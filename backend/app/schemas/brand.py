from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    twitter_handle: Optional[str] = None
    reddit_username: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    enabled_platforms: List[str] = Field(default_factory=lambda: [
        "reddit", "twitter", "google", "hacker_news", "news"
    ])
    crawl_interval_minutes: int = Field(default=60, ge=15, le=1440)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9A-Fa-f]{6}$")
    website_url: Optional[str] = None
    logo_url: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    twitter_handle: Optional[str] = None
    reddit_username: Optional[str] = None
    youtube_channel_id: Optional[str] = None
    enabled_platforms: Optional[List[str]] = None
    crawl_interval_minutes: Optional[int] = Field(None, ge=15, le=1440)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class BrandOut(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    keywords: List[str]
    twitter_handle: Optional[str]
    reddit_username: Optional[str]
    youtube_channel_id: Optional[str]
    enabled_platforms: List[str]
    crawl_interval_minutes: int
    is_active: bool
    color: str
    website_url: Optional[str]
    logo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_crawled_at: Optional[datetime]

    model_config = {"from_attributes": True}


class BrandStats(BaseModel):
    brand_id: uuid.UUID
    total_mentions: int
    mentions_last_24h: int
    mentions_last_7d: int
    avg_sentiment: float
    sentiment_trend: float
    top_platform: Optional[str]
    positive_pct: float
    negative_pct: float
    neutral_pct: float
