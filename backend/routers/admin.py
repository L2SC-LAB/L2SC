"""
Admin endpoints — yêu cầu X-API-Key của admin.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend import db_models
from backend.models import WorkflowOut, ApproveRequest
from backend.auth import get_admin
from backend.routers.public import _to_out

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _filter_workflows(db: Session, status: str, q: Optional[str], category: Optional[str]):
    query = db.query(db_models.PublicWorkflow)
    if status == "pending":
        query = query.filter(
            db_models.PublicWorkflow.is_approved == False,
            db_models.PublicWorkflow.is_rejected == False,
        )
    elif status == "approved":
        query = query.filter(db_models.PublicWorkflow.is_approved == True)
    elif status == "rejected":
        query = query.filter(db_models.PublicWorkflow.is_rejected == True)
    # else "all": no filter

    if q:
        safe_q = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{safe_q}%"
        query = query.filter(
            db_models.PublicWorkflow.title.ilike(like) |
            db_models.PublicWorkflow.description.ilike(like)
        )
    if category:
        query = query.filter(db_models.PublicWorkflow.category == category)
    return query


@router.get("/workflows/pending", response_model=list[WorkflowOut])
def pending_workflows(admin=Depends(get_admin), db: Session = Depends(get_db)):
    """Danh sách workflow chờ duyệt (backward-compat)."""
    ws = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.is_approved == False,
        db_models.PublicWorkflow.is_rejected == False,
    ).order_by(db_models.PublicWorkflow.created_at.asc()).all()
    return [_to_out(w) for w in ws]


@router.get("/workflows", response_model=list[WorkflowOut])
def all_workflows(
    status: str = Query("all", description="all | pending | approved | rejected", pattern="^(all|pending|approved|rejected)$"),
    q: Optional[str] = Query(None, max_length=200),
    category: Optional[str] = Query(None, max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Workflows với filter, search, pagination."""
    query = _filter_workflows(db, status, q, category)
    total = query.count()
    ws = query.order_by(db_models.PublicWorkflow.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_out(w) for w in ws]


@router.get("/workflows/count")
def count_workflows(
    status: str = Query("all", pattern="^(all|pending|approved|rejected)$"),
    q: Optional[str] = Query(None, max_length=200),
    category: Optional[str] = Query(None, max_length=50),
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Đếm tổng workflows theo filter — dùng cho pagination."""
    return {"total": _filter_workflows(db, status, q, category).count()}


@router.post("/workflows/{workflow_id}/approve")
def approve_workflow(
    workflow_id: str,
    body: ApproveRequest,
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Duyệt / từ chối / thu hồi workflow."""
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")

    action = body.resolved_action()
    if action == "approve":
        w.is_approved = True
        w.is_rejected = False
        msg = "Đã duyệt workflow"
    elif action == "reject":
        w.is_approved = False
        w.is_rejected = True
        msg = "Đã từ chối workflow"
    elif action == "revoke":
        w.is_approved = False
        w.is_rejected = False
        msg = "Đã thu hồi duyệt"
    else:
        raise HTTPException(status_code=400, detail="action phải là approve/reject/revoke")

    db.commit()
    return {"message": msg, "workflow_id": workflow_id}


@router.delete("/workflows/{workflow_id}")
def delete_workflow(workflow_id: str, admin=Depends(get_admin), db: Session = Depends(get_db)):
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")
    db.delete(w)
    db.commit()
    return {"message": "Đã xoá workflow"}


@router.get("/stats")
def stats(admin=Depends(get_admin), db: Session = Depends(get_db)):
    WF = db_models.PublicWorkflow
    return {
        "total_workflows": db.query(WF).count(),
        "approved_workflows": db.query(WF).filter(WF.is_approved == True).count(),
        "pending_workflows": db.query(WF).filter(WF.is_approved == False, WF.is_rejected == False).count(),
        "rejected_workflows": db.query(WF).filter(WF.is_rejected == True).count(),
        "total_contributors": db.query(db_models.Contributor).count(),
        "total_nodes": db.query(db_models.L2SNode).count(),
        "total_runs": db.query(db_models.WorkflowRun).count(),
    }


@router.post("/contributors/{contributor_id}/toggle-admin")
def toggle_admin(contributor_id: str, admin=Depends(get_admin), db: Session = Depends(get_db)):
    c = db.query(db_models.Contributor).filter(db_models.Contributor.id == contributor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contributor không tồn tại")
    c.is_admin = not c.is_admin
    db.commit()
    return {"username": c.username, "is_admin": c.is_admin}
