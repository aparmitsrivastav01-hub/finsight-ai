import logging

import chromadb

from embeddings import embed_texts
from llm import generate_answer

from bankruptcy_engine.bankruptcy_engine import run_bankruptcy_engine

logger = logging.getLogger(__name__)

# -----------------------------
# CHROMADB SETUP
# -----------------------------
client = chromadb.Client()

collection = client.get_or_create_collection(
    name="finance"
)


# -----------------------------
# CLASSIFY STATEMENT TYPE
# -----------------------------
def classify_statement(chunk):

    text = chunk.lower()

    # Balance Sheet
    if (
        "total assets" in text
        or "liabilities" in text
        or "equity" in text
        or "balance sheet" in text
    ):

        return "balance_sheet"

    # Profit & Loss
    elif (
        "revenue" in text
        or "net profit" in text
        or "operating income" in text
        or "profit and loss" in text
    ):

        return "profit_loss"

    # Cash Flow
    elif (
        "cash flow" in text
        or "operating activities" in text
        or "financing activities" in text
        or "investing activities" in text
    ):

        return "cash_flow"

    return "general"


# -----------------------------
# CLEAR OLD DATA
# -----------------------------
def clear_collection():

    try:

        existing = collection.get()

        if existing["ids"]:

            collection.delete(
                ids=existing["ids"]
            )

            logger.info("ChromaDB: cleared %s prior chunk ids", len(existing["ids"]))

    except Exception as e:

        logger.warning("ChromaDB clear_collection error: %s", e)


# -----------------------------
# STORE CHUNKS
# -----------------------------
def store_chunks(chunks):

    # Clear previous uploaded company
    clear_collection()

    docs = [str(chunk) for chunk in chunks]

    embeddings = embed_texts(docs)

    for i, doc in enumerate(docs):

        statement_type = classify_statement(doc)

        row_emb = embeddings[i]
        emb_list = row_emb.tolist() if hasattr(row_emb, "tolist") else list(row_emb)

        collection.add(

            documents=[doc],

            embeddings=[emb_list],

            metadatas=[
                {
                    "statement": statement_type
                }
            ],

            ids=[str(i)]
        )

    logger.info("ChromaDB: stored %s chunks with embeddings", len(docs))


# -----------------------------
# RETRIEVE RELEVANT CHUNKS (semantic)
# -----------------------------
def retrieve(query: str, n_results: int = 8):
    """
    Query Chroma with the same embedding model used at index time (sentence-transformers).
    """
    try:
        n_total = collection.count()
    except Exception as exc:
        logger.error("ChromaDB count failed: %s", exc)
        return []

    if n_total == 0:
        logger.info("ChromaDB: empty collection, nothing to retrieve")
        return []

    try:
        q_vec = embed_texts([query])
        first = q_vec[0]
        query_embedding = first.tolist() if hasattr(first, "tolist") else list(first)
        k = min(max(1, n_results), n_total)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
        )
    except Exception as exc:
        logger.exception("ChromaDB query failed: %s", exc)
        return []

    docs_nested = results.get("documents") or []
    docs = docs_nested[0] if docs_nested else []
    logger.debug("ChromaDB: retrieved %s chunks for query_len=%s", len(docs), len(query or ""))
    return docs


# -----------------------------
# MAIN QUESTION FUNCTION
# -----------------------------
async def ask_question(query):

    query_lower = query.lower()

    docs = retrieve(query)

    # ---------------------------------
    # HANDLE EMPTY RETRIEVAL
    # ---------------------------------
    if not docs:

        return """
No relevant financial information
was retrieved from the uploaded PDF.
"""

    context = "\n\n".join(docs)

    logger.debug("RAG context preview (chars=%s): %s", len(context), context[:500])

    # -------------------------
    # BANKRUPTCY PATH
    # -------------------------
    if (
        "bankruptcy" in query_lower
        or "bankrupt" in query_lower
        or "financial distress" in query_lower
    ):

        result = run_bankruptcy_engine(context)

        return f"""
Altman Z-Score:
{result['z_score']}

Classification:
{result['classification']}

Metrics:
{result['metrics']}
"""

    # -------------------------
    # NORMAL RAG PATH
    # -------------------------
    answer = await generate_answer(
        context,
        query,
    )

    return answer
