import logging
import uuid
from typing import Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def upload_attachment(filename: str, content: bytes, content_type: str) -> Optional[str]:
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        logger.info("[storage mock] would upload %s (%d bytes)", filename, len(content))
        return f"https://mock.local/attachments/{uuid.uuid4()}/{filename}"

    path = f"{uuid.uuid4()}/{filename}"
    url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
    async with httpx.AsyncClient() as client:
        r = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                "Content-Type": content_type,
            },
            content=content,
            timeout=60.0,
        )
        r.raise_for_status()
    public = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
    return public
