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
    github_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    nodes = relationship("L2SNode", back_populates="owner", cascade="all, delete-orphan")
    workflows = relationship("PublicWorkflow", back_populates="contributor", cascade="all, delete-orphan")


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
