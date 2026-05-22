import json
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction


async def write_audit_log(
    db: AsyncSession,
    *,
    actor_id: Optional[UUID],
    action: AuditAction,
    target_type: str,
    target_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> None:
    row = AuditLog(
        actor_id=actor_id,
        action=action.value if hasattr(action, "value") else str(action),
        target_type=target_type,
        target_id=target_id,
        ip_address=ip_address,
        event_meta=json.dumps(metadata) if metadata else None,
    )
    db.add(row)
    await db.flush()
