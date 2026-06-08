"""
AI Content Crawler — scans web content produced by AI tools for brand mentions.

Uses SerpAPI to search for the brand on AI-heavy content sites (Medium, dev.to,
Substack, Towards Data Science, etc.) and captures those articles as mentions
tagged with the ai_content platform.
"""
import httpx
from typing import List

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention

AI_CONTENT_SITES = [
    "site:medium.com",
    "site:dev.to",
    "site:substack.com",
    "site:towardsdatascience.com",
    "site:hackernoon.com",
    "site:thenewstack.io",
]


class AIContentCrawler(BaseCrawler):
    """Finds AI-generated / AI-focused articles mentioning the brand."""
    platform_name = "ai_content"

    def is_configured(self) -> bool:
        return bool(settings.SERPAPI_KEY)

    async def crawl(self, keywords: List[str], max_results: int = 50) -> List[RawMention]:
        if not self.is_configured():
            return []
        mentions: List[RawMention] = []
        per_kw = max(5, max_results // len(keywords))

        async with httpx.AsyncClient(timeout=30) as client:
            for keyword in keywords[:3]:
                site_query = " OR ".join(AI_CONTENT_SITES[:3])
                query = f"{keyword} ({site_query})"
                try:
                    r = await client.get("https://serpapi.com/search", params={
                        "q": query,
                        "api_key": settings.SERPAPI_KEY,
                        "engine": "google",
                        "num": min(per_kw, 10),
                        "hl": "en",
                    })
                    if r.status_code != 200:
                        continue
                    for result in r.json().get("organic_results", []):
                        mentions.append(RawMention(
                            platform="ai_content",
                            external_id=f"aic_{hash(result.get('link',''))}",
                            url=result.get("link", ""),
                            title=result.get("title"),
                            content=result.get("snippet"),
                            author=result.get("displayed_link"),
                            extra_data={
                                "position": result.get("position"),
                                "source": result.get("source"),
                                "query": query,
                            },
                        ))
                except Exception:
                    continue

        return mentions[:max_results]
