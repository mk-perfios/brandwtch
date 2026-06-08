import asyncio
import logging
import uuid as _uuid
from datetime import datetime, timezone
from typing import List, Optional

from app.tasks.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

PLATFORM_MAP = {
    "reddit": "REDDIT", "twitter": "TWITTER", "google": "GOOGLE",
    "quora": "QUORA", "hacker_news": "HACKER_NEWS", "youtube": "YOUTUBE",
    "news": "NEWS", "ai_claude": "AI_CLAUDE", "ai_chatgpt": "AI_CHATGPT",
    "ai_gemini": "AI_GEMINI", "ai_perplexity": "AI_PERPLEXITY",
    "ai_content": "AI_CONTENT",
}


@celery_app.task(name="app.tasks.monitor_tasks.crawl_all_brands", bind=True, max_retries=3)
def crawl_all_brands(self):
    try:
        asyncio.run(_crawl_all())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.monitor_tasks.crawl_brand", bind=True, max_retries=3)
def crawl_brand(self, brand_id: str, platforms: Optional[List[str]] = None):
    try:
        asyncio.run(run_brand_monitoring(brand_id, platforms))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


async def _crawl_all():
    from app.core.database import AsyncSessionLocal
    from app.models.brand import Brand
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        brands = (await db.execute(select(Brand).where(Brand.is_active == True))).scalars().all()

    for brand in brands:
        await run_brand_monitoring(str(brand.id), brand.enabled_platforms)


async def run_brand_monitoring(brand_id: str, platforms: Optional[List[str]] = None):
    from app.core.database import AsyncSessionLocal
    from app.models.brand import Brand
    from app.models.mention import Mention, Platform as PlatformEnum, SentimentLabel
    from app.services.crawlers import get_crawler
    from app.services.sentiment_analyzer import analyze_text
    from sqlalchemy import select, and_

    async with AsyncSessionLocal() as db:
        brand = await db.get(Brand, _uuid.UUID(brand_id))
        if not brand:
            return

        keywords = brand.keywords or [brand.name]
        enabled = platforms or brand.enabled_platforms

        for platform_name in enabled:
            crawler = get_crawler(platform_name)
            if not crawler or not crawler.is_configured():
                continue

            try:
                raw_mentions = await crawler.crawl(keywords, max_results=settings.MAX_MENTIONS_PER_CRAWL)
            except Exception as e:
                logger.exception(f"[{brand.name}] {platform_name} crawler error: {e}")
                continue

            new_count = 0
            for raw in raw_mentions:
                # Deduplicate
                if raw.external_id:
                    p_enum = _resolve(raw.platform)
                    if p_enum is None:
                        continue
                    dup = (await db.execute(
                        select(Mention).where(and_(
                            Mention.brand_id == brand.id,
                            Mention.external_id == raw.external_id,
                            Mention.platform == p_enum,
                        ))
                    )).scalar_one_or_none()
                    if dup:
                        continue

                p_enum = _resolve(raw.platform)
                if p_enum is None:
                    continue

                text = " ".join(filter(None, [raw.title, raw.content]))
                sentiment = analyze_text(text) if text.strip() else None

                s_label = None
                if sentiment:
                    s_label = {
                        "positive": SentimentLabel.POSITIVE,
                        "negative": SentimentLabel.NEGATIVE,
                        "neutral": SentimentLabel.NEUTRAL,
                    }.get(sentiment.label)

                mention = Mention(
                    brand_id=brand.id,
                    platform=p_enum,
                    external_id=raw.external_id,
                    url=raw.url,
                    title=raw.title,
                    content=raw.content,
                    author=raw.author,
                    author_url=raw.author_url,
                    upvotes=raw.upvotes,
                    comments_count=raw.comments_count,
                    shares_count=raw.shares_count,
                    views_count=raw.views_count,
                    sentiment_label=s_label,
                    sentiment_score=sentiment.score if sentiment else None,
                    sentiment_positive=sentiment.positive if sentiment else None,
                    sentiment_negative=sentiment.negative if sentiment else None,
                    sentiment_neutral=sentiment.neutral if sentiment else None,
                    matched_keywords=[kw for kw in keywords if kw.lower() in text.lower()],
                    published_at=raw.published_at,
                    ai_recommendation=raw.ai_recommendation,
                    ai_context=raw.ai_context,
                    extra_data=raw.extra_data or {},
                )
                db.add(mention)
                new_count += 1

            logger.info(f"[{brand.name}] {platform_name}: +{new_count} new mentions")

        brand.last_crawled_at = datetime.now(timezone.utc)
        await db.commit()


def _resolve(name: str):
    from app.models.mention import Platform as PlatformEnum
    mapping = {
        "reddit": PlatformEnum.REDDIT, "twitter": PlatformEnum.TWITTER,
        "google": PlatformEnum.GOOGLE, "quora": PlatformEnum.QUORA,
        "hacker_news": PlatformEnum.HACKER_NEWS, "youtube": PlatformEnum.YOUTUBE,
        "news": PlatformEnum.NEWS, "ai_claude": PlatformEnum.AI_CLAUDE,
        "ai_chatgpt": PlatformEnum.AI_CHATGPT, "ai_gemini": PlatformEnum.AI_GEMINI,
        "ai_perplexity": PlatformEnum.AI_PERPLEXITY, "ai_content": PlatformEnum.AI_CONTENT,
    }
    return mapping.get(name)
