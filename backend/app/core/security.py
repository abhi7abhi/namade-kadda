import datetime
from typing import Optional, Dict, Any
import bcrypt
import jwt
from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Hash plaintext password using bcrypt with standard salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate signed JWT access token with expiration."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate signed JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except Exception:
        return None


# In-memory token revocation registry: stores token string -> expiration timestamp
_revoked_tokens: Dict[str, float] = {}


def revoke_token(token: str) -> None:
    """Add a JWT token to the revocation registry."""
    if not token:
        return
    try:
        payload = decode_access_token(token)
        exp = payload.get("exp") if payload else None
        exp_timestamp = float(exp) if exp else (datetime.datetime.now(datetime.timezone.utc).timestamp() + 3600)
    except Exception:
        exp_timestamp = datetime.datetime.now(datetime.timezone.utc).timestamp() + 3600
    
    _revoked_tokens[token] = exp_timestamp
    _prune_expired_revocations()


def is_token_revoked(token: str) -> bool:
    """Check if a JWT token has been explicitly revoked upon logout."""
    if not token:
        return False
    return token in _revoked_tokens


def _prune_expired_revocations() -> None:
    """Remove expired tokens from the revocation registry to conserve memory."""
    now = datetime.datetime.now(datetime.timezone.utc).timestamp()
    expired = [t for t, exp in _revoked_tokens.items() if exp < now]
    for t in expired:
        _revoked_tokens.pop(t, None)

