"""add hashed_password to contributors

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-24 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "contributors",
        sa.Column("hashed_password", sa.String(), nullable=True),
    )


def downgrade():
    op.drop_column("contributors", "hashed_password")
