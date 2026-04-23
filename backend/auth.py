import secrets
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from backend.database import get_db
from backend import db_models

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def generate_api_key() -> str:
    return secrets.token_urlsafe(32)


def generate_public_token() -> str:
    return secrets.token_urlsafe(16)


def _get_contributor(api_key: str, db: Session) -> db_models.Contributor:
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="X-API-Key header required")
    contributor = db.query(db_models.Contributor).filter(
        db_models.Contributor.api_key == api_key,
        db_models.Contributor.is_active == True,
    ).first()
    if not contributor:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return contributor


def get_contributor(
    api_key: str = Security(API_KEY_HEADER),
    db: Session = Depends(get_db),
) -> db_models.Contributor:
    return _get_contributor(api_key, db)


def get_admin(
    api_key: str = Security(API_KEY_HEADER),
    db: Session = Depends(get_db),
) -> db_models.Contributor:
    contributor = _get_contributor(api_key, db)
    if not contributor.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return contributor
