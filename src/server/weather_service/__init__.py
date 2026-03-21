"""
天气服务

接入和风天气 API，提供实时天气 + 3日预报
"""

from .service import get_weather_service, WeatherService

__all__ = ["get_weather_service", "WeatherService"]
