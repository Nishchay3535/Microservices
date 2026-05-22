import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.auth import UserPublic
from app.services import storage_service

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None


def _dedupe_role_users(users: list[User]) -> list[User]:
    by_name: dict[str, User] = {}
    for item in users:
        key = item.full_name.strip().casefold()
        current = by_name.get(key)
        if current is None:
            by_name[key] = item
            continue
        current_is_demo = current.email.endswith("@demo.local")
        item_is_demo = item.email.endswith("@demo.local")
        if current_is_demo and not item_is_demo:
            by_name[key] = item
    return list(by_name.values())


@router.get("/me", response_model=UserPublic)
async def users_me(user: User = Depends(get_current_user)):
    return user


@router.post("/me/avatar")
async def upload_profile_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    url = await storage_service.upload_attachment(file.filename or "avatar", raw, file.content_type or "application/octet-stream")
    user.avatar_url = url
    await db.commit()
    await db.refresh(user)
    return {"url": url}


@router.put("/me", response_model=UserPublic)
async def users_me_update(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.department is not None:
        user.department = body.department
    if body.position is not None:
        user.position = body.position
    if body.gender is not None:
        user.gender = body.gender
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/mentors", response_model=list[UserPublic])
async def list_mentors(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(
        select(User).where(User.role == UserRole.mentor.value, User.deleted_at.is_(None), User.is_active.is_(True))
    )
    return _dedupe_role_users(list(res.scalars().all()))


@router.get("/authorities", response_model=list[UserPublic])
async def list_authorities(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    res = await db.execute(
        select(User).where(
            User.role == UserRole.authority.value, User.deleted_at.is_(None), User.is_active.is_(True)
        )
    )
    return _dedupe_role_users(list(res.scalars().all()))
