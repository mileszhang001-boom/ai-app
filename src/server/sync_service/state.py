"""
同步状态管理服务

负责管理组件从手机端到车端的同步状态
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum


class SyncStatus(Enum):
    """同步状态枚举"""
    PENDING = "pending"        # 待同步
    SYNCING = "syncing"        # 同步中
    SUCCESS = "success"        # 同步成功
    FAILED = "failed"          # 同步失败


class SyncState:
    """同步状态对象"""

    def __init__(
        self,
        sync_id: str,
        widget_id: str,
        user_id: str,
        device_id: Optional[str] = None,
        status: SyncStatus = SyncStatus.PENDING,
        created_at: Optional[str] = None,
        updated_at: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        self.sync_id = sync_id
        self.widget_id = widget_id
        self.user_id = user_id
        self.device_id = device_id
        self.status = status
        self.created_at = created_at or datetime.utcnow().isoformat()
        self.updated_at = updated_at
        self.error_message = error_message

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "sync_id": self.sync_id,
            "widget_id": self.widget_id,
            "user_id": self.user_id,
            "device_id": self.device_id,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "error_message": self.error_message
        }


class SyncStateManager:
    """同步状态管理器"""

    def __init__(self):
        self._states: Dict[str, SyncState] = {}
        self._device_states: Dict[str, Dict[str, str]] = {}
        # device_id -> {widget_id -> sync_id}

    def create_sync(
        self,
        widget_id: str,
        user_id: str,
        device_id: Optional[str] = None
    ) -> SyncState:
        """
        创建新的同步任务

        Args:
            widget_id: 组件ID
            user_id: 用户ID
            device_id: 设备ID（车机ID）

        Returns:
            SyncState 对象
        """
        import uuid
        sync_id = f"sync_{uuid.uuid4().hex[:12]}"

        state = SyncState(
            sync_id=sync_id,
            widget_id=widget_id,
            user_id=user_id,
            device_id=device_id,
            status=SyncStatus.PENDING
        )

        self._states[sync_id] = state

        # 记录设备-组件映射
        if device_id:
            if device_id not in self._device_states:
                self._device_states[device_id] = {}
            self._device_states[device_id][widget_id] = sync_id

        return state

    def update_sync_status(
        self,
        sync_id: str,
        status: SyncStatus,
        error_message: Optional[str] = None
    ) -> bool:
        """
        更新同步状态

        Args:
            sync_id: 同步ID
            status: 新状态
            error_message: 错误信息（失败时）

        Returns:
            是否更新成功
        """
        state = self._states.get(sync_id)
        if not state:
            return False

        state.status = status
        state.updated_at = datetime.utcnow().isoformat()
        state.error_message = error_message

        return True

    def get_sync_state(self, sync_id: str) -> Optional[SyncState]:
        """获取同步状态"""
        return self._states.get(sync_id)

    def get_widget_syncs(
        self,
        widget_id: str
    ) -> List[SyncState]:
        """获取组件的所有同步记录"""
        return [
            state for state in self._states.values()
            if state.widget_id == widget_id
        ]

    def get_device_syncs(
        self,
        device_id: str
    ) -> Dict[str, SyncState]:
        """获取设备的所有组件同步状态"""
        widget_sync_ids = self._device_states.get(device_id, {})
        result = {}

        for widget_id, sync_id in widget_sync_ids.items():
            state = self._states.get(sync_id)
            if state:
                result[widget_id] = state

        return result

    def get_latest_sync(
        self,
        widget_id: str
    ) -> Optional[SyncState]:
        """获取组件最新的同步状态"""
        syncs = self.get_widget_syncs(widget_id)
        if not syncs:
            return None
        return max(syncs, key=lambda s: s.created_at or "")

    def cleanup_old_states(self, hours: int = 24) -> int:
        """
        清理旧的同步记录

        Args:
            hours: 保留小时数，超过此小时的记录将被删除

        Returns:
            删除的记录数量
        """
        import time
        cutoff_time = time.time() - (hours * 60 * 60)

        to_delete = []
        for sync_id, state in self._states.items():
            created_at = state.created_at or ""
            if created_at:
                try:
                    state_time = datetime.fromisoformat(created_at).timestamp()
                    if state_time < cutoff_time:
                        to_delete.append(sync_id)
                except:
                    pass

        for sync_id in to_delete:
            del self._states[sync_id]

        return len(to_delete)


# 单例
_manager: Optional[SyncStateManager] = None


def get_sync_manager() -> SyncStateManager:
    """获取同步状态管理器单例"""
    global _manager
    if _manager is None:
        _manager = SyncStateManager()
    return _manager


# 便捷函数
def create_sync(widget_id: str, user_id: str, device_id: Optional[str] = None) -> SyncState:
    """创建新的同步任务"""
    return get_sync_manager().create_sync(widget_id, user_id, device_id)


def update_sync_status(
    sync_id: str,
    status: SyncStatus,
    error_message: Optional[str] = None
) -> bool:
    """更新同步状态"""
    return get_sync_manager().update_sync_status(sync_id, status, error_message)


def get_sync_state(sync_id: str) -> Optional[SyncState]:
    """获取同步状态"""
    return get_sync_manager().get_sync_state(sync_id)


def get_widget_syncs(widget_id: str) -> List[SyncState]:
    """获取组件所有同步记录"""
    return get_sync_manager().get_widget_syncs(widget_id)


def get_device_syncs(device_id: str) -> Dict[str, SyncState]:
    """获取设备所有组件同步状态"""
    return get_sync_manager().get_device_syncs(device_id)
