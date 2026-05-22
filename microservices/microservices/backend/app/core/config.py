from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve backend/.env regardless of process cwd (uvicorn may start from repo root).
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    PROJECT_NAME: str = "Health Equity Platform API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    DATABASE_URL: str = "sqlite+aiosqlite:///./healthequity.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    FRONTEND_URL: str = "http://localhost:3000"

    REDIS_URL: Optional[str] = None

    SUPABASE_URL: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    SUPABASE_STORAGE_BUCKET: str = "issue-attachments"

    # Any OpenAI-compatible provider (OpenAI, Groq free tier, etc.)
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = None  # e.g. https://api.groq.com/openai/v1
    AI_MODEL: str = "gpt-4o-mini"

    RESEND_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@healthequity.local"

    ESCALATION_THRESHOLD_DAYS: int = 7


@lru_cache
def get_settings() -> Settings:
    return Settings()
