"""
AI 生成服务

负责调用 LLM API 生成组件参数
支持：阿里云通义千问（Qwen）API
"""

import os
import json
import time
import random
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# Import prompt and validation functions
from .prompt import get_system_prompt, get_nl_system_prompt, get_code_gen_system_prompt, build_user_message
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

            # 自动修正 LLM 常见错误
            data = self._fix_llm_output(data, component_type, theme)

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
        "实时天气（如：北京今天天气怎么样）",
        "音乐播放器（如：给我来个音乐播放器）",
        "日历日程（如：今天有什么会议）",
    ]

    # ── 组件中文名映射 ──
    COMP_NAMES = {
        ("anniversary", "love"): "恋爱纪念日",
        ("anniversary", "baby"): "宝宝成长记录",
        ("anniversary", "holiday"): "放假倒计时",
        ("anniversary", "warm"): "暖橙纪念",
        ("news", "daily"): "每日新闻",
        ("alarm", "clock"): "智能闹钟",
        ("weather", "realtime"): "实时天气",
        ("music", "player"): "音乐播放器",
        ("calendar", "schedule"): "日历日程",
    }

    STYLE_CN = {"glass": "毛玻璃", "minimal": "极简", "material": "质感", "pixel": "像素"}

    def build_description(self, data: dict) -> str:
        """从结构化参数拼出中文摘要，不依赖 LLM"""
        COLOR_REVERSE = {v: k for k, v in self.COLOR_KEYWORDS.items() if len(k) >= 2}

        name = self.COMP_NAMES.get((data.get("component_type"), data.get("theme")), "卡片")
        parts = [f"一张「{name}」卡片"]
        params = data.get("params", {})
        if params.get("title"):
            parts.append(f"标题「{params['title']}」")
        if data.get("primary_color"):
            cn = COLOR_REVERSE.get(data["primary_color"], data["primary_color"])
            parts.append(f"{cn}色调")
        if data.get("visual_style"):
            parts.append(f"{self.STYLE_CN.get(data['visual_style'], '毛玻璃')}风格")
        if params.get("subtitle"):
            parts.append(f"文案「{params['subtitle']}」")
        # 特殊字段
        if params.get("city"):
            parts.append(f"城市「{params['city']}」")
        if params.get("song_name"):
            parts.append(f"歌曲「{params['song_name']}」")
        if params.get("alarm_time"):
            parts.append(f"时间 {params['alarm_time']}")
        return "，".join(parts)

    def generate_from_nl(self, user_text: str, base_data: dict = None) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        自然语言生成组件参数

        用户输入一句自然语言，AI 理解意图后输出完整的组件参数 JSON。
        如果无法识别用户意图，返回友好的错误提示和建议。

        Args:
            user_text: 用户的自然语言输入
            base_data: 已有参数（用于微调合并）

        Returns:
            (success, data, error_message)
        """
        try:
            system_prompt = get_nl_system_prompt()
            user_message = user_text.strip()

            response_text = self._call_llm_nl(system_prompt, user_message, base_data=base_data)
            print(f"[DEBUG] NL LLM Response: {response_text[:500]}")

            data = self._parse_response(response_text)

            component_type = data.get("component_type", "")
            theme = data.get("theme", "")

            # 自动修正 LLM 常见错误
            data = self._fix_llm_output(data, component_type, theme)
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

            # 透传 primary_color 和 visual_style
            if data.get("primary_color"):
                result["primary_color"] = data["primary_color"]
            if data.get("visual_style"):
                result["visual_style"] = data["visual_style"]

            # 微调反馈：对比 base_data 和 result，输出修改列表
            if base_data:
                changes = self._diff_params(base_data, result)
                result["changes_applied"] = changes
                if not changes:
                    result["unable_to_modify"] = "未检测到变化，可能不支持此修改"

            return True, result, None

        except Exception as e:
            return False, None, str(e)

    def generate_from_nl_debug(self, user_text: str, base_data: dict = None) -> Dict[str, Any]:
        """
        调试模式：返回完整 pipeline 中间数据

        Returns:
            包含各阶段详情的 dict（始终返回，不抛异常）
        """
        debug = {
            "input": {"user_text": user_text, "base_data": base_data, "model": self.config.model, "has_api_key": bool(self.api_key)},
            "prompt": {},
            "llm_response": {},
            "parse": {},
            "fix": {},
            "validate": {},
            "result": {},
            "timeline": [],
            "success": False,
            "error": None,
        }

        import time as _t

        try:
            t0 = _t.time()

            # ── Stage 1: Prompt construction ──
            system_prompt = get_nl_system_prompt()
            user_message = user_text.strip()
            llm_message = user_message
            if base_data:
                import json as _json
                llm_message += f"\n\n当前卡片参数（用户要求微调，请理解用户意图后输出修改后的完整 JSON）：\n{_json.dumps(base_data, ensure_ascii=False)}"

            debug["prompt"] = {
                "system_prompt_length": len(system_prompt),
                "system_prompt_preview": system_prompt[:300] + "..." if len(system_prompt) > 300 else system_prompt,
                "user_message": llm_message,
                "mode": "mock" if not self.api_key else "api",
                "is_finetune": bool(base_data),
            }
            debug["timeline"].append({"stage": "prompt_built", "elapsed_ms": int((_t.time() - t0) * 1000)})

            # ── Stage 2: LLM call ──
            t1 = _t.time()
            response_text = self._call_llm_nl(system_prompt, user_message, base_data=base_data)
            llm_elapsed = _t.time() - t1

            debug["llm_response"] = {
                "raw": response_text,
                "length": len(response_text),
                "elapsed_ms": int(llm_elapsed * 1000),
            }
            debug["timeline"].append({"stage": "llm_responded", "elapsed_ms": int((_t.time() - t0) * 1000)})

            # ── Stage 3: Parse ──
            t2 = _t.time()
            data = self._parse_response(response_text)
            debug["parse"] = {
                "parsed_json": data,
                "component_type": data.get("component_type"),
                "theme": data.get("theme"),
                "template_id": data.get("template_id"),
                "elapsed_ms": int((_t.time() - t2) * 1000),
            }
            debug["timeline"].append({"stage": "parsed", "elapsed_ms": int((_t.time() - t0) * 1000)})

            # ── Stage 4: Fix ──
            t3 = _t.time()
            component_type = data.get("component_type", "")
            theme = data.get("theme", "")
            pre_fix = json.dumps(data, ensure_ascii=False)
            data = self._fix_llm_output(data, component_type, theme)
            post_fix = json.dumps(data, ensure_ascii=False)
            component_type = data.get("component_type", "")
            theme = data.get("theme", "")

            debug["fix"] = {
                "changed": pre_fix != post_fix,
                "before": json.loads(pre_fix) if pre_fix != post_fix else None,
                "after": data if pre_fix != post_fix else None,
                "component_type": component_type,
                "theme": theme,
                "elapsed_ms": int((_t.time() - t3) * 1000),
            }
            debug["timeline"].append({"stage": "fixed", "elapsed_ms": int((_t.time() - t0) * 1000)})

            # ── Stage 5: Validate ──
            t4 = _t.time()
            is_valid, errors_or_warnings, cleaned = validate_component(component_type, theme, data)

            debug["validate"] = {
                "is_valid": is_valid,
                "errors": errors_or_warnings if not is_valid else None,
                "warnings": errors_or_warnings if is_valid else None,
                "cleaned_params": cleaned,
                "elapsed_ms": int((_t.time() - t4) * 1000),
            }
            debug["timeline"].append({"stage": "validated", "elapsed_ms": int((_t.time() - t0) * 1000)})

            if not is_valid:
                debug["error"] = f"Validation failed: {', '.join(errors_or_warnings or [])}"
                debug["timeline"].append({"stage": "failed", "elapsed_ms": int((_t.time() - t0) * 1000)})
                return debug

            # ── Stage 6: Build result ──
            result = {
                "component_type": data.get("component_type"),
                "mode": data.get("mode"),
                "theme": data.get("theme"),
                "template_id": data.get("template_id"),
                "style_preset": data.get("style_preset"),
                "params": cleaned
            }
            if data.get("primary_color"):
                result["primary_color"] = data["primary_color"]
            if data.get("visual_style"):
                result["visual_style"] = data["visual_style"]

            if base_data:
                changes = self._diff_params(base_data, result)
                result["changes_applied"] = changes

            description = self.build_description(result)
            result["description"] = description

            debug["result"] = result
            debug["success"] = True
            debug["timeline"].append({"stage": "completed", "elapsed_ms": int((_t.time() - t0) * 1000)})

            return debug

        except Exception as e:
            debug["error"] = str(e)
            debug["timeline"].append({"stage": "error", "elapsed_ms": 0})
            return debug

    @staticmethod
    def _diff_params(old_data: dict, new_data: dict) -> list:
        """对比新旧参数，返回可读的修改列表"""
        changes = []
        old_params = old_data.get("params", {})
        new_params = new_data.get("params", {})

        # 对比顶层字段
        for key in ["primary_color", "visual_style", "style_preset", "theme"]:
            old_val = old_data.get(key)
            new_val = new_data.get(key)
            if old_val != new_val and new_val:
                changes.append(f"{key}: {old_val} → {new_val}")

        # 对比 params 内字段
        all_keys = set(list(old_params.keys()) + list(new_params.keys()))
        for key in sorted(all_keys):
            old_val = old_params.get(key)
            new_val = new_params.get(key)
            if old_val != new_val:
                if old_val is None:
                    changes.append(f"新增 {key}: {new_val}")
                elif new_val is None:
                    changes.append(f"移除 {key}")
                else:
                    old_str = str(old_val)[:30]
                    new_str = str(new_val)[:30]
                    changes.append(f"{key}: {old_str} → {new_str}")

        return changes

    def generate_code_from_nl(self, user_text: str) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        AI编程模式：LLM 直接生成完整 HTML/CSS/JS 代码

        不支持 Mock 模式，必须有 API Key。

        Returns:
            (success, data, error_message)
        """
        if not self.api_key:
            return False, None, "AI编程模式需要配置 API Key"

        try:
            system_prompt = get_code_gen_system_prompt()
            user_message = user_text.strip()

            # 代码生成用更大的 max_tokens、更长的超时、更快的模型
            saved_max_tokens = self.config.max_tokens
            saved_timeout = self.config.timeout
            saved_model = self.config.model
            self.config.max_tokens = 4000
            self.config.timeout = 120
            # 代码生成用 qwen-turbo-latest（~24s，稳定不超时）
            if self.config.model.startswith("qwen"):
                self.config.model = "qwen-turbo-latest"

            try:
                if self.config.model.startswith("qwen"):
                    response_text = self._call_qwen(system_prompt, user_message)
                elif self.config.model.startswith("gpt"):
                    response_text = self._call_openai(system_prompt, user_message)
                elif self.config.model.startswith("claude"):
                    response_text = self._call_anthropic(system_prompt, user_message)
                else:
                    response_text = self._call_qwen(system_prompt, user_message)
            finally:
                self.config.max_tokens = saved_max_tokens
                self.config.timeout = saved_timeout
                self.config.model = saved_model

            print(f"[DEBUG] Code Gen LLM Response length: {len(response_text)}")

            # 提取 HTML（去除 markdown 代码围栏）
            html = response_text.strip()
            if html.startswith("```html"):
                html = html[7:]
            elif html.startswith("```"):
                html = html[3:]
            if html.endswith("```"):
                html = html[:-3]
            html = html.strip()

            # 安全校验
            is_valid, error = self._validate_generated_code(html)
            if not is_valid:
                return False, None, f"代码安全校验失败: {error}"

            return True, {
                "generation_mode": "code",
                "html_content": html,
                "description": f"AI编程生成: {user_text[:30]}",
            }, None

        except Exception as e:
            return False, None, str(e)

    def _validate_generated_code(self, html: str) -> Tuple[bool, Optional[str]]:
        """校验 AI 生成的 HTML 代码安全性"""
        import re

        if not html:
            return False, "生成内容为空"

        # 基本结构检查
        if "<!DOCTYPE" not in html.upper() and "<html" not in html.lower():
            return False, "缺少基本 HTML 结构"

        # 大小限制
        if len(html.encode('utf-8')) > 100 * 1024:
            return False, "代码超过 100KB 限制"

        # 禁止模式扫描
        forbidden = [
            (r'fetch\s*\(', 'fetch() 调用'),
            (r'XMLHttpRequest', 'XMLHttpRequest'),
            (r'localStorage', 'localStorage'),
            (r'sessionStorage', 'sessionStorage'),
            (r'eval\s*\(', 'eval() 调用'),
            (r'document\.cookie', 'document.cookie'),
            (r'<script\s+src\s*=', '外部脚本引用'),
            (r'<link[^>]+href\s*=\s*["\']https?://', '外部样式表引用'),
        ]

        for pattern, desc in forbidden:
            if re.search(pattern, html, re.IGNORECASE):
                return False, f"包含禁止内容: {desc}"

        return True, None

    def _call_llm_nl(self, system_prompt: str, user_message: str, base_data: dict = None) -> str:
        """调用 LLM API（自然语言模式）"""
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx is required")

        if not self.api_key:
            # mock 模式用原始文本，不注入 JSON
            return self._mock_nl_response(user_message, base_data=base_data)

        # 微调模式：将 base_data 注入 user message（仅 LLM 调用）
        llm_message = user_message
        if base_data:
            llm_message += f"\n\n当前卡片参数（用户要求微调，请理解用户意图后输出修改后的完整 JSON）：\n{json.dumps(base_data, ensure_ascii=False)}"

        # 复用已有的 LLM 调用逻辑
        if self.config.model.startswith("qwen"):
            return self._call_qwen(system_prompt, llm_message)
        elif self.config.model.startswith("gpt"):
            return self._call_openai(system_prompt, llm_message)
        elif self.config.model.startswith("claude"):
            return self._call_anthropic(system_prompt, llm_message)
        else:
            return self._call_qwen(system_prompt, llm_message)

    # ── 颜色关键词映射 ──
    COLOR_KEYWORDS = {
        "红": "#CC2244", "红色": "#CC2244", "red": "#CC2244",
        "深红": "#991133", "深红色": "#991133", "暗红": "#991133",
        "酒红": "#882244", "酒红色": "#882244",
        "蓝": "#2255CC", "蓝色": "#2255CC", "blue": "#2255CC",
        "天蓝": "#44AADD", "天蓝色": "#44AADD",
        "深蓝": "#1133AA", "深蓝色": "#1133AA",
        "浅蓝": "#66BBEE", "浅蓝色": "#66BBEE",
        "宝蓝": "#2244BB", "宝蓝色": "#2244BB",
        "湖蓝": "#3399BB", "湖蓝色": "#3399BB",
        "粉": "#CC6688", "粉色": "#CC6688", "粉红": "#CC6688", "pink": "#CC6688",
        "浅粉": "#DDAABB", "浅粉色": "#DDAABB",
        "樱花粉": "#EE99AA", "樱花": "#EE99AA",
        "绿": "#22AA66", "绿色": "#22AA66", "green": "#22AA66",
        "薄荷": "#55CCAA", "薄荷绿": "#55CCAA", "薄荷色": "#55CCAA",
        "深绿": "#117744", "深绿色": "#117744",
        "浅绿": "#77DDAA", "浅绿色": "#77DDAA",
        "金": "#CCAA33", "金色": "#CCAA33", "gold": "#CCAA33", "yellow": "#CCAA33",
        "鹅黄": "#DDCC66", "鹅黄色": "#DDCC66",
        "紫": "#8844CC", "紫色": "#8844CC", "purple": "#8844CC",
        "深紫": "#6622AA", "深紫色": "#6622AA",
        "淡紫": "#AA77DD", "淡紫色": "#AA77DD", "浅紫": "#AA77DD",
        "橙": "#CC6622", "橙色": "#CC6622", "orange": "#CC6622",
        "青": "#22AAAA", "青色": "#22AAAA", "cyan": "#22AAAA",
        "白": "#AABBCC", "白色": "#AABBCC", "white": "#AABBCC",
        "黑": "#334455", "黑色": "#334455", "black": "#334455",
        "玫瑰": "#CC4466", "玫瑰金": "#CC8877", "玫瑰红": "#CC3355",
        "霓虹紫": "#8844CC", "霓虹": "#8844CC",
        "香槟": "#CCAA66", "香槟色": "#CCAA66",
        "珊瑚": "#DD6655", "珊瑚色": "#DD6655",
        "灰": "#778899", "灰色": "#778899", "银灰": "#99AABB",
        "咖啡": "#886644", "咖啡色": "#886644", "棕色": "#886644", "棕": "#886644",
        "米色": "#CCBB99", "米白": "#CCBB99",
    }

    # ── 语义→视觉风格映射 ──
    STYLE_KEYWORDS = {
        "minimal": ["简约", "简洁", "极简", "商务", "专业", "正式", "科技", "未来", "极客", "minimal", "minimalist", "simple", "clean"],
        "material": ["活力", "青春", "运动", "大胆", "个性", "潮流", "material", "bold", "vibrant"],
        "pixel": ["复古", "怀旧", "童年", "像素", "8bit", "像素风", "pixel", "retro", "8-bit"],
        "glass": ["浪漫", "温柔", "甜蜜", "优雅", "高级", "奢华", "自然", "清新", "治愈", "glass", "blur", "frosted", "毛玻璃"],
    }

    def _extract_color(self, text: str) -> Optional[str]:
        """从用户输入提取颜色 hex（长关键词优先匹配）"""
        import re
        # 直接 hex
        hex_match = re.search(r'#[0-9A-Fa-f]{6}', text)
        if hex_match:
            return hex_match.group()
        # 按关键词长度降序匹配，确保"天蓝色"优先于"蓝"
        for kw in sorted(self.COLOR_KEYWORDS.keys(), key=len, reverse=True):
            if kw in text:
                return self.COLOR_KEYWORDS[kw]
        return None

    def _extract_visual_style(self, text: str) -> Optional[str]:
        """从用户输入提取视觉风格"""
        for style, keywords in self.STYLE_KEYWORDS.items():
            for kw in keywords:
                if kw in text:
                    return style
        return None

    def _extract_date_enhanced(self, user_text: str, today: date, prefer_past: bool = False) -> Optional[str]:
        """增强日期提取：支持明天/后天/下周X/X月X日/N周年反推
        prefer_past: True时，X月X日如果已过则保留当年（用于start_date等过去日期场景）
        """
        import re
        text = user_text

        # 标准格式: 2024-06-01 or 2024年6月1日
        date_match = re.search(r'(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})', text)
        if date_match:
            y, m, d = date_match.group(1), date_match.group(2).zfill(2), date_match.group(3).zfill(2)
            return f"{y}-{m}-{d}"

        # 明天/后天/大后天
        if "大后天" in text:
            return (today + timedelta(days=3)).isoformat()
        if "后天" in text:
            return (today + timedelta(days=2)).isoformat()
        if "明天" in text:
            return (today + timedelta(days=1)).isoformat()

        # 下周X
        weekday_map = {"一": 0, "二": 1, "三": 2, "四": 3, "五": 4, "六": 5, "日": 6, "天": 6}
        weekday_match = re.search(r'下周([一二三四五六日天])', text)
        if weekday_match:
            target_wd = weekday_map.get(weekday_match.group(1), 0)
            current_wd = today.weekday()
            days_ahead = (target_wd - current_wd + 7) % 7 + 7  # next week
            return (today + timedelta(days=days_ahead)).isoformat()

        # X月X日 (无年份)
        short_date = re.search(r'(\d{1,2})[月](\d{1,2})[日号]', text)
        if short_date:
            m, d = int(short_date.group(1)), int(short_date.group(2))
            target = date(today.year, m, d)
            if not prefer_past and target < today:
                # 未来日期场景：已过则取明年
                target = date(today.year + 1, m, d)
            # prefer_past: 保留当年（宝宝出生日/恋爱纪念日等）
            return target.isoformat()

        return None

    def _extract_anniversary_years(self, text: str) -> Optional[int]:
        """提取周年数：'十周年' → 10"""
        import re
        cn_num = {"一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
                  "二十": 20, "三十": 30, "四十": 40, "五十": 50}
        match = re.search(r'(\d+|[一二三四五六七八九十百]+)\s*(?:周年|年)', text)
        if match:
            val = match.group(1)
            if val.isdigit():
                return int(val)
            return cn_num.get(val)
        return None

    def _extract_days_milestone(self, text: str) -> Optional[int]:
        """提取天数里程碑：'100天' → 100"""
        import re
        match = re.search(r'(\d+)\s*天', text)
        if match:
            return int(match.group(1))
        return None

    def _build_result(self, base: dict, text: str) -> str:
        """构建结果 JSON，自动注入 primary_color 和 visual_style"""
        color = self._extract_color(text)
        visual = self._extract_visual_style(text)
        if color:
            base["primary_color"] = color
            # 当有自定义颜色时，style_preset 设为 dynamic
            base["style_preset"] = "dynamic"
        if visual:
            base["visual_style"] = visual
        return json.dumps(base, ensure_ascii=False)

    @staticmethod
    def _extract_bracketed(text: str) -> dict:
        """提取「content」括号内容及其前缀字段提示"""
        import re
        results = {}
        for match in re.finditer(
            r'(标题|副标题|歌名|歌手|歌词|城市名?|标签|日程标题|建议穿搭?|suggestion)(?:是|为)?[「\s]*「([^」]+)」',
            text
        ):
            results[match.group(1)] = match.group(2)
        # 简化匹配：直接 field「value」
        for match in re.finditer(r'(标题|副标题|歌名|歌手|歌词|城市名?|标签|日程标题|建议穿搭?)(?:是|为)?「([^」]+)」', text):
            if match.group(1) not in results:
                results[match.group(1)] = match.group(2)
        return results

    def _mock_refine_response(self, user_text: str, base_data: dict) -> str:
        """mock 模式微调 — 关键词提取 + 合并（能力有限，仅 dev 用）"""
        import copy
        merged = copy.deepcopy(base_data)

        color = self._extract_color(user_text)
        style = self._extract_visual_style(user_text)
        bracketed = self._extract_bracketed(user_text)

        if color:
            merged["primary_color"] = color
            merged["style_preset"] = "dynamic"
        if style:
            merged["visual_style"] = style
        if bracketed.get("标题"):
            merged.setdefault("params", {})["title"] = bracketed["标题"][:20]
        if bracketed.get("副标题"):
            merged.setdefault("params", {})["subtitle"] = bracketed["副标题"]
        if bracketed.get("歌名"):
            merged.setdefault("params", {})["song_name"] = bracketed["歌名"]
        if bracketed.get("歌手"):
            merged.setdefault("params", {})["artist"] = bracketed["歌手"]
        if bracketed.get("城市") or bracketed.get("城市名"):
            merged.setdefault("params", {})["city"] = bracketed.get("城市") or bracketed.get("城市名")

        return json.dumps(merged, ensure_ascii=False)

    def _detect_intent_change(self, user_text: str, base_data: dict) -> bool:
        """检测用户是否改变了意图（出现了不同类型的关键词）"""
        text = user_text.lower()
        current_type = base_data.get("component_type", "")

        type_keywords = {
            "alarm": ["闹钟", "起床", "叫我", "提醒我", "alarm"],
            "news": ["新闻", "资讯", "热点", "头条", "news"],
            "weather": ["天气", "温度", "穿什么", "下雨", "weather"],
            "music": ["音乐", "歌", "播放", "听歌", "播放器", "music"],
            "calendar": ["日历", "日程", "安排", "会议", "calendar"],
            "anniversary": ["纪念", "在一起", "结婚", "放假", "倒计时", "宝宝", "恋爱"],
        }

        for comp_type, keywords in type_keywords.items():
            if comp_type != current_type and any(k in text for k in keywords):
                return True
        return False

    def _mock_nl_response(self, user_text: str, base_data: dict = None) -> str:
        """自然语言模式的模拟响应（用于无 API Key 测试）"""
        import re

        # 微调模式：base_data 存在时尝试合并
        if base_data:
            has_new_intent = self._detect_intent_change(user_text, base_data)
            if not has_new_intent:
                return self._mock_refine_response(user_text, base_data)
            # 有新意图 → 走全量分析，忽略 base_data

        text = user_text.lower()
        print(f"[DEBUG] Mock NL response for: {user_text}")

        today = date.today()

        # 提取「」括号内容
        bracketed = self._extract_bracketed(user_text)

        # 时间提取
        time_match = re.search(r'(\d{1,2})[点:：时](\d{0,2})', user_text)
        extracted_time = None
        if time_match:
            h = time_match.group(1).zfill(2)
            m = time_match.group(2).zfill(2) if time_match.group(2) else "00"
            extracted_time = f"{h}:{m}"

        # 周年反推 start_date
        anniversary_years = self._extract_anniversary_years(user_text)
        days_milestone = self._extract_days_milestone(user_text)

        # ---- 意图识别 ----
        # 闹钟
        alarm_keywords = ["闹钟", "起床", "叫我", "提醒我", "早上", "上班", "alarm", "timer", "wake"]
        if any(k in text for k in alarm_keywords):
            t = extracted_time or "07:30"
            label = bracketed.get("标签", "")
            if not label:
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

            return self._build_result({
                "component_type": "alarm",
                "theme": "clock",
                "template_id": "alarm_clock",
                "style_preset": "digital-neon" if "霓虹" in text or "数码" in text else "vibrant-orange",
                "params": {"alarm_time": t, "label": label, "repeat": repeat}
            }, user_text)

        # 新闻
        news_keywords = ["新闻", "资讯", "热点", "头条", "每日", "news", "headlines"]
        if any(k in text for k in news_keywords) and "纪念" not in text:
            return self._build_result({
                "component_type": "news",
                "theme": "daily",
                "template_id": "news_daily",
                "style_preset": "minimal-dark",
                "params": {"category": "tech" if "科技" in text else "general", "max_items": 5}
            }, user_text)

        # 宝宝
        baby_keywords = ["宝宝", "孩子", "出生", "满月", "周岁", "儿子", "女儿", "baby", "小朋友", "born", "child"]
        # 额外检测：'我家XXX...天' 模式也视为宝宝
        baby_pattern = bool(re.search(r'我家.{1,4}(?:今天|已经|刚好|满).{0,4}\d+天', user_text))
        if any(k in text for k in baby_keywords) or baby_pattern:
            extracted_date = self._extract_date_enhanced(user_text, today, prefer_past=True)
            d = extracted_date or today.isoformat()
            # 天数里程碑反推 start_date: "100天了" → start_date = today - 100
            if days_milestone and not extracted_date:
                d = (today - timedelta(days=days_milestone)).isoformat()
            days_diff = (today - date.fromisoformat(d)).days if d <= today.isoformat() else 0
            subtitle = self._generate_nl_subtitle("baby", days_diff, user_text)

            # 智能 title
            title = "宝宝成长记"
            name_match = re.search(r'(?:叫|叫做|名字是|名叫|小名)[\s]*([^\s,，。、]{1,4})', user_text)
            baby_name_match = re.search(r'(?:我家|我的)[\s]*([^\s,，。、]{1,4}?)(?:今天|刚好|已经|出生)', user_text)
            if name_match:
                title = f"{name_match.group(1)}的成长记"
            elif baby_name_match:
                name = baby_name_match.group(1)
                if name and len(name) <= 4:
                    title = f"{name}的成长记"
            if days_milestone:
                if days_milestone == 100:
                    title = title.replace("成长记", "百天纪念") if "成长记" in title else "宝宝百天纪念"
                elif days_milestone == 1000:
                    title = title.replace("成长记", "千日纪念") if "成长记" in title else "宝宝千日纪念"

            if bracketed.get("标题"):
                title = bracketed["标题"]
            if bracketed.get("副标题"):
                subtitle = bracketed["副标题"]
            return self._build_result({
                "component_type": "anniversary", "mode": "countup", "theme": "baby",
                "template_id": "anniversary_baby", "style_preset": "soft-purple",
                "params": {"title": title[:20], "start_date": d, "subtitle": subtitle}
            }, user_text)

        # 放假/倒计时
        holiday_keywords = ["放假", "倒计时", "假期", "国庆", "春节", "五一", "元旦", "过年", "中秋", "端午", "暑假", "圣诞", "christmas", "holiday", "vacation", "countdown"]
        if any(k in text for k in holiday_keywords):
            extracted_date = self._extract_date_enhanced(user_text, today, prefer_past=False)
            # 推断目标日期
            if extracted_date:
                target = extracted_date
            elif "国庆" in text:
                target = f"{today.year}-10-01"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-10-01"
            elif "春节" in text or "过年" in text:
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
            elif "端午" in text:
                target = f"{today.year}-06-10"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-06-10"
            elif "圣诞" in text or "christmas" in text:
                target = f"{today.year}-12-25"
                if date.fromisoformat(target) < today:
                    target = f"{today.year + 1}-12-25"
            else:
                target = f"{today.year}-10-01"

            days_left = (date.fromisoformat(target) - today).days

            # 智能 title
            title = "假期倒计时"
            if "国庆" in text:
                title = "国庆假期倒计时"
            elif "春节" in text or "过年" in text:
                title = "春节倒计时"
            elif "五一" in text:
                title = "五一小长假"
            elif "端午" in text:
                title = "端午节倒计时"
            elif "中秋" in text:
                title = "中秋节倒计时"
            elif "元旦" in text:
                title = "元旦倒计时"
            elif "圣诞" in text or "christmas" in text:
                title = "圣诞节倒计时"

            subtitle = self._generate_nl_subtitle("holiday", days_left, user_text)
            if bracketed.get("标题"):
                title = bracketed["标题"]
            if bracketed.get("副标题"):
                subtitle = bracketed["副标题"]
            return self._build_result({
                "component_type": "anniversary", "mode": "countdown", "theme": "holiday",
                "template_id": "anniversary_holiday", "style_preset": "vibrant-orange",
                "params": {"title": title[:20], "target_date": target, "subtitle": subtitle}
            }, user_text)

        # 天气
        weather_keywords = ["天气", "温度", "穿什么", "下雨", "出行", "气温", "多少度", "冷", "热", "weather", "temperature", "forecast"]
        if any(k in text for k in weather_keywords):
            city = bracketed.get("城市名", bracketed.get("城市", ""))
            if not city:
                city = "北京"
                city_match = re.search(r'(北京|上海|广州|深圳|杭州|成都|武汉|南京|重庆|西安|苏州|长沙|天津|郑州|合肥|厦门|青岛|大连)', user_text)
                if city_match:
                    city = city_match.group(1)
            weather_type = "sunny"
            if "雨" in text: weather_type = "rainy"
            elif "雪" in text: weather_type = "snowy"
            elif "阴" in text or "云" in text: weather_type = "cloudy"
            return self._build_result({
                "component_type": "weather", "theme": "realtime",
                "template_id": "weather_realtime", "style_preset": "clear-blue",
                "params": {"city": city, "weather_type": weather_type}
            }, user_text)

        # 音乐
        music_keywords = ["音乐", "歌", "播放", "听歌", "播放器", "歌曲", "music", "song", "player", "play"]
        if any(k in text for k in music_keywords):
            song = "晴天"
            artist = "周杰伦"
            lyrics = "故事的小黄花 从出生那年就飘着"
            if "周杰伦" in text or "jay" in text:
                pass
            elif "薛之谦" in text:
                song, artist, lyrics = "演员", "薛之谦", "简单点 说话的方式简单点"
            elif "陈奕迅" in text:
                song, artist, lyrics = "十年", "陈奕迅", "十年之后 我们是朋友"
            elif "林俊杰" in text or "jj" in text:
                song, artist, lyrics = "江南", "林俊杰", "风到这里就是粘 粘住过客的思念"

            preset = "dark-vinyl"
            if "霓虹" in text or "紫" in text:
                preset = "neon-purple"
            elif "简约" in text or "极简" in text:
                preset = "minimal-light"

            if bracketed.get("歌名"):
                song = bracketed["歌名"]
            if bracketed.get("歌手"):
                artist = bracketed["歌手"]
            if bracketed.get("歌词"):
                lyrics = bracketed["歌词"]
            return self._build_result({
                "component_type": "music", "theme": "player",
                "template_id": "music_player", "style_preset": preset,
                "params": {"song_name": song, "artist": artist, "lyrics_snippet": lyrics}
            }, user_text)

        # 日历/日程
        calendar_keywords = ["日历", "日程", "安排", "会议", "行程", "今天有什么", "calendar", "schedule", "meeting"]
        if any(k in text for k in calendar_keywords):
            cal_params = {"show_lunar": True}
            if bracketed.get("日程标题"):
                cal_params["events"] = [{"time": "09:00", "title": bracketed["日程标题"][:30]}]
            return self._build_result({
                "component_type": "calendar", "theme": "schedule",
                "template_id": "calendar_schedule", "style_preset": "business-gray",
                "params": cal_params
            }, user_text)

        # 恋爱 / 纪念日
        love_keywords = ["恋爱", "在一起", "结婚", "纪念", "另一半", "女朋友", "男朋友", "老婆", "老公", "对象", "爱", "周年", "love", "anniversary", "girlfriend", "boyfriend"]
        extracted_date = self._extract_date_enhanced(user_text, today, prefer_past=True)
        if any(k in text for k in love_keywords) or extracted_date:
            # 周年反推 start_date（优先级最高）
            if anniversary_years:
                ref_date = date.fromisoformat(extracted_date) if extracted_date else today
                d = (ref_date - timedelta(days=anniversary_years * 365)).isoformat()
            # 天数里程碑反推
            elif days_milestone:
                d = (today - timedelta(days=days_milestone)).isoformat()
            else:
                d = extracted_date or "2024-06-01"

            days_diff = (today - date.fromisoformat(d)).days if d <= today.isoformat() else 0
            subtitle = self._generate_nl_subtitle("love", days_diff, user_text)

            # 智能 title
            title = "恋爱纪念"
            if "结婚" in text:
                if anniversary_years:
                    title = f"结婚{anniversary_years}周年"
                else:
                    title = "结婚纪念日"
            elif anniversary_years:
                title = f"在一起{anniversary_years}周年"
            elif "在一起" in text and days_milestone:
                title = f"在一起第{days_milestone}天"

            if bracketed.get("标题"):
                title = bracketed["标题"]
            if bracketed.get("副标题"):
                subtitle = bracketed["副标题"]
            return self._build_result({
                "component_type": "anniversary", "mode": "countup", "theme": "love",
                "template_id": "anniversary_love", "style_preset": "sweet-pink",
                "params": {"title": title[:20], "start_date": d, "subtitle": subtitle}
            }, user_text)

        # 兜底：无法精确匹配时，选最接近的展示型模板，永远不报错
        import random
        fallback = random.choice(["weather", "music", "calendar"])
        if fallback == "weather":
            return self._build_result({
                "component_type": "weather", "theme": "realtime",
                "template_id": "weather_realtime", "style_preset": "clear-blue",
                "params": {"city": "北京", "weather_type": "sunny"}
            }, user_text)
        elif fallback == "music":
            return self._build_result({
                "component_type": "music", "theme": "player",
                "template_id": "music_player", "style_preset": "dark-vinyl",
                "params": {"song_name": "晴天", "artist": "周杰伦", "lyrics_snippet": "故事的小黄花 从出生那年就飘着"}
            }, user_text)
        else:
            return self._build_result({
                "component_type": "calendar", "theme": "schedule",
                "template_id": "calendar_schedule", "style_preset": "business-gray",
                "params": {"show_lunar": True}
            }, user_text)

    def _generate_nl_subtitle(self, theme: str, days_diff: int, user_text: str) -> str:
        """为自然语言模式生成有创意的副标题（扩容+随机化+情感融入）"""
        text = user_text.lower()

        if theme == "love":
            # 检测情感关键词
            is_romantic = any(k in text for k in ["浪漫", "温柔", "甜蜜", "温馨"])
            is_bold = any(k in text for k in ["高级", "奢华", "大气", "酷"])

            if abs(days_diff) <= 30:
                options = ["甜蜜的开始", "每一刻都是心动", "从今天起记录我们",
                           "有你的日子天天是纪念日", "第一个月未来还长",
                           "日子因为你而发光", "这是我们的第一章", "心动是遇见你那一刻"]
            elif abs(days_diff) <= 100:
                options = ["每一天都算数", "爱在日常里生长", "小确幸的日子",
                           "平凡的每一天因你不凡", "一起走过的路都算风景",
                           "最好的时光正在发生", "我们的故事才刚刚开始", "有你就是好天气"]
            elif abs(days_diff) <= 365:
                options = ["爱已悄然生长", "最好的时光是有你的日子", "日子有你才完整",
                           "一年四季都有你", "365天的温度不曾消退",
                           "一整年的心动不止", "最好的一年因为有你", "时光温柔以待"]
            elif abs(days_diff) <= 730:
                options = ["两年了依然心动", "时光温柔因为有你", "爱已满两载春秋",
                           "七百多天的默契", "两年是新的开始", "我们的第二年更精彩"]
            elif abs(days_diff) <= 1095:
                options = ["三年如一日的心动", "时光不负深情", "千日情深",
                           "一千天每天都有你", "三年是我最好的选择"]
            elif abs(days_diff) <= 3650:
                options = ["余生都是你", "岁月流转爱意永驻", "最长情的告白",
                           "感谢你选择了我", "你是我最好的选择",
                           "携手走过的每一步都算数", "白首不相离"]
            else:
                options = ["十年如一日的深情", "余生都是你", "岁月流转爱意永驻",
                           "最长情的告白", "十年是开始不是结束",
                           "携手走过的每一步都算数", "感谢你选择了我",
                           "你是我最好的选择", "十年后的我们依然在一起", "白首不相离"]
            if is_romantic:
                options = [o for o in options if any(c in o for c in "心动温柔甜蜜")] or options
            return random.choice(options)

        elif theme == "baby":
            if abs(days_diff) <= 7:
                options = ["欢迎来到这个世界", "小天使降临", "你是最好的礼物",
                           "全世界最柔软的存在", "妈妈爱你", "小小的你大大的爱"]
            elif abs(days_diff) <= 30:
                options = ["小小的你大大的世界", "每天都在长大", "满月快乐",
                           "你的每一天都是礼物", "一个月啦时间真快"]
            elif abs(days_diff) <= 100:
                options = ["百天的小可爱", "每一天都是新奇迹", "茁壮成长中",
                           "一百天的小确幸", "你的笑容是最好的礼物",
                           "小小冒险家启程了", "每个第一次都珍贵"]
            elif abs(days_diff) <= 365:
                options = ["一岁啦生日快乐", "第一年的精彩", "从爬到走的日子",
                           "世界因你而精彩", "小小的你已经一岁啦"]
            elif abs(days_diff) <= 730:
                options = ["两岁啦小小少年", "每天都是新冒险", "你的世界越来越大"]
            else:
                options = ["时光见证你的成长", "每一天都在闪光", "最棒的小朋友",
                           "你是全世界最棒的", "茁壮成长未来可期"]
            return random.choice(options)

        elif theme == "holiday":
            # 检测具体节日用于选择文案
            is_national = "国庆" in text
            is_spring = "春节" in text or "过年" in text
            is_may = "五一" in text
            is_excited = any(k in text for k in ["兴奋", "激动", "太期待", "冲"])

            if is_national:
                holiday_pool = ["给祖国母亲庆生", "十一小长假在路上了", "七天假期倒计时中",
                                "这个国庆你想去哪", "十一黄金周即将到来",
                                "假期的快乐提前预定", "国庆七天乐倒计时"]
            elif is_spring:
                holiday_pool = ["回家过年的日子近了", "年味儿越来越浓", "春节团圆倒计时",
                                "新年快乐即将到来", "又要过年啦", "回家的路越来越短"]
            elif is_may:
                holiday_pool = ["五一小长假冲冲冲", "劳动最光荣但也要休息",
                                "五一出游计划启动", "小长假在向你招手", "五一快乐提前预定"]
            else:
                holiday_pool = None

            if holiday_pool:
                return random.choice(holiday_pool)

            if days_diff <= 0:
                options = ["假期快乐", "放假啦尽情享受", "享受假期吧",
                           "快乐的时光开始了", "假期模式已开启"]
            elif days_diff <= 3:
                options = ["再坚持一下就放假啦", "近在眼前的快乐", "倒计时开始",
                           "假期触手可及", "再忍忍就到了"]
            elif days_diff <= 7:
                options = ["一周后见快乐", "假期在向你招手", "快了快了",
                           "下周就是假期了", "假期已经在路上"]
            elif days_diff <= 30:
                options = ["期待的心情最美好", "每天都在靠近假期", "值得等待的快乐",
                           "好日子在前方等你", "心中有期待日子有奔头",
                           "再坚持一下就放假啦"]
            else:
                options = ["美好的事情值得等待", "心里有期待日子就有光", "遥远但值得",
                           "假期在向你招手", "快乐的日子要来了",
                           "值得期待的假期", "期待的心情最美好",
                           "美好的事情值得等待"]

            if is_excited:
                options = [o for o in options if any(c in o for c in "冲快乐开启")] or options

            return random.choice(options)

        return random.choice(["每一天都值得记录", "日子有你更精彩", "美好正在发生"])

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
                "style_preset": user_style or "vibrant-orange",
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

    def _fix_llm_output(self, data: Dict[str, Any], component_type: str, theme: str) -> Dict[str, Any]:
        """自动修正 LLM 输出中的常见错误"""
        # ── Theme 归一化：旧名 → 新规范名 ──
        _LEGACY_THEME = {
            "daily": "news", "realtime": "weather",
            "player": "music", "schedule": "calendar",
        }
        _LEGACY_TEMPLATE_ID = {
            "news_daily": "news_news", "weather_realtime": "weather_weather",
            "music_player": "music_music", "calendar_schedule": "calendar_calendar",
        }
        if data.get("theme") in _LEGACY_THEME:
            data["theme"] = _LEGACY_THEME[data["theme"]]
        if data.get("template_id") in _LEGACY_TEMPLATE_ID:
            data["template_id"] = _LEGACY_TEMPLATE_ID[data["template_id"]]

        # ── 修正 template_id ──
        TEMPLATE_ID_MAP = {
            "alarm": "alarm_clock",
            "news": "news_news",
            "weather": "weather_weather",
            "music": "music_music",
            "calendar": "calendar_calendar",
        }
        VALID_IDS = {
            "alarm_clock", "news_news", "weather_weather", "music_music", "calendar_calendar",
            "anniversary_love", "anniversary_baby", "anniversary_holiday",
            # legacy IDs still accepted
            "news_daily", "weather_realtime", "music_player", "calendar_schedule",
        }
        tid = data.get("template_id", "")
        if tid and tid not in VALID_IDS:
            expected = TEMPLATE_ID_MAP.get(component_type)
            if expected:
                data["template_id"] = expected

        # ── 修正 component_type / theme ──
        if not data.get("component_type") or data["component_type"] == "unknown":
            data["component_type"] = component_type
        if not data.get("theme") or data["theme"] == "default":
            data["theme"] = theme

        # ── 字段名迁移 ──
        params = data.get("params", {})
        # Alarm: display_style → default_view, dial → clock
        if data.get("component_type") == "alarm" and "display_style" in params and "default_view" not in params:
            val = params.pop("display_style")
            params["default_view"] = "clock" if val == "dial" else val
        # News: categories → topics
        if data.get("component_type") == "news" and "categories" in params and "topics" not in params:
            params["topics"] = params.pop("categories")
        # Holiday: emoji → holiday_icon
        if data.get("component_type") == "anniversary" and data.get("theme") == "holiday":
            if "emoji" in params and "holiday_icon" not in params:
                params["holiday_icon"] = params.pop("emoji")

        return data

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
    user_text: str,
    base_data: dict = None
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """异步生成组件参数（自然语言模式）"""
    generator = get_generator()
    return generator.generate_from_nl(user_text, base_data=base_data)


async def generate_code_from_nl(
    user_text: str,
) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
    """异步代码生成（AI编程模式）"""
    generator = get_generator()
    return generator.generate_code_from_nl(user_text)
