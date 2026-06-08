from app.services.crawlers.reddit_crawler import RedditCrawler
from app.services.crawlers.twitter_crawler import TwitterCrawler
from app.services.crawlers.google_crawler import GoogleCrawler
from app.services.crawlers.news_crawler import NewsCrawler
from app.services.crawlers.hackernews_crawler import HackerNewsCrawler
from app.services.crawlers.quora_crawler import QuoraCrawler
from app.services.crawlers.youtube_crawler import YouTubeCrawler
from app.services.crawlers.ai_platforms_crawler import AIPlatformsCrawler
from app.services.crawlers.ai_content_crawler import AIContentCrawler

CRAWLER_REGISTRY = {
    "reddit": RedditCrawler,
    "twitter": TwitterCrawler,
    "google": GoogleCrawler,
    "news": NewsCrawler,
    "hacker_news": HackerNewsCrawler,
    "quora": QuoraCrawler,
    "youtube": YouTubeCrawler,
    "ai_platforms": AIPlatformsCrawler,
    "ai_content": AIContentCrawler,
}


def get_crawler(platform: str):
    cls = CRAWLER_REGISTRY.get(platform)
    return cls() if cls else None
