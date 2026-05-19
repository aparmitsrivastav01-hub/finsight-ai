"""
Lightweight PDF text extraction (pypdf). Used instead of unstructured for CPU/memory limits on HF Spaces.
"""
from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None  # type: ignore[misc, assignment]


def extract_pdf_text(path: str) -> str:
    if PdfReader is None:
        raise RuntimeError("pypdf is not installed")
    reader = PdfReader(path)
    parts: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            logger.debug("pypdf page extract failed: %s", exc)
            text = ""
        if text.strip():
            parts.append(text)
    return "\n\n".join(parts).strip()


def chunk_text(
    text: str,
    *,
    max_chars: int = 3000,
    overlap: int = 400,
) -> list[str]:
    """Split plain text into overlapping chunks for embedding."""
    cleaned = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not cleaned:
        return []
    if len(cleaned) <= max_chars:
        return [cleaned]

    chunks: list[str] = []
    start = 0
    n = len(cleaned)
    while start < n:
        end = min(start + max_chars, n)
        if end < n:
            slice_ = cleaned[start:end]
            break_at = max(slice_.rfind("\n\n"), slice_.rfind("\n"), slice_.rfind(". "))
            if break_at > max_chars // 3:
                end = start + break_at + 1
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return chunks
