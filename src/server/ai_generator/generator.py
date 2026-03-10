"""
AI 生成服务

负责调用 LLM API 生成组件参数
支持：阿里云通义千问（Qwen）API
"""

import os
import json
import time
from datetime import datetime, date
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# Import prompt and validation functions
from .prompt import get_system_prompt, get_nl_system_prompt, build_user_message
from .validator import validate_component


@dataclass
class GenerateConfig:
    """生成配置"""
    model: str = "qwen-plus"  # 默认模型：阿里云通义千问
    temperature: float = 0.7     # 温度参数
    max_tokens: int = 2000        # 最大 token 数
    timeout: int = 30             # 超时时间（秒）
    api_key: Optional[str] = None   # API Key（可选，从环境变量读取）


class AIGenerator:
    """AI 生成器"""

    def __init__(self, config: GenerateConfig = None):
        self.config = config or GenerateConfig()
        # 优先从参数获取 API Key，否则从环境变量
        self.api_key = self.config.api_key or os.getenv("QWEN_API_KEY")

    def generate(
        self,
        component_type: str,
        theme: str,
        user_params: Dict[str, Any],
        style_preference: str = None
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        生成组件参数

        Args:
            component_type: 组件类型
            theme: 主题
            user_params: 用户已填参数
            style_preference: 用户偏好的风格

        Returns:
            (success, data, error_message)
        """
        try:
            # 构建消息
            system_prompt = get_system_prompt()
            user_message = build_user_message(
                component_type, theme, user_params, style_preference
            )

            # 调用 LLM
            response_text = self._call_llm(system_prompt, user_message)

            # 打印调试信息
            print(f"[DEBUG] LLM Response: {response_text[:500]}")

            # 解析响应
            data = self._parse_response(response_text)

            # 校验结果
            is_valid, errors, cleaned = validate_component(
                component_type, theme, data
            )

            if not is_valid:
                return False, None, f"Validation failed: {', '.join(errors)}"

            # 返回清理后的数据
            result = {
                "component_type": data.get("component_type"),
                "mode": data.get("mode"),
                "theme": data.get("theme"),
                "template_id": data.get("template_id"),
                "style_preset": data.get("style_preset"),
                "params": cleaned
            }

            return True, result, None

        except Exception as e:
            return False, None, str(e)

    def _call_llm(self, system_prompt: str, user_message: str) -> str:
        """调用 LLM API"""
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx is required. Install it with: pip install httpx")

        if not self.api_key:
            # 模拟模式（用于测试）
            return self._mock_response(user_message)

        # 根据不同的 API 提供者调用
        if self.config.model.startswith("qwen"):
            return self._call_qwen(system_prompt, user_message)
        elif self.config.model.startswith("gpt"):
            return self._call_openai(system_prompt, user_message)
        elif self.config.model.startswith("claude"):
            return self._call_anthropic(system_prompt, user_message)
        else:
            # 默认使用 Qwen
            return self._call_qwen(system_prompt, user_message)

    def _call_qwen(self, system_prompt: str, user_message: str) -> str:
        """调用阿里云通义千问 API

        使用 OpenAI 兼容模式
        API 文档: https://help.aliyun.com/zh/model-studio/qwen-api-via-dashscope
        """
        endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

        # 请求体格式（OpenAI 兼容）
        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens
        }

        with httpx.Client(timeout=self.config.timeout) as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            response = client.post(endpoint, json=payload, headers=headers)

            # 打印调试信息
            print(f"[DEBUG] API Request: {payload}")
            print(f"[DEBUG] API Status: {response.status_code}")
            print(f"[DEBUG] API Response: {response.text[:800]}")

            response.raise_for_status()
            result = response.json()
            print(f"[DEBUG] API Parsed JSON: {result}")

            # 解析响应（OpenAI 兼容格式）
            if result.get("choices"):
                content = result["choices"][0]["message"]["content"]
                print(f"[DEBUG] Extracted content: {content[:200]}")
                return content

            raise ValueError(f"Unexpected Qwen API response: {result}")

    def _call_openai(self, system_prompt: str, user_message: str) -> str:
        """调用 OpenAI API"""
        with httpx.Client(timeout=self.config.timeout) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.config.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens
                }
            )

            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    def _call_anthropic(self, system_prompt: str, user_message: str) -> str:
        """调用 Anthropic (Claude) API"""
        with httpx.Client(timeout=self.config.timeout) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.config.model,
                    "max_tokens": self.config.max_tokens,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": user_message}
                    ]
                }
            )

            response.raise_for_status()
            result = response.json()
            return result["content"][0]["text"]

    # 当前支持的组件描述，用于无法识别时给用户提示
    SUPPORTED_WIDGETS = [
        "恋爱纪念日（如：和女朋友6月1日在一起的）",
        "宝宝成长记录（如：宝宝3月15日出生）",
        "放假倒计时（如：国庆倒计时）",
        "每日新闻摘要（如：想看今天的新闻）",
        "闹钟（如：每天早上7点叫我起床）",
    ]

    def generate_from_nl(self, user_text: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        自然语言生成组件参数

        用户输入一句自然语言，AI 理解意图后输出完整的组件参数 JSON。
        如果无法识别用户意图，返回友好的错误提示和建议。

        Args:
            user_text: 用户的自然语言输入

        Returns:
            (success, data, error_message)
        """
        try:
            system_prompt = get_nl_system_prompt()
            user_message = user_text.strip()

            response_text = self._call_llm_nl(system_prompt, user_message)
            print(f"[DEBUG] NL LLM Response: {response_text[:500]}")

            data = self._parse_response(response_text)

            # 检查是否为无法识别的情况
            if data.get("_unrecognized"):
                suggestions = "\n".join(f"  · {s}" for s in self.SUPPORTED_WIDGETS)
                return False, None, f"暂时还不支持这类组件，试试以下场景：\n{suggestions}"

            component_type = data.get("component_type", "")
            theme = data.get("theme", "")

            is_valid, errors, cleaned = validate_component(
                component_type, theme, data
            )

            if not is_valid:
                return False, None, f"Validation failed: {', '.join(errors)}"

            result = {
                "component_type": data.get("component_type"),
                "mode": data.get("mode"),
                "theme": data.get("theme"),
                "template_id": data.get("template_id"),
                "style_preset": data.get("style_preset"),
                "params": cleaned
            }

            return True, result, None

        except Exception as e:
            return False, None, str(e)

    def _call_llm_nl(self, system_prompt: str, user_message: str) -> str:
        """调用 LLM API（自然语言模式）"""
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx is required")

        if not self.api_key:
            return self._mock_nl_response(user_message)

        # 复用已有的 LLM 调用逻辑
        if self.config.model.startswith("qwen"):
            return self._call_qwen(system_prompt, user_message)
        elif self.config.model.startswith("gpt"):
            return self._call_openai(system_prompt, user_message)
        elif self.config.model.startswith("claude"):
            return self._call_anthropic(system_prompt, user_message)
        else:
            return self._call_qwen(system_prompt, user_message)

    def _mock_nl_response(self, user_text: str) -> str:
        """自然语言模式的模拟响应（用于无 API Key 测试）"""
        import re

        text = user_text.lower()
        print(f"[DEBUG] Mock NL response for: {user_text}")

        # 提取日期 — 支持多种格式
        date_match = re.search(r'(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})', user_text)
        time_match = re.search(r'(\d{1,2})[点:：时](\d{0,2})', user_text)

        extracted_date = None
        if date_match:
            y, m, d = date_match.group(1), date_match.group(2).zfill(2), date_match.group(3).zfill(2)
            extracted_date = f"{y}-{m}-{d}"

        extracted_time = None
        if time_match:
            h = time_match.group(1).zfill(2)
            m = time_match.group(2).zfill(2) if time_match.group(2) else "00"
            extracted_time = f"{h}:{m}"

        today = date.today()

        # ---- 意图识别 ----
        # 闹钟
        alarm_keywords = ["闹钟", "起床", "叫我", "提醒我", "早上", "上班"]
        if any(k in text for k in alarm_keywords):
            t = extracted_time or "07:30"
            label = "起床闹钟"
            if "上班" in text or "工作" in text:
                label = "上班提醒"
            elif "健身" in text or "运动" in text or "跑步" in text:
                label = "运动时间"
            repeat = "weekdays"
            if "每天" in text:
                repeat = "daily"
            elif "周末" in text:
                repeat = "weekends"

            return json.dumps({
                "component_type": "alarm",
                "theme": "clock",
                "template_id": "alarm_clock",
                "style_preset": "digital-neon" if "霓虹" in text or "数码" in text else "analog-minimal",
                "params": {"alarm_time": t, "label": label, "repeat": repeat}
            }, ensure_ascii=False)

        # 新闻
        news_keywords = ["新闻", "资讯", "热点", "头条", "每日"]
        if any(k in text for k in news_keywords) and "纪念" not in text:
            return json.dumps({
                "component_type": "news",
                "theme": "daily",
                "template_id": "news_daily",
                "style_preset": "minimal-dark",
                "params": {"category": "tech" if "科技" in text else "general", "max_items": 5}
            }, ensure_ascii=False)

        # 宝宝
        baby_keywords = ["宝宝", "孩子", "出生", "满月", "周岁", "儿子", "女儿", "baby"]
        if any(k in text for k in baby_keywords):
            d = extracted_date or today.isoformat()
            days_diff = (today - date.fromisoformat(d)).days if d <= today.isoformat() else 0
            subtitle = self._generate_nl_subtitle("baby", days_diff, user_text)
            title = "宝宝成长记"
            # 从用户输入中提取名字
            name_match = re.search(r'(?:叫|叫做|名字是|名叫)[\s]*([^\s,，。、]{1,4})', user_text)
            if name_match:
                title = f"{name_match.group(1)}的成长记"
            return json.dumps({
                "component_type": "anniversary", "mode": "countup", "theme": "baby",
                "template_id": "anniversary_baby", "style_preset": "soft-purple",
                "params": {"title": title[:20], "start_date": d, "subtitle": subtitle}
            }, ensure_ascii=False)

        # 放假/倒计时
        holiday_keywords = ["放假", "倒计时", "假期", "国庆", "春节", "五一", "元旦", "过年", "中秋", "端午"]
        if any(k in text for k in holiday_keywords):
            # 推断目标日期
            if extracted_date:
                target = extracted_date
            elif "国庆" in text:
                target = f"{today.year}-10-01"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-10-01"
            elif "春节" in text or "过年" in text:
                # 简化处理：大约1月底/2月初
                target = f"{today.year + 1}-01-29"
            elif "五一" in text:
                target = f"{today.year}-05-01"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-05-01"
            elif "元旦" in text:
                target = f"{today.year + 1}-01-01"
            elif "中秋" in text:
                target = f"{today.year}-09-17"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-09-17"
            else:
                target = f"{today.year}-10-01"

            days_left = (date.fromisoformat(target) - today).days
            title = "假期倒计时"
            if "国庆" in text:
                title = "国庆快乐"
            elif "春节" in text or "过年" in text:
                title = "春节倒计时"
            elif "五一" in text:
                title = "五一假期"

            subtitle = self._generate_nl_subtitle("holiday", days_left, user_text)
            return json.dumps({
                "component_type": "anniversary", "mode": "countdown", "theme": "holiday",
                "template_id": "anniversary_holiday", "style_preset": "vibrant-orange",
                "params": {"title": title[:20], "target_date": target, "subtitle": subtitle}
            }, ensure_ascii=False)

        # 恋爱 / 纪念日
        love_keywords = ["恋爱", "在一起", "结婚", "纪念", "另一半", "女朋友", "男朋友", "老婆", "老公", "对象", "爱"]
        if any(k in text for k in love_keywords) or extracted_date:
            d = extracted_date or "2024-06-01"
            days_diff = (today - date.fromisoformat(d)).days if d <= today.isoformat() else 0
            subtitle = self._generate_nl_subtitle("love", days_diff, user_text)
            title = "恋爱纪念"
            if "结婚" in text:
                title = "结婚纪念日"
            return json.dumps({
                "component_type": "anniversary", "mode": "countup", "theme": "love",
                "template_id": "anniversary_love", "style_preset": "sweet-pink",
                "params": {"title": title[:20], "start_date": d, "subtitle": subtitle}
            }, ensure_ascii=False)

        # 兜底：无法识别意图，返回特殊标记
        return json.dumps({
            "_unrecognized": True,
            "_user_text": user_text
        }, ensure_ascii=False)

    def _generate_nl_subtitle(self, theme: str, days_diff: int, user_text: str) -> str:
        """为自然语言模式生成有创意的副标题"""
        days_abs = abs(days_diff)

        if theme == "love":
            if days_abs <= 30:
                options = ["甜蜜的开始", "每一刻都是心动", "最好的日子刚刚开始"]
            elif days_abs <= 100:
                options = ["每一天都算数", "爱在日常里生长", "100天的小确幸"]
            elif days_abs <= 365:
                options = ["爱已悄然生长", "最好的时光是有你的日子", "日子有你才完整"]
            elif days_abs <= 730:
                options = ["两年了，依然心动", "时光温柔，因为有你", "爱已满两载春秋"]
            elif days_abs <= 1095:
                options = ["三年如一日的心动", "时光不负深情", "千日情深"]
            else:
                options = ["余生都是你", "岁月流转，爱意永驻", "最长情的告白"]
            return options[days_abs % len(options)]

        elif theme == "baby":
            if days_abs <= 7:
                options = ["欢迎来到这个世界", "小天使降临", "你是最好的礼物"]
            elif days_abs <= 30:
                options = ["小小的你，大大的世界", "每天都在长大", "满月快乐"]
            elif days_abs <= 100:
                options = ["百天的小可爱", "每一天都是新奇迹", "茁壮成长中"]
            elif days_abs <= 365:
                options = ["一岁啦！", "第一年的精彩", "从爬到走的日子"]
            else:
                options = ["时光见证你的成长", "每一天都在闪光", "最棒的小朋友"]
            return options[days_abs % len(options)]

        elif theme == "holiday":
            if days_diff <= 0:
                options = ["假期快乐！", "放假啦！", "享受假期吧"]
            elif days_diff <= 3:
                options = ["再坚持一下就放假啦", "近在眼前的快乐", "倒计时开始！"]
            elif days_diff <= 7:
                options = ["一周后见，快乐", "假期在向你招手", "快了快了"]
            elif days_diff <= 30:
                options = ["期待的心情最美好", "每天都在靠近假期", "值得等待的快乐"]
            else:
                options = ["美好的事情值得等待", "心里有期待，日子就有光", "遥远但值得"]
            return options[days_abs % len(options)]

        return "每一天都值得记录"

    def _mock_response(self, user_message: str) -> str:
        """模拟响应（用于测试）"""
        # 尝试从用户消息中提取参数
        import re

        print(f"[DEBUG] Mock response called with user_message: {user_message[:300]}")

        # 提取用户输入的参数（在行内匹配，避免匹配到换行符之后的内容）
        date_match = re.search(r'-\s*date:\s*([-\d]+)', user_message)
        style_match = re.search(r'用户选择的风格[：:]\s*([^\n\r]+)', user_message)
        message_match = re.search(r'-\s*message:\s*([^\n\r]+)', user_message)
        label_match = re.search(r'-\s*label:\s*([^\n\r]+)', user_message)
        time_match = re.search(r'-\s*time:\s*([:\d]+)', user_message)
        title_match = re.search(r'-\s*title:\s*([^\n\r]+)', user_message)

        user_date = date_match.group(1) if date_match else None
        user_style = style_match.group(1) if style_match else None
        user_message_text = message_match.group(1) if message_match else None
        user_label = label_match.group(1) if label_match else None
        user_time = time_match.group(1) if time_match else None
        user_title = title_match.group(1) if title_match else None

        # 计算天数差值，用于生成个性化文案
        def calculate_days_diff(input_date):
            """计算输入日期与今天的差值天数"""
            if not input_date:
                return 0
            try:
                # 尝试解析日期格式 YYYY-MM-DD 或 DD/MM/YYYY
                if '/' in input_date:
                    day, month, year = map(int, input_date.split('/'))
                    input_dt = date(year, month, day)
                else:
                    input_dt = date.fromisoformat(input_date)

                today = date.today()
                diff = (input_dt - today).days
                return diff
            except:
                return 0

        # 生成个性化文案（根据天数差值）
        def generate_personalized_subtitle(theme, days_diff, user_input):
            """根据主题和天数生成个性化文案"""
            if user_input and len(user_input.strip()) > 0:
                return user_input.strip()[:30]

            days_abs = abs(days_diff)

            if theme == "love":
                # 恋爱主题：根据时间长度生成不同文案
                if days_diff < 0:
                    # 还没开始
                    suffixes = ["期待着与你的开始", "倒数计时中", "美好即将开始"]
                elif days_diff <= 30:
                    suffixes = ["每一刻都甜蜜", "爱的初体验", "新的开始"]
                elif days_diff <= 100:
                    suffixes = ["每一天都算数", "最好的时光", "爱在日常"]
                elif days_diff <= 365:
                    suffixes = ["爱已悄然生长", "温暖相伴四季", "深情已满百天"]
                elif days_diff <= 730:
                    suffixes = ["爱已满两载", "时光温柔见证", "两年的心动"]
                elif days_diff <= 1095:
                    suffixes = ["爱已三年整", "三年美好同行", "时光不负深情"]
                elif days_diff <= 1460:
                    suffixes = ["四载爱意盎然", "四年温暖相伴", "爱已深植心底"]
                elif days_diff <= 1825:
                    suffixes = ["五载情深似海", "五年心手相牵", "爱已五载春秋"]
                else:
                    suffixes = ["爱长存，时光不负", "经年累月，情深如初", "岁月流转，爱意永驻"]
                return suffixes[days_abs % len(suffixes)]

            elif theme == "baby":
                # 宝宝主题：根据天数生成不同文案
                if days_diff < 0:
                    suffixes = ["期待你的到来", "宝宝即将降临"]
                elif days_diff <= 7:
                    suffixes = ["初来人间", "初生的小天使", "欢迎你，小宝贝"]
                elif days_diff <= 30:
                    suffixes = ["慢慢长大不着急", "每一天都是新的奇迹", "小生命大精彩"]
                elif days_diff <= 100:
                    suffixes = ["百日快乐", "百日初成长", "百天的小可爱"]
                elif days_diff <= 365:
                    suffixes = ["一周岁了", "一岁啦", "周岁快乐"]
                elif days_diff <= 730:
                    suffixes = ["两周岁了", "两岁啦", "小小的你长大了"]
                elif days_diff <= 1095:
                    suffixes = ["三周岁快乐", "三岁的小勇士", "三岁了更懂事"]
                elif days_diff <= 1460:
                    suffixes = ["四周岁了", "四岁的小探险家", "四岁的你真棒"]
                elif days_diff <= 1825:
                    suffixes = ["五周岁快乐", "五岁的小大人", "五岁的你真厉害"]
                else:
                    suffixes = ["茁壮成长", "时光见证成长", "你是最棒的宝贝"]
                return suffixes[days_abs % len(suffixes)]

            elif theme == "holiday":
                # 放假主题：根据倒计时天数生成不同文案
                if days_diff <= 1:
                    suffixes = ["明天就放假啦", "假期即将到来", "再坚持一下"]
                elif days_diff <= 3:
                    suffixes = ["还有几天就放假", "期待的心情", "值得期待"]
                elif days_diff <= 7:
                    suffixes = ["一周后放假", "倒计时进行中", "美好的等待"]
                elif days_diff <= 14:
                    suffixes = ["两周后放假", "期待在升温", "值得等待"]
                elif days_diff <= 30:
                    suffixes = ["月底放假", "期待满满的", "假期在向你招手"]
                else:
                    suffixes = ["美好的事情值得等待", "耐心等待假期到来", "值得期待的时光"]
                return suffixes[days_abs % len(suffixes)]

            return user_input[:30] if user_input else "每一天都算数"

        # 构建响应数据，使用 json.dumps 确保 JSON 格式正确
        result = None

        if "恋爱" in user_message or "love" in user_message.lower():
            days_diff = calculate_days_diff(user_date or "2024-06-01")
            subtitle = generate_personalized_subtitle("love", days_diff, user_message_text)
            result = {
                "component_type": "anniversary",
                "mode": "countup",
                "theme": "love",
                "template_id": "anniversary_love",
                "style_preset": user_style or "sweet-pink",
                "params": {
                    "title": "恋爱纪念",
                    "start_date": user_date or "2024-06-01",
                    "subtitle": subtitle
                }
            }
        elif "宝宝" in user_message or "baby" in user_message.lower():
            days_diff = calculate_days_diff(user_date or "2024-06-01")
            subtitle = generate_personalized_subtitle("baby", days_diff, user_message_text)
            result = {
                "component_type": "anniversary",
                "mode": "countup",
                "theme": "baby",
                "template_id": "anniversary_baby",
                "style_preset": user_style or "soft-purple",
                "params": {
                    "title": "宝宝成长",
                    "start_date": user_date or "2024-06-01",
                    "subtitle": subtitle
                }
            }
        elif "放假" in user_message or "倒计时" in user_message:
            days_diff = calculate_days_diff(user_date or "2025-10-01")
            subtitle = generate_personalized_subtitle("holiday", days_diff, user_message_text)
            title = (user_title or "假期倒计时")[:20]
            result = {
                "component_type": "anniversary",
                "mode": "countdown",
                "theme": "holiday",
                "template_id": "anniversary_holiday",
                "style_preset": user_style or "vibrant-orange",
                "params": {
                    "title": title,
                    "target_date": user_date or "2025-10-01",
                    "subtitle": subtitle
                }
            }
        elif "新闻" in user_message or "news" in user_message.lower():
            result = {
                "component_type": "news",
                "template_id": "news_daily",
                "style_preset": user_style or "minimal-dark",
                "params": {
                    "category": "general",
                    "max_items": 5
                }
            }
        elif "闹钟" in user_message or "alarm" in user_message.lower():
            result = {
                "component_type": "alarm",
                "template_id": "alarm_clock",
                "style_preset": user_style or "analog-minimal",
                "params": {
                    "alarm_time": user_time or "07:30",
                    "label": user_label or "工作日闹钟",
                    "repeat": "weekdays"
                }
            }
        else:
            subtitle = (user_message_text or "每一天都算数")[:30]
            result = {
                "component_type": "anniversary",
                "mode": "countup",
                "theme": "love",
                "template_id": "anniversary_love",
                "style_preset": user_style or "sweet-pink",
                "params": {
                    "title": "恋爱纪念",
                    "start_date": user_date or "2023-01-01",
                    "subtitle": subtitle
                }
            }

        return json.dumps(result, ensure_ascii=False)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """解析 LLM 响应"""
        # 清理可能的 markdown 代码块标记
        text = response_text.strip()

        # 移除 markdown 代码块
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        print(f"[DEBUG] Parsing response: {text[:200]}")

        try:
            result = json.loads(text)
            print(f"[DEBUG] Parsed result: {result}")
            return result
        except json.JSONDecodeError as e:
            # 尝试提取 JSON（处理可能的额外文本）
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise ValueError(f"Failed to parse AI response as JSON: {e}")


# 单例
_generator = None


def get_generator(config: GenerateConfig = None) -> AIGenerator:
    """获取生成器单例"""
    global _generator
    if _generator is None or config:
        _generator = AIGenerator(config)
    return _generator


async def generate_widget(
    component_type: str,
    theme: str,
    user_params: Dict[str, Any],
    style_preference: str = None
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """异步生成组件参数（结构化模式）"""
    generator = get_generator()
    return generator.generate(component_type, theme, user_params, style_preference)


async def generate_widget_from_nl(
    user_text: str
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """异步生成组件参数（自然语言模式）"""
    generator = get_generator()
    return generator.generate_from_nl(user_text)
