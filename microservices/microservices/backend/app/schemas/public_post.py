import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PublicPostCreate(BaseModel):
    title: str = Field(max_length=512)
    content: str
    is_anonymous: bool = False


class PublicPostRead(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    is_anonymous: bool
    severity_score: float
    reaction_count: int
    created_at: datetime
    author_label: Optional[str] = None

    model_config = {"from_attributes": True}


class ReactionCreate(BaseModel):
    reaction_type: str = Field(pattern="^(support|like|flag)$")
