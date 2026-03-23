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
                ("人工智能技术在汽车领域取得新突破", "多家车企宣布将在新车型中集成AI助手，覆盖语音交互、智能导航、驾驶辅助等场景。据统计，2026年上市新车中超过80%配备了AI座舱助手，同比提升35个百分点。业内人士认为，AI技术正从"锦上添花"转变为"标配刚需"，未来两年将成为影响消费者购车决策的核心因素之一。", "科技"),
                ("新能源汽车销量持续增长", "最新数据显示，2026年3月国内新能源汽车销量达到98.7万辆，同比增长42.3%，市场渗透率达到51.2%，首次突破半数关口。其中插电混动车型增速最快，同比增长67%。分析指出，充电基础设施的快速完善和电池成本持续下降是推动增长的关键因素。", "汽车"),
                ("智能座舱成新车标配", "消费者选购新车时，智能化配置已成为仅次于价格的第二大考量因素。调查显示，76%的购车者将车机屏幕尺寸、语音助手响应速度、OTA升级能力列为"必须具备"的功能。车企纷纷加码智能座舱投入，头部厂商年研发预算超过50亿元。", "行业"),
                ("自动驾驶技术加速落地", "至少5家车企计划今年推出具备L3自动驾驶能力的量产车型。高速NOA功能已覆盖全国超过30万公里高速公路，城市NOA也在20多个城市开放测试。监管层面，工信部正在制定L3/L4级自动驾驶准入管理办法，预计年内出台。", "科技"),
                ("车联网安全标准正在完善", "随着车联网技术普及，国家网信办联合工信部发布了《智能网联汽车数据安全管理暂行规定》。新规要求车企建立数据分类分级制度，车内摄像头数据需本地处理，位置信息脱敏后方可上传云端。多家车企已着手调整数据架构以满足合规要求。", "安全"),
                ("国产芯片在车载领域崭露头角", "国产车规级芯片出货量2025年突破2亿颗，同比增长85%。多家芯片企业通过AEC-Q100车规认证，产品覆盖MCU、SoC、功率半导体等品类。业内预计到2027年，国产芯片在车载市场占有率将从目前的12%提升至30%以上。", "行业"),
            ],
            "tech": [
                ("大模型竞赛进入应用落地阶段", "2026年AI行业最显著的变化是从模型训练竞赛转向垂直行业应用。医疗、法律、金融等领域的专用AI助手已实现商业化部署，部分场景效率提升超过200%。与此同时，模型推理成本在过去一年下降了70%，使得更多中小企业能够负担AI能力的接入。", "AI"),
                ("端侧AI芯片性能大幅提升", "新一代手机和车载AI芯片在算力上实现翻倍增长的同时，功耗降低了30%。苹果、高通、联发科和华为海思均推出了支持大模型本地推理的旗舰芯片。端侧推理使得AI功能无需联网即可运行，既保护隐私又降低延迟，被视为AI普惠化的关键突破。", "硬件"),
                ("开源大模型社区活跃度创新高", "GitHub上AI相关项目星标数突破500万，贡献者数量同比增长120%。以Llama、Qwen、DeepSeek为代表的开源模型生态日趋成熟，社区贡献的微调工具和推理优化方案使开源模型在多项基准测试中追平甚至超越闭源模型。", "开源"),
                ("量子计算取得重大突破", "中科院量子信息实验室宣布成功实现了156量子比特级别的量子纠错，错误率低于0.1%。这是向实用化量子计算迈出的关键一步。研究团队表示，预计在3-5年内实现千量子比特级别的可纠错量子计算机，届时将在药物发现和材料模拟领域产生实际价值。", "前沿"),
                ("边缘计算与AI融合加速", "边缘计算+AI融合方案在自动驾驶和智能工厂中的落地案例显著增多。某头部自动驾驶公司透露，其车端计算平台已能在200ms内完成环境感知全流程，无需依赖云端。工业领域，边缘AI质检系统的缺陷检出率达到99.7%，远超人工水平。", "云计算"),
            ],
            "auto": [
                ("小米SU7交付量再创新高", "小米汽车3月交付量达到28,500辆，环比增长15%，创下单月交付新纪录。产能爬坡速度超出预期，第二座工厂已进入调试阶段，预计下半年投产后月产能将提升至5万辆。SU7 Ultra性能版也已开启预定，首批配额30分钟内售罄。", "小米"),
                ("固态电池量产进程加速", "宁德时代、比亚迪等头部电池厂商相继公布固态电池量产时间表。宁德时代宣布其半固态电池将在2026年Q4量产上车，能量密度达到400Wh/kg，搭载后续航可突破1000公里。分析人士指出，固态电池的量产将从根本上解决电动车续航和安全焦虑。", "电池"),
                ("智能底盘技术成新竞争焦点", "空气悬架和CDC连续阻尼可调减震器逐步从豪华车下探至20万级别车型。多家供应商推出了成本降低40%的国产方案，使得智能底盘的装配率大幅提升。预计到2027年，20-30万价位新车中超过半数将标配空气悬架。", "技术"),
                ("充电基础设施建设提速", "截至2026年3月底，全国公共充电桩保有量达到380万台，其中超充桩（≥250kW）占比提升至18%。国家电网计划年内在高速服务区新增5000个超充站点。多地推出"充电15分钟补能400公里"的超快充服务，充电焦虑正在快速缓解。", "基建"),
                ("车企出海势头强劲", "2026年1-3月，中国品牌新能源车出口48.2万辆，同比增长55%。在东南亚市场，中国品牌市占率达到32%；在欧洲市场，份额从去年同期的8%提升至13%。比亚迪、吉利、奇瑞成为出海"三驾马车"，本地化生产布局加速推进。", "市场"),
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
