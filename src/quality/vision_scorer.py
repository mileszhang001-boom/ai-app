"""Vision model scorer — optional Phase 3.

Uses an LLM with vision capability to evaluate subjective quality
of widget screenshots. Currently a stub that can be activated when needed.
"""

import base64
import json
import os
from typing import Optional

from .config import VISION_WEIGHTS


VISION_PROMPT = """你是车载 UI 品质评审员。这是一张 896×1464 像素的车机桌面卡片截图。

用户原始需求: "{user_query}"
生成参数: {json_params}

请对这张卡片打分（每项 1-10）：

1. COLOR_MATCH: 配色是否与用户描述匹配？
2. INTENT_MATCH: 卡片类型是否正确？（用户要天气就该是天气卡）
3. TEXT_READABILITY: 所有文字是否可在手臂距离清晰辨认？
4. LAYOUT_QUALITY: 布局是否平衡、层级清晰、留白舒适？
5. AESTHETIC_QUALITY: 是否有"精品预置卡片"的质感？（对标 Apple/Tesla 车机）
6. DARK_MODE_HARMONY: 暗色环境下是否和谐？无刺眼亮点？

输出纯 JSON：
{{
  "color_match": {{"score": N, "reason": "..."}},
  "intent_match": {{"score": N, "reason": "..."}},
  "text_readability": {{"score": N, "reason": "..."}},
  "layout_quality": {{"score": N, "reason": "..."}},
  "aesthetic_quality": {{"score": N, "reason": "..."}},
  "dark_mode_harmony": {{"score": N, "reason": "..."}},
  "overall": N,
  "issues": ["..."],
  "suggestions": ["..."]
}}"""


async def score_with_vision(
    screenshot_path: str,
    user_query: str,
    json_params: dict,
    api_key: Optional[str] = None,
) -> Optional[dict]:
    """Score a screenshot using vision model.

    Returns None if vision scoring is not available.
    Requires ANTHROPIC_API_KEY or DASHSCOPE_API_KEY environment variable.
    """
    api_key = api_key or os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        return None

    # Read and encode screenshot
    with open(screenshot_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode()

    prompt = VISION_PROMPT.format(
        user_query=user_query,
        json_params=json.dumps(json_params, ensure_ascii=False),
    )

    # Try Anthropic API first
    if os.environ.get("ANTHROPIC_API_KEY"):
        return await _call_anthropic(api_key, img_data, prompt)

    return None


async def _call_anthropic(api_key: str, img_b64: str, prompt: str) -> Optional[dict]:
    """Call Claude API with vision."""
    try:
        import httpx
    except ImportError:
        return None

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1024,
                "messages": [{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": img_b64,
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }],
            },
        )
        if resp.status_code != 200:
            return None
        text = resp.json()["content"][0]["text"]
        # Extract JSON from response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    return None


def compute_vision_score(vision_result: dict) -> float:
    """Compute weighted vision score from model output (0-100)."""
    if not vision_result:
        return 0

    total = 0
    for key, weight in VISION_WEIGHTS.items():
        item = vision_result.get(key, {})
        score = item.get("score", 5) if isinstance(item, dict) else 5
        total += (score / 10.0) * 100 * weight

    return round(total)
