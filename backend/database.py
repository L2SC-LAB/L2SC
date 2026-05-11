from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/l2sc"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import db_models  # noqa: F401
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)

    # Light migration: thêm cột mới vào public_workflows nếu chưa có
    try:
        insp = inspect(engine)
        if "public_workflows" in insp.get_table_names():
            cols = {c["name"] for c in insp.get_columns("public_workflows")}
            migrations = [
                ("is_rejected", "ALTER TABLE public_workflows ADD COLUMN is_rejected BOOLEAN NOT NULL DEFAULT FALSE"),
                ("star_count",  "ALTER TABLE public_workflows ADD COLUMN star_count INTEGER NOT NULL DEFAULT 0"),
            ]
            for col_name, ddl in migrations:
                if col_name not in cols:
                    with engine.connect() as conn:
                        conn.execute(text(ddl))
                        conn.commit()

        if "contributors" in insp.get_table_names():
            ccols = {c["name"] for c in insp.get_columns("contributors")}
            if "hashed_password" not in ccols:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE contributors ADD COLUMN hashed_password VARCHAR"))
                    conn.commit()
            if "created_ip" not in ccols:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE contributors ADD COLUMN created_ip VARCHAR"))
                    conn.execute(text("CREATE INDEX IF NOT EXISTS ix_contributors_created_ip ON contributors(created_ip)"))
                    conn.commit()

        # Bảng node_docs được tạo bởi create_all ở trên; không cần ALTER thêm.
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"[init_db] migration skip: {e}")
