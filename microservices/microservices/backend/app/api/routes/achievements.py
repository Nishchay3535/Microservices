import uuid
from datetime import datetime, timezone

from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.achievement import Achievement
from app.models.enums import UserRole
from app.models.user import User
from app.services import score_service


class AchievementCreate(BaseModel):
    title: str
    description: str | None = None
    points: int = 10


class AchievementRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    points: int
    verified_by: uuid.UUID | None

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=list[AchievementRead])
async def list_achievements(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Achievement).where(Achievement.user_id == user.id))
    return list(res.scalars().all())


@router.post("/", response_model=AchievementRead)
async def create_achievement(
    body: AchievementCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.employee)),
):
    now = datetime.now(timezone.utc)
    row = Achievement(
        user_id=user.id,
        title=body.title,
        description=body.description,
        points=body.points,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.post("/{achievement_id}/verify", response_model=AchievementRead)
async def verify_achievement(
    achievement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.admin, UserRole.authority)),
):
    row = await db.get(Achievement, achievement_id)
    if not row:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Not found")
    row.verified_by = admin.id
    await score_service.on_achievement_verified(db, row.user_id, row.points)
    await db.commit()
    await db.refresh(row)
    return row
