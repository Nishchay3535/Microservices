import json
from typing import Any
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.services.llm_client import ai_is_configured, chat_completions_url


async def score_checkin(scores: dict[str, int]) -> dict[str, str]:
    settings = get_settings()
    avg_score = sum(scores.values()) / len(scores)
    if not ai_is_configured(settings):
        label = "low" if avg_score >= 4 else "moderate" if avg_score >= 2.5 else "high"
        return {
            "burnout_label": label,
            "recommendation": "Keep tracking your workload and reach out to your manager if your stress levels remain elevated.",
        }

    prompt = (
        "You are an empathetic workplace health assistant. Given five integer check-in scores from 1 to 5, "
        "return JSON only with keys `burnout_label` and `recommendation`. `burnout_label` must be one of `low`, "
        "`moderate`, or `high`. `recommendation` must be a single sentence and should be supportive."
        f"\n\nScores:\nMood: {scores['mood_score']}\nWorkload: {scores['workload_score']}\nSleep: {scores['sleep_score']}"
        f"\nPsychological safety: {scores['safety_score']}\nTeam support: {scores['support_score']}"
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
        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
            label = parsed.get("burnout_label", "moderate")
            recommendation = parsed.get("recommendation", "Take a break and speak with your team lead if you continue to feel overwhelmed.")
            return {"burnout_label": label, "recommendation": recommendation}
        except json.JSONDecodeError:
            return {
                "burnout_label": "moderate",
                "recommendation": "Your responses suggest a mixed week; consider checking in with your support network and reviewing your workload.",
            }
