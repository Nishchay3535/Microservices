"""Idempotent demo accounts for local / SQLite environments."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User

DEMO_USERS: tuple[tuple[str, str, str], ...] = (
    ("authority@demo.local", "Authority User", UserRole.authority.value),
    ("mentor@demo.local", "Mentor User", UserRole.mentor.value),
    ("admin@demo.local", "Admin User", UserRole.admin.value),
)


async def upsert_demo_users(db: AsyncSession) -> None:
    """Create or refresh known demo users (password demo12345, roles as listed)."""
    for email, name, role in DEMO_USERS:
        res = await db.execute(select(User).where(User.email == email))
        existing = res.scalar_one_or_none()
        pw = hash_password("demo12345")
        if existing:
            existing.hashed_password = pw
            existing.full_name = name
            existing.role = role
            if existing.department is None:
                existing.department = "HQ"
            if existing.position is None:
                existing.position = role.title()
        else:
            db.add(
                User(
                    email=email,
                    full_name=name,
                    hashed_password=pw,
                    role=role,
                    department="HQ",
                    position=role.title(),
                )
            )
    await db.commit()
