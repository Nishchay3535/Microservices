import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.chat_room import ChatRoom
from app.models.enums import RoomType, UserRole
from app.models.message import Message
from app.models.user import User


class ChatRoomRead(BaseModel):
    id: uuid.UUID
    room_type: str
    employee_id: uuid.UUID
    participant_id: uuid.UUID

    model_config = {"from_attributes": True}


class RoomEnsureBody(BaseModel):
    room_type: RoomType
    other_user_id: uuid.UUID


router = APIRouter(prefix="/chat", tags=["chat"])


async def _latest_message_at(db: AsyncSession, room_id: uuid.UUID) -> Optional[datetime]:
    result = await db.execute(
        select(Message.created_at).where(Message.room_id == room_id).order_by(Message.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


async def _best_existing_room(db: AsyncSession, rooms: list[ChatRoom]) -> Optional[ChatRoom]:
    best_room = None
    best_time = None
    for room in rooms:
        last_message_at = await _latest_message_at(db, room.id)
        room_time = last_message_at or room.updated_at or room.created_at
        if best_time is None or room_time > best_time:
            best_room = room
            best_time = room_time
    return best_room


@router.post("/rooms", response_model=ChatRoomRead)
async def ensure_room(
    body: RoomEnsureBody,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    other = await db.get(User, body.other_user_id)
    if not other or other.deleted_at is not None:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == UserRole.employee.value:
        employee_id, participant_id = user.id, body.other_user_id
        if body.room_type == RoomType.authority and other.role != UserRole.authority.value:
            raise HTTPException(status_code=400, detail="Other user must be authority")
        if body.room_type == RoomType.mentor and other.role != UserRole.mentor.value:
            raise HTTPException(status_code=400, detail="Other user must be mentor")
    elif user.role == UserRole.authority.value and body.room_type == RoomType.authority:
        employee_id, participant_id = body.other_user_id, user.id
        if other.role != UserRole.employee.value:
            raise HTTPException(status_code=400, detail="Other user must be employee")
    elif user.role == UserRole.mentor.value and body.room_type == RoomType.mentor:
        employee_id, participant_id = body.other_user_id, user.id
        if other.role != UserRole.employee.value:
            raise HTTPException(status_code=400, detail="Other user must be employee")
    else:
        raise HTTPException(status_code=403, detail="Cannot open this room")

    if user.role == UserRole.employee.value:
        duplicate_participants = await db.execute(
            select(User.id).where(
                User.role == other.role,
                User.full_name == other.full_name,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        duplicate_ids = [row[0] for row in duplicate_participants.all()]
        if duplicate_ids:
            duplicate_room = await db.execute(
                select(ChatRoom).where(
                    ChatRoom.room_type == body.room_type.value,
                    ChatRoom.employee_id == employee_id,
                    ChatRoom.participant_id.in_(duplicate_ids),
                )
            )
            existing_duplicate_room = await _best_existing_room(db, list(duplicate_room.scalars().all()))
            if existing_duplicate_room:
                return existing_duplicate_room

    res = await db.execute(
        select(ChatRoom).where(
            ChatRoom.room_type == body.room_type.value,
            ChatRoom.employee_id == employee_id,
            ChatRoom.participant_id == participant_id,
        )
    )
    existing = res.scalar_one_or_none()
    if existing:
        return existing

    now = datetime.now(timezone.utc)
    room = ChatRoom(
        room_type=body.room_type.value,
        employee_id=employee_id,
        participant_id=participant_id,
        created_at=now,
        updated_at=now,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room

class ChatRoomWithParticipant(BaseModel):
    id: uuid.UUID
    room_type: str
    employee_id: uuid.UUID
    participant_id: uuid.UUID
    employee_name: str
    participant_name: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_sender_id: Optional[uuid.UUID] = None
    last_sender_name: Optional[str] = None

    model_config = {"from_attributes": True}


@router.get("/rooms", response_model=list[ChatRoomWithParticipant])
async def list_rooms(
    room_type: Optional[RoomType] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == UserRole.employee.value:
        query = select(ChatRoom).where(ChatRoom.employee_id == user.id)
    else:
        equivalent_users = await db.execute(
            select(User.id).where(
                User.role == user.role,
                User.full_name == user.full_name,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        equivalent_ids = [row[0] for row in equivalent_users.all()]
        query = select(ChatRoom).where(ChatRoom.participant_id.in_(equivalent_ids or [user.id]))
    if room_type is not None:
        query = query.where(ChatRoom.room_type == room_type.value)

    res = await db.execute(query.order_by(ChatRoom.updated_at.desc().nullslast(), ChatRoom.created_at.desc()))
    rooms = res.scalars().all()
    result = []
    for room in rooms:
        emp = await db.get(User, room.employee_id)
        part = await db.get(User, room.participant_id)
        last_res = await db.execute(
            select(Message, User)
            .join(User, Message.sender_id == User.id)
            .where(Message.room_id == room.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last = last_res.first()
        last_message = last[0] if last else None
        last_sender = last[1] if last else None
        result.append(ChatRoomWithParticipant(
            id=room.id,
            room_type=room.room_type,
            employee_id=room.employee_id,
            participant_id=room.participant_id,
            employee_name=emp.full_name if emp else "Employee",
            participant_name=part.full_name if part else "Participant",
            last_message=last_message.content if last_message else None,
            last_message_at=last_message.created_at if last_message else None,
            last_sender_id=last_message.sender_id if last_message else None,
            last_sender_name=last_sender.full_name if last_sender else None,
        ))
    sorted_result = sorted(
        result,
        key=lambda item: item.last_message_at.timestamp() if item.last_message_at else 0,
        reverse=True,
    )

    deduped: dict[str, ChatRoomWithParticipant] = {}
    for item in sorted_result:
        key = (
            f"employee:{item.room_type}:{item.participant_name.casefold()}"
            if user.role == UserRole.employee.value
            else f"participant:{item.room_type}:{item.employee_id}"
        )
        if key not in deduped:
            deduped[key] = item
    return list(deduped.values())


@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(
    room_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room = await db.get(ChatRoom, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")

    if user.role == UserRole.employee.value:
        if room.employee_id != user.id:
            raise HTTPException(status_code=403, detail="Cannot delete this chat")
    elif user.role in (UserRole.authority.value, UserRole.mentor.value):
        equivalent_users = await db.execute(
            select(User.id).where(
                User.role == user.role,
                User.full_name == user.full_name,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        equivalent_ids = [row[0] for row in equivalent_users.all()]
        if room.participant_id not in equivalent_ids:
            raise HTTPException(status_code=403, detail="Cannot delete this chat")
    else:
        raise HTTPException(status_code=403, detail="Cannot delete this chat")

    await db.delete(room)
    await db.commit()
