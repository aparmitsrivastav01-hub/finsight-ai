"""LLM bridge: RAG context + user query → OpenRouter (see openrouter_llm)."""

from openrouter_llm import generate_response


async def generate_answer(context, query):
    return await generate_response(context, query)
