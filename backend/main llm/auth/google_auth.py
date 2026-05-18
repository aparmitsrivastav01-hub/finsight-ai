import os
import re

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()


def verify_google_id_token(token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Sign-In is not configured on the server",
        )
    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Google token",
        ) from exc

    if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token issuer")

    email = (idinfo.get("email") or "").strip().lower()
    google_sub = idinfo.get("sub")
    if not email or not google_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google token missing required claims")

    if not idinfo.get("email_verified"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email is not verified")

    return {
        "google_id": str(google_sub),
        "email": email,
        "name": (idinfo.get("name") or "").strip(),
        "picture": (idinfo.get("picture") or "").strip() or None,
    }


def suggest_username(base: str, taken: set[str]) -> str:
    raw = re.sub(r"[^a-zA-Z0-9_]", "", base.replace(" ", "_"))[:64]
    if len(raw) < 2:
        raw = "user"
    candidate = raw[:64]
    if candidate.lower() not in {t.lower() for t in taken}:
        return candidate
    for i in range(1, 1000):
        suffix = f"_{i}"
        trimmed = raw[: 64 - len(suffix)] + suffix
        if trimmed.lower() not in {t.lower() for t in taken}:
            return trimmed
    return f"user_{os.urandom(4).hex()}"
