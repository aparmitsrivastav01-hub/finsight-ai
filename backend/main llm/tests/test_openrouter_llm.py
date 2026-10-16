"""Unit tests for OpenRouter inference (mocked HTTP)."""

from __future__ import annotations

import json
import os
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import openrouter_llm as or_llm


class _FakeAsyncClient:
    def __init__(self, response=None, error=None):
        self._response = response
        self._error = error
        self.calls: list[dict] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def post(self, url, headers=None, json=None):
        self.calls.append({"url": url, "headers": headers, "json": json})
        if self._error:
            raise self._error
        return self._response


def _json_response(status_code: int, payload: dict | str):
    resp = MagicMock()
    resp.status_code = status_code
    if isinstance(payload, str):
        resp.json.side_effect = ValueError("not json")
        resp.text = payload
    else:
        resp.json.return_value = payload
        resp.text = json.dumps(payload)
    return resp


class ParseAssistantMessageTests(unittest.TestCase):
    def test_parses_string_content(self):
        text = or_llm.parse_assistant_message(
            {"choices": [{"message": {"content": "  Hello analyst  "}}]}
        )
        self.assertEqual(text, "Hello analyst")

    def test_parses_list_content_parts(self):
        text = or_llm.parse_assistant_message(
            {
                "choices": [
                    {
                        "message": {
                            "content": [
                                {"type": "text", "text": "Part A "},
                                {"type": "text", "text": "Part B"},
                            ]
                        }
                    }
                ]
            }
        )
        self.assertEqual(text, "Part A Part B")

    def test_empty_completion_raises(self):
        with self.assertRaises(or_llm.InferenceError) as ctx:
            or_llm.parse_assistant_message({"choices": []})
        self.assertIn("empty completion", str(ctx.exception))

    def test_malformed_payload_raises(self):
        with self.assertRaises(or_llm.InferenceError) as ctx:
            or_llm.parse_assistant_message(["not", "an", "object"])
        self.assertIn("malformed", str(ctx.exception))

    def test_embedded_error_raises(self):
        with self.assertRaises(or_llm.InferenceError) as ctx:
            or_llm.parse_assistant_message({"error": {"message": "model not found"}})
        self.assertIn("model not found", str(ctx.exception))


class GenerateResponseTests(unittest.IsolatedAsyncioTestCase):
    async def test_missing_api_key(self):
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": ""}, clear=False):
            with self.assertRaises(or_llm.InferenceError) as ctx:
                await or_llm.generate_response("ctx", "what is revenue?")
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertIn("OPENROUTER_API_KEY", str(ctx.exception))

    async def test_success_sends_required_fields(self):
        resp = _json_response(
            200,
            {"choices": [{"message": {"content": "Revenue grew 8%."}}]},
        )
        fake = _FakeAsyncClient(response=resp)
        env = {
            "OPENROUTER_API_KEY": "test-key-not-real",
            "OPENROUTER_MODEL": "nvidia/Nemotron-3-8B-Instruct",
        }
        with patch.dict(os.environ, env, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                text = await or_llm.generate_response("Revenue: 10", "Summarize")

        self.assertEqual(text, "Revenue grew 8%.")
        self.assertEqual(len(fake.calls), 1)
        call = fake.calls[0]
        self.assertEqual(call["url"], or_llm.OPENROUTER_URL)
        self.assertEqual(call["headers"]["Authorization"], "Bearer test-key-not-real")
        self.assertEqual(call["json"]["model"], "nvidia/Nemotron-3-8B-Instruct")
        self.assertEqual(call["json"]["messages"][0]["role"], "system")
        self.assertEqual(call["json"]["messages"][1]["role"], "user")
        self.assertIn("Revenue: 10", call["json"]["messages"][1]["content"])

    async def test_invalid_model_400(self):
        resp = _json_response(
            400,
            {"error": {"message": "nvidia/Nemotron-3-8B-Instruct is not a valid model ID"}},
        )
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not a valid model ID", str(ctx.exception))

    async def test_invalid_key_401(self):
        resp = _json_response(401, {"error": {"message": "Invalid API key"}})
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "bad-key"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("OPENROUTER_API_KEY", str(ctx.exception))

    async def test_rate_limit_429(self):
        resp = _json_response(429, {"error": {"message": "Rate limit"}})
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertEqual(ctx.exception.status_code, 429)

    async def test_timeout(self):
        fake = _FakeAsyncClient(error=httpx_timeout())
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertIn("timed out", str(ctx.exception))

    async def test_malformed_json(self):
        resp = _json_response(200, "not-json")
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertIn("malformed", str(ctx.exception))

    async def test_empty_model_response(self):
        resp = _json_response(200, {"choices": [{"message": {"content": "   "}}]})
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                with self.assertRaises(or_llm.InferenceError) as ctx:
                    await or_llm.generate_response("ctx", "q")
        self.assertIn("empty model response", str(ctx.exception))

    async def test_reasoning_fallback_when_content_is_empty(self):
        resp = _json_response(
            200,
            {
                "choices": [
                    {
                        "message": {
                            "role": "assistant",
                            "content": None,
                            "reasoning": "Detailed financial analysis reasoning here.",
                        }
                    }
                ]
            },
        )
        fake = _FakeAsyncClient(response=resp)
        with patch.dict(os.environ, {"OPENROUTER_API_KEY": "k"}, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                text = await or_llm.generate_response("ctx", "q")
        self.assertEqual(text, "Detailed financial analysis reasoning here.")

    async def test_retry_on_503_and_succeed(self):
        resp_503 = _json_response(503, {"error": {"message": "Service Unavailable"}})
        resp_200 = _json_response(200, {"choices": [{"message": {"content": "Success on retry"}}]})

        class _MultiClient:
            def __init__(self):
                self.calls = 0

            async def __aenter__(self):
                return self

            async def __aexit__(self, *args):
                return False

            async def post(self, url, headers=None, json=None):
                self.calls += 1
                if self.calls == 1:
                    return resp_503
                return resp_200

        client = _MultiClient()
        env = {
            "OPENROUTER_API_KEY": "test-key-secret-12345",
            "OPENROUTER_RETRY_BACKOFF_S": "0.001",
        }
        with patch.dict(os.environ, env, clear=False):
            with patch("openrouter_llm.httpx.AsyncClient", return_value=client):
                text = await or_llm.generate_response("ctx", "q")
        self.assertEqual(text, "Success on retry")
        self.assertEqual(client.calls, 2)

    async def test_never_logs_api_key(self):
        resp = _json_response(200, {"choices": [{"message": {"content": "answer"}}]})
        fake = _FakeAsyncClient(response=resp)
        secret_key = "super-secret-key-xyz-987"
        env = {
            "OPENROUTER_API_KEY": secret_key,
            "OPENROUTER_MODEL": "nvidia/nemotron-3-ultra-550b-a55b:free",
        }
        with self.assertLogs("openrouter_llm", level="DEBUG") as log_capture:
            with patch.dict(os.environ, env, clear=False):
                with patch("openrouter_llm.httpx.AsyncClient", return_value=fake):
                    await or_llm.generate_response("ctx", "q")

        for record in log_capture.output:
            self.assertNotIn(secret_key, record)
            self.assertNotIn("Bearer", record)


def httpx_timeout():
    import httpx

    return httpx.TimeoutException("timeout")


class AskRouteTests(unittest.IsolatedAsyncioTestCase):
    async def test_ask_maps_inference_error(self):
        from fastapi import HTTPException

        from main import ask

        user = MagicMock()
        user.id = 1
        with patch("main.ask_question", new=AsyncMock(side_effect=or_llm.InferenceError("nope", status_code=503))):
            with self.assertRaises(HTTPException) as ctx:
                await ask(query="hello", user=user)
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertEqual(ctx.exception.detail, "nope")


class EnvConfigTests(unittest.TestCase):
    def test_env_file_is_beside_backend_package(self):
        from env_config import BACKEND_DIR, ENV_FILE

        self.assertTrue(BACKEND_DIR.name.endswith("llm") or "main" in BACKEND_DIR.name)
        self.assertEqual(ENV_FILE.name, ".env")
        self.assertEqual(ENV_FILE.parent, BACKEND_DIR)


class RagBankruptcyRegressionTests(unittest.TestCase):
    def test_bankruptcy_path_does_not_call_llm(self):
        import asyncio

        import rag

        async def _run():
            with patch.object(rag, "retrieve", return_value=["total assets 100"]):
                with patch.object(
                    rag,
                    "run_bankruptcy_engine",
                    return_value={"z_score": 3.2, "classification": "safe", "metrics": {}},
                ):
                    with patch.object(rag, "generate_answer", new=AsyncMock()) as gen:
                        result = await rag.ask_question("Will the company go bankrupt?")
                        gen.assert_not_called()
                        self.assertIn("3.2", result)
                        self.assertIn("safe", result)

        asyncio.run(_run())


if __name__ == "__main__":
    unittest.main()
