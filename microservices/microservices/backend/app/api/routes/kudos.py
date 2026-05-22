import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.enums import AuditAction, UserRole
from app.models.kudos import Kudos
from app.models.notification import Notification
from app.models.user import User
from app.services import score_service


class KudosCreate(BaseModel):
    recipient_id: uuid.UUID
    category: str = Field(..., min_length=1, max_length=64)
    message: str = Field(..., min_length=1, max_length=500)


class KudosFeedItem(BaseModel):
    id: uuid.UUID
    sender_name: Optional[str]
    recipient_name: str
    category: str
    message: str
    is_pinned: bool
    created_at: datetime


class KudosLeaderboardItem(BaseModel):
    user_id: uuid.UUID
    full_name: str
    department: Optional[str]
    kudos_count: int


router = APIRouter(prefix="/kudos", tags=["kudos"])


@router.get("/colleagues")
async def list_colleagues(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.deleted_at.is_(None), User.is_active.is_(True)).order_by(User.full_name)
    )
    return [u for u in result.scalars().all() if u.id != user.id]


@router.post("/")
@limiter.limit("20/hour")
async def send_kudos(
    request: Request,
    body: KudosCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.recipient_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot send kudos to yourself")

    recipient = await db.get(User, body.recipient_id)
    if not recipient or recipient.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Recipient not found")

    kudos = Kudos(
        sender_id=user.id,
        recipient_id=recipient.id,
        category=body.category,
        message=body.message.strip(),
    )
    db.add(kudos)
    await score_service.add_impact(db, recipient.id, 5.0)
    db.add(
        Notification(
            user_id=recipient.id,
            type="kudos",
            title="You received kudos",
            message=f"{user.full_name} sent you kudos for {body.category}.",
            ref_id=kudos.id,
        )
    )
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.post_create,
        target_type="kudos",
        target_id=kudos.id,
    )
    await db.commit()
    await db.refresh(kudos)
    return kudos


@router.get("/feed", response_model=list[KudosFeedItem])
async def kudos_feed(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Kudos, User, User)
        .join(User, Kudos.sender_id == User.id)
        .join(User.alias("recipient"), Kudos.recipient_id == User.id)
        .order_by(Kudos.created_at.desc())
        .limit(50)
    )
    data = []
    for kudos, sender, recipient in result.all():
        sender_name = sender.full_name if sender.role == UserRole.employee.value else sender.full_name
        data.append(
            KudosFeedItem(
                id=kudos.id,
                sender_name=sender_name,
                recipient_name=recipient.full_name,
                category=kudos.category,
                message=kudos.message,
                is_pinned=kudos.is_pinned,
                created_at=kudos.created_at,
            )
        )
    return data


@router.get("/received")
async def kudos_received(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Kudos)
        .where(Kudos.recipient_id == user.id)
        .order_by(Kudos.created_at.desc())
    )
    return result.scalars().all()


@router.get("/leaderboard", response_model=list[KudosLeaderboardItem])
async def kudos_leaderboard(db: AsyncSession = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(
            User.id.label("user_id"),
            User.full_name,
            User.department,
            func.count(Kudos.id).label("kudos_count"),
        )
        .join(Kudos, Kudos.recipient_id == User.id)
        .where(Kudos.created_at >= cutoff)
        .group_by(User.id)
        .order_by(desc(func.count(Kudos.id)))
        .limit(10)
    )
    return [KudosLeaderboardItem(**row._mapping) for row in result]


@router.patch("/{kudos_id}/pin")
@limiter.limit("20/hour")
async def pin_kudos(
    request: Request,
    kudos_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin)),
):
    kudos = await db.get(Kudos, kudos_id)
    if not kudos:
        raise HTTPException(status_code=404, detail="Kudos not found")
    kudos.is_pinned = not kudos.is_pinned
    await db.commit()
    await db.refresh(kudos)
    return kudos
