"""Lightweight SQLite migrations for existing finsight_users.db instances."""

import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

_USER_COLUMNS = (
    ("google_id", "VARCHAR(255)"),
    ("auth_provider", "VARCHAR(32) NOT NULL DEFAULT 'local'"),
    ("avatar_url", "VARCHAR(512)"),
)


def run_user_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {c["name"] for c in inspector.get_columns("users")}

    with engine.begin() as conn:
        if "hashed_password" in existing:
            # Allow Google-only accounts (nullable password)
            col = next(c for c in inspector.get_columns("users") if c["name"] == "hashed_password")
            if col.get("nullable") is False:
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                # SQLite cannot ALTER nullable; recreate column via table rebuild is heavy.
                # New installs get nullable from model; for old DBs we store empty unusable hash instead.
                logger.info("users.hashed_password remains NOT NULL on legacy DB (Google users use placeholder hash)")

        for name, ddl in _USER_COLUMNS:
            if name not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl}"))
                logger.info("Added users.%s", name)

        try:
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id)"))
        except Exception as exc:
            logger.warning("Could not create google_id unique index: %s", exc)
