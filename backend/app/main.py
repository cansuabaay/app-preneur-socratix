from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.ideas import router as ideas_router
from app.api.messages import router as messages_router
from app.api.users import router as users_router
from app.config import ALLOWED_ORIGINS
from app.database import Base, engine
from app.db_migrations import run_lightweight_migrations
from app.models import Idea, Message, PasswordResetToken, User  # noqa: F401
from app.services.avatar_service import ensure_avatar_dir

BACKEND_ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BACKEND_ROOT / "uploads"

Base.metadata.create_all(bind=engine)
run_lightweight_migrations()
ensure_avatar_dir()

app = FastAPI(title="Socratix API")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(ideas_router)
app.include_router(messages_router)


@app.get("/")
def root() -> dict:
    return {"message": "Socratix backend is running"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}