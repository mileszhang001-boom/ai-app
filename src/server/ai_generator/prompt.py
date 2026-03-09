"""
AI 生成 System Prompt 模板管理

负责管理和生成 AI 生成组件参数时使用的 System Prompt
"""

from datetime import datetime
from typing import Dict, List, Any


# 模板配置
TEMPLATES = {
    "anniversary": {
        "love": {
            "id": "anniversary_love",
            "name": "恋爱纪念",
            "mode": "countup",
            "description": "记录甜蜜时光，在一起的第X天",
            "style_presets": ["sweet-pink", "vibrant-orange", "soft-purple", "minimal-dark"]
        },
        "baby": {
            "id": "anniversary_baby",
            "name": "宝宝成长",
            "mode": "countup",
            "description": "记录宝宝的成长足迹",
            "style_presets": ["soft-purple", "sweet-pink", "ocean-blue", "warm-yellow"]
        },
        "holiday": {
            "id": "anniversary_holiday",
            "name": "放假倒计时",
            "mode": "countdown",
            "description": "期待美好假期，倒计时模式",
            "style_presets": ["vibrant-orange", "warm-yellow", "ocean-blue", "forest-green"]
        },
        "warm": {
            "id": "anniversary_warm",
            "name": "暖橙纪念",
            "mode": "countup",
            "description": "温暖琥珀色调的纪念日卡片",
            "style_presets": ["vibrant-orange", "warm-yellow", "sweet-pink", "minimal-dark"]
        }
    },
    "news": {
        "daily": {
            "id": "news_daily",
            "name": "每日新闻",
            "description": "AI 摘要的每日新闻卡片",
            "style_presets": ["minimal-dark", "clean-light"]
        }
    },
    "alarm": {
        "clock": {
            "id": "alarm_clock",
            "name": "闹钟",
            "description": "显示下一个闹钟 + 快捷设置",
            "style_presets": ["analog-minimal", "digital-neon"]
        }
    }
}


class PromptTemplate:
    """System Prompt 模板类"""

    def __init__(self):
        self.base_prompt = self._build_base_prompt()

    def _build_base_prompt(self) -> str:
        """构建基础 System Prompt"""
        return """你是车载小组件参数生成助手，只输出 JSON 格式的参数。

任务：根据用户输入，输出符合指定格式的 JSON。

严格规则：
1. 只输出纯 JSON，不要任何其他内容
2. 不要输出 markdown 标记
3. 字段名必须完全匹配：component_type, mode, theme, template_id, style_preset, params
4. params 是一个对象，包含 title, start_date 或 target_date, subtitle

格式要求：
当用户选择 anniversary/love 时，输出：
{"component_type":"anniversary","mode":"countup","theme":"love","template_id":"anniversary_love","style_preset":"sweet-pink","params":{"title":"恋爱纪念","start_date":"用户输入的日期(YYYY-MM-DD格式)","subtitle":"简短副标题"}}

当用户选择 anniversary/baby 时，输出：
{"component_type":"anniversary","mode":"countup","theme":"baby","template_id":"anniversary_baby","style_preset":"soft-purple","params":{"title":"宝宝成长","start_date":"用户输入的日期(YYYY-MM-DD格式)","subtitle":"简短副标题"}}

当用户选择 anniversary/holiday 时，输出：
{"component_type":"anniversary","mode":"countdown","theme":"holiday","template_id":"anniversary_holiday","style_preset":"vibrant-orange","params":{"title":"假期倒计时","target_date":"用户输入的日期(YYYY-MM-DD格式)","subtitle":"简短副标题"}}

文案规则：
- title 固定使用对应模板名称
- subtitle 必须≤30字
- 用户未填写subtitle时，根据日期生成个性化文案
  恋爱：≤30天"每一刻都甜蜜"，31-100天"每一天都算数"，101-365天"爱已悄然生长"，366-730天"爱已满两载"，731-1095天"爱已三年整"，1096-1460天"四载爱意盎然"，1461-1825天"五载情深似海"，1826+"爱长存，时光不负"
  宝宝：≤7天"初来人间"，8-30天"每一天都是新的奇迹"，31-100天"百日快乐"，101-365天"一周岁了"，366-730天"两周岁了"，731-1095天"三周岁快乐"，1096-1460天"四周岁了"，1461-1825天"五周岁快乐"，1826+"茁壮成长"
  放假：≤1天"明天就放假啦"，2-3天"还有几天就放假"，4-7天"一周后放假"，8-14天"两周后放假"，15-30天"月底放假"，31+"美好的事情值得等待"

风格映射：
anniversary/love: sweet-pink, vibrant-orange, soft-purple, minimal-dark
anniversary/baby: soft-purple, sweet-pink, ocean-blue, warm-yellow
anniversary/holiday: vibrant-orange, warm-yellow, ocean-blue, forest-green
"""

    def get_available_templates(self) -> Dict[str, Any]:
        """获取所有可用模板"""
        return TEMPLATES

    def get_template(self, component_type: str, theme: str) -> Dict[str, Any]:
        """获取指定模板配置"""
        return TEMPLATES.get(component_type, {}).get(theme)

    def get_style_presets(self, component_type: str, theme: str) -> List[str]:
        """获取模板的可用风格"""
        template = self.get_template(component_type, theme)
        return template.get("style_presets", []) if template else []

    def build_user_prompt(
        self,
        component_type: str,
        theme: str,
        user_params: Dict[str, Any],
        style_preference: str = None
    ) -> str:
        """
        构建用户 Prompt

        Args:
            component_type: 组件类型
            theme: 主题
            user_params: 用户已填参数
            style_preference: 用户偏好的风格（可选）

        Returns:
            用户 Prompt 字符串
        """
        template = self.get_template(component_type, theme)
        if not template:
            return f"用户选择了组件类型 {component_type}，主题 {theme}，但该模板不存在"

        # 获取可用风格
        available_styles = self.get_style_presets(component_type, theme)

        # 构建参数描述
        params_desc = []
        for key, value in user_params.items():
            if value is not None:
                params_desc.append(f"- {key}: {value}")

        prompt_parts = [
            f"用户选择了：{template['name']}（{template['description']}）",
            ""
        ]

        if params_desc:
            prompt_parts.append("用户已填参数：")
            prompt_parts.extend(params_desc)
            prompt_parts.append("")

        if style_preference:
            prompt_parts.append(f"用户选择的风格：{style_preference}")
        else:
            prompt_parts.append(f"可用风格：{', '.join(available_styles)}")
            prompt_parts.append("请根据内容特征智能推荐一个合适的风格")

        return "\n".join(prompt_parts)


# 单例
_prompt_template = None


def get_prompt_template() -> PromptTemplate:
    """获取 PromptTemplate 单例"""
    global _prompt_template
    if _prompt_template is None:
        _prompt_template = PromptTemplate()
    return _prompt_template


def get_system_prompt() -> str:
    """获取 System Prompt"""
    return get_prompt_template().base_prompt


def build_user_message(
    component_type: str,
    theme: str,
    user_params: Dict[str, Any],
    style_preference: str = None
) -> str:
    """构建用户消息"""
    return get_prompt_template().build_user_prompt(
        component_type, theme, user_params, style_preference
    )
