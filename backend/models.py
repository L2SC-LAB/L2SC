from pydantic import BaseModel, EmailStr, field_validator
from typing import Any, Optional
from datetime import datetime


# ---------- Contributor ----------

class ContributorRegister(BaseModel):
    username: str
    email: str
    password: Optional[str] = None   # Optional để backward-compat; FE mới sẽ luôn gửi
    github_url: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("password")
    @classmethod
    def _password_rule(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if len(v) < 6:
            raise ValueError("Mật khẩu phải có ít nhất 6 ký tự")
        return v


class LoginRequest(BaseModel):
    """Đăng nhập bằng email/username + password. Trả về api_key để FE lưu."""
    identifier: str   # email HOẶC username
    password: str


class SetPasswordRequest(BaseModel):
    new_password: str
    current_password: Optional[str] = None   # bắt buộc nếu đã có password; bỏ qua khi set lần đầu

    @field_validator("new_password")
    @classmethod
    def _new_rule(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mật khẩu phải có ít nhất 6 ký tự")
        return v


class ContributorOut(BaseModel):
    id: str
    username: str
    email: str
    github_url: Optional[str]
    bio: Optional[str]
    is_admin: bool
    has_password: bool = False   # FE dùng để gợi ý "bạn chưa set password"
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    api_key: str
    contributor: ContributorOut


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


# ---------- Node Docs (giải thích plugins L2S cho non-tech user) ----------

class NodeDocSummary(BaseModel):
    """Dòng 1 plugin trong list /api/docs — metadata gọn + cờ has_doc."""
    plugin_type: str
    label: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    has_doc: bool = False        # True nếu admin đã viết ít nhất 1 section


class NodeDocFieldSchema(BaseModel):
    """Render friendly cho 1 field trong config_schema của plugin."""
    name: str
    label: Optional[str] = None
    type: Optional[str] = None            # "string"/"number"/"select"/"textarea"/"bool"/...
    required: bool = False
    default: Optional[Any] = None
    description: Optional[str] = None
    options: Optional[list[Any]] = None   # cho select


class NodeDocIO(BaseModel):
    """Render 1 input hoặc output."""
    name: str
    description: Optional[str] = None
    schema_hint: Optional[Any] = None     # shape ví dụ


class NodeDocDetail(BaseModel):
    """Payload đầy đủ cho page /docs/:plugin_type."""
    plugin_type: str
    label: str
    description: Optional[str] = None
    category: Optional[str] = None
    icon: Optional[str] = None

    # Auto từ L2S metadata — admin KHÔNG sửa
    config_fields: list[NodeDocFieldSchema] = []
    inputs: list[NodeDocIO] = []
    outputs: list[NodeDocIO] = []

    # Admin-written markdown — lưu ở node_docs table
    what_it_does: Optional[str] = None
    when_to_use: Optional[str] = None
    example_md: Optional[str] = None
    faq_md: Optional[str] = None
    doc_updated_at: Optional[datetime] = None
    doc_updated_by: Optional[str] = None    # username của admin cuối cùng sửa


class NodeDocEdit(BaseModel):
    """Admin PUT payload."""
    what_it_does: Optional[str] = None
    when_to_use: Optional[str] = None
    example_md: Optional[str] = None
    faq_md: Optional[str] = None


# ---------- Forum ----------

FORUM_CATEGORIES = ("qa", "tutorial", "showcase", "announcement")


class ForumThreadCreate(BaseModel):
    title: str
    body_md: str
    category: str = "qa"

    @field_validator("title")
    @classmethod
    def _title_rule(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Tiêu đề phải có ít nhất 5 ký tự")
        if len(v) > 200:
            raise ValueError("Tiêu đề tối đa 200 ký tự")
        return v

    @field_validator("body_md")
    @classmethod
    def _body_rule(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 10:
            raise ValueError("Nội dung phải có ít nhất 10 ký tự")
        return v

    @field_validator("category")
    @classmethod
    def _cat_rule(cls, v: str) -> str:
        if v not in FORUM_CATEGORIES:
            raise ValueError(f"Category phải là một trong: {', '.join(FORUM_CATEGORIES)}")
        return v


class ForumThreadUpdate(BaseModel):
    title: Optional[str] = None
    body_md: Optional[str] = None
    category: Optional[str] = None


class ForumAuthor(BaseModel):
    id: str
    username: str
    is_admin: bool = False

    class Config:
        from_attributes = True


class ForumThreadSummary(BaseModel):
    """Dòng trong list — không include body_md."""
    id: str
    title: str
    category: str
    author: ForumAuthor
    is_pinned: bool
    is_locked: bool
    view_count: int
    reply_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ForumReplyOut(BaseModel):
    id: str
    thread_id: str
    body_md: str
    author: ForumAuthor
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ForumThreadDetail(ForumThreadSummary):
    body_md: str
    replies: list[ForumReplyOut] = []


class ForumReplyCreate(BaseModel):
    body_md: str

    @field_validator("body_md")
    @classmethod
    def _body_rule(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nội dung quá ngắn")
        return v


class ForumReplyUpdate(BaseModel):
    body_md: str


class ForumStats(BaseModel):
    total_threads: int
    by_category: dict[str, int]
    total_replies: int
