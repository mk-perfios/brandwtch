import asyncio
import httpx
import re
from bs4 import BeautifulSoup
from typing import List

from app.services.crawlers.base import BaseCrawler, RawMention

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


class QuoraCrawler(BaseCrawler):
    """Best-effort Quora scraper. Returns question links that mention the keyword."""
    platform_name = "quora"

    async def crawl(self, keywords: List[str], max_results: int = 50) -> List[RawMention]:
        mentions: List[RawMention] = []
        per_kw = max(5, max_results // len(keywords))
        async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=20) as client:
            for keyword in keywords:
                try:
                    r = await client.get(f"https://www.quora.com/search?q={keyword.replace(' ', '+')}&type=question")
                    if r.status_code != 200:
                        continue
                    soup = BeautifulSoup(r.text, "lxml")
                    count = 0
                    for link in soup.select("a[href]"):
                        href = link.get("href", "")
                        if not href.startswith("https://www.quora.com/"):
                            href = f"https://www.quora.com{href}"
                        text = link.get_text(strip=True)
                        if len(text) < 15 or not any(c in href for c in ["?", "-"]):
                            continue
                        mentions.append(RawMention(
                            platform="quora",
                            external_id=re.sub(r"[^a-zA-Z0-9]", "_", href)[-100:],
                            url=href,
                            title=text,
                            content=None,
                            extra_data={"keyword": keyword},
                        ))
                        count += 1
                        if count >= per_kw:
                            break
                    await asyncio.sleep(1.5)
                except Exception:
                    continue
        return mentions[:max_results]
