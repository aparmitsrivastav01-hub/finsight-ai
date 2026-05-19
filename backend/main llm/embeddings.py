import logging
import os

logger = logging.getLogger(__name__)

_MODEL_ID = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model: %s", _MODEL_ID)
        _model = SentenceTransformer(_MODEL_ID)
    return _model


def preload_embedding_model() -> None:
    _get_model()


def embed_texts(texts):
    model = _get_model()
    return model.encode(
        texts,
        batch_size=int(os.getenv("EMBEDDING_BATCH_SIZE", "8")),
        show_progress_bar=False,
    )
