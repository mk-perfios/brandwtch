import asyncio
from typing import List
from datetime import datetime

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention


class YouTubeCrawler(BaseCrawler):
    platform_name = "youtube"

    def is_configured(self) -> bool:
        return bool(settings.YOUTUBE_API_KEY)

    async def crawl(self, keywords: List[str], max_results: int = 100) -> List[RawMention]:
        if not self.is_configured():
            return []
        mentions: List[RawMention] = []
        per_kw = max(5, max_results // len(keywords))
        for keyword in keywords:
            try:
                results = await asyncio.to_thread(self._search, keyword, per_kw)
                mentions.extend(results)
            except Exception:
                continue
        return mentions[:max_results]

    def _search(self, keyword: str, limit: int) -> List[RawMention]:
        from googleapiclient.discovery import build
        yt = build("youtube", "v3", developerKey=settings.YOUTUBE_API_KEY)

        search_resp = yt.search().list(q=keyword, part="id,snippet", maxResults=min(limit, 50), type="video", order="date").execute()
        mentions = []
        video_ids = []
        for item in search_resp.get("items", []):
            snippet = item.get("snippet", {})
            vid = item.get("id", {}).get("videoId")
            if not vid:
                continue
            video_ids.append(vid)
            channel = snippet.get("channelId")
            mentions.append(RawMention(
                platform="youtube",
                external_id=vid,
                url=f"https://www.youtube.com/watch?v={vid}",
                title=snippet.get("title"),
                content=snippet.get("description"),
                author=snippet.get("channelTitle"),
                author_url=f"https://www.youtube.com/channel/{channel}" if channel else None,
                published_at=self._parse(snippet.get("publishedAt")),
                extra_data={"thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url")},
            ))

        if video_ids:
            stats_resp = yt.videos().list(part="statistics", id=",".join(video_ids)).execute()
            stats_map = {v["id"]: v.get("statistics", {}) for v in stats_resp.get("items", [])}
            for m in mentions:
                s = stats_map.get(m.external_id, {})
                m.views_count = int(s.get("viewCount", 0))
                m.upvotes = int(s.get("likeCount", 0))
                m.comments_count = int(s.get("commentCount", 0))
        return mentions

    def _parse(self, s):
        if not s:
            return None
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
