"""
新闻聚合服务（门面层）

整合 fetcher + summarizer + cache，对外提供统一接口
"""

import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from .fetcher import NewsFetcher, NewsItem
from .summarizer import NewsSummarizer
from .cache import NewsCache


class NewsService:
    """新闻聚合服务"""

    def __init__(self):
        self.fetcher = NewsFetcher()
        self.summarizer = NewsSummarizer()
        self.cache = NewsCache()

    async def get_news(
        self,
        category: str = "general",
        limit: int = 5,
    ) -> Dict[str, Any]:
        """
        获取新闻（带缓存 + AI 摘要）

        流程：
        1. 查缓存 → 命中则直接返回
        2. 缓存未命中 → 抓取 RSS
        3. AI 摘要（压缩长摘要）
        4. 写入缓存
        5. 返回结果
        """
        # 1. 查缓存
        cached = self.cache.get(category)
        if cached:
            items = cached[:limit]
            return self._format_response(items, category, from_cache=True)

        # 2. 抓取新闻
        raw_items = await self.fetcher.fetch(category, limit=limit + 3)  # 多抓几条以备去重

        # 3. AI 摘要
        items = await self.summarizer.summarize_batch(raw_items)

        # 4. 写入缓存
        self.cache.set(category, items)

        # 5. 返回
        return self._format_response(items[:limit], category, from_cache=False)

    async def refresh(self, category: str = None):
        """强制刷新缓存"""
        self.cache.invalidate(category)

    def _format_response(
        self,
        items: List[NewsItem],
        category: str,
        from_cache: bool,
    ) -> Dict[str, Any]:
        """格式化返回数据（兼容现有前端 news widget 的数据格式）"""
        news_list = []
        for item in items:
            # 计算相对时间
            time_str = item.published_at or "刚刚"
            if not any(c in time_str for c in ["前", "刚"]):
                time_str = self._relative_time(time_str)

            news_list.append({
                "id": item.id,
                "title": item.title,
                "summary": item.summary,
                "tag": item.category,
                "category": item.category,
                "time": time_str,
                "source": item.source,
            })

        return {
            "news": news_list,
            "category": category,
            "updated_at": datetime.now().isoformat(),
            "from_cache": from_cache,
        }

    @staticmethod
    def _relative_time(date_str: str) -> str:
        """将日期字符串转为相对时间"""
        try:
            # 清理空格并修复时区格式（"+0800" → "+0800", "  +0800" → "+0800"）
            import re
            date_str = date_str.strip()
            # 将 " +0800" 或 "  +0800" 格式修复为无空格
            date_str = re.sub(r'\s+([+-]\d{4})$', r'\1', date_str)

            # 尝试解析常见格式
            for fmt in [
                "%a, %d %b %Y %H:%M:%S %z",   # RSS 格式
                "%a, %d %b %Y %H:%M:%S GMT",
                "%Y-%m-%dT%H:%M:%S%z",         # ISO 格式
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%d %H:%M:%S%z",         # 带时区
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d",                    # 纯日期
            ]:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    continue
            else:
                return date_str

            now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
            diff = (now - dt).total_seconds()

            if diff < 60:
                return "刚刚"
            elif diff < 3600:
                return f"{int(diff / 60)}分钟前"
            elif diff < 86400:
                return f"{int(diff / 3600)}小时前"
            elif diff < 172800:
                return "昨天"
            else:
                return f"{int(diff / 86400)}天前"
        except Exception:
            return date_str


# 单例
_service: Optional[NewsService] = None


def get_news_service() -> NewsService:
    """获取新闻服务单例"""
    global _service
    if _service is None:
        _service = NewsService()
    return _service
