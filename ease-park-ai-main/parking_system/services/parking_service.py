"""
Parking service - orchestration with caching and single model load.

Loads ML model once at startup, caches slot catalog, and provides
unified allocate + navigate API for real-time performance.
"""

import logging
from pathlib import Path
from typing import Any

from ..algorithms.path_finder import PathFinder
from ..algorithms.slot_allocator import SlotAllocator, build_slot_catalog
from ..models.random_forest_model import DEFAULT_ENCODER_PATH, DEFAULT_MODEL_PATH, RandomForestSlotPredictor

logger = logging.getLogger(__name__)


class ParkingService:
    """
    Production parking service with:
    - Single model load at startup
    - Cached slot catalog (efficient dict)
    - Efficient data structures (adjacency list for pathfinding)
    - Minimal delay for allocate + navigate
    """

    _instance: "ParkingService | None" = None
    _model: RandomForestSlotPredictor | None = None
    _slot_catalog: dict[str, dict] | None = None

    def __init__(
        self,
        model_path: Path | str | None = None,
        encoder_path: Path | str | None = None,
    ) -> None:
        self.model_path = Path(model_path or DEFAULT_MODEL_PATH)
        self.encoder_path = Path(encoder_path or DEFAULT_ENCODER_PATH)
        self._predictor: RandomForestSlotPredictor | None = None
        self._allocator: SlotAllocator | None = None
        self._path_finder: PathFinder | None = None
        self._slot_catalog: dict[str, dict] = {}
        self._initialized = False

    def initialize(self) -> None:
        """Load model and cache slot data. Call once at startup."""
        if self._initialized:
            logger.debug("ParkingService already initialized")
            return

        # Load model once
        self._predictor = RandomForestSlotPredictor()
        if self.model_path.exists():
            self._predictor.load_model(self.model_path, self.encoder_path)
            logger.info("ML model loaded successfully")
        else:
            logger.warning("Model file not found. Train and save model first. Using fallback.")
            self._predictor = None

        # Cache slot catalog (efficient dictionary)
        self._slot_catalog = build_slot_catalog()
        logger.info("Cached %d slots", len(self._slot_catalog))

        if self._predictor:
            self._allocator = SlotAllocator(self._predictor, self._slot_catalog)
        else:
            self._allocator = SlotAllocator(RandomForestSlotPredictor(), self._slot_catalog)
            # Fallback: allocator needs a fitted model; we'll handle in allocate
        self._path_finder = PathFinder()
        self._initialized = True

    def allocate_slot(
        self,
        vehicle_type: str,
        vehicle_length: float,
        vehicle_width: float,
        floor_number: int,
        occupied_slot_ids: set[str],
        lane_traffic_level: int = 5,
    ) -> dict[str, Any]:
        """
        Allocate best parking slot. Uses filtering then ML prediction.

        Returns:
            {"slot_id": str | None, "confidence": float}
        """
        if not self._initialized:
            self.initialize()

        if not self._allocator:
            self._allocator = SlotAllocator(
                self._predictor or RandomForestSlotPredictor(),
                self._slot_catalog,
            )

        if not self._predictor or not getattr(self._predictor, "_is_fitted", False):
            # Fallback: pick slot with minimum distance from entry
            valid = self._allocator.filter_valid_slots(
                vehicle_length, vehicle_width, floor_number, occupied_slot_ids
            )
            if valid:
                best = min(valid, key=lambda s: s["distance_from_entry"])
                return {"slot_id": best["parking_slot_id"], "confidence": 0.5}
            return {"slot_id": None, "confidence": 0.0}

        slot_id, confidence = self._allocator.allocate(
            vehicle_type, vehicle_length, vehicle_width,
            floor_number, occupied_slot_ids, lane_traffic_level,
        )
        return {"slot_id": slot_id, "confidence": confidence}

    def find_path(
        self,
        floor: int,
        target_slot_id: str,
        occupied_slots: set[str],
    ) -> dict[str, Any]:
        """
        Find shortest path from entry to target slot.

        Returns:
            {
                "path_nodes": list,
                "path_positions": list,
                "total_distance": float,
                "navigation_path": list
            }
        """
        if not self._initialized:
            self.initialize()

        if not self._path_finder:
            return {"path_nodes": [], "path_positions": [], "total_distance": 0.0, "navigation_path": []}

        return self._path_finder.find_path(floor, target_slot_id, occupied_slots)

    def allocate_and_navigate(
        self,
        vehicle_type: str,
        vehicle_length: float,
        vehicle_width: float,
        floor_number: int,
        occupied_slot_ids: set[str],
        lane_traffic_level: int = 5,
    ) -> dict[str, Any]:
        """
        Allocate best slot and compute navigation path in one call.
        Optimal for real-time flow.
        """
        result = self.allocate_slot(
            vehicle_type, vehicle_length, vehicle_width,
            floor_number, occupied_slot_ids, lane_traffic_level,
        )
        slot_id = result.get("slot_id")
        if not slot_id:
            return {**result, "path": None}

        path = self.find_path(floor_number, slot_id, occupied_slot_ids)
        return {**result, "path": path}
