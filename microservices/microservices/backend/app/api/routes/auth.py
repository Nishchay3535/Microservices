import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.config import get_settings
from app.core.dependencies import client_ip, get_current_user, get_db
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    hash_password,
    verify_password,
    verify_password_reset_token,
)
from app.models.enums import AuditAction, UserRole
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.services import email_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(client_ip),
):
    if body.role != UserRole.employee:
        raise HTTPException(status_code=400, detail="Public registration is employee-only")
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=UserRole.employee.value,
        department=body.department,
        position=body.position,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token, jti = create_access_token(str(user.id), user.role)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.register,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
    )
    await db.commit()
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
    ip: str | None = Depends(client_ip),
):
    res = await db.execute(select(User).where(User.email == body.email, User.deleted_at.is_(None)))
    user = res.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token, _ = create_access_token(str(user.id), user.role)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.login,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
    )
    await db.commit()
    return TokenResponse(access_token=token)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    ip: str | None = Depends(client_ip),
):
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    from jose import jwt

    settings = get_settings()
    token = auth.split(" ", 1)[1]
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    jti = uuid.UUID(str(payload["jti"]))
    exp_ts = payload.get("exp")
    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
    db.add(TokenBlacklist(jti=jti, user_id=user.id, expires_at=expires_at))
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.logout,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
    )
    await db.commit()
    return None


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)):
    return user


@router.post("/password-reset/request", status_code=202)
@limiter.limit("3/minute")
async def password_reset_request(request: Request, body: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == body.email, User.deleted_at.is_(None)))
    user = res.scalar_one_or_none()
    settings = get_settings()
    if user:
        token = create_password_reset_token(str(user.id))
        link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/confirm?token={token}"
        await email_service.send_email(
            user.email,
            "Password reset",
            f"Use this link to reset your password (valid 1 hour):\n{link}",
        )
    return None


@router.post("/password-reset/confirm", status_code=204)
@limiter.limit("5/minute")
async def password_reset_confirm(request: Request, body: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    uid = verify_password_reset_token(body.token)
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    res = await db.execute(select(User).where(User.id == uuid.UUID(uid)))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return None
