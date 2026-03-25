/**
 * Preview Page — widget preview with AI summary + insight
 *
 * Layout: status bar + nav + AI summary + card preview + AI insight + action buttons
 */

import { showToast } from '../main.js';
import { renderWidgetInFrame, renderCodeWidgetInFrame, showGenerateOverlay } from '../utils/render-widget.js';

export class PreviewPage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.currentData = null;
    this.isNewGeneration = false;
  }

  async render(params) {
    const container = document.getElementById('page-preview');
    this.currentData = params.data;
    this.isNewGeneration = params.isNew !== false;
    this.isCodeMode = params.isCodeMode || (this.currentData && this.currentData.generation_mode === 'code');

    const description = this.isCodeMode
      ? '🧪 AI从零编写了一个自定义组件'
      : (this.currentData?.description || '专属卡片');
    const insight = this._getAiInsight(this.currentData);

    // Show "示例数据" hint for mock-data templates only
    const MOCK_DATA_TYPES = ['weather', 'news', 'music', 'calendar', 'alarm', 'mediahub'];
    const showDataHint = !this.isCodeMode && this.currentData?.component_type &&
      MOCK_DATA_TYPES.includes(this.currentData.component_type);
    const dataHintHTML = showDataHint
      ? `<div class="preview-data-hint"><span class="hint-dot"></span>当前为示例数据，推送到车机后将显示真实内容</div>`
      : '';

    container.innerHTML = `
      <div class="preview-page">
        <div class="preview-top-content">
          <div class="top-nav">
            <button class="top-nav-back" id="previewBackBtn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div class="top-nav-title">预览</div>
            <div style="width:36px"></div>
          </div>

          <div class="ai-summary-bar" id="aiSummary">
            ✨ AI已为你生成：${description}
          </div>

          ${dataHintHTML}

          <div class="preview-card-area">
            <div class="preview-card-wrapper">
              <div class="preview-card" id="previewFrame">
                <div class="loading"><div class="spinner"></div></div>
              </div>
            </div>
          </div>

          <div class="ai-insight-bar" id="aiInsight">
            ${insight}
          </div>
        </div>

        <div class="preview-bottom-actions">
          <button class="btn-gradient" id="finetuneBtn" ${this.isCodeMode ? 'style="display:none"' : ''}>✏️ 微调效果</button>
          <button class="btn-outlined" id="syncBtn">同步到车机 →</button>
        </div>
      </div>
    `;

    this._bindEvents();

    if (this.isNewGeneration) {
      await this._renderWithAnimation();
    } else {
      await this._renderComponent();
    }
  }

  _getAiInsight(data) {
    if (!data) return '';
    if (this.isCodeMode) return '此组件由AI直接编写代码生成，展示端到端AI能力';

    // 微调反馈：显示修改列表或无法修改提示
    if (data.changes_applied && data.changes_applied.length > 0) {
      return '已修改: ' + data.changes_applied.join('、');
    }
    if (data.unable_to_modify) {
      return data.unable_to_modify;
    }

    const insights = {
      weather:     '实时天气数据，每30分钟自动更新',
      anniversary: '自动计算天数，每日零点刷新',
      calendar:    '同步今日日程，智能排序显示',
      music:       '与车载媒体联动，实时显示播放状态',
      alarm:       '智能日夜感知，自动调整显示风格',
      news:        '每30分钟更新，AI智能摘要',
      mediahub:    '三方媒体聚合，推送后自动连接播放内容',
    };
    return insights[data.component_type] || '已为你优化显示效果';
  }

  async _renderWithAnimation() {
    const frame = document.getElementById('previewFrame');
    const summary = document.getElementById('aiSummary');
    const insight = document.getElementById('aiInsight');

    // Hide summary/insight during loading
    if (summary) summary.style.opacity = '0';
    if (insight) insight.style.opacity = '0';

    // Show loading state briefly then render
    await new Promise(r => setTimeout(r, 200));
    await this._renderComponent();

    // Fade in summary and insight
    if (summary) { summary.style.transition = 'opacity 0.5s'; summary.style.opacity = '1'; }
    if (insight) { insight.style.transition = 'opacity 0.5s'; insight.style.opacity = '1'; }
  }

  async _renderComponent() {
    const frame = document.getElementById('previewFrame');
    if (!frame || !this.currentData) return;

    // Code mode: render raw HTML
    if (this.isCodeMode && this.currentData.html_content) {
      try {
        renderCodeWidgetInFrame(frame, this.currentData.html_content);
      } catch (error) {
        console.error('代码渲染失败:', error);
        frame.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF;font-size:13px;">代码渲染失败</div>`;
      }
      return;
    }

    if (!this.currentData.component_type) {
      frame.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9CA3AF;">
          <div style="font-size:24px;margin-bottom:8px;">!</div>
          <div style="font-size:13px;">没有可预览的组件数据</div>
        </div>
      `;
      return;
    }

    try {
      await renderWidgetInFrame(frame, this.currentData);
    } catch (error) {
      console.error('渲染失败:', error);
      frame.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9CA3AF;">
          <div style="font-size:13px;">渲染失败</div>
          <div style="font-size:11px;margin-top:4px;opacity:0.6;">${error.message || ''}</div>
        </div>
      `;
    }
  }

  _bindEvents() {
    document.getElementById('previewBackBtn')?.addEventListener('click', () => {
      this.router.back();
    });

    document.getElementById('finetuneBtn')?.addEventListener('click', () => {
      this.router.navigate('finetune', { data: this.currentData });
    });

    document.getElementById('syncBtn')?.addEventListener('click', () => {
      this._handleSync();
    });
  }

  async _handleSync() {
    const btn = document.getElementById('syncBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '正在推送…';

    try {
      const params = { ...(this.currentData.params || {}) };
      // 确保颜色/样式参数不丢失（它们可能在 currentData 顶层而非 params 内）
      if (this.currentData.primary_color) params.primary_color = this.currentData.primary_color;
      if (this.currentData.visual_style) params.visual_style = this.currentData.visual_style;
      if (this.currentData.style_preset) params.style_preset = this.currentData.style_preset;

      const saveData = {
        user_id: 'demo_user',
        component_type: this.isCodeMode ? 'code_gen' : this.currentData.component_type,
        theme: this.isCodeMode ? 'custom' : (this.currentData.theme || ''),
        params,
        style_preset: this.currentData.style_preset || null,
      };
      if (this.isCodeMode) {
        saveData.generation_mode = 'code';
        saveData.html_content = this.currentData.html_content;
      }
      const saved = await this.api.saveWidget(saveData);

      if (!saved.success) {
        showToast('保存失败: ' + (saved.error || '未知错误'), 'error');
        return;
      }

      const isUpdate = saved.data && saved.data.is_update;

      const response = await this.api.syncToCar({
        widget_id: saved.widget_id,
        device_id: 'demo_device',
      });

      if (response.success) {
        this._showSyncSuccess(isUpdate);
      } else {
        showToast('同步失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('同步失败:', error);
      showToast('同步失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '同步到车机 →';
    }
  }

  _showSyncSuccess(isUpdate = false) {
    const title = isUpdate ? '已更新车机卡片' : '已推送到车机';
    const subtitle = isUpdate ? '车端卡片将自动刷新' : '请在车端确认接收卡片';
    const overlay = document.createElement('div');
    overlay.className = 'sync-success-overlay';
    overlay.innerHTML = `
      <div class="sync-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="sync-success-title">${title}</div>
      <div class="sync-success-subtitle">${subtitle}</div>
    `;
    document.body.appendChild(overlay);

    const dismiss = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 3500);
  }
}
