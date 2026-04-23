from pydantic import BaseModel, EmailStr, field_validator
from typing import Any, Optional
from datetime import datetime


# ---------- Contributor ----------

class ContributorRegister(BaseModel):
    username: str
    email: str
    github_url: Optional[str] = None
    bio: Optional[str] = None

class ContributorOut(BaseModel):
    id: str
    username: str
    email: str
    github_url: Optional[str]
    bio: Optional[str]
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- L2S Node ----------

class NodeRegister(BaseModel):
    name: str
    base_url: str       # http://host:9995
    node_api_key: str   # key dùng khi L2SC gọi ngược về L2S node

class NodeOut(BaseModel):
    id: str
    name: str
    base_url: str
    is_active: bool
    last_seen_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Public Workflow ----------

class WorkflowSubmit(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []
    workflow_def: dict[str, Any]     # {nodes: [...], edges: [...]}
    node_id: Optional[str] = None   # nếu có L2S node live
    l2s_workflow_id: Optional[str] = None
    version: str = "1.0.0"

class WorkflowUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    workflow_def: Optional[dict[str, Any]] = None
    node_id: Optional[str] = None
    l2s_workflow_id: Optional[str] = None
    version: Optional[str] = None
    is_active: Optional[bool] = None

class WorkflowOut(BaseModel):
    id: str
    public_token: str
    title: str
    description: Optional[str]
    category: Optional[str]
    tags: list
    version: str
    is_approved: bool
    is_rejected: bool = False
    is_active: bool
    call_count: int
    star_count: int = 0
    has_live_node: bool
    contributor_username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowDetail(WorkflowOut):
    workflow_def: dict[str, Any]    # nodes + edges (cho import)


# ---------- Execute ----------

class ExecuteRequest(BaseModel):
    payload: dict[str, Any] = {}

class ExecuteResponse(BaseModel):
    run_id: str
    status: str                     # pending / running / success / failed
    message: str
    result: Optional[dict[str, Any]] = None


# ---------- Run ----------

class RunOut(BaseModel):
    id: str
    remote_run_id: Optional[str]
    workflow_id: Optional[str]
    workflow_title: Optional[str]
    status: str
    payload: dict
    result: Optional[dict]
    error: Optional[str]
    started_at: datetime
    finished_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------- Admin ----------

class ApproveRequest(BaseModel):
    # action: "approve" | "reject" | "revoke"
    action: str = "approve"
    reason: Optional[str] = None

    # backward-compat: approved=True → action="approve", approved=False → action="reject"
    approved: Optional[bool] = None

    def resolved_action(self) -> str:
        if self.approved is not None:
            return "approve" if self.approved else "reject"
        return self.action


# ---------- Node Auto-Auth (L2S tự đăng ký khi khởi động) ----------

class NodeAuthRequest(BaseModel):
    node_token: str    # = L2S_CLUSTER_TOKEN — unique per installation
    base_url: str      # http://192.168.x.x:9995
    name: str          # "L2S @ hostname"

class NodeAuthResponse(BaseModel):
    api_key: str
    contributor_id: str
    node_id: str
    message: str


# ---------- L2S Bridge (gọi từ L2S sang L2SC) ----------

class PublishRequest(BaseModel):
    """L2S gửi lên để publish workflow lên L2SC"""
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: list[str] = []
    workflow_def: dict[str, Any]
    l2s_workflow_id: str
    version: str = "1.0.0"

class L2SCSettings(BaseModel):
    l2sc_url: str
    contributor_api_key: str
    node_id: Optional[str] = None
