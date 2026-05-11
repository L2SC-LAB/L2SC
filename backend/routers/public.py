"""
Public endpoints — không cần auth.
Bất kỳ ai cũng có thể browse và execute workflow public.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import uuid4
from backend.database import get_db
from backend import db_models
from backend.models import WorkflowOut, WorkflowDetail, ExecuteRequest, ExecuteResponse, RunOut
from backend.proxy import forward_execute, poll_run_status

router = APIRouter(prefix="/api/workflows", tags=["public"])

stats_router = APIRouter(prefix="/api", tags=["public"])


@stats_router.get("/stats")
def public_stats(db: Session = Depends(get_db)):
    """Public stats cho landing page."""
    return {
        "approved_workflows": db.query(db_models.PublicWorkflow).filter(
            db_models.PublicWorkflow.is_approved == True,
            db_models.PublicWorkflow.is_active == True,
        ).count(),
        "total_contributors": db.query(db_models.Contributor).count(),
        "total_nodes": db.query(db_models.L2SNode).count(),
        "total_runs": db.query(db_models.WorkflowRun).count(),
    }


@router.get("", response_model=list[WorkflowOut])
def list_workflows(
    category: Optional[str] = Query(default=None, max_length=50),
    tag: Optional[str] = Query(default=None, max_length=50),
    q: Optional[str] = Query(default=None, max_length=200),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Liệt kê tất cả workflow public đã được duyệt."""
    query = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.is_approved == True,
        db_models.PublicWorkflow.is_active == True,
    )
    if category:
        query = query.filter(db_models.PublicWorkflow.category == category)
    if tag:
        query = query.filter(db_models.PublicWorkflow.tags.contains([tag]))
    if q:
        safe_q = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(
            db_models.PublicWorkflow.title.ilike(f"%{safe_q}%") |
            db_models.PublicWorkflow.description.ilike(f"%{safe_q}%")
        )
    workflows = query.order_by(db_models.PublicWorkflow.call_count.desc()).offset(skip).limit(limit).all()
    return [_to_out(w) for w in workflows]


@router.get("/{workflow_id}", response_model=WorkflowDetail)
def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Lấy chi tiết + workflow_def (nodes/edges) để import vào L2S."""
    w = _get_approved(workflow_id, db)
    out = _to_out(w)
    return WorkflowDetail(**out.model_dump(), workflow_def=w.workflow_def)


@router.post("/{public_token}/execute", response_model=ExecuteResponse)
async def execute_workflow(
    public_token: str,
    body: ExecuteRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Kích hoạt workflow public.
    Nếu workflow có L2S node live → forward về node đó.
    Nếu chỉ có definition → trả 501.
    """
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.public_token == public_token,
        db_models.PublicWorkflow.is_approved == True,
        db_models.PublicWorkflow.is_active == True,
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại hoặc chưa được duyệt")

    if not w.node_id or not w.l2s_workflow_id:
        raise HTTPException(
            status_code=501,
            detail="Workflow này chỉ có definition (không có L2S node live). Import vào L2S của bạn để chạy."
        )

    run = db_models.WorkflowRun(
        id=str(uuid4()),
        workflow_id=w.id,
        workflow_title=w.title,
        status="pending",
        payload=body.payload,
        caller_ip=request.client.host if request.client else None,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    background_tasks.add_task(forward_execute, run, w, db)
    background_tasks.add_task(poll_run_status, run, db)

    return ExecuteResponse(
        run_id=run.id,
        status="pending",
        message="Workflow đang được thực thi. Dùng /api/runs/{run_id} để theo dõi."
    )


# ---------- Runs (public) ----------

runs_router = APIRouter(prefix="/api/runs", tags=["runs"])


@runs_router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    """Lấy trạng thái + kết quả của một lần chạy."""
    run = db.query(db_models.WorkflowRun).filter(db_models.WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run không tồn tại")
    return run


# ---------- Helpers ----------

def _get_approved(workflow_id: str, db: Session) -> db_models.PublicWorkflow:
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id,
        db_models.PublicWorkflow.is_approved == True,
        db_models.PublicWorkflow.is_active == True,
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")
    return w


@router.post("/{workflow_id}/star")
def star_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """Tăng star_count cho workflow (public, không cần auth). Simple counter."""
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id,
        db_models.PublicWorkflow.is_approved == True,
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tìm thấy")
    w.star_count = (w.star_count or 0) + 1
    db.commit()
    return {"star_count": w.star_count}


def _to_out(w: db_models.PublicWorkflow) -> WorkflowOut:
    return WorkflowOut(
        id=w.id,
        public_token=w.public_token,
        title=w.title,
        description=w.description,
        category=w.category,
        tags=w.tags or [],
        version=w.version,
        is_approved=w.is_approved,
        is_rejected=getattr(w, "is_rejected", False),
        is_active=w.is_active,
        call_count=w.call_count,
        star_count=getattr(w, "star_count", 0),
        has_live_node=bool(w.node_id and w.l2s_workflow_id),
        contributor_username=w.contributor.username if w.contributor else "unknown",
        created_at=w.created_at,
        updated_at=w.updated_at,
    )
