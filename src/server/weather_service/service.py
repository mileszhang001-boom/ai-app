"""
天气服务（门面层）

缓存 + mock fallback + 响应格式化
"""

import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from .client import QWeatherClient, get_weather_type


class WeatherService:
    """天气服务"""

    CACHE_TTL = 30 * 60  # 30 分钟缓存

    def __init__(self):
        self.client = QWeatherClient()
        self._cache: Dict[str, Dict[str, Any]] = {}  # city -> {data, ts}

    async def get_weather(self, city: str = "北京") -> Dict[str, Any]:
        """获取天气数据（带缓存 + mock fallback）"""

        # 1. 查缓存
        cached = self._cache.get(city)
        if cached and (time.time() - cached["ts"]) < self.CACHE_TTL:
            return cached["data"]

        # 2. 调用 API
        if self.client.available:
            try:
                result = await self._fetch_real(city)
                if result:
                    self._cache[city] = {"data": result, "ts": time.time()}
                    return result
            except Exception as e:
                print(f"[Weather] API error, falling back to mock: {e}")

        # 3. Mock fallback
        result = self._mock_weather(city)
        return result

    async def _fetch_real(self, city: str) -> Optional[Dict[str, Any]]:
        """调用和风天气 API"""
        # 城市查找
        location_id = await self.client.lookup_city(city)
        if not location_id:
            return None

        # 并发获取实时+预报
        now_data = await self.client.get_now(location_id)
        forecast_data = await self.client.get_3d(location_id)

        if not now_data:
            return None

        # 格式化实时数据
        icon_code = now_data.get("icon", "100")
        temp = int(now_data.get("temp", 20))
        feels_like = int(now_data.get("feelsLike", temp))
        weather_type = get_weather_type(icon_code)

        # 格式化预报
        forecast = []
        if forecast_data:
            today = datetime.now().date()
            labels = self._forecast_labels()
            for i, day in enumerate(forecast_data[:3]):
                forecast.append({
                    "label": labels[i],
                    "icon": self.client.icon_to_emoji(day.get("iconDay", "100")),
                    "high": int(day.get("tempMax", 25)),
                    "low": int(day.get("tempMin", 15)),
                })

        # AQI 简化（和风免费版不含AQI，用湿度估算显示）
        humidity = int(now_data.get("humidity", 50))

        result = {
            "temp": temp,
            "feelsLike": feels_like,
            "desc": now_data.get("text", "晴"),
            "humidity": humidity,
            "wind": now_data.get("windScale", "3"),
            "aqi": self._estimate_aqi_label(humidity),
            "icon": self.client.icon_to_emoji(icon_code),
            "weather_type": weather_type,
            "forecast": forecast,
            "suggestion": self._generate_suggestion(temp, weather_type),
            "city": city,
        }
        return result

    @staticmethod
    def _forecast_labels() -> list:
        """生成预报日期标签"""
        now = datetime.now()
        labels = []
        weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        for i in range(3):
            d = now + timedelta(days=i + 1)
            if i == 0:
                labels.append("明天")
            elif i == 1:
                labels.append("后天")
            else:
                labels.append(weekdays[d.weekday()])
        return labels

    @staticmethod
    def _estimate_aqi_label(humidity: int) -> str:
        """简化AQI估算（仅供展示）"""
        if humidity < 40:
            return "优"
        elif humidity < 70:
            return "良"
        else:
            return "良"

    @staticmethod
    def _generate_suggestion(temp: int, weather_type: str) -> str:
        """基于温度+天气生成建议文案"""
        suggestions = {
            "sunny": {
                "cold": "天气晴朗但气温较低，注意添衣保暖。",
                "cool": "晴天凉爽，适合户外活动。注意防晒。",
                "warm": "天气晴好，适合户外活动。紫外线较强，建议涂抹防晒霜。",
                "hot": "晴天高温，注意防暑降温，多喝水。",
            },
            "cloudy": {
                "cold": "多云微凉，建议穿着保暖外套。",
                "cool": "多云天气，温度适中。建议携带薄外套。",
                "warm": "多云舒适，适合出行。可能有阵雨，建议带伞。",
                "hot": "多云闷热，注意补充水分。",
            },
            "rainy": {
                "cold": "雨天降温，注意保暖防滑，行车小心。",
                "cool": "雨天路滑，请小心驾驶。记得带伞。",
                "warm": "雨天出行请携带雨具，道路湿滑注意安全。",
                "hot": "雷阵雨天气，注意防雨防雷。",
            },
            "snowy": {
                "cold": "雪天降温明显，注意保暖防滑。车辆出行请检查防冻液。",
                "cool": "小雪天气，路面可能结冰，驾车注意安全。",
                "warm": "降雪天气，注意出行安全。",
                "hot": "降雪天气，注意出行安全。",
            },
        }

        if temp < 5:
            level = "cold"
        elif temp < 18:
            level = "cool"
        elif temp < 30:
            level = "warm"
        else:
            level = "hot"

        return suggestions.get(weather_type, suggestions["sunny"]).get(level, "天气变化，注意适时增减衣物。")

    @staticmethod
    def _mock_weather(city: str) -> Dict[str, Any]:
        """Mock 天气数据"""
        return {
            "temp": 26,
            "feelsLike": 28,
            "desc": "晴",
            "humidity": 35,
            "wind": "3",
            "aqi": "优",
            "icon": "☀️",
            "weather_type": "sunny",
            "forecast": [
                {"label": "明天", "icon": "⛅", "high": 28, "low": 18},
                {"label": "后天", "icon": "☀️", "high": 30, "low": 19},
                {"label": "周六", "icon": "🌤️", "high": 27, "low": 17},
            ],
            "suggestion": "天气晴好，适合户外活动。紫外线较强，建议涂抹防晒霜。",
            "city": city,
        }


# 单例
_service: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    global _service
    if _service is None:
        _service = WeatherService()
    return _service
