import mimetypes
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.models.user import User

BACKEND_ROOT = Path(__file__).resolve().parents[2]
AVATAR_DIR = BACKEND_ROOT / "uploads" / "avatars"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def ensure_avatar_dir() -> None:
    AVATAR_DIR.mkdir(parents=True, exist_ok=True)


def _extension_for_upload(file: UploadFile) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if ext in ALLOWED_EXTENSIONS:
        return ".jpg" if ext == ".jpeg" else ext

    content_type = (file.content_type or "").lower()
    guessed = mimetypes.guess_extension(content_type) or ""
    if guessed == ".jpe":
        guessed = ".jpg"
    if guessed in ALLOWED_EXTENSIONS:
        return guessed

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Only JPG, PNG, and WEBP images are allowed.",
    )


def _validate_upload(file: UploadFile) -> None:
    content_type = (file.content_type or "").lower()
    ext = Path(file.filename or "").suffix.lower()

    mime_ok = content_type in ALLOWED_MIME_TYPES
    ext_ok = ext in ALLOWED_EXTENSIONS

    if not mime_ok and not ext_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG, and WEBP images are allowed.",
        )


def delete_avatar_file(avatar_url: str | None) -> None:
    if not avatar_url:
        return
    if not avatar_url.startswith("/uploads/avatars/"):
        return

    file_path = AVATAR_DIR / Path(avatar_url).name
    if file_path.is_file():
        file_path.unlink()


class AvatarService:
    async def save_avatar(self, db: Session, user: User, file: UploadFile) -> User:
        ensure_avatar_dir()
        _validate_upload(file)

        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty file.",
            )
        if len(content) > MAX_AVATAR_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image must be 5 MB or smaller.",
            )

        ext = _extension_for_upload(file)
        delete_avatar_file(user.avatarUrl)

        filename = f"{user.id}_{uuid4().hex[:12]}{ext}"
        destination = AVATAR_DIR / filename
        destination.write_bytes(content)

        user.avatarUrl = f"/uploads/avatars/{filename}"
        db.commit()
        db.refresh(user)
        return user

    def remove_avatar(self, db: Session, user: User) -> User:
        delete_avatar_file(user.avatarUrl)
        user.avatarUrl = None
        db.commit()
        db.refresh(user)
        return user


avatar_service = AvatarService()
