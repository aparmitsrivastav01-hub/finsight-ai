"""
Hugging Face Inference API (serverless) — text generation for FinGPT /ask flow.
Uses AsyncInferenceClient.chat_completion (modern Messages API).

NOTE: text_generation() is being phased out on the free HF serverless tier;
chat_completion() is the stable replacement and works with current free models.
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

# Mistral-7B-Instruct-v0.3 supports chat_completion on the free HF serverless tier.
# Override via HF_MODEL env var. Other working options:
#   "HuggingFaceH4/zephyr-7b-gemma-v0.1"
#   "mistralai/Mistral-7B-Instruct-v0.2"
DEFAULT_MODEL = os.getenv("HF_MODEL")
DEFAULT_TIMEOUT_S = float(os.getenv("HF_INFERENCE_TIMEOUT_SECONDS", "120"))

SYSTEM_PROMPT = (
 """
You are a professional financial analyst AI.

Analyze the provided financial report deeply and thoroughly.

Give:
- key observations
- risks
- trends
- profitability analysis
- balance sheet insights
- investor perspective
- red flags
- opportunities

Use detailed bullet points and explanations.
"""
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _api_token() -> str | None:
    """Prefer HF_TOKEN; HF_API_KEY kept for older deployments."""
    raw = (os.getenv("HF_TOKEN") or os.getenv("HF_API_KEY") or "").strip()
    return raw or None


def _model_id() -> str:
    model = os.getenv("HF_MODEL") or DEFAULT_MODEL

    if not model:
        raise RuntimeError("HF model is not configured")

    return model.strip()


def _missing_token_message() -> str:
    return (
        "Inference is not configured: set HF_TOKEN in the server environment "
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


def _is_sdk_404_bug(exc: TypeError) -> bool:
    """
    Detect the HF SDK bug where a 404 response with an empty body raises:
        TypeError: 'NoneType' object is not subscriptable
    inside text_generation()'s error handler before HfHubHTTPError is raised.

    Fixed tb.__traceback__ -> tb.tb_next (the correct attribute to walk
    traceback frames; __traceback__ is an attribute of *exception* objects,
    not *traceback* objects).
    """
    if "'NoneType' object is not subscriptable" not in str(exc):
        return False
    tb = exc.__traceback__
    while tb is not None:
        filename = tb.tb_frame.f_code.co_filename
        if "huggingface_hub" in filename and "inference" in filename:
            return True
        tb = tb.tb_next   # <-- was tb.__traceback__ (always None on tb objects)
    return False


def _message_for_hf_http(exc: HfHubHTTPError) -> str:
    resp = getattr(exc, "response", None)
    code = getattr(resp, "status_code", None) if resp is not None else None
    detail = str(exc).lower()
    model = _model_id()

    if code == 404 or "not found" in detail:
        logger.warning("HF inference 404 model=%s: %s", model, str(exc)[:400])
        return _inference_unavailable_message(
            f"model {model!r} is not available on the free Inference API — "
            "set HF_MODEL to a supported model such as "
            "'mistralai/Mistral-7B-Instruct-v0.3'"
        )
    if code == 429 or "rate limit" in detail or "too many requests" in detail:
        logger.warning("HF inference rate limited model=%s: %s", model, str(exc)[:400])
        return _inference_unavailable_message("rate limit reached — try again shortly")
    if code in (502, 503, 504) or "overloaded" in detail or "loading" in detail:
        logger.warning("HF inference overload HTTP %s model=%s: %s", code, model, str(exc)[:400])
        return _inference_unavailable_message("service overloaded or still loading")
    if code == 400 and "not supported" in detail:
        logger.warning("HF inference 400 model=%s: %s", model, str(exc)[:500])
        return _inference_unavailable_message("model not supported on Inference API")
    if code in (401, 403):
        logger.warning("HF inference auth failed HTTP %s", code)
        return "Hugging Face rejected the API token. Verify HF_TOKEN in Space secrets."
    if code is not None:
        logger.warning("HF inference HTTP %s model=%s: %s", code, model, str(exc)[:400])
        return _inference_unavailable_message(f"HTTP {code}")

    logger.warning("HF inference HTTP error model=%s: %s", model, str(exc)[:400])
    return _inference_unavailable_message("unexpected API error")


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def build_messages(context: str, query: str) -> list[dict]:
    """
    Build the chat messages list for chat_completion().
    Keeps system instructions, RAG context, and user question separate —
    better for instruction-tuned models than a single concatenated prompt.
    """
    ctx = (context or "").strip()
    q = (query or "").strip()
    user_content = f"Context:\n{ctx}\n\nQuestion:\n{q}" if ctx else q
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_content},
    ]


# Keep old name as an alias so any callers that import it don't break.
def build_inference_prompt(context: str, query: str) -> str:
    ctx = (context or "").strip()
    q = (query or "").strip()
    return (
        f"System:\n{SYSTEM_PROMPT}\n\n"
        f"Context:\n{ctx}\n\n"
        f"Question:\n{q}\n\n"
        "Answer professionally as a financial AI analyst:\n"
    )


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def generate_response(context: str, query: str) -> str:
    """
    Call HF Inference chat_completion. Returns plain text (errors as user messages).

    Uses chat_completion() instead of the deprecated text_generation() endpoint,
    which has been removed for most models on the free HF serverless tier.
    """
    token = _api_token()
    if not token:
        logger.error("HF_TOKEN (or HF_API_KEY) is not set")
        return _missing_token_message()

    model = _model_id()
    messages = build_messages(context, query)

    logger.debug("HF chat_completion start model=%s", model)

    try:
        async with AsyncInferenceClient(
            model=model,
            token=token,
            timeout=DEFAULT_TIMEOUT_S,
        ) as client:
            response = await client.chat_completion(
                messages=messages,
                max_tokens=2048,
                temperature=0.3,
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
    except TypeError as exc:
        # Catch the HF SDK bug where a 404 with empty body raises TypeError
        # before HfHubHTTPError. Retained as a safety net even though we now
        # use chat_completion() — the same SDK code path exists there too.
        if _is_sdk_404_bug(exc):
            logger.warning(
                "HF inference 404 (SDK bug: empty error payload) model=%s", model
            )
            return _inference_unavailable_message(
                f"model {model!r} is not available on the free Inference API — "
                "set HF_MODEL to 'mistralai/Mistral-7B-Instruct-v0.3'"
            )
        logger.error("Unexpected TypeError in generate_response", exc_info=True)
        raise
    except Exception as exc:
        logger.warning("HF inference failure model=%s: %s", model, exc, exc_info=True)
        return _inference_unavailable_message("unexpected error")

    # Extract text from ChatCompletionOutput
    try:
        text = response.choices[0].message.content
    except (AttributeError, IndexError, TypeError) as exc:
        logger.warning(
            "HF chat_completion unexpected response shape model=%s: %s — raw=%r",
            model, exc, response,
        )
        return _inference_unavailable_message("malformed model response")

    if not isinstance(text, str):
        text = str(text) if text is not None else ""
    text = text.strip()

    if not text:
        logger.warning("HF chat_completion returned empty output model=%s", model)
        return _inference_unavailable_message("empty model response")

    logger.info("HF chat_completion done model=%s response_len=%s", model, len(text))
    return text