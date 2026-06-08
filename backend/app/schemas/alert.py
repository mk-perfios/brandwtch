from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.models.alert import AlertType, AlertSeverity


class AlertCreate(BaseModel):
    brand_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    threshold_value: Optional[float] = None
    threshold_window_hours: int = Field(default=24, ge=1, le=168)
    platforms: List[str] = Field(default_factory=list)
    notify_email: Optional[str] = None
    notify_webhook: Optional[str] = None


class AlertUpdate(BaseModel):
    name: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    threshold_value: Optional[float] = None
    threshold_window_hours: Optional[int] = None
    platforms: Optional[List[str]] = None
    notify_email: Optional[str] = None
    notify_webhook: Optional[str] = None
    is_active: Optional[bool] = None


class AlertOut(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    name: str
    alert_type: AlertType
    severity: AlertSeverity
    threshold_value: Optional[float]
    threshold_window_hours: int
    platforms: List[str]
    notify_email: Optional[str]
    notify_webhook: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AlertEventOut(BaseModel):
    id: uuid.UUID
    alert_id: uuid.UUID
    message: str
    data: Dict[str, Any]
    resolved: bool
    triggered_at: datetime
    resolved_at: Optional[datetime]

    model_config = {"from_attributes": True}
