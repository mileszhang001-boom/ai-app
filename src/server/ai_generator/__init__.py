"""
AI 生成模块

包含 AI 参数生成、Prompt 管理和参数校验功能
"""

from .generator import AIGenerator, GenerateConfig, get_generator, generate_widget
from .prompt import (
    TEMPLATES,
    PromptTemplate,
    get_prompt_template,
    get_system_prompt,
    build_user_message
)
from .validator import ComponentValidator, ValidationError, get_validator, validate_component

__all__ = [
    # generator
    "AIGenerator",
    "GenerateConfig",
    "get_generator",
    "generate_widget",
    # prompt
    "TEMPLATES",
    "PromptTemplate",
    "get_prompt_template",
    "get_system_prompt",
    "build_user_message",
    # validator
    "ComponentValidator",
    "ValidationError",
    "get_validator",
    "validate_component",
]
