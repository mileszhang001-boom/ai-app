"""
存储模块

包含元数据存储和 H5 产物存储
"""

from .metadata import (
    WidgetMetadata,
    MetadataStore,
    get_metadata_store,
    create_widget,
    get_widget,
    get_user_widgets,
    mark_synced,
    delete_widget
)

from .assets import (
    AssetStorage,
    get_asset_storage,
    save_widget,
    get_widget_files,
    get_widget_html,
    delete_widget,
    list_all_widgets
)

__all__ = [
    # metadata
    "WidgetMetadata",
    "MetadataStore",
    "get_metadata_store",
    "create_widget",
    "get_widget",
    "get_user_widgets",
    "mark_synced",
    "delete_widget",
    # assets
    "AssetStorage",
    "get_asset_storage",
    "save_widget",
    "get_widget_files",
    "get_widget_html",
    "delete_widget",
    "list_all_widgets",
]
