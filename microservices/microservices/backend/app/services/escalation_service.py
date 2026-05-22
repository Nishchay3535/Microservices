from datetime import datetime, timezone, timedelta
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.enums import UserRole
from app.models.issue import Issue
from app.models.issue_escalation import IssueEscalation
from app.models.notification import Notification
from app.models.user import User
from app.services import email_service


async def run_escalation_check(db: AsyncSession) -> int:
    settings = get_settings()
    threshold = settings.ESCALATION_THRESHOLD_DAYS or 7
    cutoff = datetime.now(timezone.utc) - timedelta(days=threshold)

    result = await db.execute(
        select(Issue).where(
            Issue.status.in_(["open", "in_progress"]),
            Issue.updated_at < cutoff,
        )
    )
    issues = result.scalars().all()
    escalated_count = 0

    for issue in issues:
        existing = await db.execute(select(IssueEscalation).where(IssueEscalation.issue_id == issue.id, IssueEscalation.resolved.is_(False)))
        if existing.scalar_one_or_none():
            continue

        recipients = []
        if issue.assigned_to:
            assigned = await db.get(User, issue.assigned_to)
            if assigned and assigned.deleted_at is None:
                recipients.append(assigned)
        else:
            auths = await db.execute(select(User).where(User.role == UserRole.authority.value, User.deleted_at.is_(None), User.is_active.is_(True)))
            recipients = auths.scalars().all()

        notified_user_ids = [str(user.id) for user in recipients]
        escalation = IssueEscalation(
            issue_id=issue.id,
            days_stale=max(1, (datetime.now(timezone.utc) - issue.updated_at).days),
            notified_user_ids=notified_user_ids,
        )
        db.add(escalation)
        for recipient in recipients:
            db.add(
                Notification(
                    user_id=recipient.id,
                    type="issue_escalation",
                    title="Stale issue alert",
                    message=f"Issue '{issue.title}' has been stale for more than {threshold} days.",
                    ref_id=issue.id,
                )
            )
            await email_service.send_email(
                recipient.email,
                "Stale issue escalation",
                f"The issue '{issue.title}' has been open for more than {threshold} days and requires attention.",
            )

        escalated_count += 1

    if escalated_count:
        await db.commit()
    return escalated_count
