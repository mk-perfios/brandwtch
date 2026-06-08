import asyncio
from typing import List
from datetime import datetime, timezone

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention


class RedditCrawler(BaseCrawler):
    platform_name = "reddit"

    def is_configured(self) -> bool:
        return bool(settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET)

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        if not self.is_configured():
            return []
        import praw
        reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT,
        )
        mentions: List[RawMention] = []
        per_kw = max(1, max_results // len(keywords))
        for keyword in keywords:
            try:
                results = await asyncio.to_thread(self._search, reddit, keyword, per_kw)
                mentions.extend(results)
            except Exception:
                continue
        return mentions[:max_results]

    def _search(self, reddit, keyword: str, limit: int) -> List[RawMention]:
        mentions = []
        for sub in reddit.subreddit("all").search(keyword, limit=limit, sort="new"):
            mentions.append(RawMention(
                platform="reddit",
                external_id=sub.id,
                url=f"https://reddit.com{sub.permalink}",
                title=sub.title,
                content=sub.selftext[:2000] if sub.selftext else None,
                author=str(sub.author) if sub.author else "[deleted]",
                author_url=f"https://reddit.com/u/{sub.author}" if sub.author else None,
                upvotes=sub.score,
                comments_count=sub.num_comments,
                published_at=datetime.fromtimestamp(sub.created_utc, tz=timezone.utc),
                extra_data={"subreddit": sub.subreddit.display_name, "upvote_ratio": sub.upvote_ratio},
            ))
        return mentions
