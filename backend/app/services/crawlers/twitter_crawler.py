import asyncio
from typing import List
from datetime import datetime, timezone

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention


class TwitterCrawler(BaseCrawler):
    platform_name = "twitter"

    def is_configured(self) -> bool:
        return bool(settings.TWITTER_BEARER_TOKEN)

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        if not self.is_configured():
            return []
        import tweepy
        client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)
        mentions: List[RawMention] = []
        per_kw = max(10, max_results // len(keywords))
        for keyword in keywords:
            try:
                results = await asyncio.to_thread(self._search, client, keyword, min(100, per_kw))
                mentions.extend(results)
            except Exception:
                continue
        return mentions[:max_results]

    def _search(self, client, keyword: str, limit: int) -> List[RawMention]:
        response = client.search_recent_tweets(
            query=f"{keyword} -is:retweet lang:en",
            max_results=limit,
            tweet_fields=["created_at", "public_metrics", "author_id", "text"],
            user_fields=["username"],
            expansions=["author_id"],
        )
        if not response.data:
            return []
        users = {u.id: u for u in (response.includes.get("users") or [])}
        mentions = []
        for tweet in response.data:
            author = users.get(tweet.author_id)
            m = tweet.public_metrics or {}
            mentions.append(RawMention(
                platform="twitter",
                external_id=str(tweet.id),
                url=f"https://twitter.com/i/web/status/{tweet.id}",
                title=None,
                content=tweet.text,
                author=f"@{author.username}" if author else None,
                author_url=f"https://twitter.com/{author.username}" if author else None,
                upvotes=m.get("like_count", 0),
                comments_count=m.get("reply_count", 0),
                shares_count=m.get("retweet_count", 0),
                views_count=m.get("impression_count", 0),
                published_at=tweet.created_at,
            ))
        return mentions
