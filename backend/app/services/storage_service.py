"""Local file storage service (replaceable with S3 for cloud deployment)."""

import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile
from ..config import settings


class StorageService:
    """Handles file upload, deletion, and path resolution.

    For local development, files are stored on the local filesystem.
    For AWS deployment, this class can be swapped to use boto3 + S3.
    """

    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def upload_file(self, file: UploadFile) -> tuple:
        """Upload a file and return (file_key, original_filename).

        Args:
            file: The uploaded file from FastAPI.

        Returns:
            A tuple of (file_key, original_filename).
        """
        ext = Path(file.filename).suffix
        file_key = f"papers/{uuid.uuid4().hex}{ext}"
        file_path = self.upload_dir / file_key
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        return file_key, file.filename

    def delete_file(self, file_key: str) -> bool:
        """Delete a file by its storage key.

        Args:
            file_key: The relative key/path of the file.

        Returns:
            True if the file was deleted, False otherwise.
        """
        if not file_key:
            return False
        file_path = self.upload_dir / file_key
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_file_path(self, file_key: str) -> str:
        """Get the absolute file path for a file key."""
        return str(self.upload_dir / file_key)

    def file_exists(self, file_key: str) -> bool:
        """Check if a file exists by its storage key."""
        return (self.upload_dir / file_key).exists()


storage_service = StorageService()
