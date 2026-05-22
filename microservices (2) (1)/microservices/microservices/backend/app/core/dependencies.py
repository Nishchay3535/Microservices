import uuid
from typing import Annotated, Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    db: Annotated[AsyncSession, Depends(get_db)],
    creds: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
) -> Optional[User]:
    if not creds or creds.scheme.lower() != "bearer":
        return None
    try:
        payload = decode_token(creds.credentials)
        jti = uuid.UUID(str(payload["jti"]))
        res = await db.execute(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
        if res.scalar_one_or_none():
            return None
        uid = uuid.UUID(str(payload["sub"]))
        res = await db.execute(select(User).where(User.id == uid, User.deleted_at.is_(None)))
        return res.scalar_one_or_none()
    except (JWTError, KeyError, ValueError):
        return None


async def get_current_user(
    user: Annotated[Optional[User], Depends(get_current_user_optional)],
) -> User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def require_roles(*roles: UserRole):
    allowed = {r.value for r in roles}

    async def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _dep


def client_ip(x_forwarded_for: Annotated[Optional[str], Header()] = None) -> Optional[str]:
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return None
