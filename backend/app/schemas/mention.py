from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.models.mention import Platform, SentimentLabel


class MentionOut(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    platform: Platform
    external_id: Optional[str]
    url: Optional[str]
    title: Optional[str]
    content: Optional[str]
    author: Optional[str]
    author_url: Optional[str]
    upvotes: int
    comments_count: int
    shares_count: int
    views_count: int
    sentiment_label: Optional[SentimentLabel]
    sentiment_score: Optional[float]
    sentiment_positive: Optional[float]
    sentiment_negative: Optional[float]
    sentiment_neutral: Optional[float]
    matched_keywords: List[str]
    language: str
    ai_recommendation: Optional[bool]
    ai_context: Optional[str]
    published_at: Optional[datetime]
    crawled_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class MentionPage(BaseModel):
    items: List[MentionOut]
    total: int
    page: int
    page_size: int
    pages: int
