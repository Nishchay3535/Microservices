from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import achievements, admin, ai, ai_chat, ai_authority_assist, auth, chat_rooms, checkins, escalations, gdpr, issues, kudos, mentorship, notifications, polls, public_posts, resources, session_notes, users
from app.api.websocket import chat as ws_chat
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.session import SessionLocal, init_db
from app.services.demo_users import upsert_demo_users

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=prefix)
app.include_router(users.router, prefix=prefix)
app.include_router(issues.router, prefix=prefix)
app.include_router(public_posts.router, prefix=prefix)
app.include_router(achievements.router, prefix=prefix)
app.include_router(mentorship.router, prefix=prefix)
app.include_router(notifications.router, prefix=prefix)
app.include_router(ai.router, prefix=prefix)
app.include_router(admin.router, prefix=prefix)
app.include_router(gdpr.router, prefix=prefix)
app.include_router(chat_rooms.router, prefix=prefix)
app.include_router(checkins.router, prefix=prefix)
app.include_router(kudos.router, prefix=prefix)
app.include_router(polls.router, prefix=prefix)
app.include_router(escalations.router, prefix=prefix)
app.include_router(resources.router, prefix=prefix)
app.include_router(session_notes.router, prefix=prefix)
app.include_router(ai_chat.router, prefix=prefix)
app.include_router(ai_authority_assist.router, prefix=prefix)
app.include_router(ws_chat.router)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()
    # Docker / default local DB is SQLite; ensure demo mentor exists without a manual seed step.
    if "sqlite" in settings.DATABASE_URL.lower():
        async with SessionLocal() as db:
            await upsert_demo_users(db)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
