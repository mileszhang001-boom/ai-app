"""
新闻抓取器

支持多数据源：RSS 聚合 + 备用 mock 数据
优先级：RSS > mock
"""

import os
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime, timezone

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False


@dataclass
class NewsItem:
    """新闻条目"""
    id: str
    title: str
    summary: str = ""
    source: str = ""
    url: str = ""
    category: str = "综合"
    published_at: str = ""
    image_url: str = ""
    fetched_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "source": self.source,
            "url": self.url,
            "category": self.category,
            "published_at": self.published_at,
            "image_url": self.image_url,
            "fetched_at": self.fetched_at,
        }


# RSS 源配置（免费、无需 API Key，覆盖 5 大领域）
RSS_SOURCES = {
    "general": [
        {"name": "人民网-国内", "url": "http://www.people.com.cn/rss/politics.xml", "category": "国内"},
        {"name": "新华网", "url": "http://www.news.cn/rss/ws.xml", "category": "综合"},
    ],
    "tech": [
        {"name": "36氪", "url": "https://36kr.com/feed", "category": "科技"},
        {"name": "IT之家", "url": "https://www.ithome.com/rss/", "category": "科技"},
    ],
    "automotive": [
        {"name": "汽车之家", "url": "https://www.autohome.com.cn/rss/", "category": "汽车"},
    ],
    "auto": [  # 兼容旧 category 名
        {"name": "汽车之家", "url": "https://www.autohome.com.cn/rss/", "category": "汽车"},
    ],
    "finance": [
        {"name": "华尔街见闻", "url": "https://rsshub.app/wallstreetcn/news/global", "category": "财经"},
        {"name": "东方财富", "url": "https://rsshub.app/eastmoney/report", "category": "财经"},
    ],
    "sports": [
        {"name": "懂球帝", "url": "https://rsshub.app/dongqiudi/top_news", "category": "体育"},
        {"name": "虎扑", "url": "https://rsshub.app/hupu/bbs/topic", "category": "体育"},
    ],
    "lifestyle": [
        {"name": "澎湃新闻", "url": "https://rsshub.app/thepaper/featured", "category": "生活"},
    ],
}

# 备用 RSS 源（更可靠的国际源 + RSSHub 备用）
FALLBACK_RSS_SOURCES = {
    "general": [
        {"name": "BBC中文", "url": "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml", "category": "国际"},
    ],
    "tech": [
        {"name": "Hacker News", "url": "https://hnrss.org/frontpage?count=10", "category": "科技"},
    ],
    "finance": [
        {"name": "新浪财经", "url": "https://rsshub.app/sina/finance/news", "category": "财经"},
    ],
    "sports": [
        {"name": "ESPN中文", "url": "https://rsshub.app/espn/news", "category": "体育"},
    ],
}


class NewsFetcher:
    """新闻抓取器"""

    def __init__(self, timeout: int = 10):
        self.timeout = timeout

    async def fetch(self, category: str = "general", limit: int = 8) -> List[NewsItem]:
        """
        抓取新闻

        优先从 RSS 获取，失败则用 mock 数据
        """
        news = []

        # 尝试 RSS 源
        sources = RSS_SOURCES.get(category, RSS_SOURCES["general"])
        for source in sources:
            try:
                items = await self._fetch_rss(source)
                news.extend(items)
                if len(news) >= limit:
                    break
            except Exception as e:
                print(f"[NEWS] RSS fetch failed for {source['name']}: {e}")

        # 如果主源全部失败，尝试备用源
        if not news:
            fallback = FALLBACK_RSS_SOURCES.get(category, FALLBACK_RSS_SOURCES.get("general", []))
            for source in fallback:
                try:
                    items = await self._fetch_rss(source)
                    news.extend(items)
                    if len(news) >= limit:
                        break
                except Exception as e:
                    print(f"[NEWS] Fallback RSS fetch failed for {source['name']}: {e}")

        # 全部失败，使用 mock 数据
        if not news:
            print("[NEWS] All RSS sources failed, using mock data")
            news = self._get_mock_news(category)

        # 去重（按标题）
        seen_titles = set()
        unique_news = []
        for item in news:
            if item.title not in seen_titles:
                seen_titles.add(item.title)
                unique_news.append(item)

        return unique_news[:limit]

    async def _fetch_rss(self, source: dict) -> List[NewsItem]:
        """解析 RSS feed"""
        if not HTTPX_AVAILABLE:
            raise RuntimeError("httpx not available")

        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True,
            headers={"User-Agent": "AIWidgetWorkshop/0.1 NewsBot"}
        ) as client:
            response = await client.get(source["url"])
            response.raise_for_status()

        items = []
        root = ET.fromstring(response.text)

        # 支持 RSS 2.0 和 Atom 格式
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        # 命名空间（用于 media:content 等）
        media_ns = {"media": "http://search.yahoo.com/mrss/"}

        # RSS 2.0
        for item_el in root.findall(".//item"):
            title = self._get_text(item_el, "title")
            if not title:
                continue
            description = self._get_text(item_el, "description") or ""
            link = self._get_text(item_el, "link") or ""
            pub_date = self._get_text(item_el, "pubDate") or ""
            image_url = self._extract_image(item_el, description, media_ns)

            items.append(NewsItem(
                id=f"rss_{hash(title) & 0xFFFFFFFF:08x}",
                title=title.strip()[:80],
                summary=self._clean_html(description)[:500],
                source=source["name"],
                url=link,
                category=source["category"],
                published_at=pub_date,
                image_url=image_url,
            ))

        # Atom
        if not items:
            for entry in root.findall("atom:entry", ns):
                title = self._get_text(entry, "atom:title", ns)
                if not title:
                    continue
                summary = self._get_text(entry, "atom:summary", ns) or ""
                content = self._get_text(entry, "atom:content", ns) or ""
                link_el = entry.find("atom:link", ns)
                link = link_el.get("href", "") if link_el is not None else ""
                published = self._get_text(entry, "atom:published", ns) or ""
                image_url = self._extract_image(entry, summary or content, media_ns)

                items.append(NewsItem(
                    id=f"atom_{hash(title) & 0xFFFFFFFF:08x}",
                    title=title.strip()[:80],
                    summary=self._clean_html(summary or content)[:500],
                    source=source["name"],
                    url=link,
                    category=source["category"],
                    published_at=published,
                    image_url=image_url,
                ))

        return items

    @staticmethod
    def _extract_image(item_el, description: str, media_ns: dict) -> str:
        """从 RSS 条目提取图片 URL（按优先级尝试多种方式）"""
        import re
        # 1. media:content 或 media:thumbnail
        for tag in ['{http://search.yahoo.com/mrss/}content', '{http://search.yahoo.com/mrss/}thumbnail']:
            media = item_el.find(tag)
            if media is not None:
                url = media.get('url', '')
                if url and ('http' in url):
                    return url
        # 2. enclosure（podcast/media 格式）
        enclosure = item_el.find('enclosure')
        if enclosure is not None:
            enc_type = enclosure.get('type', '')
            enc_url = enclosure.get('url', '')
            if enc_url and ('image' in enc_type or enc_url.endswith(('.jpg', '.jpeg', '.png', '.webp'))):
                return enc_url
        # 3. description 中的 <img src>
        if description:
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)', description)
            if img_match:
                return img_match.group(1)
        return ""

    @staticmethod
    def _get_text(el, tag, ns=None):
        """安全获取 XML 元素文本"""
        child = el.find(tag, ns) if ns else el.find(tag)
        return child.text if child is not None and child.text else None

    @staticmethod
    def _clean_html(text: str) -> str:
        """清理 HTML 标签"""
        import re
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'&[a-zA-Z]+;', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def _get_mock_news(category: str) -> List[NewsItem]:
        """兜底 mock 数据"""
        now = datetime.now()
        mock_data = {
            "general": [
                ("人工智能技术在汽车领域取得新突破", "多家车企宣布将在新车型中集成AI助手，提升用户体验和驾驶安全性。", "科技"),
                ("新能源汽车销量持续增长", "数据显示新能源汽车市场渗透率再创新高，同比增长超40%。", "汽车"),
                ("智能座舱成新车标配", "消费者选购新车时智能化配置已成为重要考量因素，车企纷纷加码。", "行业"),
                ("自动驾驶技术加速落地", "多家车企计划今年推出具备L3自动驾驶能力的量产车型。", "科技"),
                ("车联网安全标准正在完善", "随着车联网技术普及，数据安全和隐私保护成为行业焦点。", "安全"),
                ("国产芯片在车载领域崭露头角", "国产车规级芯片出货量持续增长，供应链自主可控进程加速。", "行业"),
            ],
            "tech": [
                ("大模型竞赛进入应用落地阶段", "各大厂商从模型训练转向垂直行业应用，效率提升显著。", "AI"),
                ("端侧AI芯片性能大幅提升", "新一代手机和车载AI芯片算力翻倍，功耗降低30%。", "硬件"),
                ("开源大模型社区活跃度创新高", "GitHub上AI相关项目星标数和贡献者数量均创历史新高。", "开源"),
                ("量子计算取得重大突破", "研究团队成功实现百量子比特级别的量子纠错，离实用化更进一步。", "前沿"),
                ("边缘计算与AI融合加速", "边缘计算+AI方案在自动驾驶和智能工厂中落地案例增多。", "云计算"),
            ],
            "auto": [
                ("小米SU7交付量再创新高", "小米汽车本月交付量突破新纪录，产能爬坡超预期。", "小米"),
                ("固态电池量产进程加速", "多家电池厂商宣布固态电池量产时间表，续航有望突破1000公里。", "电池"),
                ("智能底盘技术成新竞争焦点", "空气悬架和CDC减震器逐步下探至20万级别车型。", "技术"),
                ("充电基础设施建设提速", "全国超充站数量年内有望翻倍，充电焦虑进一步缓解。", "基建"),
                ("车企出海势头强劲", "中国品牌新能源车在东南亚和欧洲市场份额持续攀升。", "市场"),
            ],
        }

        items = []
        hours_ago = [1, 2, 3, 5, 8, 12]
        for i, (title, summary, tag) in enumerate(mock_data.get(category, mock_data["general"])):
            items.append(NewsItem(
                id=f"mock_{category}_{i+1}",
                title=title,
                summary=summary,
                source="AI小组件编辑部",
                category=tag,
                published_at=f"{hours_ago[i % len(hours_ago)]}小时前",
            ))

        return items
