import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.core.dependencies import get_current_user, get_db
from app.core.rate_limit import limiter
from app.models.enums import AuditAction, ReactionType
from app.models.post_reaction import PostReaction
from app.models.public_post import PublicPost
from app.models.user import User
from app.schemas.public_post import PublicPostCreate, PublicPostRead, ReactionCreate

router = APIRouter(prefix="/public-posts", tags=["public-posts"])


def _severity_from_counts(support: int, like: int, flag: int) -> float:
    return float(flag * 3 + support + like * 0.5)


@router.post("/", response_model=PublicPostRead)
@limiter.limit("10/hour")
async def create_post(
    request: Request,
    body: PublicPostCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    post = PublicPost(
        user_id=user.id,
        title=body.title,
        content=body.content,
        is_anonymous=body.is_anonymous,
        severity_score=0,
        reaction_count=0,
        created_at=now,
        updated_at=now,
    )
    db.add(post)
    await db.flush()
    await write_audit_log(
        db, actor_id=user.id, action=AuditAction.post_create, target_type="public_post", target_id=post.id
    )
    await db.commit()
    await db.refresh(post)
    label = None if post.is_anonymous else user.full_name
    return PublicPostRead(
        id=post.id,
        title=post.title,
        content=post.content,
        is_anonymous=post.is_anonymous,
        severity_score=post.severity_score,
        reaction_count=post.reaction_count,
        created_at=post.created_at,
        author_label=label,
    )


@router.get("/", response_model=list[PublicPostRead])
async def list_posts(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PublicPost).order_by(PublicPost.created_at.desc()))
    posts = list(res.scalars().all())
    out: list[PublicPostRead] = []
    for p in posts:
        author = await db.get(User, p.user_id) if p.user_id else None
        label = None
        if not p.is_anonymous and author:
            label = author.full_name
        elif not p.is_anonymous and p.user_id:
            label = "Member"
        out.append(
            PublicPostRead(
                id=p.id,
                title=p.title,
                content=p.content,
                is_anonymous=p.is_anonymous,
                severity_score=p.severity_score,
                reaction_count=p.reaction_count,
                created_at=p.created_at,
                author_label=label,
            )
        )
    return out


@router.post("/{post_id}/react", status_code=204)
@limiter.limit("30/hour")
async def react(
    request: Request,
    post_id: uuid.UUID,
    body: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = await db.get(PublicPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    existing = await db.execute(
        select(PostReaction).where(PostReaction.post_id == post_id, PostReaction.user_id == user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already reacted")
    db.add(PostReaction(post_id=post_id, user_id=user.id, reaction_type=body.reaction_type))
    await db.flush()
    counts = await db.execute(
        select(PostReaction.reaction_type, func.count())
        .where(PostReaction.post_id == post_id)
        .group_by(PostReaction.reaction_type)
    )
    tallies = {row[0]: row[1] for row in counts.all()}
    support = int(tallies.get(ReactionType.support.value, 0))
    like = int(tallies.get(ReactionType.like.value, 0))
    flag = int(tallies.get(ReactionType.flag.value, 0))
    post.severity_score = _severity_from_counts(support, like, flag)
    post.reaction_count = support + like + flag
    await write_audit_log(
        db, actor_id=user.id, action=AuditAction.reaction, target_type="public_post", target_id=post_id
    )
    await db.commit()
    return None
