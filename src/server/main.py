"""
AI小组件云服务 - FastAPI 主应用

提供以下 API：
- POST /api/generate - AI 生成组件参数
- POST /api/render - 渲染 H5 组件
- POST /api/sync - 同步到车机
- GET /api/news - 获取新闻
- POST /api/widgets - 创建/更新组件
- GET /api/widgets - 获取用户组件列表
"""

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import json
import uuid
from datetime import datetime

# AI 生成
from ai_generator.generator import get_generator, GenerateConfig
from ai_generator.prompt import get_prompt_template
from ai_generator.validator import validate_component

# 存储
from storage.metadata import (
    get_metadata_store,
    create_widget as create_widget_metadata,
    get_widget as get_widget_metadata,
    get_user_widgets as get_user_widgets_list,
    mark_synced,
    delete_widget as delete_widget_metadata
)
from storage.assets import save_widget as save_widget_assets

# 同步服务
from sync_service.state import (
    SyncStatus,
    get_sync_manager,
    create_sync,
    update_sync_status,
    get_sync_state,
    get_device_syncs
)
# 新闻聚合服务
from news_service import get_news_service

# 天气服务
from weather_service import get_weather_service


# FastAPI 应用
app = FastAPI(
    title="AI Widget Workshop API",
    description="车载 AI 小组件 v0.1 Demo 云服务",
    version="0.1.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Demo 阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== 数据模型 ==========

class GenerateRequest(BaseModel):
    """生成请求（结构化模式）"""
    component_type: str = Field(..., description="组件类型: anniversary | news | alarm")
    theme: Optional[str] = Field(None, description="主题: love | baby | holiday | daily | clock")
    params: Dict[str, Any] = Field(default_factory=dict, description="用户已填参数")
    style_preset: Optional[str] = Field(None, description="风格预设")
    model: Optional[str] = Field("qwen-plus", description="LLM 模型")


class ChatGenerateRequest(BaseModel):
    """自然语言生成请求"""
    text: str = Field(..., description="用户的自然语言输入，如'帮我做一个恋爱纪念日'")
    base_data: Optional[Dict[str, Any]] = Field(None, description="已有参数，用于微调合并")
    model: Optional[str] = Field("qwen-plus", description="LLM 模型")
    generation_mode: Optional[str] = Field("template", description="生成模式: template | code")


class GenerateResponse(BaseModel):
    """生成响应"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class RenderRequest(BaseModel):
    """渲染请求"""
    component_type: str
    theme: str
    params: Dict[str, Any]
    style_preset: Optional[str] = None


class SyncRequest(BaseModel):
    """同步请求"""
    widget_id: str = Field(..., description="组件 ID")
    device_id: Optional[str] = Field(None, description="设备ID（车机ID）")


class SyncResponse(BaseModel):
    """同步响应"""
    success: bool
    sync_id: Optional[str] = None
    error: Optional[str] = None


class CreateWidgetRequest(BaseModel):
    """创建/更新组件请求"""
    user_id: str = Field(..., description="用户ID")
    component_type: str = Field(..., description="组件类型")
    theme: Optional[str] = Field(None, description="主题")
    params: Dict[str, Any] = Field(default_factory=dict, description="组件参数")
    style_preset: Optional[str] = Field(None, description="风格预设")


class WidgetResponse(BaseModel):
    """组件响应"""
    success: bool
    widget_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ========== 模板渲染器 ==========

class TemplateRenderer:
    """模板渲染器（简化版）"""

    @staticmethod
    def render_html(component_type: str, theme: str, params: Dict[str, Any], style_preset: str) -> str:
        """渲染 H5 HTML"""
        if component_type == "anniversary":
            return TemplateRenderer._render_anniversary(theme, params, style_preset)
        elif component_type == "news":
            return TemplateRenderer._render_news(params, style_preset)
        elif component_type == "alarm":
            return TemplateRenderer._render_alarm(params, style_preset)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown component type: {component_type}")

    @staticmethod
    def _render_anniversary(theme: str, params: Dict[str, Any], style_preset: str) -> str:
        """渲染纪念日组件"""
        style_map = {
            "sweet-pink": "#FF6B9D",
            "soft-purple": "#9B59B6",
            "vibrant-orange": "#FF8C42",
            "minimal-dark": "#1A1A2E"
        }
        bg_color = style_map.get(style_preset, "#FF6B9D")

        title = params.get("title", "在一起的第365天")
        subtitle = params.get("subtitle", "每一天都算数")
        date_info = params.get("start_date", "2024-03-05")

        if theme == "holiday":
            days_text = "还有239天"
        else:
            days_text = "已经365天"

        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>纪念日卡片</title>
    <style>
        body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
        .widget-card {{
            width: 896px;
            height: 1464px;
            background: linear-gradient(135deg, {bg_color}, #16213E);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
        }}
        .subtitle {{ font-size: 16px; opacity: 0.8; margin-bottom: 12px; }}
        .hero-number {{ font-size: 72px; font-weight: 700; line-height: 1; }}
        .title {{ font-size: 24px; font-weight: 500; margin-top: 8px; }}
        .date-info {{ font-size: 16px; opacity: 0.6; margin-top: 16px; }}
    </style>
</head>
<body>
    <div class="widget-card">
        <div class="subtitle">{subtitle}</div>
        <div class="hero-number">{days_text}</div>
        <div class="title">{title}</div>
        <div class="date-info">起始于 {date_info}</div>
    </div>
</body>
</html>
        """

    @staticmethod
    def _render_news(params: Dict[str, Any], style_preset: str) -> str:
        """渲染新闻组件"""
        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>每日新闻</title>
    <style>
        body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
        .widget-card {{
            width: 896px;
            height: 1464px;
            background: linear-gradient(135deg, #1A1A2E, #0D0D1A);
            display: flex;
            flex-direction: column;
            color: #fff;
        }}
        .header {{ display: flex; justify-content: space-between; padding: 40px 32px; }}
        .title {{ font-size: 28px; font-weight: 700; }}
        .badge {{ font-size: 12px; padding: 4px 12px; background: rgba(255,105,0,0.2); border-radius: 12px; }}
        .news-list {{ flex: 1; padding: 0 32px 40px; gap: 16px; }}
        .news-item {{ padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; }}
        .news-title {{ font-size: 18px; font-weight: 500; margin-bottom: 6px; }}
        .news-summary {{ font-size: 14px; opacity: 0.6; line-height: 1.4; }}
    </style>
</head>
<body>
    <div class="widget-card">
        <div class="header">
            <div class="title">每日新闻</div>
            <div class="badge">AI摘要</div>
        </div>
        <div class="news-list">
            <div class="news-item">
                <div class="news-title">科技新闻</div>
                <div class="news-summary">AI技术在汽车领域取得新突破</div>
            </div>
            <div class="news-item">
                <div class="news-title">汽车新闻</div>
                <div class="news-summary">新能源汽车销量创新高</div>
            </div>
        </div>
    </div>
</body>
</html>
        """

    @staticmethod
    def _render_alarm(params: Dict[str, Any], style_preset: str) -> str:
        """渲染闹钟组件"""
        default_hours = params.get("default_hours", 7)
        label = params.get("label", "起床闹钟")

        return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>闹钟卡片</title>
    <style>
        body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }}
        .widget-card {{
            width: 896px;
            height: 1464px;
            background: linear-gradient(135deg, #1e1e2e, #141418);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
        }}
        .time {{ font-size: 96px; font-weight: 200; letter-spacing: -3px; }}
        .time span {{ font-size: 48px; opacity: 0.5; }}
        .label {{ font-size: 20px; font-weight: 500; margin-top: 8px; opacity: 0.8; }}
        .status {{ font-size: 14px; margin-top: 24px; padding: 8px 16px; background: rgba(255,105,0,0.12); border-radius: 14px; }}
    </style>
</head>
<body>
    <div class="widget-card">
        <div class="time">0{default_hours}<span>:30</span></div>
        <div class="label">{label}</div>
        <div class="status">下次响铃 明日 07:30</div>
    </div>
</body>
</html>
        """


# ========== 路由 ==========

@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "AI Widget Workshop API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/api/templates")
async def get_templates():
    """获取所有可用模板"""
    prompt_template = get_prompt_template()
    return {
        "templates": prompt_template.get_available_templates()
    }


@app.get("/api/templates/{component_type}/{theme}")
async def get_template_schema(component_type: str, theme: str):
    """获取模板参数 schema"""
    prompt_template = get_prompt_template()
    template = prompt_template.get_template(component_type, theme)

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    return {
        "template": template,
        "style_presets": prompt_template.get_style_presets(component_type, theme)
    }


@app.post("/api/generate", response_model=GenerateResponse)
async def generate_component(request: GenerateRequest):
    """
    AI 生成组件参数

    调用 LLM 根据用户输入生成完整的组件参数
    """
    try:
        # 获取生成器
        config = GenerateConfig(model=request.model)
        generator = get_generator(config)

        # 调用 AI 生成
        success, data, error = generator.generate(
            component_type=request.component_type,
            theme=request.theme or "",
            user_params=request.params,
            style_preference=request.style_preset
        )

        if success:
            # 生成组件 ID
            widget_id = f"widget_{uuid.uuid4().hex[:12]}"
            return GenerateResponse(
                success=True,
                data={
                    "widget_id": widget_id,
                    **data
                }
            )
        else:
            return GenerateResponse(
                success=False,
                error=error
            )

    except Exception as e:
        return GenerateResponse(
            success=False,
            error=str(e)
        )


@app.post("/api/chat-generate", response_model=GenerateResponse)
async def chat_generate(request: ChatGenerateRequest):
    """
    自然语言生成组件参数

    用户输入一句话，AI 理解意图并生成完整的组件参数。
    例如："帮我做一个和女朋友的恋爱纪念日，我们2024年6月1日在一起的"
    """
    try:
        if not request.text or not request.text.strip():
            return GenerateResponse(success=False, error="请输入你想要的组件描述")

        config = GenerateConfig(model=request.model)
        generator = get_generator(config)

        # AI编程模式：LLM 直接生成完整代码
        if request.generation_mode == "code":
            success, data, error = generator.generate_code_from_nl(request.text.strip())
            if success:
                widget_id = f"widget_{uuid.uuid4().hex[:12]}"
                return GenerateResponse(
                    success=True,
                    data={
                        "widget_id": widget_id,
                        **data
                    }
                )
            else:
                return GenerateResponse(success=False, error=error)

        # 模板生成模式（默认）
        success, data, error = generator.generate_from_nl(request.text.strip(), base_data=request.base_data)

        if success:
            widget_id = f"widget_{uuid.uuid4().hex[:12]}"
            description = generator.build_description(data)
            return GenerateResponse(
                success=True,
                data={
                    "widget_id": widget_id,
                    "description": description,
                    **data
                }
            )
        else:
            return GenerateResponse(success=False, error=error)

    except Exception as e:
        return GenerateResponse(success=False, error=str(e))


@app.post("/api/render", response_class=HTMLResponse)
async def render_component(request: RenderRequest):
    """
    渲染 H5 组件

    根据参数生成完整的 H5 页面
    """
    try:
        html_content = TemplateRenderer.render_html(
            component_type=request.component_type,
            theme=request.theme,
            params=request.params,
            style_preset=request.style_preset or "minimal-dark"
        )

        return HTMLResponse(content=html_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sync", response_model=SyncResponse)
async def sync_to_car(request: SyncRequest, background_tasks: BackgroundTasks):
    """
    同步组件到车机

    将组件数据推送到车机
    """
    try:
        # 创建同步任务
        sync_state = create_sync(
            widget_id=request.widget_id,
            user_id="demo_user",
            device_id=request.device_id or "demo_device"
        )

        # 更新为同步中
        update_sync_status(sync_state.sync_id, SyncStatus.SYNCING)

        # 模拟异步推送（Demo）
        def simulate_push():
            import time
            time.sleep(2)  # 模拟网络延迟
            update_sync_status(sync_state.sync_id, SyncStatus.SUCCESS)
            # 标记组件元数据已同步
            mark_synced(request.widget_id)

        background_tasks.add_task(simulate_push)

        return SyncResponse(
            success=True,
            sync_id=sync_state.sync_id
        )

    except Exception as e:
        return SyncResponse(
            success=False,
            error=str(e)
        )


@app.get("/api/sync/{sync_id}")
async def get_sync_status(sync_id: str):
    """获取同步状态"""
    state = get_sync_state(sync_id)
    if not state:
        raise HTTPException(status_code=404, detail="Sync not found")
    return state.to_dict()


@app.get("/api/device/{device_id}/widgets")
async def get_device_widgets(device_id: str):
    """获取设备上的所有组件"""
    device_syncs = get_device_syncs(device_id)
    return {
        "device_id": device_id,
        "widgets": [
            {
                "widget_id": widget_id,
                "status": sync_state.status.value
            }
            for widget_id, sync_state in device_syncs.items()
        ]
    }


@app.post("/api/widgets", response_model=WidgetResponse)
async def create_widget(request: CreateWidgetRequest):
    """
    创建/更新组件

    保存组件元数据和 H5 产物
    """
    try:
        # 创建元数据
        widget_metadata = create_widget_metadata(
            user_id=request.user_id,
            widget_data={
                "component_type": request.component_type,
                "theme": request.theme,
                "style_preset": request.style_preset,
                "params": request.params
            }
        )

        # 生成 H5 内容
        html_content = TemplateRenderer.render_html(
            component_type=request.component_type,
            theme=request.theme,
            params=request.params,
            style_preset=request.style_preset or "minimal-dark"
        )

        # 保存 H5 产物
        assets = save_widget_assets(
            widget_id=widget_metadata.widget_id,
            html_content=html_content,
            css_content="",
            js_content="",
            metadata=widget_metadata.to_dict()
        )

        return WidgetResponse(
            success=True,
            widget_id=widget_metadata.widget_id,
            data={
                "metadata": widget_metadata.to_dict(),
                "assets": assets
            }
        )

    except Exception as e:
        return WidgetResponse(
            success=False,
            error=str(e)
        )


@app.get("/api/widgets/user/{user_id}")
async def get_user_widgets(user_id: str):
    """获取用户的所有组件"""
    widgets = get_user_widgets_list(user_id)
    return {
        "user_id": user_id,
        "widgets": [w.to_dict() for w in widgets]
    }


@app.get("/api/widgets/{widget_id}")
async def get_widget(widget_id: str):
    """获取组件详情"""
    widget_metadata = get_widget_metadata(widget_id)
    if not widget_metadata:
        raise HTTPException(status_code=404, detail="Widget not found")
    return widget_metadata.to_dict()


@app.delete("/api/widgets/{widget_id}")
async def delete_widget(widget_id: str):
    """删除组件"""
    success = delete_widget_metadata(widget_id)
    return {"success": success}


@app.get("/api/news")
async def get_news(category: str = "general", limit: int = 5):
    """
    获取新闻

    从 RSS 源抓取 + AI 摘要，30分钟内存缓存 + 24小时文件缓存
    支持分类：general（综合）、tech（科技）、auto（汽车）
    """
    try:
        service = get_news_service()
        return await service.get_news(category=category, limit=limit)
    except Exception as e:
        print(f"[API] News service error: {e}")
        raise HTTPException(status_code=500, detail=f"News service error: {str(e)}")


@app.post("/api/news/refresh")
async def refresh_news(category: str = None):
    """
    强制刷新新闻缓存

    可选指定分类，不指定则刷新全部
    """
    try:
        service = get_news_service()
        await service.refresh(category)
        return {"success": True, "message": f"Cache invalidated for: {category or 'all'}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/weather")
async def get_weather(city: str = "北京"):
    """
    获取天气数据

    接入和风天气 API，30分钟缓存。无 API key 时返回 mock 数据。
    """
    try:
        service = get_weather_service()
        return await service.get_weather(city=city)
    except Exception as e:
        print(f"[API] Weather service error: {e}")
        raise HTTPException(status_code=500, detail=f"Weather service error: {str(e)}")


@app.get("/api/calendar/today")
async def get_calendar_today():
    """
    获取当日模拟日程

    按当前时间 + 星期几生成合理的模拟日程事件
    """
    now = datetime.now()
    weekday = now.weekday()  # 0=Monday

    # 基础事件池（按星期变化）
    weekday_events = {
        0: [  # 周一
            {"time": "09:00", "title": "周一晨会", "location": "3楼会议室A"},
            {"time": "10:30", "title": "产品需求评审", "location": "线上会议"},
            {"time": "14:00", "title": "技术方案讨论", "location": "2楼小会议室"},
            {"time": "15:30", "title": "代码Review", "location": "工位"},
            {"time": "17:00", "title": "本周计划确认", "location": "3楼会议室A"},
        ],
        1: [  # 周二
            {"time": "09:30", "title": "站会同步", "location": "工位"},
            {"time": "11:00", "title": "UI设计走查", "location": "线上会议"},
            {"time": "14:00", "title": "跨组技术对齐", "location": "5楼大会议室"},
            {"time": "15:30", "title": "Bug修复冲刺", "location": "工位"},
            {"time": "17:30", "title": "技术分享会", "location": "培训室"},
        ],
        2: [  # 周三
            {"time": "09:00", "title": "项目进度同步", "location": "线上会议"},
            {"time": "10:30", "title": "接口联调", "location": "工位"},
            {"time": "14:00", "title": "性能优化讨论", "location": "2楼小会议室"},
            {"time": "16:00", "title": "测试用例评审", "location": "线上会议"},
            {"time": "17:00", "title": "文档更新", "location": "工位"},
        ],
        3: [  # 周四
            {"time": "09:30", "title": "站会同步", "location": "工位"},
            {"time": "11:00", "title": "产品体验走查", "location": "体验室"},
            {"time": "14:00", "title": "需求排期会", "location": "3楼会议室A"},
            {"time": "15:30", "title": "代码优化", "location": "工位"},
            {"time": "17:00", "title": "1on1沟通", "location": "咖啡区"},
        ],
        4: [  # 周五
            {"time": "09:00", "title": "周五晨会", "location": "3楼会议室A"},
            {"time": "10:30", "title": "Sprint回顾", "location": "线上会议"},
            {"time": "14:00", "title": "本周成果演示", "location": "5楼大会议室"},
            {"time": "15:30", "title": "下周计划预排", "location": "工位"},
            {"time": "17:00", "title": "周报总结", "location": "工位"},
        ],
        5: [  # 周六
            {"time": "10:00", "title": "个人学习时间", "location": "家"},
            {"time": "14:00", "title": "读书分享", "location": "线上"},
            {"time": "16:00", "title": "开源项目贡献", "location": "咖啡馆"},
        ],
        6: [  # 周日
            {"time": "10:00", "title": "周末运动", "location": "健身房"},
            {"time": "14:00", "title": "下周准备", "location": "家"},
            {"time": "16:00", "title": "休闲阅读", "location": "书房"},
        ],
    }

    events = weekday_events.get(weekday, weekday_events[0])

    return {
        "events": events,
        "date": now.strftime("%Y-%m-%d"),
        "weekday": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][weekday],
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "ai_generator": True,
            "storage": True,
            "sync_service": True
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
