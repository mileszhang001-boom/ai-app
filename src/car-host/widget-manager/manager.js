/**
 * 车端组件管理器
 *
 * 负责：
 * - 从云端拉取组件列表
 * - 下载/缓存组件 H5 产物
 * - 管理组件生命周期（加载/卸载/更新）
 *
 * Demo 阶段：使用轮询方式检查新组件
 */

const POLL_INTERVAL = 5000; // 5秒轮询

export class WidgetManager {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '';
    this.deviceId = options.deviceId || 'demo_device';
    this.widgets = new Map(); // widget_id → metadata
    this.pollTimer = null;
    this.onUpdate = options.onUpdate || (() => {});
  }

  /**
   * 启动组件管理器
   * 首次全量同步 + 定时轮询
   */
  async start() {
    await this.syncWidgets();
    this.pollTimer = setInterval(() => this.syncWidgets(), POLL_INTERVAL);
  }

  /**
   * 停止轮询
   */
  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * 同步组件列表
   */
  async syncWidgets() {
    try {
      const res = await fetch(
        `${this.apiBase}/api/device/${this.deviceId}/widgets`
      );
      if (!res.ok) return;

      const data = await res.json();
      const serverWidgets = data.widgets || [];

      let changed = false;

      for (const w of serverWidgets) {
        if (w.status === 'success' && !this.widgets.has(w.widget_id)) {
          // 新组件：拉取详情
          const detail = await this.fetchWidgetDetail(w.widget_id);
          if (detail) {
            this.widgets.set(w.widget_id, detail);
            changed = true;
          }
        }
      }

      if (changed) {
        this.onUpdate(this.getWidgetList());
      }
    } catch (e) {
      // 静默处理网络错误（车机可能断网）
      console.warn('[WidgetManager] Sync error:', e.message);
    }
  }

  /**
   * 获取组件详情
   */
  async fetchWidgetDetail(widgetId) {
    try {
      const res = await fetch(`${this.apiBase}/api/widgets/${widgetId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * 获取当前组件列表（按创建时间倒序）
   */
  getWidgetList() {
    return Array.from(this.widgets.values())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * 获取组件数量
   */
  get count() {
    return this.widgets.size;
  }

  /**
   * 获取组件的渲染 URL
   * Demo 阶段：根据 component_type/theme 映射到本地模板
   */
  getWidgetURL(widget) {
    const type = widget.component_type;
    const theme = widget.theme;

    if (type === 'anniversary') {
      return `/widget-templates/anniversary/${theme}/index.html`;
    } else if (type === 'news') {
      return '/widget-templates/news/index.html';
    } else if (type === 'alarm') {
      return '/widget-templates/alarm/index.html';
    }
    return null;
  }
}
