"""
Docs router — giải thích các plugin của L2S cho non-tech user.

Nguồn dữ liệu:
- Metadata (label/description/configSchema/inputs/outputs/category): auto-pull từ L2S node live qua
  endpoint public `/api/plugins/public`. Cache 5 phút để đỡ round-trip.
- Content admin viết tay (what_it_does / when_to_use / example_md / faq_md): lưu trong bảng node_docs.
"""
import logging
import time
from typing import Any, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import db_models
from backend.auth import get_admin
from backend.models import (
    NodeDocSummary, NodeDocDetail, NodeDocEdit,
    NodeDocFieldSchema, NodeDocIO,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/docs", tags=["docs"])

# Cache plugin metadata trong bộ nhớ để đỡ gọi L2S node mỗi request.
_CACHE_TTL = 300   # 5 phút
_cache: dict[str, Any] = {"plugins": None, "at": 0.0, "source_url": None}


def _pick_active_node(db: Session) -> Optional[db_models.L2SNode]:
    """Chọn L2S node đang active — ưu tiên node mới last_seen."""
    return (
        db.query(db_models.L2SNode)
        .filter(db_models.L2SNode.is_active == True)
        .order_by(
            db_models.L2SNode.last_seen_at.desc().nullslast(),
            db_models.L2SNode.created_at.desc(),
        )
        .first()
    )


async def _fetch_plugins(db: Session, force: bool = False) -> list[dict]:
    """
    Fetch + cache metadata plugin từ L2S node active.
    Raises HTTPException 503 nếu không có node.
    """
    now = time.time()
    if (
        not force
        and _cache["plugins"] is not None
        and now - _cache["at"] < _CACHE_TTL
    ):
        return _cache["plugins"]

    node = _pick_active_node(db)
    if not node:
        raise HTTPException(
            status_code=503,
            detail="Chưa có L2S node nào được đăng ký với L2SC. Không thể load danh sách plugin.",
        )

    url = f"{node.base_url.rstrip('/')}/api/plugins/public"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"L2S node {node.base_url} trả lỗi {resp.status_code} khi fetch plugins",
            )
        data = resp.json()
        plugins = data.get("plugins") if isinstance(data, dict) else None
        if not isinstance(plugins, list):
            raise HTTPException(status_code=502, detail="Plugin response không đúng định dạng")
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Không kết nối được tới L2S node {node.base_url}: {e.__class__.__name__}",
        )

    _cache["plugins"] = plugins
    _cache["at"] = now
    _cache["source_url"] = url
    return plugins


def _flatten_schema_to_fields(config_schema: Optional[dict]) -> list[NodeDocFieldSchema]:
    """configSchema dạng dict{name: {type, label, required, default, description, options}} → list friendly."""
    if not config_schema or not isinstance(config_schema, dict):
        return []
    out: list[NodeDocFieldSchema] = []
    for name, spec in config_schema.items():
        if not isinstance(spec, dict):
            continue
        raw_options = spec.get("options")
        options: Optional[list[Any]] = None
        if isinstance(raw_options, list):
            options = [
                opt if isinstance(opt, (str, int, float, bool))
                else opt.get("label") or opt.get("value") or str(opt)
                for opt in raw_options
            ]
        out.append(NodeDocFieldSchema(
            name=name,
            label=spec.get("label") or name,
            type=spec.get("type") or "string",
            required=bool(spec.get("required", False)),
            default=spec.get("default"),
            description=spec.get("description") or spec.get("placeholder"),
            options=options,
        ))
    return out


def _io_list(items: Any) -> list[NodeDocIO]:
    """inputs/outputs trong L2S là list[str] các tên — convert sang NodeDocIO."""
    if not isinstance(items, list):
        return []
    out: list[NodeDocIO] = []
    for it in items:
        if isinstance(it, str):
            out.append(NodeDocIO(name=it))
        elif isinstance(it, dict) and it.get("name"):
            out.append(NodeDocIO(
                name=str(it.get("name")),
                description=it.get("description"),
                schema_hint=it.get("schema") or it.get("example"),
            ))
    return out


def _doc_map(db: Session) -> dict[str, db_models.NodeDoc]:
    """Lấy toàn bộ node_docs về dict để lookup nhanh khi render list."""
    return {d.plugin_type: d for d in db.query(db_models.NodeDoc).all()}


# ---------- Endpoints ----------

@router.get("", response_model=list[NodeDocSummary])
async def list_docs(db: Session = Depends(get_db)):
    """Danh sách tất cả plugin + cờ has_doc (để render badge 'Có tutorial')."""
    plugins = await _fetch_plugins(db)
    docs = _doc_map(db)
    out: list[NodeDocSummary] = []
    for p in plugins:
        plugin_type = p.get("type")
        if not plugin_type:
            continue
        d = docs.get(plugin_type)
        out.append(NodeDocSummary(
            plugin_type=plugin_type,
            label=p.get("label") or plugin_type,
            description=p.get("description"),
            category=p.get("category"),
            icon=p.get("icon"),
            has_doc=bool(d and d.has_content),
        ))
    return out


@router.get("/{plugin_type}", response_model=NodeDocDetail)
async def get_doc(plugin_type: str, db: Session = Depends(get_db)):
    plugins = await _fetch_plugins(db)
    meta = next((p for p in plugins if p.get("type") == plugin_type), None)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_type}' không tồn tại trên L2S node")

    doc = db.query(db_models.NodeDoc).filter(db_models.NodeDoc.plugin_type == plugin_type).first()
    editor_username: Optional[str] = None
    if doc and doc.updated_by:
        editor = db.query(db_models.Contributor).filter(
            db_models.Contributor.id == doc.updated_by
        ).first()
        editor_username = editor.username if editor else None

    return NodeDocDetail(
        plugin_type=plugin_type,
        label=meta.get("label") or plugin_type,
        description=meta.get("description"),
        category=meta.get("category"),
        icon=meta.get("icon"),
        config_fields=_flatten_schema_to_fields(meta.get("configSchema")),
        inputs=_io_list(meta.get("inputs")),
        outputs=_io_list(meta.get("outputs")),
        what_it_does=doc.what_it_does if doc else None,
        when_to_use=doc.when_to_use if doc else None,
        example_md=doc.example_md if doc else None,
        faq_md=doc.faq_md if doc else None,
        doc_updated_at=doc.updated_at if doc else None,
        doc_updated_by=editor_username,
    )


@router.put("/{plugin_type}", response_model=NodeDocDetail)
async def upsert_doc(
    plugin_type: str,
    body: NodeDocEdit,
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Admin viết/sửa doc cho plugin. Chỉ update các field đưa vào (exclude_unset)."""
    plugins = await _fetch_plugins(db)
    if not any(p.get("type") == plugin_type for p in plugins):
        raise HTTPException(status_code=404, detail=f"Plugin '{plugin_type}' không tồn tại")

    doc = db.query(db_models.NodeDoc).filter(db_models.NodeDoc.plugin_type == plugin_type).first()
    if not doc:
        doc = db_models.NodeDoc(plugin_type=plugin_type)
        db.add(doc)

    updates = body.model_dump(exclude_unset=True)
    for field, val in updates.items():
        setattr(doc, field, val)
    doc.updated_by = admin.id
    db.commit()

    return await get_doc(plugin_type, db)


@router.post("/_refresh-cache")
async def refresh_cache(admin=Depends(get_admin), db: Session = Depends(get_db)):
    """Admin bấm để force refresh cache plugin metadata (khi L2S cài plugin mới)."""
    plugins = await _fetch_plugins(db, force=True)
    return {"count": len(plugins), "source": _cache["source_url"]}
