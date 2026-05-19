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

DEFAULT_MODEL = "microsoft/Phi-3-mini-4k-instruct"
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


def _message_for_hf_http(exc: HfHubHTTPError) -> str:
    resp = getattr(exc, "response", None)
    code = getattr(resp, "status_code", None) if resp is not None else None
    detail = str(exc).lower()
    if code == 400 and "not supported" in detail:
        logger.warning("HF inference 400 (model): %s", str(exc)[:500])
        return (
            "This model is not available on Hugging Face Inference (400). "
            "Check HF_MODEL or use a model enabled for serverless inference."
        )
    if code == 404:
        logger.warning(
            "HF inference 404 (model not found) model=%s detail=%s",
            _model_id(),
            str(exc)[:400],
        )
        return (
            "The configured model was not found or is unavailable on Hugging Face Inference (404). "
            "Check HF_MODEL and that your token can access this model."
        )
    if code in (502, 503, 504):
        logger.warning("HF inference unavailable/overloaded HTTP %s: %s", code, str(exc)[:400])
        return (
            "The model is temporarily overloaded or still loading (503). "
            "Please wait a moment and try again."
        )
    if code in (401, 403):
        logger.warning("HF inference auth failed HTTP %s", code)
        return "Hugging Face rejected the API token. Verify HF_API_TOKEN."
    if code is not None:
        logger.warning("HF inference HTTP %s: %s", code, str(exc)[:400])
        return f"Inference request failed (HTTP {code}). Please try again later."
    logger.warning("HF inference HTTP error (no status): %s", exc)
    return "Inference request failed. Please try again later."


def build_phi3_prompt(context: str, query: str) -> str:
    """Phi-3-mini-4k-instruct chat template for serverless text_generation."""
    ctx = (context or "").strip()
    q = (query or "").strip()
    user_block = f"Context:\n{ctx}\n\nQuestion:\n{q}\n\nAnswer professionally as a financial AI analyst."
    return (
        f"<|system|>\n{SYSTEM_PROMPT}<|end|>\n"
        f"<|user|>\n{user_block}<|end|>\n"
        f"<|assistant|>\n"
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
    prompt = build_phi3_prompt(context, query)

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
        logger.warning("HF inference timeout: %s", exc)
        return "The analysis request timed out. Please try again or shorten your question."
    except OverloadedError as exc:
        logger.warning("HF inference overloaded (503-class): %s", exc)
        return "The model is temporarily overloaded (503). Please retry shortly."
    except HfHubHTTPError as exc:
        return _message_for_hf_http(exc)
    except httpx.TimeoutException:
        logger.warning("HF underlying HTTP client timed out")
        return "The analysis service timed out. Please try again."
    except httpx.RequestError as exc:
        logger.warning("HF network failure: %s", exc)
        return "Could not reach Hugging Face Inference (network error). Please try again later."
    except Exception as exc:
        logger.exception("HF inference unexpected failure: %s", exc)
        return "An unexpected error occurred during inference. Please try again later."

    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    text = text.strip()
    if not text:
        logger.warning("HF text_generation returned empty output")
        return "The model returned an unexpected or empty response. Please try again."

    logger.info("HF text_generation done model=%s response_len=%s", model, len(text))
    return text
