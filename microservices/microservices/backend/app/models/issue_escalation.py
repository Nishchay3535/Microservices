import uuid
from datetime import datetime, timezone
from typing import List

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.db.base import Base


def _utc() -> datetime:
    return datetime.now(timezone.utc)


class IssueEscalation(Base):
    __tablename__ = "issue_escalations"
    __table_args__ = (UniqueConstraint("issue_id", name="uq_issue_escalations_issue_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("issues.id"), nullable=False)
    escalated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc, nullable=False)
    days_stale: Mapped[int] = mapped_column(Integer, nullable=False)
    notified_user_ids: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
