"""
新闻缓存管理

双层缓存：内存（快）+ 文件（持久化）
TTL: 30分钟内存缓存，24小时文件缓存
"""

import os
import json
import time
import threading
from typing import List, Optional, Dict
from dataclasses import asdict

from .fetcher import NewsItem


class NewsCache:
    """新闻缓存"""

    # 内存缓存 TTL（秒）
    MEMORY_TTL = 30 * 60  # 30 分钟
    # 文件缓存 TTL（秒）
    FILE_TTL = 24 * 60 * 60  # 24 小时

    def __init__(self, cache_dir: str = None):
        self._memory: Dict[str, dict] = {}  # {category: {"items": [...], "ts": timestamp}}
        self._lock = threading.Lock()
        self._cache_dir = cache_dir or os.path.join(
            os.path.dirname(__file__), "..", ".cache", "news"
        )
        os.makedirs(self._cache_dir, exist_ok=True)

    def get(self, category: str) -> Optional[List[NewsItem]]:
        """
        读取缓存

        优先读内存，内存过期读文件，文件过期返回 None
        """
        now = time.time()

        # 1. 内存缓存
        with self._lock:
            entry = self._memory.get(category)
            if entry and (now - entry["ts"]) < self.MEMORY_TTL:
                return [NewsItem(**d) for d in entry["items"]]

        # 2. 文件缓存
        file_path = os.path.join(self._cache_dir, f"{category}.json")
        if os.path.exists(file_path):
            try:
                mtime = os.path.getmtime(file_path)
                if (now - mtime) < self.FILE_TTL:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    items = [NewsItem(**d) for d in data]
                    # 回填内存缓存
                    self._set_memory(category, data)
                    return items
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        return None

    def set(self, category: str, items: List[NewsItem]):
        """写入缓存（同时更新内存和文件）"""
        data = [item.to_dict() for item in items]

        # 内存
        self._set_memory(category, data)

        # 文件
        file_path = os.path.join(self._cache_dir, f"{category}.json")
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except OSError as e:
            print(f"[NEWS CACHE] File write failed: {e}")

    def invalidate(self, category: str = None):
        """清除缓存"""
        with self._lock:
            if category:
                self._memory.pop(category, None)
            else:
                self._memory.clear()

        if category:
            file_path = os.path.join(self._cache_dir, f"{category}.json")
            if os.path.exists(file_path):
                os.remove(file_path)
        else:
            for f in os.listdir(self._cache_dir):
                if f.endswith(".json"):
                    os.remove(os.path.join(self._cache_dir, f))

    def _set_memory(self, category: str, data: list):
        with self._lock:
            self._memory[category] = {"items": data, "ts": time.time()}
