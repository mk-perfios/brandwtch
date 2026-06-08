from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.core.database import get_db
from app.core.deps import get_current_org
from app.models.alert import Alert, AlertEvent
from app.models.brand import Brand
from app.schemas.alert import AlertCreate, AlertUpdate, AlertOut, AlertEventOut

router = APIRouter()


@router.get("/", response_model=List[AlertOut])
async def list_alerts(
    brand_id: uuid.UUID | None = None,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    org_brand_ids = (await db.execute(select(Brand.id).where(Brand.org_id == current_org.id))).scalars().all()
    q = select(Alert).where(Alert.brand_id.in_(org_brand_ids)).order_by(Alert.created_at.desc())
    if brand_id:
        q = q.where(Alert.brand_id == brand_id)
    return (await db.execute(q)).scalars().all()


@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    brand = await db.get(Brand, data.brand_id)
    if not brand or brand.org_id != current_org.id:
        raise HTTPException(status_code=404, detail="Brand not found")
    alert = Alert(**data.model_dump())
    db.add(alert)
    await db.flush()
    await db.refresh(alert)
    return alert


@router.patch("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: uuid.UUID,
    data: AlertUpdate,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    alert = await _get_alert_or_404(db, alert_id, current_org.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(alert, field, value)
    await db.flush()
    await db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    alert = await _get_alert_or_404(db, alert_id, current_org.id)
    await db.delete(alert)


@router.get("/{alert_id}/events", response_model=List[AlertEventOut])
async def get_events(
    alert_id: uuid.UUID,
    current_org=Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    await _get_alert_or_404(db, alert_id, current_org.id)
    result = await db.execute(
        select(AlertEvent).where(AlertEvent.alert_id == alert_id).order_by(AlertEvent.triggered_at.desc()).limit(50)
    )
    return result.scalars().all()


async def _get_alert_or_404(db, alert_id, org_id):
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    brand = await db.get(Brand, alert.brand_id)
    if not brand or brand.org_id != org_id:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
