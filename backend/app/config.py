import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL missing. Create backend/.env first.")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-before-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# When true, POST /auth/forgot-password includes resetToken in JSON (no email). Set false in production.
PASSWORD_RESET_EXPOSE_TOKEN = (
    os.getenv("PASSWORD_RESET_EXPOSE_TOKEN", "true").lower() in ("1", "true", "yes")
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]