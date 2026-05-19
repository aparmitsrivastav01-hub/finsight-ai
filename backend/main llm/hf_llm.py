"""
Hugging Face Inference API (serverless) — chat completions for FinGPT /ask flow.
Uses AsyncInferenceClient for non-blocking calls under FastAPI.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from huggingface_hub import AsyncInferenceClient
from huggingface_hub.errors import HfHubHTTPError, InferenceTimeoutError, OverloadedError

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "microsoft/Phi-3-mini-4k-instruct"
DEFAULT_TIMEOUT_S = float(os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "120"))


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
            "HF inference 404 (model/provider not found) model=%s detail=%s",
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


def _extract_answer_text(completion: Any) -> str:
    choices = getattr(completion, "choices", None)
    if choices is None and isinstance(completion, dict):
        choices = completion.get("choices")
    if not choices:
        logger.warning("HF malformed response: missing choices: %r", completion)
        raise ValueError("missing_choices")

    first = choices[0]
    msg = getattr(first, "message", None)
    if msg is None and isinstance(first, dict):
        msg = first.get("message")
    content = getattr(msg, "content", None) if msg is not None else None
    if content is None and isinstance(msg, dict):
        content = msg.get("content")
    if not isinstance(content, str):
        content = str(content) if content is not None else ""
    text = content.strip()
    if not text:
        logger.warning("HF malformed response: empty assistant content")
        raise ValueError("empty_content")
    return text


async def generate_response(prompt: str) -> str:
    """
    Call HF Inference chat completions. Returns user-facing text (errors as messages, not raises).
    """
    token = _api_token()
    if not token:
        logger.error("HF_API_TOKEN (or HF_API_KEY) is not set")
        return _missing_token_message()

    model = _model_id()
    client = AsyncInferenceClient(
        model=model,
        token=token,
        timeout=DEFAULT_TIMEOUT_S,
    )

    logger.debug(
        "HF inference start model=%s prompt_len=%s",
        model,
        len(prompt or ""),
    )

    try:
        completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional financial analyst AI. "
                        "Use the context in the user message when present. Be precise and concise."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=800,
            temperature=0.3,
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

    try:
        text = _extract_answer_text(completion)
    except ValueError:
        return "The model returned an unexpected or empty response. Please try again."
    except (AttributeError, KeyError, IndexError, TypeError) as exc:
        logger.warning("HF response parse error: %s raw=%r", exc, completion)
        return "Could not parse the model response. Please try again."

    logger.info("HF inference done model=%s response_len=%s", model, len(text))
    return text
