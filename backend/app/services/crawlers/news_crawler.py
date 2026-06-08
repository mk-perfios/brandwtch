import asyncio
from typing import List
from datetime import datetime

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention


class NewsCrawler(BaseCrawler):
    platform_name = "news"

    def is_configured(self) -> bool:
        return bool(settings.NEWS_API_KEY)

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        if not self.is_configured():
            return []
        from newsapi import NewsApiClient
        client = NewsApiClient(api_key=settings.NEWS_API_KEY)
        mentions: List[RawMention] = []
        per_kw = max(5, max_results // len(keywords))
        for keyword in keywords:
            try:
                results = await asyncio.to_thread(self._search, client, keyword, per_kw)
                mentions.extend(results)
            except Exception:
                continue
        return mentions[:max_results]

    def _search(self, client, keyword: str, limit: int) -> List[RawMention]:
        response = client.get_everything(q=keyword, language="en", sort_by="publishedAt", page_size=min(100, limit))
        mentions = []
        for article in response.get("articles", []):
            source = article.get("source", {})
            mentions.append(RawMention(
                platform="news",
                external_id=(article.get("url") or "")[-100:],
                url=article.get("url"),
                title=article.get("title"),
                content=article.get("description") or article.get("content"),
                author=article.get("author"),
                published_at=self._parse(article.get("publishedAt")),
                extra_data={"source_name": source.get("name"), "image_url": article.get("urlToImage")},
            ))
        return mentions

    def _parse(self, s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
