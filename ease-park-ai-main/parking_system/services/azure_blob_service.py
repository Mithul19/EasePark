"""Azure Blob storage service wrapper used by the parking API."""

import base64
import logging
import os
from typing import Any

try:
    from azure.core.exceptions import ResourceNotFoundError
    from azure.storage.blob import BlobServiceClient

    HAS_AZURE_BLOB = True
except ImportError:  # pragma: no cover - depends on optional dependency
    HAS_AZURE_BLOB = False
    BlobServiceClient = None  # type: ignore[assignment]
    ResourceNotFoundError = Exception  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class AzureBlobStorageService:
    """Small adapter around Azure Blob SDK with env-based defaults."""

    def __init__(
        self,
        connection_string: str | None = None,
        default_container: str | None = None,
    ) -> None:
        self.connection_string = connection_string or os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
        self.default_container = default_container or os.getenv("AZURE_STORAGE_CONTAINER", "parking-assets")
        self._client = None

    @property
    def enabled(self) -> bool:
        """Whether the service is ready to perform storage operations."""
        return HAS_AZURE_BLOB and bool(self.connection_string)

    def initialize(self) -> None:
        """Create client lazily. Safe to call multiple times."""
        if self._client is not None:
            return

        if not HAS_AZURE_BLOB:
            raise RuntimeError(
                "azure-storage-blob is not installed. Install from requirements.txt."
            )
        if not self.connection_string:
            raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is not configured.")

        self._client = BlobServiceClient.from_connection_string(self.connection_string)

    def _container(self, container_name: str | None = None):
        self.initialize()
        target = container_name or self.default_container
        container_client = self._client.get_container_client(target)
        container_client.create_container()
        return container_client

    def upload_base64(
        self,
        blob_name: str,
        content_base64: str,
        container_name: str | None = None,
        content_type: str | None = None,
        overwrite: bool = True,
    ) -> dict[str, Any]:
        """Upload base64 payload as a blob and return metadata."""
        container = self._container(container_name)
        payload = base64.b64decode(content_base64)
        blob_client = container.get_blob_client(blob_name)
        blob_client.upload_blob(payload, overwrite=overwrite, content_type=content_type)

        props = blob_client.get_blob_properties()
        return {
            "container": container.container_name,
            "blob_name": blob_name,
            "size": props.size,
            "etag": props.etag,
            "content_type": props.content_settings.content_type,
            "last_modified": props.last_modified.isoformat() if props.last_modified else None,
        }

    def download_base64(
        self,
        blob_name: str,
        container_name: str | None = None,
    ) -> dict[str, Any]:
        """Download a blob and return base64 payload + metadata."""
        container = self._container(container_name)
        blob_client = container.get_blob_client(blob_name)

        try:
            data = blob_client.download_blob().readall()
        except ResourceNotFoundError as exc:
            raise FileNotFoundError(f"Blob not found: {blob_name}") from exc

        props = blob_client.get_blob_properties()
        return {
            "container": container.container_name,
            "blob_name": blob_name,
            "content_base64": base64.b64encode(data).decode("utf-8"),
            "size": props.size,
            "etag": props.etag,
            "content_type": props.content_settings.content_type,
            "last_modified": props.last_modified.isoformat() if props.last_modified else None,
        }

    def delete_blob(self, blob_name: str, container_name: str | None = None) -> dict[str, Any]:
        """Delete a blob if it exists."""
        container = self._container(container_name)
        blob_client = container.get_blob_client(blob_name)
        blob_client.delete_blob(delete_snapshots="include")
        return {
            "container": container.container_name,
            "blob_name": blob_name,
            "deleted": True,
        }

    def list_blobs(
        self,
        container_name: str | None = None,
        prefix: str | None = None,
        limit: int = 100,
    ) -> dict[str, Any]:
        """List blobs in a container with optional prefix and limit."""
        container = self._container(container_name)
        blobs = []
        for i, item in enumerate(container.list_blobs(name_starts_with=prefix)):
            if i >= limit:
                break
            blobs.append(
                {
                    "name": item.name,
                    "size": item.size,
                    "etag": item.etag,
                    "last_modified": item.last_modified.isoformat() if item.last_modified else None,
                }
            )

        return {
            "container": container.container_name,
            "count": len(blobs),
            "blobs": blobs,
        }
