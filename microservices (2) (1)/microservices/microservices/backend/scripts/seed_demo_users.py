"""
Create demo authority, mentor, and admin users (run from backend folder).

Same pattern for each role: {role}@demo.local with password demo12345 (not public /register).

Usage:
  set DATABASE_URL=sqlite+aiosqlite:///./healthequity.db
  python scripts/seed_demo_users.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal, init_db
from app.services.demo_users import DEMO_USERS, upsert_demo_users


async def main() -> None:
    await init_db()
    async with SessionLocal() as db:
        await upsert_demo_users(db)
    print("Upserted users:")
    for email, _, role, _ in DEMO_USERS:
        print(f" - {email} ({role})")


if __name__ == "__main__":
    asyncio.run(main())
