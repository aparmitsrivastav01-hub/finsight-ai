from langchain_community.llms import Ollama

llm = Ollama(model="deepseek-r1")


def generate_answer(context, query):

    prompt = f"""
You are FinSight AI.

Answer ONLY using the financial context below.

If the context mentions:
- net loss
- operating loss
- accumulated deficit

then clearly state the company is in loss.

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    return llm.invoke(prompt)