import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_org
from app.models.brand import Brand
from app.models.mention import Mention, SentimentLabel
from app.schemas.brand import BrandCreate, BrandUpdate, BrandOut, BrandStats

router = APIRouter()


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug


@router.get("/", response_model=List[BrandOut])
async def list_brands(
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Brand).where(Brand.org_id == current_org.id).order_by(Brand.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
async def create_brand(
    data: BrandCreate,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    slug = _slugify(data.name)
    existing = await db.execute(
        select(Brand).where(Brand.org_id == current_org.id, Brand.slug == slug)
    )
    if existing.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    brand = Brand(org_id=current_org.id, slug=slug, **data.model_dump())
    db.add(brand)
    await db.flush()
    await db.refresh(brand)
    return brand


@router.get("/{brand_id}", response_model=BrandOut)
async def get_brand(
    brand_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await _get_brand_or_404(db, brand_id, current_org.id)
    return brand


@router.patch("/{brand_id}", response_model=BrandOut)
async def update_brand(
    brand_id: uuid.UUID,
    data: BrandUpdate,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await _get_brand_or_404(db, brand_id, current_org.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(brand, field, value)
    brand.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(brand)
    return brand


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
    brand_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await _get_brand_or_404(db, brand_id, current_org.id)
    await db.delete(brand)


@router.get("/{brand_id}/stats", response_model=BrandStats)
async def get_brand_stats(
    brand_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await _get_brand_or_404(db, brand_id, current_org.id)
    now = datetime.now(timezone.utc)

    total = (await db.execute(select(func.count(Mention.id)).where(Mention.brand_id == brand_id))).scalar() or 0
    m24h = (await db.execute(select(func.count(Mention.id)).where(and_(Mention.brand_id == brand_id, Mention.created_at >= now - timedelta(hours=24))))).scalar() or 0
    m7d = (await db.execute(select(func.count(Mention.id)).where(and_(Mention.brand_id == brand_id, Mention.created_at >= now - timedelta(days=7))))).scalar() or 0
    avg_s = float((await db.execute(select(func.avg(Mention.sentiment_score)).where(and_(Mention.brand_id == brand_id, Mention.sentiment_score.isnot(None))))).scalar() or 0.0)

    prev_avg = float((await db.execute(
        select(func.avg(Mention.sentiment_score)).where(
            and_(Mention.brand_id == brand_id, Mention.created_at >= now - timedelta(days=14), Mention.created_at < now - timedelta(days=7), Mention.sentiment_score.isnot(None))
        )
    )).scalar() or 0.0)

    sc = {r[0]: r[1] for r in (await db.execute(
        select(Mention.sentiment_label, func.count(Mention.id)).where(Mention.brand_id == brand_id).group_by(Mention.sentiment_label)
    )).all()}
    pos = sc.get(SentimentLabel.POSITIVE, 0)
    neg = sc.get(SentimentLabel.NEGATIVE, 0)

    top_row = (await db.execute(
        select(Mention.platform, func.count(Mention.id).label("cnt")).where(Mention.brand_id == brand_id).group_by(Mention.platform).order_by(func.count(Mention.id).desc()).limit(1)
    )).first()

    return BrandStats(
        brand_id=brand_id,
        total_mentions=total,
        mentions_last_24h=m24h,
        mentions_last_7d=m7d,
        avg_sentiment=round(avg_s, 3),
        sentiment_trend=round(avg_s - prev_avg, 3),
        top_platform=top_row[0].value if top_row else None,
        positive_pct=round(pos / total * 100, 1) if total else 0,
        negative_pct=round(neg / total * 100, 1) if total else 0,
        neutral_pct=round((total - pos - neg) / total * 100, 1) if total else 0,
    )


async def _get_brand_or_404(db, brand_id, org_id):
    brand = await db.get(Brand, brand_id)
    if not brand or brand.org_id != org_id:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand
