import logging
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> None:
    settings = get_settings()
    if settings.RESEND_API_KEY:
        try:
            import httpx

            async with httpx.AsyncClient() as client:
                await client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                    json={
                        "from": settings.EMAIL_FROM,
                        "to": [to],
                        "subject": subject,
                        "text": body,
                    },
                    timeout=15.0,
                )
        except Exception as e:  # pragma: no cover
            logger.warning("Resend email failed: %s", e)
    else:
        logger.info("[email mock] to=%s subject=%s\n%s", to, subject, body)
