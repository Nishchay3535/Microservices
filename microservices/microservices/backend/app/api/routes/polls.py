import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, validator
from sqlalchemy import case, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.enums import AuditAction, UserRole
from app.models.poll import Poll, PollVote
from app.models.user import User


class PollCreate(BaseModel):
    question: str = Field(..., min_length=3, max_length=512)
    options: list[str] = Field(..., min_length=2, max_length=5)
    target_audience: str
    expires_at: datetime | None = None

    @validator("options")
    def options_must_be_strings(cls, value: list[str]) -> list[str]:
        return [str(item).strip() for item in value if str(item).strip()]


class PollVoteCreate(BaseModel):
    option_index: int = Field(..., ge=0)


router = APIRouter(prefix="/polls", tags=["polls"])


def _matches_audience(poll: Poll, user: User) -> bool:
    if poll.target_audience == "all":
        return True
    if poll.target_audience.startswith("department:"):
        return poll.target_audience.split(":", 1)[1] == (user.department or "")
    if poll.target_audience.startswith("role:"):
        return poll.target_audience.split(":", 1)[1] == user.role
    return False


@router.post("/")
@limiter.limit("20/hour")
async def create_poll(
    request: Request,
    body: PollCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin, UserRole.authority, UserRole.mentor)),
):
    poll = Poll(
        question=body.question.strip(),
        options=body.options,
        target_audience=body.target_audience,
        expires_at=body.expires_at,
        created_by=user.id,
    )
    db.add(poll)
    await db.commit()
    await db.refresh(poll)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.post_create,
        target_type="poll",
        target_id=poll.id,
    )
    return poll


@router.get("/active")
async def list_active_polls(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Poll).where(
            Poll.is_active.is_(True),
            (Poll.expires_at.is_(None)) | (Poll.expires_at > now),
        )
    )
    polls = [poll for poll in result.scalars().all() if _matches_audience(poll, user)]
    response = []
    for poll in polls:
        votes = await db.execute(select(PollVote).where(PollVote.poll_id == poll.id, PollVote.voter_id == user.id))
        has_voted = votes.scalar_one_or_none() is not None
        counts = await db.execute(
            select(PollVote.option_index, func.count(PollVote.id))
            .where(PollVote.poll_id == poll.id)
            .group_by(PollVote.option_index)
        )
        count_map = {row[0]: row[1] for row in counts.all()}
        total = sum(count_map.values())
        results = []
        poll_manager_roles = {UserRole.admin.value, UserRole.authority.value, UserRole.mentor.value}
        if has_voted or user.role in poll_manager_roles:
            for index, option in enumerate(poll.options):
                count = count_map.get(index, 0)
                percentage = float(count) / total * 100 if total else 0.0
                results.append({"option": option, "count": count, "percentage": round(percentage, 1)})
        response.append({
            "id": poll.id,
            "question": poll.question,
            "options": poll.options,
            "target_audience": poll.target_audience,
            "is_active": poll.is_active,
            "expires_at": poll.expires_at,
            "created_at": poll.created_at,
            "has_voted": has_voted,
            "results": results,
        })
    return response


@router.post("/{poll_id}/vote")
@limiter.limit("20/hour")
async def vote_poll(
    request: Request,
    poll_id: uuid.UUID,
    body: PollVoteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if not _matches_audience(poll, user):
        raise HTTPException(status_code=403, detail="Not authorized for this poll")
    if body.option_index >= len(poll.options):
        raise HTTPException(status_code=400, detail="Invalid option")
    existing = await db.execute(select(PollVote).where(PollVote.poll_id == poll.id, PollVote.voter_id == user.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already voted")
    vote = PollVote(poll_id=poll.id, voter_id=user.id, option_index=body.option_index)
    db.add(vote)
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.post_create,
        target_type="poll_vote",
        target_id=vote.id,
    )
    await db.commit()
    return {"message": "Vote recorded"}


@router.get("/{poll_id}/results")
async def poll_results(
    poll_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin)),
):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    total = await db.execute(select(func.count(PollVote.id)).where(PollVote.poll_id == poll.id))
    total_voters = total.scalar_one() or 0
    counts = await db.execute(
        select(PollVote.option_index, func.count(PollVote.id))
        .where(PollVote.poll_id == poll.id)
        .group_by(PollVote.option_index)
    )
    count_map = {row[0]: row[1] for row in counts.all()}
    eligible_query = select(User)
    if poll.target_audience == "all":
        eligible_query = select(User).where(User.deleted_at.is_(None), User.is_active.is_(True))
    elif poll.target_audience.startswith("department:"):
        department = poll.target_audience.split(":", 1)[1]
        eligible_query = select(User).where(User.department == department, User.deleted_at.is_(None), User.is_active.is_(True))
    elif poll.target_audience.startswith("role:"):
        role = poll.target_audience.split(":", 1)[1]
        eligible_query = select(User).where(User.role == role, User.deleted_at.is_(None), User.is_active.is_(True))
    eligible = await db.execute(eligible_query)
    eligible_count = len(eligible.scalars().all())
    response = {
        "poll_id": poll.id,
        "question": poll.question,
        "target_audience": poll.target_audience,
        "total_voters": total_voters,
        "response_rate": float(total_voters) / eligible_count if eligible_count else 0.0,
        "breakdown": [
            {
                "option": poll.options[index],
                "count": count_map.get(index, 0),
                "percentage": round(float(count_map.get(index, 0)) / total_voters * 100, 1) if total_voters else 0.0,
            }
            for index in range(len(poll.options))
        ],
    }
    return response


@router.patch("/{poll_id}")
async def toggle_poll(
    poll_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.admin)),
):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_active = not poll.is_active
    await db.commit()
    await db.refresh(poll)
    return poll
