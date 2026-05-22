from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.enums import UserRole
from app.models.issue_escalation import IssueEscalation
from app.services.escalation_service import run_escalation_check

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.post("/run")
@limiter.limit("20/hour")
async def run_escalations(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_roles(UserRole.admin)),
):
    escalated_count = await run_escalation_check(db)
    return {"escalated_count": escalated_count}


@router.get("/")
async def list_escalations(
    db: AsyncSession = Depends(get_db),
    user=Depends(require_roles(UserRole.authority, UserRole.admin)),
):
    result = await db.execute(
        select(IssueEscalation).where(IssueEscalation.resolved.is_(False)).order_by(IssueEscalation.escalated_at.desc())
    )
    return result.scalars().all()
