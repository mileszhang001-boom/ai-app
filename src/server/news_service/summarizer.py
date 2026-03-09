"""
新闻 AI 摘要服务

使用 LLM 将长新闻正文压缩为适合卡片展示的短摘要（≤60字）
复用项目已有的 Qwen API 通道
"""

import os
import json
from typing import List, Optional

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

from .fetcher import NewsItem


class NewsSummarizer:
    """新闻 AI 摘要生成器"""

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("QWEN_API_KEY")
        self.model = model or os.getenv("AI_MODEL", "qwen-plus")
        self.endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

    async def summarize_batch(self, items: List[NewsItem], max_summary_len: int = 60) -> List[NewsItem]:
        """
        批量生成摘要

        对已有 summary 且足够短的条目跳过，只处理需要压缩的条目
        """
        if not self.api_key or not HTTPX_AVAILABLE:
            # 无 API Key 时，直接截断作为摘要
            for item in items:
                if len(item.summary) > max_summary_len:
                    item.summary = item.summary[:max_summary_len - 1] + "…"
                elif not item.summary:
                    item.summary = item.title
            return items

        # 筛选出需要摘要的条目
        needs_summary = []
        for item in items:
            if not item.summary or len(item.summary) > max_summary_len:
                needs_summary.append(item)

        if not needs_summary:
            return items

        # 批量调用（一次请求处理多条，节省 API 调用次数）
        try:
            summaries = await self._call_llm_batch(needs_summary, max_summary_len)
            for item, summary in zip(needs_summary, summaries):
                item.summary = summary
        except Exception as e:
            print(f"[NEWS] AI summarize failed: {e}, falling back to truncation")
            for item in needs_summary:
                if item.summary and len(item.summary) > max_summary_len:
                    item.summary = item.summary[:max_summary_len - 1] + "…"
                elif not item.summary:
                    item.summary = item.title[:max_summary_len]

        return items

    async def _call_llm_batch(self, items: List[NewsItem], max_len: int) -> List[str]:
        """批量调用 LLM 生成摘要"""
        # 构建批量摘要 prompt
        news_text = "\n".join(
            f"{i+1}. 【{item.title}】{item.summary or '无正文'}"
            for i, item in enumerate(items)
        )

        system_prompt = (
            "你是一个新闻摘要助手。将每条新闻压缩为一句话摘要，"
            f"每条不超过{max_len}字。简洁、信息密度高、适合车载卡片展示。"
        )

        user_prompt = (
            f"请为以下{len(items)}条新闻各生成一句话摘要，"
            f"每条不超过{max_len}字。\n"
            "只输出 JSON 数组，格式：[\"摘要1\", \"摘要2\", ...]\n\n"
            f"{news_text}"
        )

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                self.endpoint,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1000,
                },
            )
            response.raise_for_status()
            result = response.json()

        content = result["choices"][0]["message"]["content"].strip()

        # 清理 markdown 代码块
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        summaries = json.loads(content)

        # 确保长度不超限
        return [s[:max_len] for s in summaries]
