from collections.abc import AsyncGenerator

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def add_avatar_column(sync_conn):
            inspector = inspect(sync_conn)
            if "users" in inspector.get_table_names():
                existing_columns = [column["name"] for column in inspector.get_columns("users")]
                if "avatar_url" not in existing_columns:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)"))

        await conn.run_sync(add_avatar_column)
