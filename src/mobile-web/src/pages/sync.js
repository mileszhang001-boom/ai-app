/**
 * 同步页面
 */

import { showToast } from '../main.js';

export class SyncPage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
  }

  async render() {
    const container = document.getElementById('page-sync');

    container.innerHTML = `
      <div class="top-nav">
        <div class="top-nav-title">同步到车机</div>
        <div></div>
      </div>
      <div class="container">
        <div class="card">
          <div class="card-title">同步状态</div>
          <div style="padding: 24px 0; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🚗</div>
            <div style="font-size: 16px; color: var(--color-text-secondary); margin-bottom: 8px;">
              车机连接状态
            </div>
            <div id="connectionStatus" style="font-size: 14px; color: #00C853;">
              ● 已连接
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">我的组件</div>
          <div id="widgetsList">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>

        <button id="syncAllBtn" class="btn">一键同步全部</button>
        <button id="refreshBtn" class="btn btn-secondary" style="margin-top: 12px;">刷新</button>
      </div>
    `;

    // 加载组件列表
    await this.loadWidgets();

    // 绑定事件
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadWidgets();
    });

    document.getElementById('syncAllBtn').addEventListener('click', () => {
      this.syncAll();
    });
  }

  async loadWidgets() {
    const list = document.getElementById('widgetsList');

    try {
      const response = await this.api.getUserWidgets();
      const widgets = response.widgets || [];

      if (widgets.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon" style="font-size: 32px;">🎨</div>
            <div class="empty-text">还没有创建组件</div>
            <button class="btn" style="margin-top: 16px; width: auto;" data-action="create">
              去创建
            </button>
          </div>
        `;

        const createBtn = list.querySelector('[data-action="create"]');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            this.router.navigate('market');
          });
        }
        return;
      }

      let html = '';
      widgets.forEach(widget => {
        const data = widget.params || {};
        const title = data.title || widget.component_type || '未命名组件';
        const synced = widget.synced;
        const syncTime = widget.sync_time ?
          new Date(widget.sync_time).toLocaleString('zh-CN') : '';

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom:1px solid var(--color-divider);">
            <div>
              <div style="font-size: 14px;">${title}</div>
              ${synced ? `
                <div style="font-size: 12px; color: var(--color-text-tertiary);">
                  ${syncTime} 同步
                </div>
              ` : `
                <div style="font-size: 12px; color: var(--color-accent);">
                  未同步
                </div>
              `}
            </div>
            ${synced ? `
              <div style="color: #00C853; font-size: 20px;">✓</div>
            ` : `
              <button class="sync-btn" data-id="${widget.widget_id}" style="
                padding: 6px 12px;
                background: var(--color-accent);
                color: #FFF;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
              ">同步</button>
            `}
          </div>
        `;
      });

      list.innerHTML = html;

      // 绑定单个同步按钮
      list.querySelectorAll('.sync-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.syncWidget(btn.dataset.id);
        });
      });

    } catch (error) {
      console.error('加载组件失败:', error);
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😢</div>
          <div class="empty-text">加载失败，请刷新重试</div>
          <button class="btn" style="margin-top: 16px; width: auto;" data-action="retry">
            重试
          </button>
        </div>
      `;

      const retryBtn = list.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.loadWidgets();
        });
      }
    }
  }

  async syncWidget(widgetId) {
    try {
      const response = await this.api.syncToCar({
        widget_id: widgetId,
        device_id: 'demo_device'
      });

      if (response.success) {
        showToast('同步成功', 'success');
        await this.loadWidgets();
      } else {
        showToast('同步失败: ' + (response.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('同步失败:', error);
      showToast('同步失败，请重试', 'error');
    }
  }

  async syncAll() {
    const btn = document.getElementById('syncAllBtn');
    btn.disabled = true;
    btn.textContent = '同步中...';

    try {
      const response = await this.api.getUserWidgets();
      const widgets = response.widgets || [];

      const unsynced = widgets.filter(w => !w.synced);

      if (unsynced.length === 0) {
        showToast('所有组件已同步', 'success');
      } else {
        let successCount = 0;
        for (const widget of unsynced) {
          try {
            await this.api.syncToCar({
              widget_id: widget.widget_id,
              device_id: 'demo_device'
            });
            successCount++;
          } catch (e) {
            console.error('同步失败:', widget.widget_id, e);
          }
        }

        if (successCount > 0) {
          showToast(`成功同步 ${successCount} 个组件`, 'success');
        } else {
          showToast('同步失败', 'error');
        }

        await this.loadWidgets();
      }

    } catch (error) {
      console.error('批量同步失败:', error);
      showToast('同步失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '一键同步全部';
    }
  }
}
