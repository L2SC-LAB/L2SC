from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class Contributor(Base):
    """
    Người đóng góp workflow — có thể là GitHub user hoặc bất kỳ ai có API key.
    API key dùng để submit/update workflow và register L2S node.
    """
    __tablename__ = "contributors"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    api_key = Column(String, unique=True, index=True, nullable=False)   # Bearer token dùng cho API
    hashed_password = Column(String, nullable=True)   # Optional — login bằng email/username + password để lấy api_key
    github_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    nodes = relationship("L2SNode", back_populates="owner", cascade="all, delete-orphan")
    workflows = relationship("PublicWorkflow", back_populates="contributor", cascade="all, delete-orphan")

    @property
    def has_password(self) -> bool:
        return bool(self.hashed_password)


class L2SNode(Base):
    """
    L2S instance đã đăng ký với L2SC.
    L2SC dùng base_url + node_api_key để forward execution request về node.
    """
    __tablename__ = "l2s_nodes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)           # http://192.168.1.10:9995
    node_api_key = Column(String, nullable=False)       # key để L2SC gọi /api/execute trên node đó
    contributor_id = Column(String, ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_seen_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("Contributor", back_populates="nodes")
    workflows = relationship("PublicWorkflow", back_populates="node")


class PublicWorkflow(Base):
    """
    Workflow public được đóng góp lên L2SC.
    - workflow_def: JSON nodes/edges (cùng format L2S) — dùng để import vào L2S bất kỳ.
    - node_id + l2s_workflow_id: nếu contributor có L2S node đang chạy,
      execute sẽ forward về node đó thay vì chỉ trả definition.
    """
    __tablename__ = "public_workflows"

    id = Column(String, primary_key=True, index=True)
    public_token = Column(String, unique=True, index=True, nullable=False)  # URL-safe token để gọi execute
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)                # etl / ml / analytics / notification / ...
    tags = Column(JSON, default=list, nullable=False)
    workflow_def = Column(JSON, nullable=False)              # {nodes: [...], edges: [...]}

    contributor_id = Column(String, ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String, ForeignKey("l2s_nodes.id", ondelete="SET NULL"), nullable=True, index=True)
    l2s_workflow_id = Column(String, nullable=True)         # ID workflow trên L2S node

    is_approved = Column(Boolean, default=False, nullable=False, index=True)
    is_rejected = Column(Boolean, default=False, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(String, default="1.0.0", nullable=False)
    call_count = Column(Integer, default=0, nullable=False)
    star_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    contributor = relationship("Contributor", back_populates="workflows")
    node = relationship("L2SNode", back_populates="workflows")
    runs = relationship("WorkflowRun", back_populates="workflow", cascade="all, delete-orphan")


class ForumThread(Base):
    """
    Thread (bài đăng / câu hỏi) trên forum L2S.
    Mọi contributor có api_key đều có thể tạo; guest chỉ xem.
    """
    __tablename__ = "forum_threads"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    body_md = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)   # qa / tutorial / showcase / announcement
    author_id = Column(String, ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False, index=True)
    is_pinned = Column(Boolean, default=False, nullable=False, index=True)
    is_locked = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    reply_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    author = relationship("Contributor", backref="forum_threads")
    replies = relationship("ForumReply", back_populates="thread", cascade="all, delete-orphan")


class ForumReply(Base):
    """Trả lời cho một thread. Không có nested — flat 1 level."""
    __tablename__ = "forum_replies"

    id = Column(String, primary_key=True, index=True)
    thread_id = Column(String, ForeignKey("forum_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    body_md = Column(Text, nullable=False)
    author_id = Column(String, ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    thread = relationship("ForumThread", back_populates="replies")
    author = relationship("Contributor", backref="forum_replies")


class NodeDoc(Base):
    """
    Doc cho từng plugin type trên L2S. Auto-section (config, inputs/outputs) pull từ L2S node metadata —
    KHÔNG lưu ở đây. Chỉ lưu phần admin viết tay để giải thích cho non-tech user.
    """
    __tablename__ = "node_docs"

    plugin_type = Column(String, primary_key=True)   # trùng với BaseNodeExecutor.type bên L2S
    what_it_does = Column(Text, nullable=True)       # 1 câu: "Node này làm gì?"
    when_to_use = Column(Text, nullable=True)        # markdown bullet: "Khi nào dùng?"
    example_md = Column(Text, nullable=True)         # markdown: "Ví dụ thực tế"
    faq_md = Column(Text, nullable=True)             # markdown: "Lỗi thường gặp / FAQ"
    updated_by = Column(String, ForeignKey("contributors.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def has_content(self) -> bool:
        return any([self.what_it_does, self.when_to_use, self.example_md, self.faq_md])


class WorkflowRun(Base):
    """
    Lịch sử mỗi lần execute qua L2SC.
    Nếu workflow có node, L2SC forward và track run_id từ node.
    Nếu không có node, trả 501 Not Implemented (definition-only).
    """
    __tablename__ = "workflow_runs"

    id = Column(String, primary_key=True, index=True)           # L2SC run ID
    remote_run_id = Column(String, nullable=True)               # run ID trả về từ L2S node
    workflow_id = Column(String, ForeignKey("public_workflows.id", ondelete="SET NULL"), nullable=True, index=True)
    workflow_title = Column(String, nullable=True)

    status = Column(String, default="pending", nullable=False, index=True)  # pending/running/success/failed
    payload = Column(JSON, default=dict, nullable=False)        # input gửi vào
    result = Column(JSON, nullable=True)                         # output từ L2S node
    error = Column(Text, nullable=True)

    caller_ip = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)

    workflow = relationship("PublicWorkflow", back_populates="runs")
