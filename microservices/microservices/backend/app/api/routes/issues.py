import uuid
from datetime import datetime, timezone

from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db, require_roles
from app.core.rate_limit import limiter
from app.models.ai_suggestion import AISuggestion
from app.models.enums import AuditAction, IssueStatus, UserRole
from app.models.issue import Issue
from app.models.issue_escalation import IssueEscalation
from app.models.issue_status_history import IssueStatusHistory
from app.models.mentorship_session import MentorshipSession
from app.models.notification import Notification
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueRead, IssueStatusUpdate
from app.services import ai_service, email_service, score_service
from app.services import storage_service

router = APIRouter(prefix="/issues", tags=["issues"])


async def _run_ai_suggestion_bg(issue_id: uuid.UUID, title: str, description: str) -> None:
    from app.db.session import SessionLocal

    insights = await ai_service.generate_issue_insights(title, description)
    summary = str(insights.get("summary", ""))
    sug = insights.get("suggestions") or []
    text = summary + "\n\n" + "\n".join(f"- {s}" for s in sug if isinstance(s, str))
    async with SessionLocal() as db:
        db.add(
            AISuggestion(
                issue_id=issue_id,
                suggestion_text=text[:8000],
                confidence_score=float(insights.get("severity_signal") or 0) / 5.0,
                model_used=str(insights.get("model_used") or "unknown"),
            )
        )
        await db.commit()


def _mask_issue(issue: Issue, viewer: User) -> IssueRead:
    data = IssueRead.model_validate(issue)
    if issue.is_anonymous:
        if viewer.role not in (UserRole.admin.value, UserRole.authority.value) and viewer.id != issue.submitter_id:
            data.submitter_id = None
    return data


@router.post("/upload-attachment")
@limiter.limit("10/hour")
async def upload_attachment(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(require_roles(UserRole.employee)),
):
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    url = await storage_service.upload_attachment(file.filename or "file", raw, file.content_type or "application/octet-stream")
    return {"url": url}


@router.post("/", response_model=IssueRead)
@limiter.limit("20/hour")
async def create_issue(
    request: Request,
    body: IssueCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.employee)),
):
    now = datetime.now(timezone.utc)
    issue = Issue(
        title=body.title,
        description=body.description,
        category=body.category.value,
        severity=body.severity,
        is_anonymous=body.is_anonymous,
        submitter_id=user.id,
        attachment_urls=body.attachment_urls,
        status=IssueStatus.open.value,
        created_at=now,
        updated_at=now,
    )
    db.add(issue)
    await db.flush()
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.issue_create,
        target_type="issue",
        target_id=issue.id,
    )
    await db.commit()
    await db.refresh(issue)
    background.add_task(_run_ai_suggestion_bg, issue.id, issue.title, issue.description)
    return _mask_issue(issue, user)


@router.get("/", response_model=list[IssueRead])
async def list_issues(
    mentee: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    mentee_id: Optional[uuid.UUID] = None
    invalid_mentee = False
    if mentee:
        try:
            mentee_id = uuid.UUID(mentee)
        except ValueError:
            invalid_mentee = True

    if invalid_mentee:
        return []

    if user.role == UserRole.admin.value:
        query = select(Issue).order_by(Issue.created_at.desc())
    elif user.role == UserRole.authority.value:
        query = select(Issue).where(or_(Issue.assigned_to == user.id, Issue.assigned_to.is_(None)))
        if mentee_id:
            query = query.where(Issue.submitter_id == mentee_id)
        query = query.order_by(Issue.created_at.desc())
    elif user.role == UserRole.mentor.value:
        if mentee_id:
            relationship = await db.execute(
                select(MentorshipSession).where(
                    MentorshipSession.mentor_id == user.id,
                    MentorshipSession.employee_id == mentee_id,
                )
            )
            if relationship.scalar_one_or_none() is None:
                raise HTTPException(status_code=403, detail="Forbidden")
            query = select(Issue).where(Issue.submitter_id == mentee_id).order_by(Issue.created_at.desc())
        else:
            query = select(Issue).where(Issue.submitter_id == user.id).order_by(Issue.created_at.desc())
    else:
        query = select(Issue).where(Issue.submitter_id == user.id).order_by(Issue.created_at.desc())

    res = await db.execute(query)
    issues = list(res.scalars().all())
    return [_mask_issue(i, user) for i in issues]


@router.get("/{issue_id}", response_model=IssueRead)
async def get_issue(issue_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = res.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == UserRole.employee.value and issue.submitter_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user.role == UserRole.authority.value and issue.assigned_to not in (None, user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return _mask_issue(issue, user)


@router.put("/{issue_id}/status", response_model=IssueRead)
async def update_status(
    issue_id: uuid.UUID,
    body: IssueStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.authority, UserRole.admin)),
):
    res = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = res.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == UserRole.authority.value and issue.assigned_to not in (None, user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    old = issue.status
    issue.status = body.status.value
    if body.resolution_note:
        issue.resolution_note = body.resolution_note
    issue.updated_at = datetime.now(timezone.utc)
    db.add(
        IssueStatusHistory(
            issue_id=issue.id,
            old_status=old,
            new_status=body.status.value,
            changed_by=user.id,
            note=body.resolution_note,
        )
    )
    await write_audit_log(
        db,
        actor_id=user.id,
        action=AuditAction.issue_status,
        target_type="issue",
        target_id=issue.id,
        metadata={"old": old, "new": body.status.value},
    )
    if body.status in (IssueStatus.resolved, IssueStatus.closed):
        await score_service.on_issue_resolved(db, issue)
        sub = await db.get(User, issue.submitter_id)
        if sub:
            await email_service.send_email(
                sub.email,
                "Issue status updated",
                f"Your issue '{issue.title}' is now {body.status.value}.",
            )
        esc_res = await db.execute(
            select(IssueEscalation).where(
                IssueEscalation.issue_id == issue.id,
                IssueEscalation.resolved.is_(False),
            )
        )
        for esc in esc_res.scalars().all():
            esc.resolved = True
    await db.commit()
    await db.refresh(issue)
    return _mask_issue(issue, user)
