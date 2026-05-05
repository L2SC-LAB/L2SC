"""
L2SC — L2S Communicate
Registry và execution proxy cho public workflows của hệ sinh thái L2S.
"""
import logging
import os
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, get_db, SessionLocal
from backend import db_models
from backend.auth import generate_api_key
from backend.routers.public import router as public_router, runs_router, stats_router
from backend.routers.contribute import router as contribute_router
from backend.routers.admin import router as admin_router
from backend.routers.docs import router as docs_router
from backend.routers.forum import router as forum_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _seed_admin()
    logger.info("L2SC started")
    yield
    logger.info("L2SC shutting down")


def _seed_admin():
    """Tạo admin mặc định nếu chưa có ai trong DB."""
    db = SessionLocal()
    try:
        if db.query(db_models.Contributor).count() == 0:
            admin_key = os.getenv("L2SC_ADMIN_API_KEY", generate_api_key())
            admin = db_models.Contributor(
                id=str(uuid4()),
                username="admin",
                email="admin@l2sc.local",
                api_key=admin_key,
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            logger.info(f"[L2SC] Admin seeded — API key: {admin_key}")
            logger.info("[L2SC] Lưu key này lại. Set L2SC_ADMIN_API_KEY trong .env để giữ key cố định.")
    finally:
        db.close()


app = FastAPI(
    title="L2SC — L2S Communicate",
    description=(
        "Public workflow registry & execution proxy cho hệ sinh thái L2S.\n\n"
        "- **Public**: browse & execute workflow không cần auth\n"
        "- **Contribute** (`X-API-Key`): đăng ký contributor, submit workflow, register L2S node\n"
        "- **Admin** (`X-API-Key` admin): duyệt workflow, xem stats\n\n"
        "Contributor đăng ký tại `POST /api/contribute/register`."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — production set L2SC_CORS_ORIGINS=https://l2s.io.vn,https://www.l2s.io.vn
# Default "*" cho dev. Same-origin behind cloudflared (l2s.io.vn → frontend → /api → backend)
# thì preflight không bắt buộc, nhưng giữ "*" cho bot/integration.
_cors_env = os.getenv("L2SC_CORS_ORIGINS", "*").strip()
_cors_origins = ["*"] if _cors_env == "*" else [o.strip() for o in _cors_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stats_router)
app.include_router(public_router)
app.include_router(runs_router)
app.include_router(contribute_router)
app.include_router(admin_router)
app.include_router(docs_router)
app.include_router(forum_router)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "l2sc"}


@app.get("/api/health")
def api_health():
    """L2S clients ping endpoint này để kiểm tra connection — trả 'ok' để L2S
    biết hub đang sống. Giữ shape `{ok, version, auto_approve}` để khớp với
    parser bên L2S backend community.py."""
    from sqlalchemy import select, func
    from backend.db_models import PublicWorkflow

    auto_approve = os.getenv("L2SC_AUTO_APPROVE", "false").lower() == "true"
    try:
        with SessionLocal() as db:
            wf_count = db.scalar(select(func.count(PublicWorkflow.id))) or 0
    except Exception:
        wf_count = 0

    return {
        "ok": True,
        "service": "l2sc",
        "version": os.getenv("L2SC_VERSION", "1.0.0-beta"),
        "auto_approve": auto_approve,
        "workflows": wf_count,
    }


@app.get("/api/info")
def api_info():
    """Metadata service info — replaces old / route which now serves SPA."""
    return {
        "service": "L2SC — L2S Communicate",
        "docs": "/docs",
        "workflows": "/api/workflows",
        "register": "/api/contribute/register",
    }


# ============================================================
# FRONTEND STATIC SERVING (all-in-one image)
# ============================================================
# Khi docker image gộp BE + FE: copy `frontend/dist` → /app/static.
# Backend serve UI trực tiếp tại `/`, fallback `index.html` cho SPA routing.
# Bypass nếu L2SC_STATIC_DIR không tồn tại (chạy backend riêng cho dev frontend Vite).
from pathlib import Path as _Path
from fastapi import HTTPException as _HTTPException, Request as _Request
from fastapi.staticfiles import StaticFiles as _StaticFiles
from fastapi.responses import FileResponse as _FileResponse

_static_dir = _Path(os.getenv("L2SC_STATIC_DIR", "/app/static"))
if _static_dir.is_dir() and (_static_dir / "index.html").exists():
    _assets_dir = _static_dir / "assets"
    if _assets_dir.is_dir():
        app.mount("/assets", _StaticFiles(directory=str(_assets_dir)), name="assets")

    @app.get("/favicon.ico", include_in_schema=False)
    @app.get("/favicon.png", include_in_schema=False)
    @app.get("/robots.txt", include_in_schema=False)
    @app.get("/vite.svg", include_in_schema=False)
    async def _static_root_file(request: _Request):
        f = _static_dir / request.url.path.lstrip("/")
        if f.is_file():
            return _FileResponse(f)
        raise _HTTPException(status_code=404)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def _spa_fallback(full_path: str):
        # Đừng catch API path — nếu API không match thì FastAPI tự trả 404
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path == "openapi.json":
            raise _HTTPException(status_code=404, detail=f"Not found: /{full_path}")
        return _FileResponse(_static_dir / "index.html")

    logger.info(f"[static] Serving frontend từ {_static_dir} — all-in-one mode")
else:
    # Dev mode: không có static dir → backend chỉ serve API.
    # Add lại `/` JSON cho ai gọi root.
    @app.get("/")
    def _root_json():
        return {
            "service": "L2SC — L2S Communicate",
            "mode": "api-only",
            "docs": "/docs",
            "workflows": "/api/workflows",
        }
    logger.info(f"[static] Không tìm thấy {_static_dir} — backend chỉ serve API (dev mode)")
