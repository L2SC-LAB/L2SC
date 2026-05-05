# L2SC all-in-one image — backend (FastAPI) + frontend (React static).
# Backend serve static files trực tiếp qua FastAPI StaticFiles → không cần nginx riêng.
#
# Build:  docker build -t baphongpine/l2sc:dev .
# Multi-arch push:
#   docker buildx build --platform linux/amd64,linux/arm64 \
#     -t baphongpine/l2sc:1.0.0-beta -t baphongpine/l2sc:latest --push .

# =====================================================================
# Stage 1: frontend-builder — build React → static bundle
# =====================================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /fe
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build
# Output: /fe/dist/{index.html, assets/*}

# =====================================================================
# Stage 2: backend-builder — install Python deps vào venv
# =====================================================================
FROM python:3.11-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build deps cho psycopg2, bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt ./
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip wheel && \
    /opt/venv/bin/pip install -r requirements.txt

# =====================================================================
# Stage 3: runtime — Python venv + source + frontend static
# =====================================================================
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    L2SC_STATIC_DIR=/app/static

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /opt/venv /opt/venv

WORKDIR /app

COPY backend/ ./backend/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Frontend static bundle
COPY --from=frontend-builder /fe/dist /app/static

EXPOSE 991

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:991/health || exit 1

# Serve cả API + static UI trên port 991
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "991"]
