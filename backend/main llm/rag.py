import chromadb

from embeddings import embed_texts
from llm import generate_answer

from bankruptcy_engine.bankruptcy_engine import (
    run_bankruptcy_engine
)


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

            print("\nOLD CHUNKS CLEARED\n")

    except Exception as e:

        print(f"\nCLEAR ERROR: {e}\n")


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

        collection.add(

            documents=[doc],

            embeddings=[embeddings[i]],

            metadatas=[
                {
                    "statement": statement_type
                }
            ],

            ids=[str(i)]
        )

    print(f"\nSTORED {len(docs)} CHUNKS\n")


# -----------------------------
# RETRIEVE RELEVANT CHUNKS
# -----------------------------
def retrieve(query):

    results = collection.get()

    docs = results["documents"]

    print("\nRETRIEVED DOC COUNT:")
    print(len(docs))

    return docs


# -----------------------------
# MAIN QUESTION FUNCTION
# -----------------------------
def ask_question(query):

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

    print("\nRETRIEVED CONTEXT:\n")
    print(context[:5000])

    # -------------------------
    # BANKRUPTCY PATH
    # -------------------------
    if (
        "bankruptcy" in query_lower
        or "bankrupt" in query_lower
        or "financial distress" in query_lower
        or "risk" in query_lower
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
    answer = generate_answer(
        context,
        query
    )

    return answer