"""
OpenRouter Chat Completions — text generation for FinGPT /ask flow.

Provider: https://openrouter.ai/api/v1/chat/completions
Default model: nvidia/nemotron-3-ultra-550b-a55b:free
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import httpx

from env_config import load_backend_env

load_backend_env()
logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
DEFAULT_TIMEOUT_S = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "120"))
CONNECT_TIMEOUT_S = 10.0


class InferenceError(Exception):
    """Raised when OpenRouter inference cannot complete."""

    def __init__(self, message: str, *, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


def _api_key() -> str | None:
    raw = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    return raw or None


def _model_id() -> str:
    model = (os.getenv("OPENROUTER_MODEL") or DEFAULT_MODEL).strip()
    if not model:
        raise InferenceError(
            "Inference is not configured: set OPENROUTER_MODEL in the server environment.",
            status_code=503,
        )
    return model


def _timeout() -> httpx.Timeout:
    read_s = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_S)))
    return httpx.Timeout(
        connect=CONNECT_TIMEOUT_S,
        read=read_s,
        write=30.0,
        pool=10.0,
    )


def _request_headers(api_key: str) -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-Title": (os.getenv("OPENROUTER_APP_TITLE") or "FinSight").strip(),
    }
    referer = (os.getenv("OPENROUTER_HTTP_REFERER") or "").strip()
    if referer:
        headers["HTTP-Referer"] = referer
    return headers


def _missing_key_message() -> str:
    return (
        "Inference is not configured: set OPENROUTER_API_KEY in the server environment "
        "(see backend/main llm/.env for local development)."
    )


def _unavailable_message(reason: str = "") -> str:
    base = (
        "Financial analysis is temporarily unavailable. "
        "The inference service could not complete your request"
    )
    if reason:
        return f"{base} ({reason}). Please try again in a few minutes."
    return f"{base}. Please try again in a few minutes."


def build_messages(context: str, query: str) -> list[dict[str, str]]:
    ctx = (context or "").strip()
    q = (query or "").strip()
    user_content = f"Context:\n{ctx}\n\nQuestion:\n{q}" if ctx else q
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]


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
Output your final structured report directly using clear Markdown headers and bullet points. Do NOT include internal planning notes, meta-commentary, or drafting steps. Begin immediately with the financial analysis.

Ground every claim in the provided context. Do not invent financial ratios,
dollar amounts, or scores. If a figure is missing from the context, say so.
When the context includes source excerpts, refer to them in the answer.
"""
)


def build_inference_prompt(context: str, query: str) -> str:
    ctx = (context or "").strip()
    q = (query or "").strip()
    return (
        f"System:\n{SYSTEM_PROMPT}\n\n"
        f"Context:\n{ctx}\n\n"
        f"Question:\n{q}\n\n"
        "Answer professionally as a financial AI analyst:\n"
    )


def _message_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts).strip()
    return str(content).strip()


def _error_message_from_body(payload: Any, status_code: int) -> str:
    if isinstance(payload, dict):
        err = payload.get("error")
        if isinstance(err, dict):
            msg = err.get("message") or err.get("code") or err.get("type")
            if msg:
                return str(msg)[:300]
        if isinstance(err, str) and err.strip():
            return err.strip()[:300]
        msg = payload.get("message")
        if isinstance(msg, str) and msg.strip():
            return msg.strip()[:300]
    return f"HTTP {status_code}"


def _raise_for_status(resp: httpx.Response) -> None:
    code = resp.status_code
    payload: Any = None
    try:
        payload = resp.json()
    except ValueError:
        payload = None

    detail = _error_message_from_body(payload, code)
    requested = _model_id()
    logger.warning("OpenRouter HTTP %s requested_model=%s detail=%s", code, requested, detail)

    if code in (401, 403):
        raise InferenceError(
            "OpenRouter rejected the API key. Verify OPENROUTER_API_KEY in the server environment.",
            status_code=code,
        )
    if code == 429:
        raise InferenceError(
            _unavailable_message(f"rate limit reached: {detail}"),
            status_code=429,
        )
    if code == 400:
        raise InferenceError(
            f"OpenRouter rejected the request: {detail}",
            status_code=400,
        )
    if code == 404:
        raise InferenceError(
            _unavailable_message(f"model {requested!r} is not available on OpenRouter ({detail})"),
            status_code=404,
        )
    if code in (502, 503, 504):
        raise InferenceError(
            _unavailable_message(f"upstream provider error HTTP {code}: {detail}"),
            status_code=code,
        )
    raise InferenceError(_unavailable_message(detail), status_code=503)


def parse_assistant_message(payload: Any) -> str:
    if not isinstance(payload, dict):
        raise InferenceError(_unavailable_message("malformed response"))

    api_error = payload.get("error")
    if api_error:
        raise InferenceError(
            _unavailable_message(_error_message_from_body(payload, 200)),
        )

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        raise InferenceError(_unavailable_message("empty completion"))

    first = choices[0]
    if not isinstance(first, dict):
        raise InferenceError(_unavailable_message("malformed response"))

    message = first.get("message") or {}
    if not isinstance(message, dict):
        raise InferenceError(_unavailable_message("malformed response"))

    text = _message_content(message.get("content"))
    if not text and message.get("reasoning"):
        text = _message_content(message.get("reasoning"))

    if not text:
        raise InferenceError(_unavailable_message("empty model response"))
    return text


async def generate_response(context: str, query: str) -> str:
    token = _api_key()
    if not token:
        logger.error("OPENROUTER_API_KEY is not set")
        raise InferenceError(_missing_key_message(), status_code=503)

    configured_model = os.getenv("OPENROUTER_MODEL", "<unset, using default>")
    model = _model_id()
    messages = build_messages(context, query)
    logger.info(
        "OpenRouter inference starting: configured_model=%s requested_model=%s",
        configured_model,
        model,
    )

    max_tokens_val = int(os.getenv("OPENROUTER_MAX_TOKENS", "4096"))
    body: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": max_tokens_val,
    }
    reasoning_max = os.getenv("OPENROUTER_REASONING_MAX_TOKENS", "400").strip()
    if reasoning_max and reasoning_max != "0":
        try:
            body["reasoning"] = {"max_tokens": int(reasoning_max)}
        except ValueError:
            pass

    max_retries = max(0, int(os.getenv("OPENROUTER_MAX_RETRIES", "2")))
    backoff_base = max(0.0, float(os.getenv("OPENROUTER_RETRY_BACKOFF_S", "1.5")))

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=_timeout()) as client:
                resp = await client.post(
                    OPENROUTER_URL,
                    headers=_request_headers(token),
                    json=body,
                )
        except httpx.TimeoutException:
            if attempt < max_retries:
                delay = backoff_base * (2**attempt)
                logger.warning(
                    "OpenRouter timeout on attempt %d/%d model=%s; retrying in %.1fs...",
                    attempt + 1,
                    max_retries + 1,
                    model,
                    delay,
                )
                if delay > 0:
                    await asyncio.sleep(delay)
                continue
            logger.error("OpenRouter request timed out after %d attempts model=%s", max_retries + 1, model)
            raise InferenceError(
                _unavailable_message(f"request timed out after {max_retries + 1} attempts — upstream provider unresponsive"),
                status_code=503,
            ) from None
        except httpx.RequestError as exc:
            if attempt < max_retries:
                delay = backoff_base * (2**attempt)
                logger.warning(
                    "OpenRouter connection error (%s) on attempt %d/%d model=%s; retrying in %.1fs...",
                    type(exc).__name__,
                    attempt + 1,
                    max_retries + 1,
                    model,
                    delay,
                )
                if delay > 0:
                    await asyncio.sleep(delay)
                continue
            logger.error(
                "OpenRouter connection error after %d attempts model=%s type=%s",
                max_retries + 1,
                model,
                type(exc).__name__,
            )
            raise InferenceError(_unavailable_message("connection error"), status_code=503) from None

        # Check for transient HTTP error status
        if resp.status_code in (429, 502, 503, 504) and attempt < max_retries:
            delay = backoff_base * (2**attempt)
            if resp.status_code == 429:
                retry_after = resp.headers.get("retry-after")
                if retry_after:
                    try:
                        delay = min(max(float(retry_after), 1.0), 10.0)
                    except ValueError:
                        pass
            try:
                err_detail = _error_message_from_body(resp.json(), resp.status_code)
            except Exception:
                err_detail = f"HTTP {resp.status_code}"
            logger.warning(
                "OpenRouter transient HTTP %d (detail=%s) on attempt %d/%d model=%s; retrying in %.1fs...",
                resp.status_code,
                err_detail,
                attempt + 1,
                max_retries + 1,
                model,
                delay,
            )
            if delay > 0:
                await asyncio.sleep(delay)
            continue

        if resp.status_code >= 400:
            _raise_for_status(resp)

        try:
            payload = resp.json()
        except ValueError:
            logger.warning("OpenRouter returned non-JSON body status=%s", resp.status_code)
            raise InferenceError(_unavailable_message("malformed response")) from None

        # Handle embedded error in HTTP 200 response (e.g. timeout/aborted chunked payloads)
        if isinstance(payload, dict) and payload.get("error"):
            err_dict = payload["error"]
            err_code = err_dict.get("code") if isinstance(err_dict, dict) else None
            err_msg = _error_message_from_body(payload, 200)
            if (
                err_code in (502, 503, 504)
                or "aborted" in err_msg.lower()
                or "timeout" in err_msg.lower()
            ) and attempt < max_retries:
                delay = backoff_base * (2**attempt)
                logger.warning(
                    "OpenRouter embedded transient error (%s) on attempt %d/%d model=%s; retrying in %.1fs...",
                    err_msg,
                    attempt + 1,
                    max_retries + 1,
                    model,
                    delay,
                )
                if delay > 0:
                    await asyncio.sleep(delay)
                continue
            err_status = err_code if isinstance(err_code, int) and 400 <= err_code <= 599 else 503
            raise InferenceError(_unavailable_message(err_msg), status_code=err_status)

        text = parse_assistant_message(payload)
        actual_model = payload.get("model") or model
        gen_id = payload.get("id") or "unknown"
        provider = payload.get("provider") or "unknown"
        logger.info(
            "OpenRouter response success: requested_model=%s actual_model=%s provider=%s gen_id=%s length=%d",
            model,
            actual_model,
            provider,
            gen_id,
            len(text),
        )
        return text
