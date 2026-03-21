"""
和风天气 API 客户端

- 城市查找 (GeoAPI)
- 实时天气
- 3日预报
"""

import os
from typing import Optional, Dict, Any

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


# 天气图标码 → emoji
ICON_MAP = {
    # 晴
    '100': '☀️', '150': '☀️',
    # 多云
    '101': '⛅', '102': '⛅', '103': '⛅',
    '151': '⛅', '152': '⛅', '153': '⛅',
    # 阴
    '104': '☁️', '154': '☁️',
    # 雨
    '300': '🌧️', '301': '🌧️', '302': '⛈️', '303': '⛈️',
    '304': '⛈️', '305': '🌧️', '306': '🌧️', '307': '🌧️',
    '308': '🌧️', '309': '🌧️', '310': '🌧️', '311': '🌧️',
    '312': '🌧️', '313': '🌧️', '314': '🌧️', '315': '🌧️',
    '316': '🌧️', '317': '🌧️', '318': '🌧️',
    '350': '🌧️', '351': '🌧️',
    # 雪
    '400': '❄️', '401': '❄️', '402': '❄️', '403': '❄️',
    '404': '🌨️', '405': '🌨️', '406': '🌨️', '407': '🌨️',
    '408': '❄️', '409': '❄️', '410': '❄️',
    '456': '🌨️', '457': '🌨️',
    # 雾/霾
    '500': '🌫️', '501': '🌫️', '502': '🌫️',
    '503': '🌫️', '504': '🌫️', '507': '🌫️', '508': '🌫️',
    '509': '🌫️', '510': '🌫️', '511': '🌫️', '512': '🌫️',
    '513': '🌫️', '514': '🌫️', '515': '🌫️',
}

# 天气码 → weather_type（驱动模板粒子系统）
def get_weather_type(icon_code: str) -> str:
    code = int(icon_code) if icon_code.isdigit() else 100
    if code in (100, 150):
        return 'sunny'
    elif code < 200:
        return 'cloudy'
    elif 300 <= code < 400:
        return 'rainy'
    elif 400 <= code < 500:
        return 'snowy'
    return 'cloudy'


class QWeatherClient:
    """和风天气 API 客户端

    新版 QWeather API 使用账户专属 host：{CREDENTIAL_ID}.qweatherapi.com
    通过环境变量 QWEATHER_API_HOST 配置，默认回退到旧版 devapi
    """

    def __init__(self, api_key: Optional[str] = None, api_host: Optional[str] = None):
        self.api_key = api_key or os.environ.get("QWEATHER_API_KEY", "")
        # 新版 API host（账户专属）
        host = api_host or os.environ.get("QWEATHER_API_HOST", "")
        if host:
            self.API_BASE = f"https://{host}"
        else:
            self.API_BASE = "https://devapi.qweather.com"

    @property
    def available(self) -> bool:
        return bool(self.api_key) and HTTPX_AVAILABLE

    async def lookup_city(self, city: str) -> Optional[str]:
        """城市名 → location ID"""
        if not self.available:
            return None
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.API_BASE}/v2/city/lookup",
                    params={"location": city, "key": self.api_key, "number": 1},
                )
                data = resp.json()
                if data.get("code") == "200" and data.get("location"):
                    return data["location"][0]["id"]
        except Exception as e:
            print(f"[Weather] City lookup error: {e}")
        return None

    async def get_now(self, location_id: str) -> Optional[Dict[str, Any]]:
        """实时天气"""
        if not self.available:
            return None
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.API_BASE}/v7/weather/now",
                    params={"location": location_id, "key": self.api_key},
                )
                data = resp.json()
                if data.get("code") == "200":
                    return data.get("now")
        except Exception as e:
            print(f"[Weather] Now error: {e}")
        return None

    async def get_3d(self, location_id: str) -> Optional[list]:
        """3日预报"""
        if not self.available:
            return None
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.API_BASE}/v7/weather/3d",
                    params={"location": location_id, "key": self.api_key},
                )
                data = resp.json()
                if data.get("code") == "200":
                    return data.get("daily", [])
        except Exception as e:
            print(f"[Weather] 3d error: {e}")
        return None

    @staticmethod
    def icon_to_emoji(icon_code: str) -> str:
        return ICON_MAP.get(icon_code, '🌤️')
