from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.core.deps import get_current_org
from app.models.brand import Brand

router = APIRouter()


@router.post("/run/{brand_id}")
async def trigger_monitoring(
    brand_id: uuid.UUID,
    platforms: Optional[List[str]] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await db.get(Brand, brand_id)
    if not brand or brand.org_id != current_org.id:
        raise HTTPException(status_code=404, detail="Brand not found")

    target_platforms = platforms or brand.enabled_platforms
    background_tasks.add_task(_dispatch_crawl, str(brand_id), target_platforms)

    return {
        "status": "queued",
        "brand_id": str(brand_id),
        "brand_name": brand.name,
        "platforms": target_platforms,
    }


@router.post("/run-all")
async def trigger_all(
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brands = (await db.execute(
        select(Brand).where(Brand.org_id == current_org.id, Brand.is_active == True)
    )).scalars().all()
    for brand in brands:
        background_tasks.add_task(_dispatch_crawl, str(brand.id), brand.enabled_platforms)
    return {"status": "queued", "brands_count": len(brands)}


@router.get("/status")
async def monitoring_status(current_org=Depends(get_current_org), db: AsyncSession = Depends(get_db)):
    brands = (await db.execute(
        select(Brand).where(Brand.org_id == current_org.id, Brand.is_active == True)
    )).scalars().all()
    return {
        "active_brands": len(brands),
        "brands": [
            {
                "id": str(b.id),
                "name": b.name,
                "last_crawled_at": b.last_crawled_at.isoformat() if b.last_crawled_at else None,
                "crawl_interval_minutes": b.crawl_interval_minutes,
                "enabled_platforms": b.enabled_platforms,
            }
            for b in brands
        ],
    }


async def _dispatch_crawl(brand_id: str, platforms: List[str]):
    try:
        from app.tasks.monitor_tasks import crawl_brand
        crawl_brand.delay(brand_id, platforms)
    except Exception:
        from app.tasks.monitor_tasks import run_brand_monitoring
        await run_brand_monitoring(brand_id, platforms)
