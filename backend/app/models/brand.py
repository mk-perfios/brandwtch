from sqlalchemy import Column, String, Boolean, DateTime, JSON, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid
from app.core.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    keywords = Column(JSON, default=list)
    twitter_handle = Column(String(100), nullable=True)
    reddit_username = Column(String(100), nullable=True)
    youtube_channel_id = Column(String(100), nullable=True)
    enabled_platforms = Column(JSON, default=list)

    crawl_interval_minutes = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)

    color = Column(String(7), default="#6366f1")
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_crawled_at = Column(DateTime(timezone=True), nullable=True)

    org = relationship("Organization", back_populates="brands")
    mentions = relationship("Mention", back_populates="brand", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="brand", cascade="all, delete-orphan")
