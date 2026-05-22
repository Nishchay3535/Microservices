from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FollowUpAction(BaseModel):
    action: str = Field(..., min_length=1, max_length=500)
    due_date: Optional[str] = Field(None, description="ISO 8601 date string")
    completed: bool = Field(default=False)


class SessionNotesCreate(BaseModel):
    summary: str = Field(..., min_length=1, max_length=2000)
    key_takeaways: List[str] = Field(..., min_items=1, max_items=10)
    follow_up_actions: List[FollowUpAction] = Field(..., min_items=0, max_items=10)


class SessionNotesResponse(BaseModel):
    id: UUID
    session_id: UUID
    summary: str
    key_takeaways: List[str]
    follow_up_actions: List[dict]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FollowUpActionUpdate(BaseModel):
    completed: bool