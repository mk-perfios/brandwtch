"""
AI Platform Monitoring — Probing Mode.

Sends brand-related probe questions to each configured AI assistant,
then checks whether the brand is mentioned and how it is framed.
"""
import asyncio
from typing import List, Optional, Tuple
from datetime import datetime, timezone

from app.core.config import settings
from app.services.crawlers.base import BaseCrawler, RawMention

PROBES = [
    "What are the best {keyword} tools or solutions available right now?",
    "Can you recommend a good {keyword} platform? What do people think about it?",
    "What are the pros and cons of {keyword}?",
    "Is {keyword} worth using? How does it compare to alternatives?",
]

_POS_SIGNALS = {"recommend", "great", "excellent", "best", "popular", "widely used", "trusted", "leading", "top"}
_NEG_SIGNALS = {"avoid", "not recommend", "poor", "issues", "problems", "discontinued", "outdated", "scam", "buggy"}


def _find_brand(text: str, keywords: List[str]) -> Tuple[bool, Optional[str]]:
    lower = text.lower()
    for kw in keywords:
        if kw.lower() in lower:
            idx = lower.index(kw.lower())
            return True, text[max(0, idx - 150): idx + 300]
    return False, None


def _assess(text: str) -> Optional[bool]:
    lower = text.lower()
    pos = sum(1 for s in _POS_SIGNALS if s in lower)
    neg = sum(1 for s in _NEG_SIGNALS if s in lower)
    return True if pos > neg else False if neg > pos else None


class AIPlatformsCrawler(BaseCrawler):
    platform_name = "ai_platforms"

    async def crawl(self, keywords: List[str], max_results: int = 30) -> List[RawMention]:
        tasks = []
        if settings.OPENAI_API_KEY:
            tasks.append(self._probe_openai(keywords))
        if settings.ANTHROPIC_API_KEY:
            tasks.append(self._probe_claude(keywords))
        if settings.GOOGLE_AI_API_KEY:
            tasks.append(self._probe_gemini(keywords))

        results = await asyncio.gather(*tasks, return_exceptions=True)
        mentions = []
        for r in results:
            if isinstance(r, list):
                mentions.extend(r)
        return mentions[:max_results]

    async def _probe_openai(self, keywords: List[str]) -> List[RawMention]:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            mentions = []
            for kw in keywords[:2]:
                prompt = PROBES[0].format(keyword=kw)
                resp = await client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=600,
                )
                text = resp.choices[0].message.content or ""
                found, ctx = _find_brand(text, keywords)
                if found:
                    mentions.append(RawMention(
                        platform="ai_chatgpt",
                        external_id=f"chatgpt_{kw}_{datetime.now().strftime('%Y%m%d%H%M')}",
                        url="https://chat.openai.com",
                        title=f'ChatGPT on: "{prompt}"',
                        content=text[:2000],
                        author="ChatGPT (GPT-4o mini)",
                        published_at=datetime.now(timezone.utc),
                        ai_recommendation=_assess(text),
                        ai_context=ctx,
                        extra_data={"prompt": prompt, "model": "gpt-4o-mini"},
                    ))
                await asyncio.sleep(0.5)
            return mentions
        except Exception:
            return []

    async def _probe_claude(self, keywords: List[str]) -> List[RawMention]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            mentions = []
            for kw in keywords[:2]:
                prompt = PROBES[1].format(keyword=kw)
                resp = await client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=600,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = resp.content[0].text if resp.content else ""
                found, ctx = _find_brand(text, keywords)
                if found:
                    mentions.append(RawMention(
                        platform="ai_claude",
                        external_id=f"claude_{kw}_{datetime.now().strftime('%Y%m%d%H%M')}",
                        url="https://claude.ai",
                        title=f'Claude on: "{prompt}"',
                        content=text[:2000],
                        author="Claude (Haiku)",
                        published_at=datetime.now(timezone.utc),
                        ai_recommendation=_assess(text),
                        ai_context=ctx,
                        extra_data={"prompt": prompt, "model": "claude-haiku"},
                    ))
                await asyncio.sleep(0.5)
            return mentions
        except Exception:
            return []

    async def _probe_gemini(self, keywords: List[str]) -> List[RawMention]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            mentions = []
            for kw in keywords[:2]:
                prompt = PROBES[2].format(keyword=kw)
                resp = model.generate_content(prompt)
                text = resp.text or ""
                found, ctx = _find_brand(text, keywords)
                if found:
                    mentions.append(RawMention(
                        platform="ai_gemini",
                        external_id=f"gemini_{kw}_{datetime.now().strftime('%Y%m%d%H%M')}",
                        url="https://gemini.google.com",
                        title=f'Gemini on: "{prompt}"',
                        content=text[:2000],
                        author="Google Gemini 1.5 Flash",
                        published_at=datetime.now(timezone.utc),
                        ai_recommendation=_assess(text),
                        ai_context=ctx,
                        extra_data={"prompt": prompt, "model": "gemini-1.5-flash"},
                    ))
                await asyncio.sleep(0.5)
            return mentions
        except Exception:
            return []
