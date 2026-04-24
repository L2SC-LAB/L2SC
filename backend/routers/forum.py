"""
Forum router — diễn đàn cộng đồng L2S.
- Public: browse threads + detail + replies
- Contributor (auth): tạo thread / reply, sửa-xoá của mình
- Admin: pin, lock, xoá bất kỳ
"""
from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.database import get_db
from backend import db_models
from backend.auth import get_contributor, get_admin, API_KEY_HEADER
from backend.models import (
    FORUM_CATEGORIES,
    ForumThreadCreate, ForumThreadUpdate, ForumThreadSummary, ForumThreadDetail,
    ForumReplyCreate, ForumReplyUpdate, ForumReplyOut,
    ForumAuthor, ForumStats,
)

router = APIRouter(prefix="/api/forum", tags=["forum"])


def _author_payload(c: db_models.Contributor) -> ForumAuthor:
    return ForumAuthor(id=c.id, username=c.username, is_admin=c.is_admin)


def _summary_payload(t: db_models.ForumThread) -> ForumThreadSummary:
    return ForumThreadSummary(
        id=t.id,
        title=t.title,
        category=t.category,
        author=_author_payload(t.author),
        is_pinned=t.is_pinned,
        is_locked=t.is_locked,
        view_count=t.view_count,
        reply_count=t.reply_count,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def _reply_payload(r: db_models.ForumReply) -> ForumReplyOut:
    return ForumReplyOut(
        id=r.id,
        thread_id=r.thread_id,
        body_md=r.body_md,
        author=_author_payload(r.author),
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


def _detail_payload(t: db_models.ForumThread) -> ForumThreadDetail:
    summary = _summary_payload(t)
    return ForumThreadDetail(
        **summary.model_dump(),
        body_md=t.body_md,
        replies=[_reply_payload(r) for r in sorted(t.replies, key=lambda x: x.created_at)],
    )


# ---------- Stats (public) ----------

@router.get("/stats", response_model=ForumStats)
def forum_stats(db: Session = Depends(get_db)):
    total_threads = db.query(func.count(db_models.ForumThread.id)).scalar() or 0
    total_replies = db.query(func.count(db_models.ForumReply.id)).scalar() or 0
    rows = (
        db.query(db_models.ForumThread.category, func.count(db_models.ForumThread.id))
        .group_by(db_models.ForumThread.category)
        .all()
    )
    by_category = {c: 0 for c in FORUM_CATEGORIES}
    for cat, cnt in rows:
        by_category[cat] = cnt
    return ForumStats(total_threads=total_threads, by_category=by_category, total_replies=total_replies)


# ---------- Threads list (public) ----------

@router.get("/threads", response_model=list[ForumThreadSummary])
def list_threads(
    category: str | None = None,
    q: str | None = None,
    sort: str = "recent",     # recent / popular / unanswered
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(db_models.ForumThread)
    if category:
        if category not in FORUM_CATEGORIES:
            raise HTTPException(status_code=400, detail="Category không hợp lệ")
        query = query.filter(db_models.ForumThread.category == category)
    if q:
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(
            db_models.ForumThread.title.ilike(pattern),
            db_models.ForumThread.body_md.ilike(pattern),
        ))

    if sort == "popular":
        query = query.order_by(
            db_models.ForumThread.is_pinned.desc(),
            db_models.ForumThread.view_count.desc(),
            db_models.ForumThread.created_at.desc(),
        )
    elif sort == "unanswered":
        query = query.filter(db_models.ForumThread.reply_count == 0).order_by(
            db_models.ForumThread.is_pinned.desc(),
            db_models.ForumThread.created_at.desc(),
        )
    else:  # recent
        query = query.order_by(
            db_models.ForumThread.is_pinned.desc(),
            db_models.ForumThread.updated_at.desc(),
        )

    threads = query.offset(max(0, skip)).limit(max(1, min(100, limit))).all()
    return [_summary_payload(t) for t in threads]


# ---------- Thread detail (public, auto increment view_count) ----------

@router.get("/threads/{thread_id}", response_model=ForumThreadDetail)
def get_thread(thread_id: str, db: Session = Depends(get_db)):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    t.view_count = (t.view_count or 0) + 1
    db.commit()
    db.refresh(t)
    return _detail_payload(t)


# ---------- Thread CRUD (auth) ----------

@router.post("/threads", response_model=ForumThreadDetail, status_code=201)
def create_thread(
    body: ForumThreadCreate,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    t = db_models.ForumThread(
        id=str(uuid4()),
        title=body.title,
        body_md=body.body_md,
        category=body.category,
        author_id=contributor.id,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _detail_payload(t)


@router.put("/threads/{thread_id}", response_model=ForumThreadDetail)
def update_thread(
    thread_id: str,
    body: ForumThreadUpdate,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    if t.author_id != contributor.id and not contributor.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ chủ bài hoặc admin mới sửa được")

    updates = body.model_dump(exclude_unset=True)
    if "title" in updates:
        title = (updates["title"] or "").strip()
        if len(title) < 5:
            raise HTTPException(status_code=422, detail="Tiêu đề quá ngắn")
        t.title = title
    if "body_md" in updates:
        md = (updates["body_md"] or "").strip()
        if len(md) < 10:
            raise HTTPException(status_code=422, detail="Nội dung quá ngắn")
        t.body_md = md
    if "category" in updates and updates["category"]:
        if updates["category"] not in FORUM_CATEGORIES:
            raise HTTPException(status_code=400, detail="Category không hợp lệ")
        t.category = updates["category"]

    db.commit()
    db.refresh(t)
    return _detail_payload(t)


@router.delete("/threads/{thread_id}")
def delete_thread(
    thread_id: str,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    if t.author_id != contributor.id and not contributor.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ chủ bài hoặc admin mới xoá được")
    db.delete(t)
    db.commit()
    return {"message": "Đã xoá thread"}


# ---------- Replies ----------

@router.post("/threads/{thread_id}/replies", response_model=ForumReplyOut, status_code=201)
def create_reply(
    thread_id: str,
    body: ForumReplyCreate,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    if t.is_locked and not contributor.is_admin:
        raise HTTPException(status_code=403, detail="Thread đã khoá — không thể trả lời")

    r = db_models.ForumReply(
        id=str(uuid4()),
        thread_id=thread_id,
        body_md=body.body_md,
        author_id=contributor.id,
    )
    db.add(r)
    # Cập nhật reply_count + updated_at của thread (để sort recent hoạt động đúng)
    t.reply_count = (t.reply_count or 0) + 1
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return _reply_payload(r)


@router.put("/replies/{reply_id}", response_model=ForumReplyOut)
def update_reply(
    reply_id: str,
    body: ForumReplyUpdate,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    r = db.query(db_models.ForumReply).filter(db_models.ForumReply.id == reply_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reply không tồn tại")
    if r.author_id != contributor.id and not contributor.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ chủ reply hoặc admin mới sửa được")
    md = (body.body_md or "").strip()
    if len(md) < 2:
        raise HTTPException(status_code=422, detail="Nội dung quá ngắn")
    r.body_md = md
    db.commit()
    db.refresh(r)
    return _reply_payload(r)


@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: str,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    r = db.query(db_models.ForumReply).filter(db_models.ForumReply.id == reply_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reply không tồn tại")
    if r.author_id != contributor.id and not contributor.is_admin:
        raise HTTPException(status_code=403, detail="Chỉ chủ reply hoặc admin mới xoá được")
    # Decrement reply_count
    t = r.thread
    if t and t.reply_count and t.reply_count > 0:
        t.reply_count -= 1
    db.delete(r)
    db.commit()
    return {"message": "Đã xoá reply"}


# ---------- Admin actions ----------

@router.post("/threads/{thread_id}/pin", response_model=ForumThreadSummary)
def toggle_pin(
    thread_id: str,
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    t.is_pinned = not t.is_pinned
    db.commit()
    db.refresh(t)
    return _summary_payload(t)


@router.post("/threads/{thread_id}/lock", response_model=ForumThreadSummary)
def toggle_lock(
    thread_id: str,
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    t = db.query(db_models.ForumThread).filter(db_models.ForumThread.id == thread_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Thread không tồn tại")
    t.is_locked = not t.is_locked
    db.commit()
    db.refresh(t)
    return _summary_payload(t)
