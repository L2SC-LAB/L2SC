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


@app.get("/")
def root():
    return {
        "service": "L2SC — L2S Communicate",
        "docs": "/docs",
        "workflows": "/api/workflows",
        "register": "/api/contribute/register",
    }
