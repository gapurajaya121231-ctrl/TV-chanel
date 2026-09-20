"""File uploads (logo, mosque photos, QR images) — stored on disk, served under /api."""

import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
}
MAX_BYTES = 8 * 1024 * 1024


@router.post("")
async def upload(file: UploadFile):
    ext = Path(file.filename or "x").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Format file tidak didukung (jpg/png/webp/gif/svg)")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 8MB")
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"/api/uploads/{name}"}


@router.get("/{name}")
async def get_upload(name: str):
    path = UPLOAD_DIR / Path(name).name  # basename — no path traversal
    if not path.exists():
        raise HTTPException(status_code=404, detail="File tidak ditemukan")
    return FileResponse(path, media_type=ALLOWED.get(path.suffix.lower(), "application/octet-stream"))
