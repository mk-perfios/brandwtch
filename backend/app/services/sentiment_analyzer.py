from typing import Optional
from app.core.config import settings


class SentimentResult:
    __slots__ = ("label", "score", "positive", "negative", "neutral")

    def __init__(self, label: str, score: float, positive: float, negative: float, neutral: float):
        self.label = label
        self.score = score
        self.positive = positive
        self.negative = negative
        self.neutral = neutral


class SentimentAnalyzer:
    """Dual-backend sentiment analyser. VADER is the default (fast, no GPU).
    Set SENTIMENT_MODEL=transformer in .env to switch to distilbert."""

    def __init__(self):
        self._vader = None
        self._transformer = None
        self._model = settings.SENTIMENT_MODEL

    def _get_vader(self):
        if self._vader is None:
            from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
            self._vader = SentimentIntensityAnalyzer()
        return self._vader

    def analyze(self, text: str) -> SentimentResult:
        if not text or not text.strip():
            return SentimentResult("neutral", 0.0, 0.0, 0.0, 1.0)
        text = text[:5000]
        if self._model == "transformer":
            return self._analyze_transformer(text)
        return self._analyze_vader(text)

    def _analyze_vader(self, text: str) -> SentimentResult:
        scores = self._get_vader().polarity_scores(text)
        c = scores["compound"]
        label = "positive" if c >= 0.05 else "negative" if c <= -0.05 else "neutral"
        return SentimentResult(label, round(c, 4), round(scores["pos"], 4), round(scores["neg"], 4), round(scores["neu"], 4))

    def _analyze_transformer(self, text: str) -> SentimentResult:
        try:
            from transformers import pipeline
            if self._transformer is None:
                self._transformer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                    truncation=True, max_length=512,
                )
            r = self._transformer(text[:512])[0]
            label = r["label"].lower()
            conf = r["score"]
            score = conf if label == "positive" else -conf
            pos = conf if label == "positive" else 0.0
            neg = conf if label == "negative" else 0.0
            return SentimentResult(label, round(score, 4), round(pos, 4), round(neg, 4), round(1 - conf, 4))
        except Exception:
            return self._analyze_vader(text)


_analyzer: Optional[SentimentAnalyzer] = None


def get_analyzer() -> SentimentAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = SentimentAnalyzer()
    return _analyzer


def analyze_text(text: str) -> SentimentResult:
    return get_analyzer().analyze(text)
