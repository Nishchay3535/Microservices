import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import client_ip, get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.enums import AuditAction
from app.models.user import User

router = APIRouter(prefix="/gdpr", tags=["gdpr"])


@router.delete("/me", status_code=204)
@limiter.limit("1/day")
async def soft_delete_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    ip: str | None = Depends(client_ip),
):
    user.deleted_at = datetime.now(timezone.utc)
    user.is_active = False
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.gdpr_soft_delete,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
    )
    await db.commit()
    return None


@router.delete("/me/hard", status_code=204)
@limiter.limit("1/day")
async def hard_delete_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    ip: str | None = Depends(client_ip),
):
    from app.core.security import hash_password

    user.email = f"deleted+{uuid.uuid4()}@invalid.local"
    user.full_name = "Deleted User"
    user.hashed_password = hash_password(str(uuid.uuid4()))
    user.deleted_at = datetime.now(timezone.utc)
    user.is_active = False
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.gdpr_hard_delete,
        target_type="user",
        target_id=user.id,
        ip_address=ip,
    )
    await db.commit()
    return None
