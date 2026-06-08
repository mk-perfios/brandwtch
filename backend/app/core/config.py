from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "BrandWtch"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://brandwtch:brandwtch@localhost:5432/brandwtch"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # When False (lite / no-Docker mode), crawls run inline instead of via Celery+Redis.
    USE_CELERY: bool = True

    # Reddit
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    REDDIT_USER_AGENT: str = "BrandWtch/1.0"

    # Twitter/X
    TWITTER_BEARER_TOKEN: Optional[str] = None

    # SerpAPI (Google Search)
    SERPAPI_KEY: Optional[str] = None

    # News API
    NEWS_API_KEY: Optional[str] = None

    # YouTube
    YOUTUBE_API_KEY: Optional[str] = None

    # AI Platform APIs
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None

    # Monitoring
    DEFAULT_CRAWL_INTERVAL_MINUTES: int = 60
    MAX_MENTIONS_PER_CRAWL: int = 100
    SENTIMENT_MODEL: str = "vader"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
