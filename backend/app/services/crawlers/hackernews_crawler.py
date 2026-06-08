import httpx
from typing import List
from datetime import datetime, timezone

from app.services.crawlers.base import BaseCrawler, RawMention

HN_SEARCH = "https://hn.algolia.com/api/v1/search"


class HackerNewsCrawler(BaseCrawler):
    platform_name = "hacker_news"

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        mentions: List[RawMention] = []
        per_kw = max(5, max_results // len(keywords))
        async with httpx.AsyncClient(timeout=20) as client:
            for keyword in keywords:
                try:
                    r = await client.get(HN_SEARCH, params={"query": keyword, "tags": "(story,comment)", "hitsPerPage": min(per_kw, 50)})
                    if r.status_code != 200:
                        continue
                    for hit in r.json().get("hits", []):
                        sid = hit.get("objectID")
                        author = hit.get("author")
                        mentions.append(RawMention(
                            platform="hacker_news",
                            external_id=str(sid),
                            url=hit.get("url") or f"https://news.ycombinator.com/item?id={sid}",
                            title=hit.get("title") or hit.get("story_title"),
                            content=hit.get("comment_text") or hit.get("story_text"),
                            author=author,
                            author_url=f"https://news.ycombinator.com/user?id={author}" if author else None,
                            upvotes=hit.get("points") or 0,
                            comments_count=hit.get("num_comments") or 0,
                            published_at=self._parse(hit.get("created_at")),
                            extra_data={"type": (hit.get("_tags") or ["story"])[0]},
                        ))
                except Exception:
                    continue
        return mentions[:max_results]

    def _parse(self, s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
