"""
Admin endpoints — yêu cầu X-API-Key của admin.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import db_models
from backend.models import WorkflowOut, ApproveRequest
from backend.auth import get_admin
from backend.routers.public import _to_out

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/workflows/pending", response_model=list[WorkflowOut])
def pending_workflows(admin=Depends(get_admin), db: Session = Depends(get_db)):
    """Danh sách workflow chờ duyệt."""
    ws = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.is_approved == False
    ).order_by(db_models.PublicWorkflow.created_at.asc()).all()
    return [_to_out(w) for w in ws]


@router.get("/workflows", response_model=list[WorkflowOut])
def all_workflows(admin=Depends(get_admin), db: Session = Depends(get_db)):
    """Tất cả workflow (kể cả chưa duyệt, chưa active)."""
    ws = db.query(db_models.PublicWorkflow).order_by(
        db_models.PublicWorkflow.created_at.desc()
    ).all()
    return [_to_out(w) for w in ws]


@router.post("/workflows/{workflow_id}/approve")
def approve_workflow(
    workflow_id: str,
    body: ApproveRequest,
    admin=Depends(get_admin),
    db: Session = Depends(get_db),
):
    """Duyệt hoặc từ chối workflow."""
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")
    w.is_approved = body.approved
    db.commit()
    action = "đã duyệt" if body.approved else "đã từ chối"
    return {"message": f"Workflow {action}", "workflow_id": workflow_id}


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
    return {
        "total_workflows": db.query(db_models.PublicWorkflow).count(),
        "approved_workflows": db.query(db_models.PublicWorkflow).filter(db_models.PublicWorkflow.is_approved == True).count(),
        "pending_workflows": db.query(db_models.PublicWorkflow).filter(db_models.PublicWorkflow.is_approved == False).count(),
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
