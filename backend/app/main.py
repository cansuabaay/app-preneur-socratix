from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.ideas import router as ideas_router
from app.api.users import router as users_router
from app.config import ALLOWED_ORIGINS
from app.database import Base, engine
from app.models import Idea, PasswordResetToken, User  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Socratix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(ideas_router)


@app.get("/")
def root() -> dict:
    return {"message": "Socratix backend is running"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}