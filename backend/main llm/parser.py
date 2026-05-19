import logging

from pdf_text_extract import chunk_text, extract_pdf_text

logger = logging.getLogger(__name__)


def parse_pdf(path: str) -> list[str]:
    text = extract_pdf_text(path)
    if not text:
        logger.warning("No text extracted from PDF: %s", path)
        return []
    chunks = chunk_text(text)
    logger.info("Parsed PDF %s into %s chunks", path, len(chunks))
    return chunks
