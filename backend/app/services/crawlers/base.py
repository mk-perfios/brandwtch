from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class RawMention:
    platform: str
    external_id: str
    url: str
    title: Optional[str]
    content: Optional[str]
    author: Optional[str] = None
    author_url: Optional[str] = None
    upvotes: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    published_at: Optional[datetime] = None
    extra_data: dict = field(default_factory=dict)
    ai_recommendation: Optional[bool] = None
    ai_context: Optional[str] = None


class BaseCrawler(ABC):
    platform_name: str = "unknown"

    @abstractmethod
    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        ...

    def is_configured(self) -> bool:
        return True
