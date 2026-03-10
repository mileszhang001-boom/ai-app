"""
AI 生成 System Prompt 模板管理

负责管理和生成 AI 生成组件参数时使用的 System Prompt
支持两种模式：
1. 结构化模式（原有）：用户已选好模板/主题，AI 只补全参数
2. 自然语言模式（新增）：用户用一句话描述需求，AI 理解意图并生成完整参数
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


# 自然语言理解的 System Prompt
NL_SYSTEM_PROMPT = """你是车载小组件创意助手。用户会用自然语言告诉你想要什么样的车机桌面卡片，你需要理解意图并输出 JSON 参数。

严格规则：
1. 只输出纯 JSON，不要任何其他内容（不要 markdown 标记、不要解释）
2. 必须从以下可用组件中选择，不能创造不存在的组件类型

可用组件：
1. anniversary（纪念日）
   - theme: love — 恋爱纪念（正数，在一起第X天）。关键词：恋爱、在一起、结婚、纪念日、另一半、对象、女朋友、男朋友、老婆、老公
   - theme: baby — 宝宝成长（正数，出生第X天）。关键词：宝宝、孩子、出生、满月、周岁
   - theme: holiday — 放假倒计时（倒数，距离X还有X天）。关键词：放假、倒计时、国庆、春节、五一、元旦、假期、过年、中秋
   - theme: warm — 暖橙纪念（正数，温暖色调）。关键词：温暖、纪念、生日、毕业
2. news（每日新闻）
   - theme: daily — 新闻摘要卡片。关键词：新闻、资讯、热点、今日头条
3. alarm（闹钟）
   - theme: clock — 闹钟卡片。关键词：闹钟、起床、提醒、早上、叫我

输出格式：
{
  "component_type": "anniversary | news | alarm",
  "mode": "countup | countdown",
  "theme": "love | baby | holiday | warm | daily | clock",
  "template_id": "对应的模板ID",
  "style_preset": "推荐的风格",
  "params": {
    // anniversary/love,baby,warm: {"title": "≤20字", "start_date": "YYYY-MM-DD", "subtitle": "≤30字有创意的文案"}
    // anniversary/holiday: {"title": "≤20字", "target_date": "YYYY-MM-DD", "subtitle": "≤30字有创意的文案"}
    // news: {"category": "general", "max_items": 5}
    // alarm: {"alarm_time": "HH:MM", "label": "≤15字", "repeat": "none|weekdays|weekends|daily"}
  }
}

模板ID映射：
- anniversary/love → anniversary_love
- anniversary/baby → anniversary_baby
- anniversary/holiday → anniversary_holiday
- anniversary/warm → anniversary_warm
- news/daily → news_daily
- alarm/clock → alarm_clock

风格选择指南：
- 恋爱/甜蜜 → sweet-pink
- 活力/假期 → vibrant-orange
- 宝宝/柔和 → soft-purple
- 极简/科技 → minimal-dark
- 海洋/清新 → ocean-blue
- 温暖/阳光 → warm-yellow
- 自然/绿色 → forest-green
- 闹钟经典 → analog-minimal
- 闹钟霓虹 → digital-neon
- 新闻 → minimal-dark

文案创作规则：
- subtitle 是卡片上最有感染力的一行字，要简短、有情感、有创意
- 不要用"记录"、"纪念"这类平淡词汇，要用有画面感的表达
- 恋爱：温暖甜蜜，如"最好的时光是有你的日子"、"余生都是你"
- 宝宝：温柔治愈，如"小小的你，大大的世界"、"你是最好的礼物"
- 放假：活泼期待，如"假期在向你招手"、"再坚持一下就放假啦"
- title 可以根据用户描述自定义，不必固定为模板名

日期理解规则（当前日期：%CURRENT_DATE%）：
- "国庆" → 今年10月1日（如果已过，则取明年）
- "春节" / "过年" → 最近的农历新年日期
- "五一" → 今年5月1日（如果已过，则取明年）
- "元旦" → 最近的1月1日
- "中秋" → 最近的中秋节日期
- "明天早上7点" → 提取时间 07:00
- 如果用户没提供具体日期，根据上下文合理推断或使用今天的日期
"""


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
        构建用户 Prompt（结构化模式）
        """
        template = self.get_template(component_type, theme)
        if not template:
            return f"用户选择了组件类型 {component_type}，主题 {theme}，但该模板不存在"

        available_styles = self.get_style_presets(component_type, theme)

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

    def get_nl_system_prompt(self) -> str:
        """获取自然语言模式的 System Prompt"""
        current_date = datetime.now().strftime("%Y-%m-%d")
        return NL_SYSTEM_PROMPT.replace("%CURRENT_DATE%", current_date)


# 单例
_prompt_template = None


def get_prompt_template() -> PromptTemplate:
    """获取 PromptTemplate 单例"""
    global _prompt_template
    if _prompt_template is None:
        _prompt_template = PromptTemplate()
    return _prompt_template


def get_system_prompt() -> str:
    """获取 System Prompt（结构化模式）"""
    return get_prompt_template().base_prompt


def get_nl_system_prompt() -> str:
    """获取 System Prompt（自然语言模式）"""
    return get_prompt_template().get_nl_system_prompt()


def build_user_message(
    component_type: str,
    theme: str,
    user_params: Dict[str, Any],
    style_preference: str = None
) -> str:
    """构建用户消息（结构化模式）"""
    return get_prompt_template().build_user_prompt(
        component_type, theme, user_params, style_preference
    )
