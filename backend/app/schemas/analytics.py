from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid


class TimeSeriesPoint(BaseModel):
    date: str
    total: int
    positive: int
    negative: int
    neutral: int
    avg_sentiment: float


class PlatformBreakdown(BaseModel):
    platform: str
    total_mentions: int
    positive: int
    negative: int
    neutral: int
    avg_sentiment: float
    percentage: float


class SentimentSummary(BaseModel):
    total_mentions: int
    positive: int
    negative: int
    neutral: int
    avg_sentiment: float
    sentiment_trend: float


class TopMention(BaseModel):
    id: uuid.UUID
    platform: str
    title: Optional[str]
    content: Optional[str]
    url: Optional[str]
    sentiment_score: Optional[float]
    sentiment_label: Optional[str]
    upvotes: int
    published_at: Optional[datetime]


class AnalyticsDashboard(BaseModel):
    brand_id: uuid.UUID
    period_days: int
    summary: SentimentSummary
    time_series: List[TimeSeriesPoint]
    platform_breakdown: List[PlatformBreakdown]
    top_positive: List[TopMention]
    top_negative: List[TopMention]
    trending_keywords: List[Dict[str, Any]]


class OverviewStats(BaseModel):
    total_brands: int
    total_mentions: int
    mentions_today: int
    avg_sentiment: float
    most_mentioned_brand: Optional[str]
    most_negative_brand: Optional[str]
