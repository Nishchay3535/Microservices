import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, HttpUrl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.enums import AuditAction, UserRole
from app.models.resource import LearningResource, ResourceCompletion
from app.models.user import User
from app.services import score_service


class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=256)
    description: str | None = None
    url: HttpUrl
    category: str = Field(..., min_length=3, max_length=64)
    estimated_minutes: int = Field(default=10, ge=1)


class ResourceResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    url: str
    category: str
    estimated_minutes: int
    is_active: bool
    is_completed: bool = False


router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("/")
@limiter.limit("20/hour")
async def create_resource(
    request: Request,
    body: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.authority, UserRole.mentor)),
):
    resource = LearningResource(
        title=body.title.strip(),
        description=body.description,
        url=str(body.url),
        category=body.category.strip(),
        estimated_minutes=body.estimated_minutes,
        created_by=user.id,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.post_create,
        target_type="resource",
        target_id=resource.id,
    )
    return resource


@router.get("/")
async def list_resources(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resources = await db.execute(select(LearningResource).where(LearningResource.is_active.is_(True)))
    completed = await db.execute(
        select(ResourceCompletion.resource_id).where(ResourceCompletion.user_id == user.id)
    )
    completed_ids = {row[0] for row in completed.all()}
    return [
        ResourceResponse(
            id=resource.id,
            title=resource.title,
            description=resource.description,
            url=resource.url,
            category=resource.category,
            estimated_minutes=resource.estimated_minutes,
            is_active=resource.is_active,
            is_completed=resource.id in completed_ids,
        )
        for resource in resources.scalars().all()
    ]


@router.post("/{resource_id}/complete")
@limiter.limit("20/hour")
async def complete_resource(
    request: Request,
    resource_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resource = await db.get(LearningResource, resource_id)
    if not resource or not resource.is_active:
        raise HTTPException(status_code=404, detail="Resource not found")
    existing = await db.execute(
        select(ResourceCompletion).where(ResourceCompletion.resource_id == resource_id, ResourceCompletion.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already completed")

    completion = ResourceCompletion(resource_id=resource_id, user_id=user.id)
    db.add(completion)
    await score_service.add_impact(db, user.id, 2.0)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.post_create,
        target_type="resource_completion",
        target_id=completion.id,
    )
    await db.commit()
    return {"message": "Completed", "new_impact_score": user.impact_score}


@router.get("/my-progress")
async def my_progress(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resources_total = await db.execute(select(func.count(LearningResource.id)).where(LearningResource.is_active.is_(True)))
    total_count = resources_total.scalar_one() or 0
    completions = await db.execute(
        select(ResourceCompletion)
        .where(ResourceCompletion.user_id == user.id)
        .order_by(ResourceCompletion.completed_at.desc())
    )
    rows = completions.scalars().all()
    completed_count = len(rows)
    now = datetime.now(timezone.utc)
    current_week = now.isocalendar()[1]
    current_year = now.isocalendar()[0]
    streak = 0
    week = current_week
    year = current_year
    completed_weeks = {
        (c.completed_at.isocalendar()[0], c.completed_at.isocalendar()[1]) for c in rows
    }
    while (year, week) in completed_weeks:
        streak += 1
        if week == 1:
            year -= 1
            week = 52
        else:
            week -= 1
    return {
        "completed_count": completed_count,
        "total_count": total_count,
        "learning_streak_weeks": streak,
        "completions": [
            {"resource_id": row.resource_id, "completed_at": row.completed_at}
            for row in rows
        ],
    }
