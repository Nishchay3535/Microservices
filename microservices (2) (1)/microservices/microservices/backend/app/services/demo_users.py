"""Idempotent demo / seed accounts for local and hosted databases."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User

# (email, full_name, role, password)
DEMO_USERS: tuple[tuple[str, str, str, str], ...] = (
    ("authority@example.com", "Authority User", UserRole.authority.value, "demo12345"),
    ("mentor@example.com", "Mentor User", UserRole.mentor.value, "demo12345"),
    ("naveen1234@gmail.com", "Naveen", UserRole.employee.value, "Naveen@1234"),
    # Optional extra demo accounts (same password demo12345)
    ("employee@demo.local", "Employee User", UserRole.employee.value, "demo12345"),
    ("authority@demo.local", "Authority User", UserRole.authority.value, "demo12345"),
    ("mentor@demo.local", "Mentor User", UserRole.mentor.value, "demo12345"),
    ("admin@demo.local", "Admin User", UserRole.admin.value, "demo12345"),
)


async def upsert_demo_users(db: AsyncSession) -> None:
    """Create or refresh known users with the passwords defined above."""
    for email, name, role, password in DEMO_USERS:
        res = await db.execute(select(User).where(User.email == email))
        existing = res.scalar_one_or_none()
        pw = hash_password(password)
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
