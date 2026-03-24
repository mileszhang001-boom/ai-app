"""
AI 生成结果校验（Quality Gate）

负责校验 AI 输出的 JSON 参数是否符合模板 schema。
校验层级：
  1. 基础字段完整性
  2. component_type / theme 白名单
  3. template_id 白名单
  4. style_preset 白名单
  5. params 字段类型 + 长度（超长自动截断）
"""

import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime


# ── 白名单定义（与 prompt.py TEMPLATES 保持一致） ──

VALID_TEMPLATE_IDS = {
    "anniversary_love", "anniversary_baby", "anniversary_holiday",
    "news_daily",
    "alarm_clock",
    "weather_realtime",
    "music_player",
    "calendar_schedule",
}

VALID_STYLE_PRESETS = {
    # anniversary / love
    "sweet-pink", "vibrant-orange", "soft-purple", "minimal-dark",
    # anniversary / baby
    "ocean-blue", "warm-yellow",
    # anniversary / holiday
    "forest-green",
    # news
    "clean-light", "tech-blue", "xiaomi-orange",
    # alarm
    "digital-neon",
    # weather
    "clear-blue", "twilight", "warm-sun",
    # music
    "dark-vinyl", "neon-purple", "minimal-light",
    # calendar
    "business-gray", "nature-green", "elegant-white",
    # dynamic (color-engine)
    "dynamic",
}

VALID_VISUAL_STYLES = {"glass", "minimal", "material", "pixel"}

VALID_THEMES = {
    "anniversary": {"love", "baby", "holiday"},
    "news": {"daily"},
    "alarm": {"clock"},
    "weather": {"realtime"},
    "music": {"player"},
    "calendar": {"schedule"},
}


class ValidationError(Exception):
    """参数校验错误"""

    def __init__(self, field: str, reason: str):
        self.field = field
        self.reason = reason
        super().__init__(f"Field '{field}': {reason}")


class ComponentValidator:
    """组件参数校验器"""

    def __init__(self):
        from .prompt import TEMPLATES
        self.templates = TEMPLATES

    def validate(
        self,
        component_type: str,
        theme: str,
        data: Dict[str, Any]
    ) -> Tuple[bool, Optional[List[str]], Optional[Dict[str, Any]]]:
        """
        校验组件参数

        Returns:
            (is_valid, errors, cleaned_data)
            - 对于可修复的问题（文案超长），自动截断并放入 cleaned_data
            - 对于不可修复的问题（非法类型），返回 errors
        """
        errors = []
        warnings = []
        cleaned = {}

        try:
            # 1. 基础字段完整性
            self._validate_basic_fields(data, errors)
            if errors:
                return False, errors, None

            # 2. component_type 白名单
            self._validate_component_type(component_type, data.get("component_type"), errors)

            # 3. theme 白名单
            actual_type = data.get("component_type", component_type)
            if actual_type == "anniversary":
                self._validate_theme(theme, data.get("theme"), errors)

            # 4. template_id 白名单
            self._validate_template_id(data.get("template_id"), errors)

            # 5. style_preset 白名单
            self._validate_style_preset(
                actual_type,
                data.get("theme", theme),
                data.get("style_preset"),
                errors,
            )

            if errors:
                return False, errors, None

            # 6. primary_color 格式校验（可选）
            primary_color = data.get("primary_color")
            if primary_color:
                import re
                if not re.match(r'^#[0-9A-Fa-f]{6}$', primary_color):
                    errors.append(f"Invalid primary_color format: {primary_color}, expected #RRGGBB")

            # 7. visual_style 枚举校验（可选）
            visual_style = data.get("visual_style")
            if visual_style and visual_style not in VALID_VISUAL_STYLES:
                errors.append(
                    f"Invalid visual_style: {visual_style}. "
                    f"Must be one of {sorted(VALID_VISUAL_STYLES)}"
                )

            if errors:
                return False, errors, None

            # 8. params 校验（含自动截断）
            self._validate_params(
                component_type, theme,
                data.get("params", {}),
                errors, warnings, cleaned,
            )

            if errors:
                return False, errors, None

            return True, warnings or None, cleaned

        except Exception as e:
            return False, [str(e)], None

    # ── 各级校验 ──

    def _validate_basic_fields(self, data: Dict[str, Any], errors: List[str]):
        """校验基础字段"""
        required_fields = ["component_type", "template_id", "params"]
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")

    def _validate_component_type(self, expected: str, actual: str, errors: List[str]):
        """校验组件类型"""
        if not actual:
            errors.append("component_type is missing")
            return

        valid_types = list(VALID_THEMES.keys())
        if actual not in valid_types:
            errors.append(f"Invalid component_type: {actual}. Must be one of {valid_types}")

        if expected and actual != expected:
            errors.append(f"component_type mismatch: expected {expected}, got {actual}")

    def _validate_theme(self, expected: str, actual: str, errors: List[str]):
        """校验主题"""
        if not actual:
            errors.append("theme is missing for anniversary component")
            return

        valid_themes = VALID_THEMES.get("anniversary", set())
        if actual not in valid_themes:
            errors.append(f"Invalid theme: {actual}. Must be one of {sorted(valid_themes)}")

        if expected and actual != expected:
            errors.append(f"theme mismatch: expected {expected}, got {actual}")

    def _validate_template_id(self, template_id: str, errors: List[str]):
        """校验 template_id 白名单（含自动修正）"""
        if not template_id:
            errors.append("template_id is missing")
            return
        if template_id not in VALID_TEMPLATE_IDS:
            # 自动修正常见 LLM 错误（如 alarm_dial → alarm_clock）
            TEMPLATE_ID_FIXES = {
                "alarm_dial": "alarm_clock",
                "alarm_list": "alarm_clock",
                "weather_daily": "weather_realtime",
                "news_general": "news_daily",
                "calendar_daily": "calendar_schedule",
                "music_default": "music_player",
                "anniversary_warm": "anniversary_love",
            }
            if template_id in TEMPLATE_ID_FIXES:
                return  # 允许通过，后续会在 cleaned 中修正
            errors.append(
                f"Invalid template_id: {template_id}. "
                f"Must be one of {sorted(VALID_TEMPLATE_IDS)}"
            )

    def _validate_style_preset(
        self,
        component_type: str,
        theme: str,
        style_preset: str,
        errors: List[str],
    ):
        """校验 style_preset 白名单（基于 component_type/theme 的可用风格）"""
        if not style_preset:
            return  # style_preset is optional after SCHEMA v2

        # "dynamic" 总是合法的（由 color-engine 驱动）
        if style_preset == "dynamic":
            return

        # 先查模板定义的可用风格
        template_config = self.templates.get(component_type, {}).get(theme)
        if template_config:
            allowed = set(template_config.get("style_presets", []))
            if allowed and style_preset not in allowed:
                errors.append(
                    f"Invalid style_preset '{style_preset}' for {component_type}/{theme}. "
                    f"Must be one of {sorted(allowed)}"
                )
                return

        # 如果模板中没有定义（如新模板），则用全局白名单兜底
        if style_preset not in VALID_STYLE_PRESETS:
            errors.append(
                f"Invalid style_preset: {style_preset}. "
                f"Must be one of {sorted(VALID_STYLE_PRESETS)}"
            )

    def _validate_params(
        self,
        component_type: str,
        theme: str,
        params: Dict[str, Any],
        errors: List[str],
        warnings: List[str],
        cleaned: Dict[str, Any],
    ):
        """校验参数字段（超长文案自动截断）"""
        if not isinstance(params, dict):
            errors.append("params must be an object")
            return

        # 定义参数 schema
        param_schema = self._get_param_schema(component_type, theme)

        if not param_schema:
            errors.append(f"No param schema for {component_type}/{theme}")
            return

        # 校验每个参数
        for key, config in param_schema.items():
            value = params.get(key)

            # 必填字段检查
            if config.get("required", False) and value is None:
                errors.append(f"Required parameter missing: {key}")
                continue

            # 跳过空值（非必填）
            if value is None:
                if config.get("default") is not None:
                    cleaned[key] = config["default"]
                continue

            # 类型检查（含自动截断）
            try:
                validated_value = self._validate_type(key, value, config, errors, warnings)
                if validated_value is not None:
                    cleaned[key] = validated_value
            except ValidationError as e:
                errors.append(e.reason)

        # 复制未在 schema 中定义的参数（保持灵活性）
        for key, value in params.items():
            if key not in cleaned and key not in param_schema:
                cleaned[key] = value

    def _get_param_schema(self, component_type: str, theme: str) -> Dict[str, Any]:
        """获取参数 schema"""
        # 纪念日 love schema
        _anniversary_love = {
            "title": {"type": "string", "required": True, "maxLength": 8},
            "start_date": {"type": "date", "required": True},
            "nickname": {"type": "string", "required": False, "maxLength": 6},
            "background_image": {"type": "string", "required": False, "maxLength": 50},
        }

        # 纪念日 baby schema
        _anniversary_baby = {
            "title": {"type": "string", "required": True, "maxLength": 8},
            "birth_date": {"type": "date", "required": True},
            "baby_name": {"type": "string", "required": False, "maxLength": 6},
            "background_image": {"type": "string", "required": False, "maxLength": 50},
        }

        schemas = {
            "anniversary": {
                "love": _anniversary_love,
                "baby": _anniversary_baby,
                "holiday": {
                    "title": {"type": "string", "required": True, "maxLength": 8},
                    "target_date": {"type": "datetime", "required": True},
                    "emoji": {"type": "string", "required": False},
                    "show_hours": {"type": "boolean", "required": False},
                    "show_minutes": {"type": "boolean", "required": False},
                    "background_image": {"type": "string", "required": False, "maxLength": 50},
                },
            },
            "news": {
                "daily": {
                    "category": {"type": "enum", "values": ["general", "tech", "auto", "automotive", "finance", "sports", "lifestyle"], "default": "general"},
                    "categories": {"type": "any", "required": False},
                    "max_items": {"type": "number", "min": 3, "max": 8, "default": 5},
                },
            },
            "alarm": {
                "clock": {
                    "alarm_time": {"type": "string", "required": False},
                    "label": {"type": "string", "required": False, "maxLength": 15},
                    "repeat": {"type": "string", "required": False},
                    "display_style": {"type": "enum", "values": ["list", "dial"], "default": "list"},
                },
            },
            "weather": {
                "realtime": {
                    "city": {"type": "string", "required": False, "maxLength": 20, "default": "北京"},
                    "weather_type": {"type": "enum", "values": ["sunny", "cloudy", "rainy", "snowy"], "default": "sunny"},
                },
            },
            "music": {
                "player": {
                    "song_name": {"type": "string", "required": False, "maxLength": 30},
                    "artist": {"type": "string", "required": False, "maxLength": 20},
                    "lyrics_snippet": {"type": "string", "required": False, "maxLength": 50},
                },
            },
            "calendar": {
                "schedule": {
                    "show_lunar": {"type": "boolean", "required": False, "default": True},
                },
            },
        }

        return schemas.get(component_type, {}).get(theme, {})

    def _validate_type(
        self,
        key: str,
        value: Any,
        config: Dict[str, Any],
        errors: List[str],
        warnings: List[str],
    ) -> Any:
        """校验单个字段类型（超长字符串自动截断而非拒绝）"""
        field_type = config.get("type", "string")

        if field_type == "string":
            if not isinstance(value, str):
                raise ValidationError(key, f"must be string, got {type(value).__name__}")

            max_length = config.get("maxLength") or config.get("max_length")
            if max_length and len(value) > max_length:
                # 自动截断 + 警告
                truncated = value[:max_length]
                warnings.append(
                    f"{key} truncated from {len(value)} to {max_length} chars: "
                    f"'{value}' → '{truncated}'"
                )
                return truncated

            return value

        elif field_type == "number":
            if not isinstance(value, (int, float)):
                raise ValidationError(key, f"must be number, got {type(value).__name__}")

            min_val = config.get("min")
            max_val = config.get("max")

            if min_val is not None and value < min_val:
                warnings.append(f"{key} clamped from {value} to min {min_val}")
                value = min_val
            if max_val is not None and value > max_val:
                warnings.append(f"{key} clamped from {value} to max {max_val}")
                value = max_val

            return value

        elif field_type == "boolean":
            if not isinstance(value, bool):
                if isinstance(value, str):
                    return value.lower() in ("true", "1", "yes")
                raise ValidationError(key, f"must be boolean, got {type(value).__name__}")
            return value

        elif field_type == "date":
            if isinstance(value, str):
                try:
                    datetime.strptime(value, "%Y-%m-%d")
                    return value
                except ValueError:
                    raise ValidationError(key, f"invalid date format: {value}, expected YYYY-MM-DD")
            raise ValidationError(key, f"must be date string (YYYY-MM-DD), got {type(value).__name__}")

        elif field_type == "datetime":
            if isinstance(value, str):
                try:
                    datetime.fromisoformat(value.replace('Z', '+00:00'))
                    return value
                except ValueError:
                    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                        try:
                            datetime.strptime(value, fmt)
                            return value
                        except ValueError:
                            continue
                    raise ValidationError(key, f"invalid datetime format: {value}")
            raise ValidationError(key, f"must be datetime string, got {type(value).__name__}")

        elif field_type == "enum":
            valid_values = config.get("values", [])
            if value not in valid_values:
                errors.append(f"{key} must be one of {valid_values}, got {value}")
            return value

        elif field_type == "any":
            # 接受任意类型（string/array/...），透传
            return value

        else:
            return value


# 单例
_validator = None


def get_validator() -> ComponentValidator:
    """获取校验器单例"""
    global _validator
    if _validator is None:
        _validator = ComponentValidator()
    return _validator


def validate_component(component_type: str, theme: str, data: Dict[str, Any]):
    """便捷函数：校验组件参数"""
    validator = get_validator()
    return validator.validate(component_type, theme, data)
