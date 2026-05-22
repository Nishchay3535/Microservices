import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db, require_roles
from app.models.enums import MentorshipStatus, UserRole
from app.models.mentorship_session import MentorshipSession
from app.models.user import User
from app.services import email_service, score_service


class MentorshipRequest(BaseModel):
    topic: str


class MentorshipRead(BaseModel):
    id: uuid.UUID
    mentor_id: uuid.UUID | None
    employee_id: uuid.UUID
    topic: str
    status: str

    model_config = {"from_attributes": True}


class MentorshipUpdate(BaseModel):
    status: str


router = APIRouter(prefix="/mentorship", tags=["mentorship"])


@router.post("/request", response_model=MentorshipRead)
async def request_session(
    body: MentorshipRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.employee)),
):
    now = datetime.now(timezone.utc)
    row = MentorshipSession(
        employee_id=user.id,
        topic=body.topic,
        status=MentorshipStatus.requested.value,
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    mentors = await db.execute(select(User).where(User.role == UserRole.mentor.value, User.deleted_at.is_(None)))
    for m in mentors.scalars().all():
        await email_service.send_email(m.email, "New mentorship request", f"Topic: {body.topic}")
    return row


@router.get("/sessions", response_model=list[MentorshipRead])
async def list_sessions(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role == UserRole.mentor.value:
        res = await db.execute(
            select(MentorshipSession).where(
                or_(
                    MentorshipSession.mentor_id == user.id,
                    (MentorshipSession.mentor_id.is_(None))
                    & (MentorshipSession.status == MentorshipStatus.requested.value),
                )
            )
        )
    else:
        res = await db.execute(select(MentorshipSession).where(MentorshipSession.employee_id == user.id))
    return list(res.scalars().all())


@router.put("/sessions/{session_id}", response_model=MentorshipRead)
async def update_session(
    session_id: uuid.UUID,
    body: MentorshipUpdate,
    db: AsyncSession = Depends(get_db),
    mentor: User = Depends(require_roles(UserRole.mentor)),
):
    row = await db.get(MentorshipSession, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    row.mentor_id = mentor.id
    row.status = body.status
    row.updated_at = datetime.now(timezone.utc)
    if body.status == MentorshipStatus.completed.value:
        await score_service.on_mentorship_completed(db, row)
    await db.commit()
    await db.refresh(row)
    emp = await db.get(User, row.employee_id)
    if emp:
        await email_service.send_email(emp.email, "Mentorship update", f"Your session is now {row.status}.")
    return row
