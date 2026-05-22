import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.checkin import CheckIn
from app.models.enums import UserRole
from app.models.user import User
from app.services.checkin_service import score_checkin
from app.db.session import SessionLocal


class CheckInCreate(BaseModel):
    mood_score: int = Field(..., ge=1, le=5)
    workload_score: int = Field(..., ge=1, le=5)
    sleep_score: int = Field(..., ge=1, le=5)
    safety_score: int = Field(..., ge=1, le=5)
    support_score: int = Field(..., ge=1, le=5)


router = APIRouter(prefix="/checkins", tags=["checkins"])


async def _update_checkin_scores(checkin_id: uuid.UUID) -> None:
    async with SessionLocal() as db:
        checkin = await db.get(CheckIn, checkin_id)
        if not checkin:
            return
        scores = {
            "mood_score": checkin.mood_score,
            "workload_score": checkin.workload_score,
            "sleep_score": checkin.sleep_score,
            "safety_score": checkin.safety_score,
            "support_score": checkin.support_score,
        }
        result = await score_checkin(scores)
        checkin.burnout_label = result.get("burnout_label")
        checkin.ai_recommendation = result.get("recommendation")
        db.add(checkin)
        await db.commit()


@router.post("/", response_model=CheckInCreate)
@limiter.limit("20/hour")
async def create_checkin(
    request: Request,
    body: CheckInCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.employee)),
):
    now = datetime.now(timezone.utc)
    week_number, year = now.isocalendar()[1], now.isocalendar()[0]
    exists = await db.execute(
        select(CheckIn).where(CheckIn.user_id == user.id, CheckIn.week_number == week_number, CheckIn.year == year)
    )
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A check-in already exists for this week")

    checkin = CheckIn(
        user_id=user.id,
        week_number=week_number,
        year=year,
        mood_score=body.mood_score,
        workload_score=body.workload_score,
        sleep_score=body.sleep_score,
        safety_score=body.safety_score,
        support_score=body.support_score,
    )
    db.add(checkin)
    await db.flush()
    await db.commit()
    await db.refresh(checkin)
    background.add_task(_update_checkin_scores, checkin.id)
    return body


@router.get("/me")
async def get_my_checkins(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CheckIn)
        .where(CheckIn.user_id == user.id)
        .order_by(CheckIn.year.desc(), CheckIn.week_number.desc())
        .limit(12)
    )
    return result.scalars().all()


@router.get("/department-trends")
async def get_department_trends(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.authority, UserRole.admin)),
):
    stmt = (
        select(
            CheckIn.week_number,
            CheckIn.year,
            User.department,
            func.avg(CheckIn.mood_score).label("avg_mood"),
            func.avg(CheckIn.workload_score).label("avg_workload"),
            func.avg(CheckIn.sleep_score).label("avg_sleep"),
            func.avg(CheckIn.safety_score).label("avg_safety"),
            func.avg(CheckIn.support_score).label("avg_support"),
            func.sum(case((CheckIn.burnout_label == "high", 1), else_=0)).label("burnout_high_count"),
        )
        .join(User, User.id == CheckIn.user_id)
        .group_by(CheckIn.year, CheckIn.week_number, User.department)
        .order_by(CheckIn.year.desc(), CheckIn.week_number.desc())
    )
    rows = await db.execute(stmt)
    return [dict(row._mapping) for row in rows]
