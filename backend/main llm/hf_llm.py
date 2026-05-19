"""
Hugging Face Inference API (serverless) — text generation for FinGPT /ask flow.
Uses AsyncInferenceClient.text_generation (api-inference), not chat/completions.
"""
from __future__ import annotations

import logging
import os

import httpx
from dotenv import load_dotenv
from huggingface_hub import AsyncInferenceClient
from huggingface_hub.errors import HfHubHTTPError, InferenceTimeoutError, OverloadedError

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "google/gemma-3-27b-it"
DEFAULT_TIMEOUT_S = float(os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "120"))

SYSTEM_PROMPT = (
    "You are a professional financial analyst AI. "
    "Answer using only the provided financial context when available. Be precise and concise."
)


def _api_token() -> str | None:
    """Prefer HF_API_TOKEN; HF_API_KEY kept for older deployments."""
    raw = (os.getenv("HF_API_TOKEN") or os.getenv("HF_API_KEY") or "").strip()
    return raw or None


def _model_id() -> str:
    return (os.getenv("HF_MODEL") or DEFAULT_MODEL).strip()


def _missing_token_message() -> str:
    return (
        "Inference is not configured: set HF_API_TOKEN in the server environment "
        "(see .env for local development)."
    )


def _inference_unavailable_message(reason: str = "") -> str:
    base = (
        "Financial analysis is temporarily unavailable. "
        "The inference service could not complete your request"
    )
    if reason:
        return f"{base} ({reason}). Please try again in a few minutes."
    return f"{base}. Please try again in a few minutes."


def _message_for_hf_http(exc: HfHubHTTPError) -> str:
    resp = getattr(exc, "response", None)
    code = getattr(resp, "status_code", None) if resp is not None else None
    detail = str(exc).lower()
    model = _model_id()
    if code == 400 and "not supported" in detail:
        logger.warning("HF inference 400 model=%s: %s", model, str(exc)[:500])
        return _inference_unavailable_message("model not supported on Inference API")
    if code == 404:
        logger.warning("HF inference 404 model=%s: %s", model, str(exc)[:400])
        return _inference_unavailable_message(
            f"model {model!r} was not found on Hugging Face Inference"
        )
    if code in (502, 503, 504):
        logger.warning("HF inference unavailable HTTP %s model=%s: %s", code, model, str(exc)[:400])
        return _inference_unavailable_message("service overloaded or still loading")
    if code in (401, 403):
        logger.warning("HF inference auth failed HTTP %s", code)
        return "Hugging Face rejected the API token. Verify HF_API_TOKEN in Space secrets."
    if code is not None:
        logger.warning("HF inference HTTP %s model=%s: %s", code, model, str(exc)[:400])
        return _inference_unavailable_message(f"HTTP {code}")
    logger.warning("HF inference HTTP error model=%s: %s", model, exc)
    return _inference_unavailable_message("unexpected API error")


def build_inference_prompt(context: str, query: str) -> str:
    """Plain prompt: system instructions, RAG context, and user question."""
    ctx = (context or "").strip()
    q = (query or "").strip()
    return (
        f"System:\n{SYSTEM_PROMPT}\n\n"
        f"Context:\n{ctx}\n\n"
        f"Question:\n{q}\n\n"
        "Answer professionally as a financial AI analyst:\n"
    )


async def generate_response(context: str, query: str) -> str:
    """
    Call HF Inference text_generation. Returns plain generated text (errors as user messages).
    """
    token = _api_token()
    if not token:
        logger.error("HF_API_TOKEN (or HF_API_KEY) is not set")
        return _missing_token_message()

    model = _model_id()
    prompt = build_inference_prompt(context, query)

    client = AsyncInferenceClient(
        model=model,
        token=token,
        timeout=DEFAULT_TIMEOUT_S,
    )

    logger.debug(
        "HF text_generation start model=%s prompt_len=%s",
        model,
        len(prompt),
    )

    try:
        text = await client.text_generation(
            prompt,
            max_new_tokens=800,
            temperature=0.3,
            return_full_text=False,
            do_sample=True,
        )
    except InferenceTimeoutError as exc:
        logger.warning("HF inference timeout model=%s: %s", model, exc)
        return _inference_unavailable_message("request timed out")
    except OverloadedError as exc:
        logger.warning("HF inference overloaded model=%s: %s", model, exc)
        return _inference_unavailable_message("service overloaded")
    except HfHubHTTPError as exc:
        return _message_for_hf_http(exc)
    except httpx.TimeoutException:
        logger.warning("HF HTTP client timed out model=%s", model)
        return _inference_unavailable_message("network timeout")
    except httpx.RequestError as exc:
        logger.warning("HF network failure model=%s: %s", model, exc)
        return _inference_unavailable_message("could not reach Hugging Face")
    except Exception as exc:
        logger.exception("HF inference unexpected failure model=%s: %s", model, exc)
        return _inference_unavailable_message("unexpected error")

    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    text = text.strip()
    if not text:
        logger.warning("HF text_generation returned empty output model=%s", model)
        return _inference_unavailable_message("empty model response")

    logger.info("HF text_generation done model=%s response_len=%s", model, len(text))
    return text
