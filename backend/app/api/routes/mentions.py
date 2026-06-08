from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
import uuid
import math
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_org
from app.models.brand import Brand
from app.models.mention import Mention, Platform, SentimentLabel
from app.schemas.mention import MentionOut, MentionPage

router = APIRouter()


@router.get("/", response_model=MentionPage)
async def list_mentions(
    brand_id: Optional[uuid.UUID] = None,
    platform: Optional[Platform] = None,
    sentiment: Optional[SentimentLabel] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    keyword: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    # Scope to org's brands
    org_brand_ids = (await db.execute(
        select(Brand.id).where(Brand.org_id == current_org.id)
    )).scalars().all()

    filters = [Mention.brand_id.in_(org_brand_ids)]
    if brand_id:
        filters.append(Mention.brand_id == brand_id)
    if platform:
        filters.append(Mention.platform == platform)
    if sentiment:
        filters.append(Mention.sentiment_label == sentiment)
    if start_date:
        filters.append(Mention.created_at >= start_date)
    if end_date:
        filters.append(Mention.created_at <= end_date)
    if keyword:
        kw = f"%{keyword}%"
        filters.append(or_(Mention.title.ilike(kw), Mention.content.ilike(kw), Mention.author.ilike(kw)))

    where = and_(*filters)
    total = (await db.execute(select(func.count(Mention.id)).where(where))).scalar() or 0
    items = (await db.execute(
        select(Mention).where(where).order_by(Mention.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()

    return MentionPage(items=items, total=total, page=page, page_size=page_size, pages=math.ceil(total / page_size) if total else 0)


@router.get("/{mention_id}", response_model=MentionOut)
async def get_mention(
    mention_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    mention = await db.get(Mention, mention_id)
    if not mention:
        raise HTTPException(status_code=404, detail="Mention not found")
    brand = await db.get(Brand, mention.brand_id)
    if not brand or brand.org_id != current_org.id:
        raise HTTPException(status_code=404, detail="Mention not found")
    return mention
