"""
Contributor endpoints — yêu cầu X-API-Key.
Dùng để đăng ký, submit/update workflow và register L2S node.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from backend.database import get_db
from backend import db_models
from backend.models import (
    ContributorRegister, ContributorOut,
    NodeRegister, NodeOut,
    WorkflowSubmit, WorkflowUpdate, WorkflowOut,
)
from backend.auth import get_contributor, generate_api_key, generate_public_token
from backend.routers.public import _to_out

router = APIRouter(prefix="/api/contribute", tags=["contribute"])


# ---------- Đăng ký (public, không cần key) ----------

@router.post("/register", response_model=dict)
def register(body: ContributorRegister, db: Session = Depends(get_db)):
    """
    Đăng ký contributor. Trả về api_key — lưu lại, không thể lấy lại.
    Mỗi email/username chỉ đăng ký một lần.
    """
    if db.query(db_models.Contributor).filter(db_models.Contributor.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email đã được đăng ký")
    if db.query(db_models.Contributor).filter(db_models.Contributor.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    api_key = generate_api_key()
    contributor = db_models.Contributor(
        id=str(uuid4()),
        username=body.username,
        email=body.email,
        api_key=api_key,
        github_url=body.github_url,
        bio=body.bio,
    )
    db.add(contributor)
    db.commit()
    return {
        "id": contributor.id,
        "username": contributor.username,
        "api_key": api_key,
        "message": "Đăng ký thành công. Lưu api_key lại — không thể khôi phục.",
    }


@router.get("/me", response_model=ContributorOut)
def me(contributor=Depends(get_contributor)):
    return contributor


# ---------- L2S Node ----------

@router.post("/nodes", response_model=NodeOut)
def register_node(
    body: NodeRegister,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    """Đăng ký L2S instance. L2SC dùng node_api_key để forward execution về node."""
    node = db_models.L2SNode(
        id=str(uuid4()),
        name=body.name,
        base_url=body.base_url.rstrip("/"),
        node_api_key=body.node_api_key,
        contributor_id=contributor.id,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node


@router.get("/nodes", response_model=list[NodeOut])
def list_nodes(contributor=Depends(get_contributor), db: Session = Depends(get_db)):
    return db.query(db_models.L2SNode).filter(
        db_models.L2SNode.contributor_id == contributor.id
    ).all()


@router.delete("/nodes/{node_id}")
def delete_node(node_id: str, contributor=Depends(get_contributor), db: Session = Depends(get_db)):
    node = db.query(db_models.L2SNode).filter(
        db_models.L2SNode.id == node_id,
        db_models.L2SNode.contributor_id == contributor.id,
    ).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node không tồn tại")
    db.delete(node)
    db.commit()
    return {"message": "Đã xoá node"}


# ---------- Workflow ----------

@router.post("/workflows", response_model=WorkflowOut)
def submit_workflow(
    body: WorkflowSubmit,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    """
    Submit workflow lên L2SC. Workflow sẽ pending review của admin trước khi public.
    node_id (tuỳ chọn): nếu có, execute sẽ forward về L2S node đó.
    """
    if body.node_id:
        node = db.query(db_models.L2SNode).filter(
            db_models.L2SNode.id == body.node_id,
            db_models.L2SNode.contributor_id == contributor.id,
        ).first()
        if not node:
            raise HTTPException(status_code=404, detail="Node không tồn tại hoặc không thuộc về bạn")

    w = db_models.PublicWorkflow(
        id=str(uuid4()),
        public_token=generate_public_token(),
        title=body.title,
        description=body.description,
        category=body.category,
        tags=body.tags,
        workflow_def=body.workflow_def,
        contributor_id=contributor.id,
        node_id=body.node_id,
        l2s_workflow_id=body.l2s_workflow_id,
        version=body.version,
        is_approved=False,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return _to_out(w)


@router.get("/workflows", response_model=list[WorkflowOut])
def my_workflows(contributor=Depends(get_contributor), db: Session = Depends(get_db)):
    """Xem toàn bộ workflow của bản thân (kể cả chưa được duyệt)."""
    ws = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.contributor_id == contributor.id
    ).order_by(db_models.PublicWorkflow.created_at.desc()).all()
    return [_to_out(w) for w in ws]


@router.put("/workflows/{workflow_id}", response_model=WorkflowOut)
def update_workflow(
    workflow_id: str,
    body: WorkflowUpdate,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id,
        db_models.PublicWorkflow.contributor_id == contributor.id,
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")

    for field, val in body.model_dump(exclude_none=True).items():
        setattr(w, field, val)

    # Nếu có thay đổi nội dung → yêu cầu duyệt lại
    if body.workflow_def or body.title:
        w.is_approved = False

    db.commit()
    db.refresh(w)
    return _to_out(w)


@router.delete("/workflows/{workflow_id}")
def delete_workflow(
    workflow_id: str,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    w = db.query(db_models.PublicWorkflow).filter(
        db_models.PublicWorkflow.id == workflow_id,
        db_models.PublicWorkflow.contributor_id == contributor.id,
    ).first()
    if not w:
        raise HTTPException(status_code=404, detail="Workflow không tồn tại")
    db.delete(w)
    db.commit()
    return {"message": "Đã xoá workflow"}
