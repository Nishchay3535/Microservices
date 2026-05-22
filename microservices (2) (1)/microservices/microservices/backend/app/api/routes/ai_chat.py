import uuid as uuid_lib
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import get_current_user
from app.services.llm_client import AI_NOT_CONFIGURED, AI_REQUEST_FAILED, ai_is_configured, chat_completion
from app.db.session import get_db
from app.models.issue import Issue
from app.models.user import User

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])

SYSTEM_PROMPT = """You are Aria, a compassionate and professional workplace wellbeing counsellor.
Your role is to:
- Listen actively and acknowledge the employee's feelings with genuine empathy
- Validate their experience without making legal or HR promises
- Help them feel heard, less alone, and more confident
- Gently suggest constructive next steps when appropriate
- Never be dismissive, robotic, or generic
- Speak warmly, like a trusted colleague who genuinely cares
- Keep responses concise (3-5 sentences) unless the employee needs more
You are NOT a replacement for HR or legal advice. Always remind them help is available."""


class ChatMessage(BaseModel):
    role: str
    content: str


class AIChatRequest(BaseModel):
    issue_id: str
    messages: List[ChatMessage]


class AIChatResponse(BaseModel):
    reply: str


@router.post("/message", response_model=AIChatResponse)
async def ai_chat_message(
    request: AIChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIChatResponse:
    try:
        issue_uuid = uuid_lib.UUID(request.issue_id)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid issue ID")

    result = await db.execute(
        select(Issue).where(Issue.id == issue_uuid, Issue.submitter_id == current_user.id)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    settings = get_settings()

    context_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Context about this employee's situation:\n"
        f"- Issue category: {issue.category}\n"
        f"- Issue title: {issue.title}\n"
        f"- Issue description: {issue.description}\n"
        f"- Current status: {issue.status}\n\n"
        "Use this context to personalise your support. "
        "Do not repeat the issue back to them robotically."
    )

    messages_payload = [{"role": "system", "content": context_prompt}]
    for msg in request.messages:
        messages_payload.append({"role": msg.role, "content": msg.content})

    if not ai_is_configured(settings):
        raise HTTPException(status_code=503, detail=AI_NOT_CONFIGURED)

    try:
        reply = await chat_completion(
            settings,
            messages=messages_payload,
            max_tokens=300,
            temperature=0.75,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=AI_REQUEST_FAILED) from exc
    return AIChatResponse(reply=reply)
