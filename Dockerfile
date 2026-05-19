# FinSight FinGPT — Hugging Face Spaces (Docker, port 7860)
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Application code (Space root = repo root)
COPY ["backend/main llm/", "/app/"]

# CPU / memory tuning for HF Spaces basic tier
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TOKENIZERS_PARALLELISM=false \
    OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    HF_HOME=/data/hf-cache \
    SENTENCE_TRANSFORMERS_HOME=/data/hf-cache \
    CHROMA_PERSIST_DIR=/data/chroma \
    FINSIGHT_SQLITE_PATH=/data/finsight_users.db \
    PRELOAD_EMBEDDING_MODEL=true \
    PORT=7860 \
    HOST=0.0.0.0

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements-spaces.txt

# Warm embedding weights at build time (faster first /ask after deploy)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

RUN mkdir -p /data/uploaded_pdfs /data/chroma /data/hf-cache

EXPOSE 7860

CMD ["sh", "-c", "uvicorn main:app --host ${HOST} --port ${PORT} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
