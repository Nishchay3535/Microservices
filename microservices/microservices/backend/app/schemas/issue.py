import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.enums import IssueCategory, IssueStatus


class IssueCreate(BaseModel):
    title: str = Field(max_length=512)
    description: str
    category: IssueCategory = IssueCategory.other
    severity: int = Field(ge=1, le=5, default=1)
    is_anonymous: bool = False
    attachment_urls: Optional[list[str]] = None


class IssueStatusUpdate(BaseModel):
    status: IssueStatus
    resolution_note: Optional[str] = None


class IssueRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    category: str
    severity: int
    is_anonymous: bool
    submitter_id: Optional[uuid.UUID] = None
    assigned_to: Optional[uuid.UUID] = None
    status: str
    resolution_note: Optional[str] = None
    attachment_urls: Optional[list[Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
