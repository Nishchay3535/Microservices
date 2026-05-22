from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.issue import Issue
from app.models.mentorship_session import MentorshipSession
from app.models.user import User


async def add_impact(db: AsyncSession, user_id, delta: float) -> None:
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalar_one_or_none()
    if user:
        user.impact_score = float(user.impact_score or 0) + delta


async def on_issue_resolved(db: AsyncSession, issue: Issue) -> None:
    if issue.submitter_id:
        await add_impact(db, issue.submitter_id, 10.0)


async def on_mentorship_completed(db: AsyncSession, session: MentorshipSession) -> None:
    if session.employee_id:
        await add_impact(db, session.employee_id, 5.0)
    if session.mentor_id:
        await add_impact(db, session.mentor_id, 5.0)


async def on_achievement_verified(db: AsyncSession, user_id, points: int) -> None:
    await add_impact(db, user_id, float(points))
