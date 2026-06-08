from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from collections import Counter
import uuid
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.deps import get_current_org
from app.models.brand import Brand
from app.models.mention import Mention, SentimentLabel
from app.schemas.analytics import (
    AnalyticsDashboard, OverviewStats, TimeSeriesPoint,
    PlatformBreakdown, SentimentSummary, TopMention,
)

router = APIRouter()


@router.get("/overview", response_model=OverviewStats)
async def get_overview(current_org=Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    org_brand_ids = (await db.execute(select(Brand.id).where(Brand.org_id == current_org.id))).scalars().all()

    total_brands = len(org_brand_ids)
    base = Mention.brand_id.in_(org_brand_ids)
    total_mentions = (await db.execute(select(func.count(Mention.id)).where(base))).scalar() or 0
    mentions_today = (await db.execute(select(func.count(Mention.id)).where(and_(base, Mention.created_at >= now - timedelta(days=1))))).scalar() or 0
    avg_sentiment = float((await db.execute(select(func.avg(Mention.sentiment_score)).where(base))).scalar() or 0.0)

    most_mentioned = (await db.execute(
        select(Brand.name, func.count(Mention.id).label("cnt"))
        .join(Mention, Mention.brand_id == Brand.id)
        .where(Brand.org_id == current_org.id)
        .group_by(Brand.name).order_by(func.count(Mention.id).desc()).limit(1)
    )).first()

    most_negative = (await db.execute(
        select(Brand.name, func.avg(Mention.sentiment_score).label("avg_s"))
        .join(Mention, Mention.brand_id == Brand.id)
        .where(Brand.org_id == current_org.id)
        .group_by(Brand.name).order_by(func.avg(Mention.sentiment_score).asc()).limit(1)
    )).first()

    return OverviewStats(
        total_brands=total_brands,
        total_mentions=total_mentions,
        mentions_today=mentions_today,
        avg_sentiment=round(avg_sentiment, 3),
        most_mentioned_brand=most_mentioned[0] if most_mentioned else None,
        most_negative_brand=most_negative[0] if most_negative else None,
    )


@router.get("/{brand_id}", response_model=AnalyticsDashboard)
async def get_brand_analytics(
    brand_id: uuid.UUID,
    days: int = Query(default=30, ge=1, le=365),
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await db.get(Brand, brand_id)
    if not brand or brand.org_id != current_org.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Brand not found")

    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)
    base = and_(Mention.brand_id == brand_id, Mention.created_at >= start)

    total = (await db.execute(select(func.count(Mention.id)).where(base))).scalar() or 0
    avg_s = float((await db.execute(select(func.avg(Mention.sentiment_score)).where(base))).scalar() or 0.0)

    sc = {r[0]: r[1] for r in (await db.execute(
        select(Mention.sentiment_label, func.count(Mention.id)).where(base).group_by(Mention.sentiment_label)
    )).all()}
    pos = sc.get(SentimentLabel.POSITIVE, 0)
    neg = sc.get(SentimentLabel.NEGATIVE, 0)
    neu = sc.get(SentimentLabel.NEUTRAL, 0) + sc.get(SentimentLabel.MIXED, 0)

    prev_avg = float((await db.execute(
        select(func.avg(Mention.sentiment_score)).where(and_(
            Mention.brand_id == brand_id,
            Mention.created_at >= now - timedelta(days=days * 2),
            Mention.created_at < start,
        ))
    )).scalar() or 0.0)

    # Time series
    daily_rows = (await db.execute(
        select(
            func.date_trunc("day", Mention.created_at).label("day"),
            func.count(Mention.id).label("total"),
            func.avg(Mention.sentiment_score).label("avg_s"),
        ).where(base).group_by(text("day")).order_by(text("day"))
    )).all()
    time_series = [
        TimeSeriesPoint(
            date=r.day.strftime("%Y-%m-%d"),
            total=int(r.total),
            positive=0, negative=0, neutral=int(r.total),
            avg_sentiment=round(float(r.avg_s or 0), 3),
        )
        for r in daily_rows
    ]

    # Platform breakdown
    platform_rows = (await db.execute(
        select(Mention.platform, func.count(Mention.id).label("cnt"), func.avg(Mention.sentiment_score).label("avg_s"))
        .where(base).group_by(Mention.platform).order_by(func.count(Mention.id).desc())
    )).all()

    platform_breakdown = [
        PlatformBreakdown(
            platform=r.platform.value,
            total_mentions=int(r.cnt),
            positive=0, negative=0, neutral=int(r.cnt),
            avg_sentiment=round(float(r.avg_s or 0), 3),
            percentage=round(int(r.cnt) / total * 100, 1) if total else 0,
        )
        for r in platform_rows
    ]

    # Top mentions
    top_pos = (await db.execute(
        select(Mention).where(and_(base, Mention.sentiment_label == SentimentLabel.POSITIVE))
        .order_by(Mention.upvotes.desc(), Mention.sentiment_score.desc()).limit(5)
    )).scalars().all()

    top_neg = (await db.execute(
        select(Mention).where(and_(base, Mention.sentiment_label == SentimentLabel.NEGATIVE))
        .order_by(Mention.upvotes.desc(), Mention.sentiment_score.asc()).limit(5)
    )).scalars().all()

    def _to_top(m):
        return TopMention(
            id=m.id, platform=m.platform.value, title=m.title,
            content=m.content[:200] if m.content else None,
            url=m.url, sentiment_score=m.sentiment_score,
            sentiment_label=m.sentiment_label.value if m.sentiment_label else None,
            upvotes=m.upvotes, published_at=m.published_at,
        )

    # Trending keywords
    kws = (await db.execute(select(Mention.matched_keywords).where(base))).scalars().all()
    kw_counter: Counter = Counter()
    for kw_list in kws:
        if isinstance(kw_list, list):
            kw_counter.update(kw_list)

    return AnalyticsDashboard(
        brand_id=brand_id,
        period_days=days,
        summary=SentimentSummary(total_mentions=total, positive=pos, negative=neg, neutral=neu, avg_sentiment=round(avg_s, 3), sentiment_trend=round(avg_s - prev_avg, 3)),
        time_series=time_series,
        platform_breakdown=platform_breakdown,
        top_positive=[_to_top(m) for m in top_pos],
        top_negative=[_to_top(m) for m in top_neg],
        trending_keywords=[{"keyword": k, "count": v} for k, v in kw_counter.most_common(20)],
    )
