/**
 * 我的组件页面
 */

import { showToast } from '../main.js';

export class MyWidgetsPage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.widgets = [];
  }

  async render() {
    const container = document.getElementById('page-my-widgets');

    container.innerHTML = `
      <div class="top-nav">
        <div class="top-nav-title">我的组件</div>
        <div></div>
      </div>
      <div class="container">
        <div class="loading">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    try {
      const response = await this.api.getUserWidgets();
      this.widgets = response.widgets || [];

      if (this.widgets.length === 0) {
        container.querySelector('.container').innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🎨</div>
            <div class="empty-text">还没有创建组件</div>
            <button class="btn" style="margin-top: 16px; width: auto;" data-action="create">
              去创建
            </button>
          </div>
        `;

        const createBtn = container.querySelector('[data-action="create"]');
        if (createBtn) {
          createBtn.addEventListener('click', () => {
            this.router.navigate('market');
          });
        }
        return;
      }

      this.renderWidgetList(container);
    } catch (error) {
      console.error('加载组件失败:', error);
      container.querySelector('.container').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😢</div>
          <div class="empty-text">加载失败，请刷新重试</div>
          <button class="btn" style="margin-top: 16px; width: auto;" data-action="retry">
            重试
          </button>
        </div>
      `;

      const retryBtn = container.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.render();
        });
      }
    }
  }

  renderWidgetList(container) {
    let html = '';

    this.widgets.forEach(widget => {
      const params = widget.params || {};
      const title = params.title || widget.component_type || '未命名组件';
      const synced = widget.synced;
      const created = widget.created_at ? new Date(widget.created_at).toLocaleDateString('zh-CN') : '';

      html += `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <div class="card-title">${title}</div>
              <div style="font-size: 12px; color: var(--color-text-tertiary);">
                创建于 ${created}
              </div>
              ${synced ? `
                <div style="font-size: 12px; color: #00C853; margin-top: 4px;">
                  ✓ 已同步到车机
                </div>
              ` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="action-btn edit-btn" data-id="${widget.widget_id}" style="
                padding: 8px;
                background: transparent;
                border: none;
                color: var(--color-text-tertiary);
                cursor: pointer;
                border-radius: 4px;
              " title="编辑">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" data-id="${widget.widget_id}" style="
                padding: 8px;
                background: transparent;
                border: none;
                color: #FF5252;
                cursor: pointer;
                border-radius: 4px;
              " title="删除">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.querySelector('.container').innerHTML = html;

    // 绑定编辑事件
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const widgetId = btn.dataset.id;
        this.editWidget(widgetId);
      });
    });

    // 绑定删除事件
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm('确定要删除这个组件吗？')) {
          try {
            await this.api.deleteWidget(id);
            showToast('删除成功', 'success');
            await this.render();
          } catch (error) {
            console.error('删除失败:', error);
            showToast('删除失败，请重试', 'error');
          }
        }
      });
    });
  }

  async editWidget(widgetId) {
    try {
      const widget = this.widgets.find(w => w.widget_id === widgetId);
      if (!widget) {
        showToast('组件不存在', 'error');
        return;
      }

      // 导航到配置页面，传递编辑数据
      this.router.navigate('config', {
        type: widget.component_type,
        theme: widget.theme,
        editMode: true,
        widgetData: widget
      });
    } catch (error) {
      console.error('编辑失败:', error);
      showToast('编辑失败，请重试', 'error');
    }
  }
}
