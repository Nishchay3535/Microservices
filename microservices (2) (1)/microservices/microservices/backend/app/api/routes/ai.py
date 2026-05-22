import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.ai_suggestion import AISuggestion
from app.models.enums import UserRole
from app.models.issue import Issue
from app.models.user import User


class AISuggestionRead(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    suggestion_text: str
    confidence_score: float | None
    model_used: str | None

    model_config = {"from_attributes": True}


router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/suggestions/{issue_id}", response_model=AISuggestionRead | None)
@limiter.limit("30/hour")
async def get_suggestion(
    request: Request,
    issue_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    issue = await db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    if user.role == UserRole.employee.value and issue.submitter_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    res = await db.execute(
        select(AISuggestion).where(AISuggestion.issue_id == issue_id).order_by(AISuggestion.created_at.desc())
    )
    row = res.scalars().first()
    return row
