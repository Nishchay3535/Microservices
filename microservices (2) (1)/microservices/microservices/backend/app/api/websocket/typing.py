"""
Typing indicator relay for chat WebSockets.

Broadcasts ``{"type": "typing", "sender_id", "sender_name"}`` to every socket in
the room except the sender. ``chat.py`` delegates ``type == "typing"`` messages
here so broadcast rules stay in one place.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import WebSocket

from app.models.user import User


async def handle_typing_event(
    room_id: str,
    sender: User,
    manager: Any,
    sender_ws: WebSocket,
) -> None:
    """Notify other participants in the room that ``sender`` is typing."""
    payload = {
        "type": "typing",
        "sender_id": str(sender.id),
        "sender_name": sender.full_name,
    }
    text = json.dumps(payload)
    for client in list(manager.rooms.get(room_id, [])):
        if client is sender_ws:
            continue
        try:
            await client.send_text(text)
        except Exception:
            pass
