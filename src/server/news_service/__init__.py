"""
新闻聚合服务

提供新闻抓取、AI 摘要、缓存管理功能
"""

from .fetcher import NewsFetcher, NewsItem
from .summarizer import NewsSummarizer
from .cache import NewsCache
from .service import NewsService, get_news_service

__all__ = [
    "NewsFetcher",
    "NewsItem",
    "NewsSummarizer",
    "NewsCache",
    "NewsService",
    "get_news_service",
]
