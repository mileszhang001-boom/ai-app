"""
组件元数据存储服务

负责存储和管理小组件的元数据（配置信息）
Demo 阶段使用内存存储，生产环境可切换到数据库
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import threading


class WidgetMetadata:
    """组件元数据"""

    def __init__(
        self,
        widget_id: str,
        user_id: str,
        component_type: str,
        theme: str,
        template_id: str,
        style_preset: str,
        params: Dict[str, Any],
        created_at: str,
        synced: bool = False,
        sync_time: Optional[str] = None
    ):
        self.widget_id = widget_id
        self.user_id = user_id
        self.component_type = component_type
        self.theme = theme
        self.template_id = template_id
        self.style_preset = style_preset
        self.params = params
        self.created_at = created_at
        self.synced = synced
        self.sync_time = sync_time

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "widget_id": self.widget_id,
            "user_id": self.user_id,
            "component_type": self.component_type,
            "theme": self.theme,
            "template_id": self.template_id,
            "style_preset": self.style_preset,
            "params": self.params,
            "created_at": self.created_at,
            "synced": self.synced,
            "sync_time": self.sync_time
        }


class MetadataStore:
    """元数据存储（内存实现）"""

    def __init__(self):
        self._storage: Dict[str, WidgetMetadata] = {}
        self._lock = threading.Lock()
        self._user_widgets: Dict[str, List[str]] = {}

    def create(
        self,
        user_id: str,
        widget_data: Dict[str, Any]
    ) -> WidgetMetadata:
        """
        创建新组件元数据

        Args:
            user_id: 用户ID
            widget_data: 组件数据

        Returns:
            WidgetMetadata 对象
        """
        widget_id = self._generate_widget_id()
        metadata = WidgetMetadata(
            widget_id=widget_id,
            user_id=user_id,
            component_type=widget_data.get("component_type"),
            theme=widget_data.get("theme"),
            template_id=widget_data.get("template_id"),
            style_preset=widget_data.get("style_preset"),
            params=widget_data.get("params", {}),
            created_at=datetime.utcnow().isoformat(),
            synced=False
        )

        with self._lock:
            self._storage[widget_id] = metadata
            # 添加到用户组件列表
            if user_id not in self._user_widgets:
                self._user_widgets[user_id] = []
            self._user_widgets[user_id].append(widget_id)

        return metadata

    def get(self, widget_id: str) -> Optional[WidgetMetadata]:
        """获取组件元数据"""
        return self._storage.get(widget_id)

    def get_user_widgets(self, user_id: str) -> List[WidgetMetadata]:
        """获取用户的所有组件"""
        widget_ids = self._user_widgets.get(user_id, [])
        return [
            self._storage[wid] for wid in widget_ids
            if wid in self._storage
        ]

    def update_sync_status(
        self,
        widget_id: str,
        synced: bool,
        sync_time: Optional[str] = None
    ) -> bool:
        """
        更新同步状态

        Args:
            widget_id: 组件ID
            synced: 是否已同步
            sync_time: 同步时间

        Returns:
            是否更新成功
        """
        with self._lock:
            metadata = self._storage.get(widget_id)
            if metadata:
                metadata.synced = synced
                metadata.sync_time = sync_time
                return True
            return False

    def delete(self, widget_id: str) -> bool:
        """删除组件"""
        with self._lock:
            metadata = self._storage.get(widget_id)
            if metadata:
                # 从用户列表中移除
                user_widgets = self._user_widgets.get(metadata.user_id, [])
                if widget_id in user_widgets:
                    user_widgets.remove(widget_id)
                # 从存储中移除
                del self._storage[widget_id]
                return True
            return False

    def _generate_widget_id(self) -> str:
        """生成唯一的组件ID"""
        import uuid
        return f"widget_{uuid.uuid4().hex[:12]}"


# 单例
_store: Optional[MetadataStore] = None
_store_lock = threading.Lock()


def get_metadata_store() -> MetadataStore:
    """获取元数据存储单例"""
    global _store
    if _store is None:
        _store = MetadataStore()
    return _store


# 便捷函数
def create_widget(user_id: str, widget_data: Dict[str, Any]) -> WidgetMetadata:
    """创建新组件"""
    return get_metadata_store().create(user_id, widget_data)


def get_widget(widget_id: str) -> Optional[WidgetMetadata]:
    """获取组件"""
    return get_metadata_store().get(widget_id)


def get_user_widgets(user_id: str) -> List[WidgetMetadata]:
    """获取用户所有组件"""
    return get_metadata_store().get_user_widgets(user_id)


def mark_synced(widget_id: str) -> bool:
    """标记组件已同步"""
    return get_metadata_store().update_sync_status(
        widget_id,
        synced=True,
        sync_time=datetime.utcnow().isoformat()
    )


def delete_widget(widget_id: str) -> bool:
    """删除组件"""
    return get_metadata_store().delete(widget_id)
