from sqlalchemy import Column, String, Float, DateTime, JSON, Text, ForeignKey, Boolean, Integer, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
import enum
from app.core.database import Base


class AlertType(str, enum.Enum):
    SENTIMENT_DROP = "sentiment_drop"
    MENTION_SPIKE = "mention_spike"
    NEGATIVE_SURGE = "negative_surge"
    KEYWORD_ALERT = "keyword_alert"
    PLATFORM_DOWN = "platform_down"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    alert_type = Column(SAEnum(AlertType), nullable=False)
    severity = Column(SAEnum(AlertSeverity), default=AlertSeverity.MEDIUM)

    threshold_value = Column(Float, nullable=True)
    threshold_window_hours = Column(Integer, default=24)
    platforms = Column(JSON, default=list)

    notify_email = Column(String(500), nullable=True)
    notify_webhook = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    brand = relationship("Brand", back_populates="alerts")
    events = relationship("AlertEvent", back_populates="alert", cascade="all, delete-orphan")


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)

    message = Column(Text, nullable=False)
    data = Column(JSON, default=dict)
    resolved = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    alert = relationship("Alert", back_populates="events")
