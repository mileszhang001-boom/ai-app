"""
H5 组件产物存储服务

负责存储和管理小组件的 H5 产物（HTML、CSS、JS）
Demo 阶段使用本地文件系统，生产环境可切换到对象存储
"""

import os
import json
import shutil
from typing import Dict, Any, Optional
from pathlib import Path


class AssetStorage:
    """H5 产物存储"""

    def __init__(self, base_dir: str = "./widgets"):
        """
        初始化存储

        Args:
            base_dir: 基础存储目录
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

        # 创建子目录
        self.html_dir = self.base_dir / "html"
        self.css_dir = self.base_dir / "css"
        self.js_dir = self.base_dir / "js"
        self.manifest_dir = self.base_dir / "manifests"

        for dir_path in [self.html_dir, self.css_dir, self.js_dir, self.manifest_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)

    def save_widget(
        self,
        widget_id: str,
        html_content: str,
        css_content: str,
        js_content: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        保存组件产物

        Args:
            widget_id: 组件ID
            html_content: HTML 内容
            css_content: CSS 内容
            js_content: JS 内容
            metadata: 元数据

        Returns:
            保存后的资产信息
        """
        safe_id = widget_id.replace("/", "_")

        # 保存 HTML
        html_path = self.html_dir / f"{safe_id}.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 保存 CSS
        css_path = self.css_dir / f"{safe_id}.css"
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css_content)

        # 保存 JS
        js_path = self.js_dir / f"{safe_id}.js"
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js_content)

        # 保存清单（manifest）
        manifest_path = self.manifest_dir / f"{safe_id}.json"
        manifest = {
            "widget_id": widget_id,
            "files": {
                "html": f"html/{safe_id}.html",
                "css": f"css/{safe_id}.css",
                "js": f"js/{safe_id}.js"
            },
            "metadata": metadata,
            "created_at": metadata.get("created_at"),
            "size": {
                "html": len(html_content),
                "css": len(css_content),
                "js": len(js_content)
            }
        }

        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)

        return {
            "widget_id": widget_id,
            "html_path": str(html_path),
            "css_path": str(css_path),
            "js_path": str(js_path),
            "manifest_path": str(manifest_path),
            "total_size": len(html_content) + len(css_content) + len(js_content)
        }

    def get_widget_files(self, widget_id: str) -> Optional[Dict[str, Any]]:
        """
        获取组件所有文件

        Args:
            widget_id: 组件ID

        Returns:
            文件路径映射
        """
        safe_id = widget_id.replace("/", "_")
        manifest_path = self.manifest_dir / f"{safe_id}.json"

        if not manifest_path.exists():
            return None

        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)

        return {
            "widget_id": widget_id,
            "html": str(self.html_dir / f"{safe_id}.html"),
            "css": str(self.css_dir / f"{safe_id}.css"),
            "js": str(self.js_dir / f"{safe_id}.js"),
            "manifest": str(manifest_path)
        }

    def delete_widget(self, widget_id: str) -> bool:
        """
        删除组件所有文件

        Args:
            widget_id: 组件ID

        Returns:
            是否删除成功
        """
        safe_id = widget_id.replace("/", "_")

        # 删除各个文件
        files_to_delete = [
            self.html_dir / f"{safe_id}.html",
            self.css_dir / f"{safe_id}.css",
            self.js_dir / f"{safe_id}.js",
            self.manifest_dir / f"{safe_id}.json"
        ]

        deleted = 0
        for file_path in files_to_delete:
            if file_path.exists():
                file_path.unlink()
                deleted += 1

        return deleted > 0

    def get_widget_html(self, widget_id: str) -> Optional[str]:
        """获取组件 HTML 内容"""
        files = self.get_widget_files(widget_id)
        if not files:
            return None

        html_path = files["html"]
        if not Path(html_path).exists():
            return None

        with open(html_path, 'r', encoding='utf-8') as f:
            return f.read()

    def list_widgets(self) -> list:
        """列出所有组件"""
        widgets = []

        if not self.manifest_dir.exists():
            return widgets

        for manifest_file in self.manifest_dir.glob("*.json"):
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
                widgets.append(manifest)

        return widgets

    def cleanup_old_widgets(self, days: int = 30) -> int:
        """
        清理旧组件

        Args:
            days: 保留天数，超过此天数的将被删除

        Returns:
            删除的组件数量
        """
        import time
        cutoff_time = time.time() - (days * 24 * 60 * 60)

        widgets = self.list_widgets()
        deleted = 0

        for widget in widgets:
            created_at = widget.get("metadata", {}).get("created_at", "")
            if created_at:
                try:
                    widget_time = datetime.fromisoformat(created_at).timestamp()
                    if widget_time < cutoff_time:
                        if self.delete_widget(widget["widget_id"]):
                            deleted += 1
                except:
                    pass

        return deleted


# 单例
_storage: Optional[AssetStorage] = None


def get_asset_storage(base_dir: str = "./widgets") -> AssetStorage:
    """获取资产存储单例"""
    global _storage
    if _storage is None or _storage.base_dir != base_dir:
        _storage = AssetStorage(base_dir)
    return _storage


# 便捷函数
def save_widget(
    widget_id: str,
    html_content: str,
    css_content: str,
    js_content: str,
    metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """保存组件"""
    return get_asset_storage().save_widget(
        widget_id, html_content, css_content, js_content, metadata
    )


def get_widget_files(widget_id: str) -> Optional[Dict[str, Any]]:
    """获取组件文件"""
    return get_asset_storage().get_widget_files(widget_id)


def get_widget_html(widget_id: str) -> Optional[str]:
    """获取组件 HTML"""
    return get_asset_storage().get_widget_html(widget_id)


def delete_widget(widget_id: str) -> bool:
    """删除组件"""
    return get_asset_storage().delete_widget(widget_id)


def list_all_widgets() -> list:
    """列出所有组件"""
    return get_asset_storage().list_widgets()
