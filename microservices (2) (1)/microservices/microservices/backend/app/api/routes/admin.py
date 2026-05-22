import uuid

from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_db, require_roles
from app.models.audit_log import AuditLog
from app.models.enums import AuditAction, UserRole
from app.models.issue import Issue
from app.models.user import User
from app.schemas.auth import UserPublic


class RoleUpdate(BaseModel):
    role: UserRole


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserPublic])
async def admin_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin))):
    res = await db.execute(select(User).where(User.deleted_at.is_(None)))
    return list(res.scalars().all())


@router.put("/users/{user_id}/role", response_model=UserPublic)
async def admin_set_role(
    user_id: uuid.UUID,
    body: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.admin)),
):
    u = await db.get(User, user_id)
    if not u:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Not found")
    u.role = body.role.value
    await write_audit_log(
        db,
        actor_id=admin.id,
        action=AuditAction.role_change,
        target_type="user",
        target_id=u.id,
        metadata={"new_role": body.role.value},
    )
    await db.commit()
    await db.refresh(u)
    return u


@router.get("/analytics")
async def admin_analytics(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.admin, UserRole.authority))):
    users = await db.execute(select(func.count()).select_from(User).where(User.deleted_at.is_(None)))
    issues = await db.execute(select(func.count()).select_from(Issue))
    return {"users": int(users.scalar_one()), "issues": int(issues.scalar_one())}


@router.get("/audit-logs")
async def audit_logs(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.admin)),
    limit: int = 100,
):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    rows = res.scalars().all()
    return [
        {
            "id": str(r.id),
            "actor_id": str(r.actor_id) if r.actor_id else None,
            "action": r.action,
            "target_type": r.target_type,
            "target_id": str(r.target_id) if r.target_id else None,
            "ip_address": r.ip_address,
            "event_meta": r.event_meta,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
