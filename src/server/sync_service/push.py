"""
推送通知服务

负责向车端推送组件更新通知
Demo 阶段使用轮询模拟，生产环境可切换到 MQTT/长连接
"""

import asyncio
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime
from enum import Enum

from .state import SyncStatus, get_sync_manager, get_device_syncs


class PushMethod(Enum):
    """推送方式"""
    POLLING = "polling"        # 轮询（Demo 降级方案）
    MQTT = "mqtt"            # MQTT（生产环境）
    WEBSOCKET = "websocket"  # WebSocket（生产环境）


class PushConfig:
    """推送配置"""

    def __init__(
        self,
        method: PushMethod = PushMethod.POLLING,
        polling_interval: int = 5,  # 轮询间隔（秒）
        mqtt_broker: Optional[str] = None,
        mqtt_topic: str = "widgets/updates"
    ):
        self.method = method
        self.polling_interval = polling_interval
        self.mqtt_broker = mqtt_broker
        self.mqtt_topic = mqtt_topic


class PushService:
    """推送服务"""

    def __init__(self, config: PushConfig):
        self.config = config
        self._sync_manager = get_sync_manager()
        self._callbacks: Dict[str, List[Callable]] = {}
        self._is_running = False

    async def start(self) -> None:
        """启动推送服务"""
        if self._is_running:
            return

        self._is_running = True

        if self.config.method == PushMethod.POLLING:
            # 启动轮询服务
            asyncio.create_task(self._polling_loop())
        # 其他方式（MQTT/WebSocket）可在此扩展

    async def stop(self) -> None:
        """停止推送服务"""
        self._is_running = False

    def register_callback(
        self,
        device_id: str,
        callback: Callable[[Dict[str, Any]], None]
    ) -> None:
        """
        注册设备回调函数

        Args:
            device_id: 设备ID
            callback: 回调函数，接收更新数据
        """
        if device_id not in self._callbacks:
            self._callbacks[device_id] = []
        self._callbacks[device_id].append(callback)

    def unregister_callback(
        self,
        device_id: str,
        callback: Callable[[Dict[str, Any]], None]
    ) -> bool:
        """取消注册设备回调"""
        if device_id not in self._callbacks:
            return False

        if callback in self._callbacks[device_id]:
            self._callbacks[device_id].remove(callback)
            return True

        return False

    async def push_to_device(
        self,
        device_id: str,
        widget_data: Dict[str, Any]
    ) -> bool:
        """
        推送组件更新到指定设备

        Args:
            device_id: 设备ID
            widget_data: 组件数据

        Returns:
            是否推送成功
        """
        if not self._is_running:
            return False

        # 调用设备回调
        callbacks = self._callbacks.get(device_id, [])
        if not callbacks:
            # 无在线设备，记录状态
            print(f"No active device: {device_id}")
            return False

        success_count = 0
        for callback in callbacks:
            try:
                await callback(widget_data)
                success_count += 1
            except Exception as e:
                print(f"Callback error for device {device_id}: {e}")

        return success_count > 0

    async def broadcast_to_all(
        self,
        widget_data: Dict[str, Any]
    ) -> Dict[str, bool]:
        """
        广播组件更新到所有在线设备

        Args:
            widget_data: 组件数据

        Returns:
            各设备推送结果 {device_id: success}
        """
        results = {}

        for device_id, callbacks in self._callbacks.items():
            success_count = 0
            for callback in callbacks:
                try:
                    await callback(widget_data)
                    success_count += 1
                except Exception as e:
                    print(f"Callback error for device {device_id}: {e}")

            results[device_id] = success_count > 0

        return results

    async def _polling_loop(self) -> None:
        """轮询循环（Demo 降级方案）"""
        while self._is_running:
            try:
                # 获取所有待同步的组件
                device_syncs = self._sync_manager.get_device_syncs("demo_device")

                for widget_id, sync_state in device_syncs.items():
                    if sync_state.status.value == SyncStatus.PENDING.value:
                        # 模拟向设备推送
                        await self._notify_device(
                            "demo_device",
                            widget_id,
                            sync_state
                        )
                        # 更新为同步中
                        self._sync_manager.update_sync_status(
                            sync_state.sync_id,
                            SyncStatus.SYNCING
                        )

                        # 模拟延迟后标记为成功
                        await asyncio.sleep(2)
                        self._sync_manager.update_sync_status(
                            sync_state.sync_id,
                            SyncStatus.SUCCESS
                        )

                        # 通知回调
                        await self._trigger_callbacks(
                            "demo_device",
                            {
                                "action": "sync_complete",
                                "widget_id": widget_id,
                                "status": "success"
                            }
                        )

                # 等待下一次轮询
                await asyncio.sleep(self.config.polling_interval)

            except Exception as e:
                print(f"Polling loop error: {e}")
                await asyncio.sleep(5)

    async def _notify_device(
        self,
        device_id: str,
        widget_id: str,
        sync_state: Any
    ) -> None:
        """模拟通知设备"""
        # 在 Demo 中，这里只是打印日志
        print(f"[Push] Notifying device {device_id}: widget {widget_id}")

    async def _trigger_callbacks(
        self,
        device_id: str,
        data: Dict[str, Any]
    ) -> None:
        """触发设备回调"""
        callbacks = self._callbacks.get(device_id, [])
        for callback in callbacks:
            try:
                await callback(data)
            except Exception as e:
                print(f"Callback trigger error: {e}")


# 单例
_push_service: Optional[PushService] = None


def get_push_service(config: PushConfig = None) -> PushService:
    """获取推送服务单例"""
    global _push_service
    if _push_service is None or config:
        _push_service = PushService(config or PushConfig())
    return _push_service


# 便捷函数
async def start_push_service(config: PushConfig = None) -> PushService:
    """启动推送服务"""
    service = get_push_service(config)
    await service.start()
    return service


async def stop_push_service() -> None:
    """停止推送服务"""
    service = get_push_service()
    await service.stop()


async def push_to_device(device_id: str, widget_data: Dict[str, Any]) -> bool:
    """推送到指定设备"""
    service = get_push_service()
    return await service.push_to_device(device_id, widget_data)


async def broadcast_widgets(widget_data: Dict[str, Any]) -> Dict[str, bool]:
    """广播到所有设备"""
    service = get_push_service()
    return await service.broadcast_to_all(widget_data)


def register_device_callback(
    device_id: str,
    callback: Callable[[Dict[str, Any]], None]
) -> None:
    """注册设备回调"""
    service = get_push_service()
    service.register_callback(device_id, callback)


def unregister_device_callback(
    device_id: str,
    callback: Callable[[Dict[str, Any]], None]
) -> bool:
    """取消注册设备回调"""
    service = get_push_service()
    return service.unregister_callback(device_id, callback)
