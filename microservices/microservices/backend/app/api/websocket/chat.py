import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.chat_room import ChatRoom
from app.models.message import Message
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, room_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.rooms.setdefault(room_id, []).append(ws)

    def disconnect(self, room_id: str, ws: WebSocket) -> None:
        if room_id in self.rooms:
            self.rooms[room_id] = [c for c in self.rooms[room_id] if c != ws]

    async def broadcast(self, room_id: str, message: dict[str, Any]) -> None:
        for client in list(self.rooms.get(room_id, [])):
            try:
                await client.send_text(json.dumps(message))
            except Exception:
                pass


manager = ConnectionManager()


async def _can_access_room(db, user: User, room: ChatRoom) -> bool:
    if user.id in (room.employee_id, room.participant_id):
        return True
    if user.role != room.room_type:
        return False
    participant = await db.get(User, room.participant_id)
    return bool(
        participant
        and participant.role == user.role
        and participant.full_name == user.full_name
        and participant.deleted_at is None
    )


async def _get_user_from_token(token: str):
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = uuid.UUID(str(payload["jti"]))
        uid = uuid.UUID(str(payload["sub"]))
    except (JWTError, ValueError, KeyError):
        return None
    async with SessionLocal() as db:
        bl = await db.execute(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
        if bl.scalar_one_or_none():
            return None
        res = await db.execute(select(User).where(User.id == uid, User.deleted_at.is_(None)))
        return res.scalar_one_or_none()


@router.websocket("/ws/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str, token: str | None = None):
    if not token:
        await websocket.close(code=4401)
        return

    user = await _get_user_from_token(token)
    if not user:
        await websocket.close(code=4401)
        return

    try:
        rid = uuid.UUID(room_id)
        async with SessionLocal() as db:
            room = await db.get(ChatRoom, rid)
            if not room or not await _can_access_room(db, user, room):
                await websocket.close(code=4403)
                return
    except ValueError:
        await websocket.close(code=4404)
        return

    await manager.connect(room_id, websocket)

    # Send full message history on connect
    try:
        async with SessionLocal() as db:
            result = await db.execute(
                select(Message, User)
                .join(User, Message.sender_id == User.id)
                .where(Message.room_id == rid)
                .order_by(Message.created_at.asc())
            )
            rows = result.all()
            history = [
                {
                    "content": msg.content,
                    "sender_id": str(msg.sender_id),
                    "sender_name": u.full_name,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg, u in rows
            ]
        await websocket.send_text(json.dumps({"type": "history", "history": history}))
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "detail": str(e)}))
        manager.disconnect(room_id, websocket)
        return

    # Listen for messages
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "send_message":
                content = str(data.get("content", "")).strip()[:8000]
                if not content:
                    continue

                async with SessionLocal() as db:
                    rid = uuid.UUID(room_id)
                    room = await db.get(ChatRoom, rid)
                    if not room:
                        await websocket.send_text(json.dumps({"type": "error", "detail": "room not found"}))
                        continue
                    if not await _can_access_room(db, user, room):
                        await websocket.send_text(json.dumps({"type": "error", "detail": "forbidden"}))
                        continue
                    msg = Message(
                        room_id=rid,
                        sender_id=user.id,
                        content=content,
                        is_ai_generated=False,
                    )
                    db.add(msg)
                    room.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                    await db.refresh(msg)
                    sender = await db.get(User, user.id)
                    sender_name = sender.full_name if sender else ""
                    msg_id = str(msg.id)
                    msg_content = msg.content
                    msg_created = msg.created_at.isoformat()
                    msg_sender_id = str(msg.sender_id)

                await manager.broadcast(
                    room_id,
                    {
                        "type": "new_message",
                        "id": msg_id,
                        "sender_id": msg_sender_id,
                        "sender_name": sender_name,
                        "content": msg_content,
                        "created_at": msg_created,
                    },
                )

            elif data.get("type") == "typing":
                from app.api.websocket.typing import handle_typing_event

                await handle_typing_event(room_id, user, manager, websocket)
            elif data.get("type") == "mark_read":
                await manager.broadcast(room_id, {"type": "read_receipt", "reader_id": str(user.id)})

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    except Exception:
        manager.disconnect(room_id, websocket)
