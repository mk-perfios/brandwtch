import httpx
from typing import List
from datetime import datetime, timezone

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention


class GoogleCrawler(BaseCrawler):
    """Organic Google Search results via SerpAPI."""
    platform_name = "google"

    def is_configured(self) -> bool:
        return bool(settings.SERPAPI_KEY)

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        if not self.is_configured():
            return []
        mentions: List[RawMention] = []
        per_kw = max(10, max_results // len(keywords))
        async with httpx.AsyncClient(timeout=30) as client:
            for keyword in keywords:
                try:
                    results = await self._search(client, keyword, per_kw)
                    mentions.extend(results)
                except Exception:
                    continue
        return mentions[:max_results]

    async def _search(self, client: httpx.AsyncClient, keyword: str, limit: int) -> List[RawMention]:
        mentions = []
        for page in range(min(3, (limit + 9) // 10)):
            r = await client.get("https://serpapi.com/search", params={
                "q": keyword, "api_key": settings.SERPAPI_KEY,
                "engine": "google", "num": 10, "start": page * 10,
                "hl": "en", "gl": "us",
            })
            if r.status_code != 200:
                break
            for result in r.json().get("organic_results", []):
                mentions.append(RawMention(
                    platform="google",
                    external_id=f"google_{hash(result.get('link',''))}",
                    url=result.get("link", ""),
                    title=result.get("title"),
                    content=result.get("snippet"),
                    author=result.get("displayed_link"),
                    extra_data={"position": result.get("position"), "source": result.get("source")},
                ))
        return mentions
