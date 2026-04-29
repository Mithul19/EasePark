#!/usr/bin/env python3
"""
Smart Parking System - API entry point.

Loads ML model once at startup, provides REST API for:
- POST /allocate - Allocate best parking slot
- POST /navigate - Get path to slot
- POST /allocate-and-navigate - Combined flow

Usage: python run.py
"""

import json
import logging
import sys
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).resolve().parent))

from parking_system.services.parking_service import ParkingService
from parking_system.services.azure_blob_service import AzureBlobStorageService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Optional: FastAPI if available
try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

# Global service - loaded once at startup
_service: ParkingService | None = None
_blob_service: AzureBlobStorageService | None = None


def get_service() -> ParkingService:
    """Get or create ParkingService (singleton)."""
    global _service
    if _service is None:
        _service = ParkingService()
        _service.initialize()
        logger.info("ParkingService initialized")
    return _service


def get_blob_service() -> AzureBlobStorageService:
    """Get or create AzureBlobStorageService (singleton)."""
    global _blob_service
    if _blob_service is None:
        _blob_service = AzureBlobStorageService()
    return _blob_service


if HAS_FASTAPI:

    class AllocateRequest(BaseModel):
        vehicle_type: str = "Sedan"
        vehicle_length: float = 4.5
        vehicle_width: float = 1.8
        floor_number: int = 1
        occupied_slot_ids: list[str] = []
        lane_traffic_level: int = 5

    class NavigateRequest(BaseModel):
        floor_number: int
        target_slot_id: str
        occupied_slot_ids: list[str] = []

    class BlobUploadRequest(BaseModel):
        blob_name: str
        content_base64: str
        container_name: str | None = None
        content_type: str | None = None
        overwrite: bool = True

    app = FastAPI(title="Smart Parking System API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def startup() -> None:
        """Load model once at startup."""
        get_service()

    @app.post("/allocate")
    def allocate(req: AllocateRequest) -> dict:
        """Allocate best parking slot."""
        svc = get_service()
        result = svc.allocate_slot(
            vehicle_type=req.vehicle_type,
            vehicle_length=req.vehicle_length,
            vehicle_width=req.vehicle_width,
            floor_number=req.floor_number,
            occupied_slot_ids=set(req.occupied_slot_ids),
            lane_traffic_level=req.lane_traffic_level,
        )
        return result

    @app.post("/navigate")
    def navigate(req: NavigateRequest) -> dict:
        """Get navigation path to slot."""
        svc = get_service()
        return svc.find_path(
            floor=req.floor_number,
            target_slot_id=req.target_slot_id,
            occupied_slots=set(req.occupied_slot_ids),
        )

    @app.post("/allocate-and-navigate")
    def allocate_and_navigate(req: AllocateRequest) -> dict:
        """Allocate slot and get path in one call."""
        svc = get_service()
        return svc.allocate_and_navigate(
            vehicle_type=req.vehicle_type,
            vehicle_length=req.vehicle_length,
            vehicle_width=req.vehicle_width,
            floor_number=req.floor_number,
            occupied_slot_ids=set(req.occupied_slot_ids),
            lane_traffic_level=req.lane_traffic_level,
        )

    @app.get("/health")
    def health() -> dict:
        """Health check."""
        blob = get_blob_service()
        return {
            "status": "ok",
            "service": "parking",
            "azure_blob_enabled": blob.enabled,
        }

    @app.post("/blob/upload")
    def blob_upload(req: BlobUploadRequest) -> dict:
        """Upload base64 content to Azure Blob storage."""
        blob = get_blob_service()
        try:
            return blob.upload_base64(
                blob_name=req.blob_name,
                content_base64=req.content_base64,
                container_name=req.container_name,
                content_type=req.content_type,
                overwrite=req.overwrite,
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.get("/blob/download/{blob_name}")
    def blob_download(blob_name: str, container_name: str | None = None) -> dict:
        """Download blob and return base64 content."""
        blob = get_blob_service()
        try:
            return blob.download_base64(blob_name=blob_name, container_name=container_name)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.delete("/blob/{blob_name}")
    def blob_delete(blob_name: str, container_name: str | None = None) -> dict:
        """Delete a blob."""
        blob = get_blob_service()
        try:
            return blob.delete_blob(blob_name=blob_name, container_name=container_name)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.get("/blob/list")
    def blob_list(
        container_name: str | None = None,
        prefix: str | None = None,
        limit: int = 100,
    ) -> dict:
        """List blobs in a container."""
        blob = get_blob_service()
        try:
            return blob.list_blobs(container_name=container_name, prefix=prefix, limit=limit)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


def main() -> None:
    """Run API server or CLI demo."""
    if HAS_FASTAPI:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        # CLI demo
        logger.info("FastAPI not installed. Run: pip install fastapi uvicorn")
        logger.info("Running CLI demo...")
        svc = get_service()
        result = svc.allocate_and_navigate(
            vehicle_type="Sedan",
            vehicle_length=4.5,
            vehicle_width=1.8,
            floor_number=1,
            occupied_slot_ids=set(),
            lane_traffic_level=5,
        )
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
