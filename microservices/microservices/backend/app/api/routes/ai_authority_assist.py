import uuid as uuid_lib
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.services.llm_client import AI_NOT_CONFIGURED, ai_is_configured, chat_completion
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.issue import Issue
from app.models.user import User

router = APIRouter(prefix="/ai-authority-assist", tags=["ai-authority-assist"])

AUTHORITY_SYSTEM_PROMPT = """You are assisting a workplace authority figure (manager/HR) who is about to respond to an employee raising a sensitive workplace issue.

Your job is to:
- Suggest ONE professional, empathetic, and constructive reply they could send
- The reply should acknowledge the employee's concern genuinely
- Be firm but human - not corporate-speak or legal boilerplate
- Keep it concise (2-4 sentences)
- The authority will decide whether to use your suggestion or not

Only output the suggested reply text. No preamble, no explanation, no quotes."""


class ConversationMessage(BaseModel):
    role: str
    content: str
    sender_name: str = ""


class AuthorityAssistRequest(BaseModel):
    issue_id: Optional[str] = None
    employee_id: Optional[str] = None
    recent_messages: List[ConversationMessage]


class AuthorityAssistResponse(BaseModel):
    suggested_reply: str


@router.post("/suggest", response_model=AuthorityAssistResponse)
async def suggest_authority_reply(
    request: AuthorityAssistRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AuthorityAssistResponse:
    if current_user.role not in (UserRole.authority.value, UserRole.admin.value):
        raise HTTPException(status_code=403, detail="Only authority users can access this")

    context = ""
    issue = None
    if request.issue_id:
        try:
            issue_uuid = uuid_lib.UUID(request.issue_id)
            query = select(Issue).where(Issue.id == issue_uuid)
            if current_user.role == UserRole.authority.value:
                query = query.where(or_(Issue.assigned_to == current_user.id, Issue.assigned_to.is_(None)))
            result = await db.execute(query)
            issue = result.scalar_one_or_none()
            if issue:
                context = (
                    f"\nIssue context - Category: {issue.category}, "
                    f"Title: {issue.title}, "
                    f"Description: {issue.description[:300]}, "
                    f"Status: {issue.status}"
                )
        except (ValueError, AttributeError):
            pass
    elif request.employee_id:
        try:
            employee_uuid = uuid_lib.UUID(request.employee_id)
            query = select(Issue).where(Issue.submitter_id == employee_uuid)
            if current_user.role == UserRole.authority.value:
                query = query.where(or_(Issue.assigned_to == current_user.id, Issue.assigned_to.is_(None)))
            result = await db.execute(query.order_by(Issue.created_at.desc()).limit(1))
            issue = result.scalar_one_or_none()
            if issue:
                context = (
                    f"\nIssue context - Category: {issue.category}, "
                    f"Title: {issue.title}, "
                    f"Description: {issue.description[:300]}, "
                    f"Status: {issue.status}"
                )
        except (ValueError, AttributeError):
            pass

    conversation_text = "\n".join(
        f"{msg.sender_name or msg.role}: {msg.content}"
        for msg in request.recent_messages[-6:]
    )

    user_prompt = (
        f"Issue context:{context}\n\n"
        f"Recent conversation:\n{conversation_text}\n\n"
        "Suggest a professional, empathetic reply for the authority to send."
    )

    settings = get_settings()

    if not ai_is_configured(settings):
        raise HTTPException(status_code=503, detail=AI_NOT_CONFIGURED)

    suggested = await chat_completion(
        settings,
        messages=[
            {"role": "system", "content": AUTHORITY_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=200,
        temperature=0.6,
    )
    return AuthorityAssistResponse(suggested_reply=suggested.strip())
