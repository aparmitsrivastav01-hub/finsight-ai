"""LLM bridge: RAG context + user query → Hugging Face Inference (see hf_llm)."""

from hf_llm import generate_response


async def generate_answer(context, query):
    return await generate_response(context, query)