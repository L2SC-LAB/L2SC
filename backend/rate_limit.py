"""
Rate limiting cho L2SC backend (slowapi).
Tắt qua env L2SC_RATE_LIMIT_ENABLED=false trong dev.
"""
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

_enabled = os.getenv("L2SC_RATE_LIMIT_ENABLED", "true").lower() != "false"

limiter = Limiter(
    key_func=get_remote_address,
    enabled=_enabled,
    default_limits=[],
)

# Giới hạn cho public registration / auth endpoints
LIMIT_REGISTER = "5/minute"
LIMIT_AUTH = "10/minute"
LIMIT_NODE_AUTH = "20/minute"
