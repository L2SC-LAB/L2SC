"""
Contributor endpoints — yêu cầu X-API-Key.
Dùng để đăng ký, submit/update workflow và register L2S node.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from uuid import uuid4
from backend.database import get_db
from backend import db_models
from datetime import datetime, timedelta
from backend.models import (
    ContributorRegister, ContributorOut,
    LoginRequest, LoginResponse, SetPasswordRequest, SetPasswordResponse,
    NodeRegister, NodeOut,
    WorkflowSubmit, WorkflowUpdate, WorkflowOut,
    NodeAuthRequest, NodeAuthResponse,
)
from backend.auth import (
    get_contributor, generate_api_key, generate_public_token,
    hash_password, verify_password,
)
from backend.routers.public import _to_out
from backend.rate_limit import limiter, LIMIT_REGISTER, LIMIT_AUTH, LIMIT_NODE_AUTH
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# Max contributor được phép tạo từ 1 IP trong 24h. Chặn attacker bypass rate limit
# bằng cách chờ giữa mỗi request. Override qua env nếu cần.
import os
MAX_REGISTER_PER_IP_PER_DAY = int(os.getenv("L2SC_MAX_REGISTER_PER_IP_PER_DAY", "3"))

router = APIRouter(prefix="/api/contribute", tags=["contribute"])


# ---------- Auto-registration cho L2S node (public, không cần key trước) ----------

@router.post("/node-auth", response_model=NodeAuthResponse)
@limiter.limit(LIMIT_NODE_AUTH)
def node_auth(request: Request, body: NodeAuthRequest, db: Session = Depends(get_db)):
    """
    L2S gọi endpoint này lúc khởi động để tự đăng ký với L2SC.
    Dùng L2S_CLUSTER_TOKEN làm identity — không cần tạo tài khoản thủ công.
    Nếu đã tồn tại → cập nhật base_url + last_seen. Nếu chưa → tạo mới.
    """
    if not body.node_token or len(body.node_token) < 32:
        raise HTTPException(status_code=400, detail="node_token quá ngắn (cần ≥ 32 ký tự)")

    contributor = db.query(db_models.Contributor).filter(
        db_models.Contributor.api_key == body.node_token
    ).first()

    if not contributor:
        short = body.node_token[:8]
        contributor = db_models.Contributor(
            id=str(uuid4()),
            username=f"node-{short}",
            email=f"node-{short}@auto.l2sc",
            api_key=body.node_token,
            bio=f"Auto-registered L2S node: {body.name}",
        )
        db.add(contributor)
        db.flush()

    node = db.query(db_models.L2SNode).filter(
        db_models.L2SNode.node_api_key == body.node_token,
        db_models.L2SNode.contributor_id == contributor.id,
    ).first()

    if not node:
        node = db_models.L2SNode(
            id=str(uuid4()),
            name=body.name,
            base_url=body.base_url.rstrip("/"),
            node_api_key=body.node_token,
            contributor_id=contributor.id,
            is_active=True,
        )
        db.add(node)
    else:
        node.base_url = body.base_url.rstrip("/")
        node.name = body.name
        node.is_active = True
        node.last_seen_at = datetime.utcnow()

    db.commit()
    return NodeAuthResponse(
        api_key=body.node_token,
        contributor_id=contributor.id,
        node_id=node.id,
        message="Node registered" if node.last_seen_at is None else "Node refreshed",
    )


# ---------- Đăng ký (public, không cần key) ----------

@router.post("/register", response_model=dict)
@limiter.limit(LIMIT_REGISTER)
def register(request: Request, body: ContributorRegister, db: Session = Depends(get_db)):
    """
    Đăng ký contributor. Trả về api_key — lưu lại, không thể lấy lại.
    Mỗi email/username chỉ đăng ký một lần.

    Anti-spam:
    - Honeypot field 'website' phải empty (humans không thấy field, bots auto-fill)
    - Mỗi IP tối đa MAX_REGISTER_PER_IP_PER_DAY (default 3) account/24h
    - Đã có rate limit 5/min/IP ở decorator
    """
    client_ip = get_remote_address(request) or ""

    # Layer 1: Honeypot — bot auto-fill, human không thấy field
    if body.website:
        logger.warning(f"[register] honeypot triggered from IP={client_ip} username={body.username!r}")
        # Trả message vague để bot không biết cách bypass
        raise HTTPException(status_code=400, detail="Đăng ký thất bại. Vui lòng thử lại.")

    # Layer 2: per-IP daily cap
    if client_ip:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent = db.query(db_models.Contributor).filter(
            db_models.Contributor.created_ip == client_ip,
            db_models.Contributor.created_at >= cutoff,
        ).count()
        if recent >= MAX_REGISTER_PER_IP_PER_DAY:
            logger.warning(f"[register] daily IP cap hit ({recent}) from IP={client_ip}")
            raise HTTPException(
                status_code=429,
                detail=(
                    f"IP của bạn đã đăng ký {recent} tài khoản trong 24h. "
                    f"Vui lòng thử lại sau hoặc liên hệ admin nếu cần thêm."
                ),
            )

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
        hashed_password=hash_password(body.password) if body.password else None,
        github_url=body.github_url,
        bio=body.bio,
        created_ip=client_ip or None,
    )
    db.add(contributor)
    db.commit()
    return {
        "id": contributor.id,
        "username": contributor.username,
        "api_key": api_key,
        "message": (
            "Đăng ký thành công. Lưu api_key lại — có thể đăng nhập lại bằng email/mật khẩu."
            if body.password else
            "Đăng ký thành công. Lưu api_key lại — không thể khôi phục."
        ),
    }


# ---------- Login bằng email/username + password ----------

@router.post("/login", response_model=LoginResponse)
@limiter.limit(LIMIT_AUTH)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    """
    Đăng nhập bằng email HOẶC username + password.
    Trả về api_key để FE lưu và dùng như trước (header X-API-Key).
    """
    ident = body.identifier.strip()
    contributor = db.query(db_models.Contributor).filter(
        (db_models.Contributor.email == ident) | (db_models.Contributor.username == ident),
        db_models.Contributor.is_active == True,
    ).first()
    if not contributor or not verify_password(body.password, contributor.hashed_password or ""):
        raise HTTPException(status_code=401, detail="Email/username hoặc mật khẩu không đúng")
    return LoginResponse(api_key=contributor.api_key, contributor=contributor)


@router.post("/set-password", response_model=SetPasswordResponse)
@limiter.limit(LIMIT_AUTH)
def set_password(
    request: Request,
    body: SetPasswordRequest,
    contributor=Depends(get_contributor),
    db: Session = Depends(get_db),
):
    """
    Set/đổi mật khẩu cho contributor đang login bằng api_key.
    - Nếu chưa có password trước đó: chỉ cần new_password.
    - Nếu đã có: phải cung cấp current_password đúng.

    🔐 Security: sau khi set/đổi password, api_key cũ sẽ bị rotate (vô hiệu hoá).
    Lý do: api_key sinh ra lúc /register có thể đã bị lộ (user copy ra ngoài, screenshot).
    User phải đăng nhập lại bằng email + mật khẩu để lấy api_key mới.
    """
    was_first_time = not contributor.hashed_password
    if contributor.hashed_password:
        if not body.current_password or not verify_password(body.current_password, contributor.hashed_password):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    contributor.hashed_password = hash_password(body.new_password)
    # Rotate api_key — key cũ (có thể đã leak lúc /register) sẽ không còn auth được
    new_key = generate_api_key()
    contributor.api_key = new_key
    db.commit()
    return SetPasswordResponse(
        message=(
            "Đã set mật khẩu lần đầu. API key cũ đã bị thay — vui lòng đăng nhập lại."
            if was_first_time else
            "Đã đổi mật khẩu. API key cũ đã bị thay — vui lòng đăng nhập lại."
        ),
        api_key=new_key,
        rotated=True,
    )


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
