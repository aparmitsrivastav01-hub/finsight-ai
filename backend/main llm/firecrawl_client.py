"""
Firecrawl API client — scrape URLs to markdown for FinGPT ingestion / RAG.
Uses httpx (already in requirements); set FIRECRAWL_API_KEY in the server env.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DEFAULT_API_URL = "https://api.firecrawl.dev/v2"
DEFAULT_TIMEOUT_S = float(os.getenv("FIRECRAWL_TIMEOUT_SECONDS", "90"))
MAX_MARKDOWN_CHARS = int(os.getenv("FIRECRAWL_MAX_CHARS", "120000"))


class FirecrawlError(Exception):
    """Raised when Firecrawl is misconfigured or the API call fails."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def _api_key() -> str | None:
    raw = (os.getenv("FIRECRAWL_API_KEY") or "").strip()
    return raw or None


def _base_url() -> str:
    return (os.getenv("FIRECRAWL_API_URL") or DEFAULT_API_URL).rstrip("/")


def is_configured() -> bool:
    return _api_key() is not None


def _headers() -> dict[str, str]:
    key = _api_key()
    if not key:
        raise FirecrawlError(
            "Firecrawl is not configured: set FIRECRAWL_API_KEY in the server environment.",
            status_code=503,
        )
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _extract_markdown(payload: dict[str, Any]) -> str:
    """Normalize Firecrawl v2 scrape response shapes to markdown text."""
    data = payload.get("data")
    if isinstance(data, dict):
        md = data.get("markdown") or data.get("content") or ""
        if isinstance(md, str) and md.strip():
            return md.strip()
    md = payload.get("markdown")
    if isinstance(md, str) and md.strip():
        return md.strip()
    return ""


async def scrape_url(
    url: str,
    *,
    only_main_content: bool = True,
    timeout_ms: int | None = None,
) -> str:
    """
    Scrape a single URL and return clean markdown.
    Raises FirecrawlError on config / HTTP / empty-content failures.
    """
    target = (url or "").strip()
    if not target:
        raise FirecrawlError("URL is required", status_code=400)

    scrape_timeout_ms = timeout_ms
    if scrape_timeout_ms is None:
        scrape_timeout_ms = int(DEFAULT_TIMEOUT_S * 1000)

    body: dict[str, Any] = {
        "url": target,
        "formats": ["markdown"],
        "onlyMainContent": only_main_content,
        "timeout": scrape_timeout_ms,
    }

    http_timeout = httpx.Timeout(DEFAULT_TIMEOUT_S + 15.0, connect=15.0)
    endpoint = f"{_base_url()}/scrape"

    logger.info("Firecrawl scrape url=%s", target)

    try:
        async with httpx.AsyncClient(timeout=http_timeout) as client:
            response = await client.post(endpoint, headers=_headers(), json=body)
    except FirecrawlError:
        raise
    except httpx.TimeoutException as exc:
        logger.warning("Firecrawl scrape timed out url=%s: %s", target, exc)
        raise FirecrawlError("Firecrawl scrape timed out", status_code=504) from exc
    except httpx.HTTPError as exc:
        logger.exception("Firecrawl scrape transport error url=%s", target)
        raise FirecrawlError(f"Firecrawl request failed: {exc}", status_code=502) from exc

    if response.status_code == 401 or response.status_code == 403:
        logger.warning("Firecrawl auth failed HTTP %s", response.status_code)
        raise FirecrawlError(
            "Firecrawl rejected the API key. Verify FIRECRAWL_API_KEY.",
            status_code=503,
        )
    if response.status_code == 402:
        raise FirecrawlError(
            "Firecrawl payment required — check plan / credits.",
            status_code=402,
        )
    if response.status_code == 429:
        raise FirecrawlError(
            "Firecrawl rate limit reached — try again shortly.",
            status_code=429,
        )
    if response.status_code >= 400:
        detail = (response.text or "")[:400]
        logger.warning(
            "Firecrawl scrape HTTP %s url=%s: %s",
            response.status_code,
            target,
            detail,
        )
        raise FirecrawlError(
            f"Firecrawl scrape failed (HTTP {response.status_code})",
            status_code=502,
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise FirecrawlError("Firecrawl returned invalid JSON", status_code=502) from exc

    if payload.get("success") is False:
        err = payload.get("error") or "unknown error"
        raise FirecrawlError(f"Firecrawl scrape failed: {err}", status_code=502)

    markdown = _extract_markdown(payload if isinstance(payload, dict) else {})
    if not markdown:
        raise FirecrawlError(
            "Firecrawl returned no markdown content for this URL",
            status_code=422,
        )

    if len(markdown) > MAX_MARKDOWN_CHARS:
        logger.info(
            "Firecrawl markdown truncated from %s to %s chars",
            len(markdown),
            MAX_MARKDOWN_CHARS,
        )
        markdown = markdown[:MAX_MARKDOWN_CHARS]

    logger.info("Firecrawl scrape success url=%s markdown_len=%s", target, len(markdown))
    return markdown


async def search(query: str, *, limit: int = 5) -> list[dict[str, Any]]:
    """
    Optional web search via Firecrawl /search.
    Returns a list of result dicts (title, url, description, …) or raises FirecrawlError.
    """
    q = (query or "").strip()
    if not q:
        raise FirecrawlError("Search query is required", status_code=400)

    body = {"query": q, "limit": max(1, min(limit, 10))}
    http_timeout = httpx.Timeout(DEFAULT_TIMEOUT_S + 15.0, connect=15.0)
    endpoint = f"{_base_url()}/search"

    logger.info("Firecrawl search query_len=%s limit=%s", len(q), body["limit"])

    try:
        async with httpx.AsyncClient(timeout=http_timeout) as client:
            response = await client.post(endpoint, headers=_headers(), json=body)
    except FirecrawlError:
        raise
    except httpx.TimeoutException as exc:
        raise FirecrawlError("Firecrawl search timed out", status_code=504) from exc
    except httpx.HTTPError as exc:
        raise FirecrawlError(f"Firecrawl search failed: {exc}", status_code=502) from exc

    if response.status_code >= 400:
        raise FirecrawlError(
            f"Firecrawl search failed (HTTP {response.status_code})",
            status_code=502,
        )

    payload = response.json()
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, dict):
        web = data.get("web")
        if isinstance(web, list):
            return [r for r in web if isinstance(r, dict)]
    if isinstance(data, list):
        return [r for r in data if isinstance(r, dict)]
    return []
