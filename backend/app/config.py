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

AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").strip().lower()
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()
OPENROUTER_BASE_URL = os.getenv(
    "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
).strip()


def get_ai_provider() -> str:
    return os.getenv("AI_PROVIDER", "openai").strip().lower()


def get_ai_model() -> str:
    return os.getenv("AI_MODEL", "gpt-4o-mini").strip()


def get_openai_api_key() -> str:
    return os.getenv("OPENAI_API_KEY", "").strip()


def get_openrouter_api_key() -> str:
    explicit = os.getenv("OPENROUTER_API_KEY", "").strip()
    if explicit:
        return explicit
    if get_ai_provider() == "openrouter":
        return get_openai_api_key()
    return ""


def get_ai_api_key() -> str:
    provider = get_ai_provider()
    if provider == "openrouter":
        return get_openrouter_api_key()
    return get_openai_api_key()


def get_ai_base_url() -> str:
    provider = get_ai_provider()
    if provider == "openrouter":
        return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").strip()
    return os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()