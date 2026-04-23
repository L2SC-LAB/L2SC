"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "contributors",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("username", sa.String(), unique=True, nullable=False),
        sa.Column("email", sa.String(), unique=True, nullable=False),
        sa.Column("api_key", sa.String(), unique=True, nullable=False),
        sa.Column("github_url", sa.String(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("is_admin", sa.Boolean(), default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_contributors_api_key", "contributors", ["api_key"])

    op.create_table(
        "l2s_nodes",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("base_url", sa.String(), nullable=False),
        sa.Column("node_api_key", sa.String(), nullable=False),
        sa.Column("contributor_id", sa.String(), sa.ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "public_workflows",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("public_token", sa.String(), unique=True, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("workflow_def", sa.JSON(), nullable=False),
        sa.Column("contributor_id", sa.String(), sa.ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("node_id", sa.String(), sa.ForeignKey("l2s_nodes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("l2s_workflow_id", sa.String(), nullable=True),
        sa.Column("is_approved", sa.Boolean(), default=False, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("version", sa.String(), default="1.0.0", nullable=False),
        sa.Column("call_count", sa.Integer(), default=0, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_public_workflows_token", "public_workflows", ["public_token"])
    op.create_index("ix_public_workflows_approved", "public_workflows", ["is_approved"])

    op.create_table(
        "workflow_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("remote_run_id", sa.String(), nullable=True),
        sa.Column("workflow_id", sa.String(), sa.ForeignKey("public_workflows.id", ondelete="SET NULL"), nullable=True),
        sa.Column("workflow_title", sa.String(), nullable=True),
        sa.Column("status", sa.String(), default="pending", nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("caller_ip", sa.String(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("workflow_runs")
    op.drop_table("public_workflows")
    op.drop_table("l2s_nodes")
    op.drop_table("contributors")
