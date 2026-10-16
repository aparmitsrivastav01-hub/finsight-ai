"""Load backend environment from this package directory, not the process CWD."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
ENV_FILE = BACKEND_DIR / ".env"


def load_backend_env() -> Path:
    """Load `backend/main llm/.env` if present. Safe to call more than once."""
    load_dotenv(ENV_FILE, override=True)
    return ENV_FILE
