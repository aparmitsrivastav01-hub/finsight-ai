import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from auth.database import Base, engine
from auth.deps import get_current_user
from auth.models import User
from auth.router import router as auth_router
from health_engine import analyze_health
from history.router import router as history_router
from parser import parse_pdf
from rag import ask_question, store_chunks

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Import models so metadata registers tables
    from auth import models as _auth_models  # noqa: F401
    from history import models as _history_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    os.makedirs("data/uploaded_pdfs", exist_ok=True)
    yield


app = FastAPI(title="FinSight FinGPT API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(history_router)


UPLOAD_DIR = "data/uploaded_pdfs"


def _require_pdf(filename: str | None) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported")


def _safe_pdf_path(filename: str) -> str:
    base = os.path.basename(filename.strip())
    if not base or not base.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid document id")
    path = os.path.join(UPLOAD_DIR, base)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document not found")
    return path


def _document_meta(path: str, name: str) -> dict:
    stat = os.stat(path)
    return {
        "id": name,
        "name": name,
        "size": stat.st_size,
        "uploadedAt": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        "type": "application/pdf",
    }


@app.post("/upload")
async def upload_pdf(
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    _require_pdf(file.filename)
    filename = os.path.basename(file.filename)
    path = os.path.join(UPLOAD_DIR, filename)
    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    with open(path, "wb") as f:
        f.write(raw)

    chunks = parse_pdf(path)
    store_chunks(chunks)

    document = {
        "id": filename,
        "name": filename,
        "size": len(raw),
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "type": "application/pdf",
    }

    health: dict | None = None
    try:
        health = analyze_health(path)
    except Exception as exc:
        logger.warning("Health analysis skipped after upload: %s", exc)

    payload = {
        "message": "PDF processed successfully",
        "filename": filename,
        "document": document,
        "user_id": user.id,
    }
    if health is not None:
        payload["health"] = health
    return payload


@app.get("/documents")
async def list_documents(user: User = Depends(get_current_user)):
    del user  # reserved for per-user storage later
    docs: list[dict] = []
    if os.path.isdir(UPLOAD_DIR):
        names = sorted(
            (n for n in os.listdir(UPLOAD_DIR) if n.lower().endswith(".pdf")),
            key=lambda n: os.path.getmtime(os.path.join(UPLOAD_DIR, n)),
            reverse=True,
        )
        for name in names:
            full = os.path.join(UPLOAD_DIR, name)
            if os.path.isfile(full):
                docs.append(_document_meta(full, name))
    return {"documents": docs}


@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, user: User = Depends(get_current_user)):
    del user
    path = _safe_pdf_path(document_id)
    os.remove(path)
    return {"message": "Document deleted", "id": os.path.basename(document_id)}


def _infer_analysis_type(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ("invest", "investment", "buy", "portfolio")):
        return "investment"
    if any(w in q for w in ("risk", "bankrupt", "flag", "distress", "debt")):
        return "risk"
    return "analysis"


def _company_from_active_doc() -> str:
    if not os.path.isdir(UPLOAD_DIR):
        return "Unknown"
    pdfs = [n for n in os.listdir(UPLOAD_DIR) if n.lower().endswith(".pdf")]
    if not pdfs:
        return "Unknown"
    pdfs.sort(key=lambda n: os.path.getmtime(os.path.join(UPLOAD_DIR, n)), reverse=True)
    return pdfs[0].replace(".pdf", "").replace("_", " ")


def _save_query_history(user_id: int, query: str, answer: str) -> None:
    from auth.database import SessionLocal
    from history.models import QueryHistory

    summary = (answer or "")[:500]
    company = _company_from_active_doc()
    db = SessionLocal()
    try:
        row = QueryHistory(
            user_id=user_id,
            company_name=company,
            query=query,
            analysis_type=_infer_analysis_type(query),
            response_summary=summary,
            document_id=None,
        )
        db.add(row)
        db.commit()
    finally:
        db.close()


@app.get("/ask")
def ask(
    query: str,
    user: User = Depends(get_current_user),
):
    if not query or not query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query is required")
    q = query.strip()
    answer = ask_question(q)

    try:
        _save_query_history(user.id, q, answer)
    except Exception as exc:
        logger.warning("Failed to save query history: %s", exc)

    return {
        "query": query,
        "answer": answer,
        "user_id": user.id,
    }


@app.get("/analysis/health")
def get_financial_health(user: User = Depends(get_current_user)):
    del user
    try:
        return analyze_health()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Health analysis unavailable: {exc}",
        ) from exc


@app.get("/health")
def health():
    return {"status": "ok"}
