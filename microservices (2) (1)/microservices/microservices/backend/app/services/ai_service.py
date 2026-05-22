import json
import logging
from typing import Any

import httpx

from app.core.config import get_settings
from app.services.llm_client import ai_is_configured, chat_completions_url

logger = logging.getLogger(__name__)


async def generate_issue_insights(title: str, description: str) -> dict[str, Any]:
    settings = get_settings()
    if not ai_is_configured(settings):
        summary = (title + ": " + description)[:400]
        return {
            "summary": summary,
            "suggestions": [
                "Acknowledge the concern and offer a follow-up within 48 hours.",
                "Connect the employee with HR or a mentor if appropriate.",
            ],
            "severity_signal": 3,
            "model_used": "heuristic-fallback",
        }

    prompt = (
        "You assist workplace equity officers. Given an employee issue, respond with JSON only: "
        '{"summary": string, "suggestions": string[], "severity_signal": number 1-5}. '
        "Do not claim legal or medical authority.\n\n"
        f"Title: {title}\nDescription: {description}"
    )
    async with httpx.AsyncClient() as client:
        r = await client.post(
            chat_completions_url(settings),
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={
                "model": settings.AI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
            timeout=60.0,
        )
        r.raise_for_status()
        data = r.json()
        text = data["choices"][0]["message"]["content"]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("AI returned non-JSON, wrapping")
            return {
                "summary": text[:500],
                "suggestions": ["Review with a human manager."],
                "severity_signal": 3,
                "model_used": settings.AI_MODEL,
            }
