from sqlalchemy import Column, String, Float, DateTime, JSON, Text, ForeignKey, Boolean, Integer, Enum as SAEnum, Uuid as UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import enum
from app.core.database import Base


class Platform(str, enum.Enum):
    REDDIT = "reddit"
    TWITTER = "twitter"
    GOOGLE = "google"
    QUORA = "quora"
    HACKER_NEWS = "hacker_news"
    YOUTUBE = "youtube"
    NEWS = "news"
    AI_CLAUDE = "ai_claude"
    AI_CHATGPT = "ai_chatgpt"
    AI_GEMINI = "ai_gemini"
    AI_PERPLEXITY = "ai_perplexity"
    AI_CONTENT = "ai_content"
    OTHER = "other"


class SentimentLabel(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class Mention(Base):
    __tablename__ = "mentions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)

    platform = Column(SAEnum(Platform), nullable=False, index=True)
    external_id = Column(String(500), nullable=True)
    url = Column(String(2000), nullable=True)

    title = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    author_url = Column(String(500), nullable=True)

    upvotes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)

    sentiment_label = Column(SAEnum(SentimentLabel), nullable=True, index=True)
    sentiment_score = Column(Float, nullable=True)
    sentiment_positive = Column(Float, nullable=True)
    sentiment_negative = Column(Float, nullable=True)
    sentiment_neutral = Column(Float, nullable=True)

    matched_keywords = Column(JSON, default=list)
    language = Column(String(10), default="en")
    extra_data = Column(JSON, default=dict)

    # AI-specific fields
    ai_recommendation = Column(Boolean, nullable=True)
    ai_context = Column(Text, nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    crawled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    brand = relationship("Brand", back_populates="mentions")
