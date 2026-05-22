import uuid

from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    message: str
    is_read: bool
    ref_id: uuid.UUID | None

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationRead])
async def list_notifications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())
    )
    return list(res.scalars().all())


@router.put("/{notif_id}/read", status_code=204)
async def mark_read(notif_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    row = await db.get(Notification, notif_id)
    if row and row.user_id == user.id:
        row.is_read = True
        await db.commit()
    return None
