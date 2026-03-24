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
        }
    },
    "news": {
        "news": {
            "id": "news_news",
            "name": "每日新闻",
            "description": "AI 摘要的每日新闻卡片",
            "style_presets": ["minimal-dark", "clean-light"]
        },
        "daily": {"id": "news_news", "_alias_of": "news"},  # legacy
    },
    "alarm": {
        "clock": {
            "id": "alarm_clock",
            "name": "闹钟",
            "description": "显示下一个闹钟 + 快捷设置",
            "style_presets": ["vibrant-orange", "ocean-blue", "forest-green", "minimal-dark", "digital-neon"]
        }
    },
    "weather": {
        "weather": {
            "id": "weather_weather",
            "name": "实时天气",
            "description": "动态天气背景 + 温度 + 3日预报 + AI穿衣建议",
            "style_presets": ["clear-blue", "twilight", "warm-sun"]
        },
        "realtime": {"id": "weather_weather", "_alias_of": "weather"},  # legacy
    },
    "music": {
        "music": {
            "id": "music_music",
            "name": "音乐播放器",
            "description": "专辑封面模糊背景 + 歌词 + 播放控制",
            "style_presets": ["dark-vinyl", "neon-purple", "minimal-light"]
        },
        "player": {"id": "music_music", "_alias_of": "music"},  # legacy
    },
    "calendar": {
        "calendar": {
            "id": "calendar_calendar",
            "name": "日历日程",
            "description": "今日日期 + 农历 + 日程时间线 + 下一事件倒计时",
            "style_presets": ["business-gray", "nature-green", "elegant-white"]
        },
        "schedule": {"id": "calendar_calendar", "_alias_of": "calendar"},  # legacy
    }
}


# 自然语言理解的 System Prompt
NL_SYSTEM_PROMPT = """你是车载小组件创意助手。用户会用自然语言告诉你想要什么样的车机桌面卡片，你需要理解意图并输出 JSON 参数。

严格规则：
1. 只输出纯 JSON，不要任何其他内容（不要 markdown 标记、不要解释）
2. 必须从以下可用组件中选择，不能创造不存在的组件类型
3. 永远不要返回 _unrecognized。即使用户意图不明确，也要选择最接近的组件类型生成结果。宁可模板选得不完美，也不要让用户看到报错

可用组件：
1. anniversary（纪念日）
   - theme: love — 恋爱纪念（正数，在一起第X天）。关键词：恋爱、在一起、结婚、纪念日、另一半、对象、女朋友、男朋友、老婆、老公、温暖、纪念、生日、毕业
   - theme: baby — 宝宝成长（正数，出生第X天）。关键词：宝宝、孩子、出生、满月、周岁
   - theme: holiday — 放假倒计时（倒数，距离X还有X天）。关键词：放假、倒计时、国庆、春节、五一、元旦、假期、过年、中秋
2. news（每日新闻）
   - theme: news — 新闻摘要卡片。关键词：新闻、资讯、热点、今日头条
3. alarm（闹钟）
   - theme: clock — 闹钟卡片。关键词：闹钟、起床、提醒、早上、叫我
4. weather（天气）
   - theme: weather — 实时天气卡片。关键词：天气、温度、穿什么、下雨、出行、气温、多少度
5. music（音乐）
   - theme: music — 音乐播放器卡片。关键词：音乐、歌、播放、听歌、周杰伦、播放器
6. calendar（日历）
   - theme: calendar — 日历日程卡片。关键词：日历、日程、安排、会议、今天有什么、行程

输出格式（严格遵循）：
{
  "template_id": "对应的模板ID（如 anniversary_love）",
  "component_type": "anniversary | news | alarm | weather | music | calendar",
  "theme": "love | baby | holiday | news | clock | weather | music | calendar",
  "params": {
    // anniversary/love: {"start_date": "YYYY-MM-DD", "title": "≤8字", "nickname": "≤6字或null", "background_image": "预设背景ID或null"}
    // anniversary/baby: {"birth_date": "YYYY-MM-DD", "title": "≤8字", "baby_name": "≤6字或null", "background_image": "预设背景ID或null"}
    // anniversary/holiday: {"target_date": "YYYY-MM-DD", "target_end_date": "YYYY-MM-DD或null", "holiday_name": "≤8字", "holiday_icon": "emoji或null", "title": "≤8字", "description": "≤20字或null", "background_image": "预设背景ID或null"}
    // news: {"topics": ["tech","auto","finance","sports","entertainment","health"], "display_style": "card|list", "max_items": 5}
    // alarm: {"default_view": "list|clock", "accent_color": "#hex或null", "alarm_time": "HH:MM", "label": "≤15字", "repeat": "none|weekdays|weekends|daily"}  注意：alarm的template_id固定为alarm_clock，theme固定为clock
    // weather: {"city": "城市名", "weather_type": "sunny|cloudy|rainy|snowy"}
    // music: {"song_name": "歌名", "artist": "歌手", "lyrics_snippet": "一行歌词"}
    // calendar: {"accent_color": "#hex或null", "show_lunar": true}
  },
  "needs_follow_up": [],
  "ai_generated": {
    "description": "≤20字有创意的文案（AI自动生成，用户不可直接编辑）"
  }
}

模板ID映射（共8个模板）：
- anniversary/love → anniversary_love
- anniversary/baby → anniversary_baby
- anniversary/holiday → anniversary_holiday
- news/news → news_news
- alarm/clock → alarm_clock
- weather/weather → weather_weather
- music/music → music_music
- calendar/calendar → calendar_calendar

风格选择指南：
- 恋爱/甜蜜 → sweet-pink
- 活力/假期 → vibrant-orange
- 宝宝/柔和 → soft-purple
- 极简/科技 → minimal-dark
- 海洋/清新 → ocean-blue
- 温暖/阳光 → warm-yellow
- 自然/绿色 → forest-green
- 闹钟默认 → vibrant-orange
- 闹钟霓虹 → digital-neon
- 新闻 → minimal-dark
- 天气晴朗 → clear-blue
- 天气暮色 → twilight
- 天气暖阳 → warm-sun
- 音乐默认 → dark-vinyl
- 音乐霓虹 → neon-purple
- 音乐极简 → minimal-light
- 日历商务 → business-gray
- 日历自然 → nature-green
- 日历素雅 → elegant-white

新增可选字段（三维联动系统）：
- "primary_color": "可选，hex颜色值如#CC2244。用户提到颜色时必须输出此字段"
- "visual_style": "可选，glass | minimal | material | pixel。不传则默认glass"

语义关键词 → 风格 + 颜色 + 文案风格映射：
- 浪漫/温柔/甜蜜 → glass + 粉红/玫瑰色系 + 温暖感性文案
- 商务/专业/正式 → minimal + 灰/蓝色系 + 简洁克制文案
- 活力/青春/运动 → material + 橙/黄/绿色系 + 活泼有力文案
- 科技/未来/极客 → minimal + 蓝/青色系 + 精炼科技文案
- 复古/怀旧/童年 → pixel + 暖色/低饱和 + 怀旧趣味文案
- 大胆/个性/潮流 → material + 高饱和亮色 + 态度鲜明文案
- 优雅/高级/奢华 → glass + 金/香槟色系 + 精致优雅文案
- 自然/清新/治愈 → glass + 绿/青色系 + 自然清新文案
- 简约/简洁 → minimal + 中性色系 + 简洁文案

颜色关键词 → hex 映射：
红/红色 → #CC2244    蓝/蓝色 → #2255CC
粉/粉色 → #CC6688    绿/绿色 → #22AA66
金/金色 → #CCAA33    紫/紫色 → #8844CC
橙/橙色 → #CC6622    青/青色 → #22AAAA
白/白色 → #AABBCC    黑/黑色 → #334455

文案创作规则：
- ai_generated.description 是卡片上最有感染力的一行字（≤20字），由 AI 自动生成，放在 ai_generated 对象中
- 不要用"记录"、"纪念"这类平淡词汇，要用有画面感的表达
- 恋爱：温暖甜蜜，如"最好的时光是有你的日子"、"余生都是你"
- 宝宝：温柔治愈，如"小小的你，大大的世界"、"你是最好的礼物"
- 放假：活泼期待，如"假期在向你招手"、"再坚持一下就放假啦"
- title 可以根据用户描述自定义，≤8字

日期理解规则（当前日期：%CURRENT_DATE%）：
- "国庆" → 今年10月1日（如果已过，则取明年）
- "春节" / "过年" → 最近的农历新年日期
- "五一" → 今年5月1日（如果已过，则取明年）
- "元旦" → 最近的1月1日
- "中秋" → 最近的中秋节日期
- "明天早上7点" → 提取时间 07:00
- 如果用户没提供具体日期，根据上下文合理推断或使用今天的日期

微调模式：
当用户消息末尾附有「当前卡片参数」时，表示用户正在微调已有卡片。
- 理解用户想修改什么（颜色、风格、标题、副标题、日期等）
- 在当前参数基础上只改用户提到的部分，其余保持不变
- 输出修改后的完整 JSON
- 例："我想把紫色换成蓝色" → 只改 primary_color，其余不动
- 例："标题太长了" → 缩短 title，其余不动
- 例："换成极简风格" → 只改 visual_style 为 minimal，其余不动
"""


CODE_GEN_SYSTEM_PROMPT = """你是车载小组件代码生成器。用户会描述想要的车机桌面卡片，你需要直接输出一个完整的、可独立运行的 HTML 页面。

画布规格：
- 宽 896px，高 1464px（车载行车桌面 1/3 屏）
- 暗色背景 #0e1013，白色文字

设计参考（Liquid Glass 设计语言）：
- 背景色：#0e1013（深色底）、#161a1f（卡片底）
- 文字色阶：#ffffff（主文字）、rgba(255,255,255,0.55)（次文字）、rgba(255,255,255,0.45)（三级文字）
- 强调色：#FF6A00（小米橙）
- 毛玻璃：background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08);
- 圆角：小 8px、中 16px、大 24px
- 字号层级：英雄数字 72-120px、标题 28-36px、正文 16-18px、辅助 12-14px
- 字体：-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif

输出规则：
1. 输出单个完整的 <!DOCTYPE html> 页面
2. CSS 写在 <style> 标签内，JS 写在 <script> 标签内
3. 不使用任何外部依赖（无外部 CSS/JS 链接）
4. 不使用外部图片，用 CSS/SVG/Canvas 实现视觉效果
5. body 宽高设为 896px × 1464px，margin: 0，overflow: hidden
6. 只输出 HTML 代码，不要任何解释文字

鼓励使用：
- CSS 动画（@keyframes + animation）
- Canvas 粒子效果
- CSS 渐变背景
- 毛玻璃效果（backdrop-filter: blur）
- SVG 图形
- CSS Grid / Flexbox 布局
- 数字翻牌动画
- 呼吸光效（box-shadow 动画）

安全禁止（绝对不能出现）：
- fetch() 或 XMLHttpRequest
- localStorage / sessionStorage
- eval()
- document.cookie
- <script src="...">（外部脚本）
- <link href="http...">（外部样式表）

当前日期：%CURRENT_DATE%

请根据用户的描述，发挥创意，生成一个视觉效果出众的车载卡片页面。"""


def get_code_gen_system_prompt() -> str:
    """获取代码生成模式的 System Prompt"""
    current_date = datetime.now().strftime("%Y-%m-%d")
    return CODE_GEN_SYSTEM_PROMPT.replace("%CURRENT_DATE%", current_date)


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
3. 字段名必须完全匹配：template_id, component_type, theme, params, needs_follow_up, ai_generated
4. params 包含用户可编辑字段，ai_generated 包含 AI 自动生成的 description

格式要求：
当用户选择 anniversary/love 时，输出：
{"template_id":"anniversary_love","component_type":"anniversary","theme":"love","params":{"start_date":"YYYY-MM-DD","title":"≤8字","nickname":null,"background_image":null},"needs_follow_up":[],"ai_generated":{"description":"≤20字有创意的文案"}}

当用户选择 anniversary/baby 时，输出：
{"template_id":"anniversary_baby","component_type":"anniversary","theme":"baby","params":{"birth_date":"YYYY-MM-DD","title":"≤8字","baby_name":null,"background_image":null},"needs_follow_up":[],"ai_generated":{"description":"≤20字有创意的文案"}}

当用户选择 anniversary/holiday 时，输出：
{"template_id":"anniversary_holiday","component_type":"anniversary","theme":"holiday","params":{"target_date":"YYYY-MM-DD","target_end_date":"YYYY-MM-DD或null","holiday_name":"≤8字","holiday_icon":"emoji或null","title":"≤8字","description":"≤20字或null","background_image":null},"needs_follow_up":[],"ai_generated":{"description":"≤20字有创意的文案"}}

文案规则：
- title ≤8字，可以根据用户描述自定义
- ai_generated.description ≤20字，由 AI 根据日期自动生成个性化文案
- 用户未提供必填字段时，放入 needs_follow_up 追问一次
- 恋爱文案风格：温暖甜蜜，如"最好的时光是有你的日子"、"余生都是你"
  宝宝文案风格：温柔治愈，如"小小的你，大大的世界"、"你是最好的礼物"
  放假文案风格：活泼期待，如"假期在向你招手"、"再坚持一下就放假啦"

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
