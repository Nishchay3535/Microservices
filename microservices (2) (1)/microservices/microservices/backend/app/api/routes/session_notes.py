from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.mentorship_session import MentorshipSession
from app.models.session_notes import SessionNotes
from app.models.user import User
from app.schemas.session_notes import SessionNotesCreate, SessionNotesResponse, FollowUpActionUpdate

router = APIRouter()


@router.post(
    "/mentorship/sessions/{session_id}/notes",
    response_model=SessionNotesResponse,
)
@limiter.limit("5/hour")
async def create_session_notes(
    request: Request,
    session_id: UUID,
    notes: SessionNotesCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionNotesResponse:
    # Check if session exists and user is the mentor
    result = await db.execute(
        select(MentorshipSession).where(MentorshipSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.mentor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only mentor can add notes")
    if session.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session must be completed")

    # Check if notes already exist
    existing = await db.execute(
        select(SessionNotes).where(SessionNotes.session_id == session_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Notes already exist")

    db_notes = SessionNotes(
        session_id=session_id,
        summary=notes.summary,
        key_takeaways=notes.key_takeaways,
        follow_up_actions=[action.dict() for action in notes.follow_up_actions],
    )
    db.add(db_notes)
    await db.commit()
    await db.refresh(db_notes)
    await write_audit_log(
        db,
        actor_id=current_user.id,
        action="create_session_notes",
        target_type="session_notes",
        target_id=db_notes.id,
    )
    return SessionNotesResponse.from_orm(db_notes)


@router.get(
    "/mentorship/sessions/{session_id}/notes",
    response_model=SessionNotesResponse,
)
async def get_session_notes(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionNotesResponse:
    # Check if session exists and user has access
    result = await db.execute(
        select(MentorshipSession).where(MentorshipSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if not (
        session.mentor_id == current_user.id
        or session.employee_id == current_user.id
        or current_user.role in ["admin", "authority"]
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(
        select(SessionNotes).where(SessionNotes.session_id == session_id)
    )
    notes = result.scalar_one_or_none()
    if not notes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notes not found")
    return SessionNotesResponse.from_orm(notes)


@router.patch(
    "/mentorship/sessions/{session_id}/notes/actions/{action_index}",
    response_model=SessionNotesResponse,
)
async def update_follow_up_action(
    session_id: UUID,
    action_index: int,
    update: FollowUpActionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SessionNotesResponse:
    # Check if session exists and user is the employee
    result = await db.execute(
        select(MentorshipSession).where(MentorshipSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if session.employee_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only employee can update actions")

    result = await db.execute(
        select(SessionNotes).where(SessionNotes.session_id == session_id)
    )
    notes = result.scalar_one_or_none()
    if not notes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notes not found")

    if action_index < 0 or action_index >= len(notes.follow_up_actions):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action index")

    notes.follow_up_actions[action_index]["completed"] = update.completed
    notes.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notes)
    await write_audit_log(
        db,
        actor_id=current_user.id,
        action="update_follow_up_action",
        target_type="session_notes",
        target_id=notes.id,
    )
    return SessionNotesResponse.from_orm(notes)