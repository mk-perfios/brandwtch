import asyncio
import logging
from datetime import datetime, timezone, timedelta

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.alert_tasks.check_all_alerts", bind=True, max_retries=3)
def check_all_alerts(self):
    try:
        asyncio.run(_check_all())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


async def _check_all():
    from app.core.database import AsyncSessionLocal
    from app.models.alert import Alert, AlertEvent
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        alerts = (await db.execute(select(Alert).where(Alert.is_active == True))).scalars().all()

        for alert in alerts:
            try:
                msg = await _evaluate(db, alert)
                if msg:
                    db.add(AlertEvent(alert_id=alert.id, message=msg, data={"evaluated_at": datetime.now(timezone.utc).isoformat()}))
                    logger.info(f"Alert fired: {alert.name} — {msg}")
            except Exception as e:
                logger.exception(f"Alert eval error {alert.id}: {e}")

        await db.commit()


async def _evaluate(db, alert) -> str | None:
    from app.models.alert import AlertType
    from app.models.mention import Mention, SentimentLabel
    from sqlalchemy import select, func, and_

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=alert.threshold_window_hours)
    base = and_(Mention.brand_id == alert.brand_id, Mention.created_at >= window_start)

    if alert.alert_type == AlertType.SENTIMENT_DROP:
        avg = (await db.execute(select(func.avg(Mention.sentiment_score)).where(and_(base, Mention.sentiment_score.isnot(None))))).scalar()
        threshold = alert.threshold_value if alert.threshold_value is not None else -0.3
        if avg is not None and avg < threshold:
            return f"Avg sentiment {avg:.3f} dropped below threshold {threshold} over the last {alert.threshold_window_hours}h"

    elif alert.alert_type == AlertType.MENTION_SPIKE:
        count = (await db.execute(select(func.count(Mention.id)).where(base))).scalar() or 0
        threshold = alert.threshold_value or 100
        if count > threshold:
            return f"Mention spike: {count} mentions in {alert.threshold_window_hours}h (threshold: {threshold})"

    elif alert.alert_type == AlertType.NEGATIVE_SURGE:
        total = (await db.execute(select(func.count(Mention.id)).where(base))).scalar() or 0
        neg = (await db.execute(select(func.count(Mention.id)).where(and_(base, Mention.sentiment_label == SentimentLabel.NEGATIVE)))).scalar() or 0
        pct = neg / total * 100 if total else 0
        threshold = alert.threshold_value or 40
        if pct > threshold:
            return f"Negative surge: {pct:.1f}% negative ({neg}/{total}) in {alert.threshold_window_hours}h"

    return None
