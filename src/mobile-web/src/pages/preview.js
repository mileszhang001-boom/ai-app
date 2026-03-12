/**
 * 预览页面
 *
 * 通过 iframe 加载真实的 widget-templates，注入用户参数，
 * 实现与车端完全一致的预览效果。
 */

import { showToast } from '../main.js';

const TEMPLATE_URL_MAP = {
  'anniversary-love':    '/widget-templates/anniversary/love/index.html',
  'anniversary-baby':    '/widget-templates/anniversary/baby/index.html',
  'anniversary-holiday': '/widget-templates/anniversary/holiday/index.html',
  'anniversary-warm':    '/widget-templates/anniversary/warm/index.html',
  'news-daily':          '/widget-templates/news/index.html',
  'news':                '/widget-templates/news/index.html',
  'alarm-clock':         '/widget-templates/alarm/index.html',
  'alarm':               '/widget-templates/alarm/index.html',
};

export class PreviewPage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.currentData = null;
  }

  async render(params) {
    const container = document.getElementById('page-preview');
    this.currentData = params.data;

    container.innerHTML = `
      <div class="top-nav">
        <button class="top-nav-back" id="previewBackBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="top-nav-title">预览</div>
        <div></div>
      </div>
      <div class="container">
        <div class="preview-container">
          <div class="preview-bezel">
            <div class="preview-bezel-label">SU7 行车桌面</div>
            <div class="preview-frame" id="previewFrame">
              <div class="loading">
                <div class="spinner"></div>
              </div>
            </div>
          </div>
          <div class="preview-label">896 × 1464 · 1/3 屏卡片预览</div>
        </div>

        <div class="actions" style="padding: 0 16px 24px;">
          <button id="syncBtn" class="btn">同步到车机</button>
          <button id="editBtn" class="btn btn-secondary" style="margin-top: 12px;">编辑参数</button>
        </div>
      </div>
    `;

    this.bindEvents();
    await this.renderComponent();
  }

  getTemplateUrl(data) {
    if (!data) return null;
    const type = data.component_type;
    const theme = data.theme;
    return TEMPLATE_URL_MAP[`${type}-${theme}`]
        || TEMPLATE_URL_MAP[type]
        || null;
  }

  buildWidgetParams(data) {
    if (!data || !data.params) return {};
    const p = { ...data.params };

    if (data.style_preset) {
      p.style_preset = data.style_preset;
    }

    if (data.component_type === 'anniversary') {
      if (p.date && !p.start_date && !p.target_date) {
        if (data.theme === 'holiday') {
          p.target_date = p.date;
        } else {
          p.start_date = p.date;
        }
      }
      if (p.message && !p.subtitle) {
        p.subtitle = p.message;
      }
    }

    if (data.component_type === 'alarm') {
      if (p.time && !p.alarm_time) {
        p.alarm_time = p.time;
      }
    }

    return p;
  }

  async renderComponent() {
    const frame = document.getElementById('previewFrame');
    const data = this.currentData;
    const cacheBuster = `v=${Date.now()}`;

    if (!data || !data.component_type) {
      frame.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">!</div>
          <div class="empty-text">没有可预览的组件数据</div>
          <button class="btn btn-secondary" id="retryBackBtn" style="margin-top:16px;width:auto;">返回</button>
        </div>
      `;
      const btn = document.getElementById('retryBackBtn');
      if (btn) btn.addEventListener('click', () => this.router.back());
      return;
    }

    const templateUrl = this.getTemplateUrl(data);
    if (!templateUrl) {
      frame.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">!</div>
          <div class="empty-text">未找到模板: ${data.component_type}/${data.theme || ''}</div>
          <button class="btn btn-secondary" id="retryBackBtn" style="margin-top:16px;width:auto;">返回</button>
        </div>
      `;
      const btn = document.getElementById('retryBackBtn');
      if (btn) btn.addEventListener('click', () => this.router.back());
      return;
    }

    try {
      // 计算模板的基础路径（用于转换相对路径）
      const templateBasePath = templateUrl.replace('index.html', '');

      const resp = await fetch(`${templateUrl}?${cacheBuster}`, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      let html = await resp.text();

      const widgetParams = this.buildWidgetParams(data);
      console.log('[Preview] widgetParams:', widgetParams);
      console.log('[Preview] templateUrl:', templateUrl);
      console.log('[Preview] templateBasePath:', templateBasePath);

      const paramsScript = `<script>window.__WIDGET_PARAMS__ = ${JSON.stringify(widgetParams)};<\/script>`;

      // 修复 srcdoc 模式下的相对路径问题
      // 1. 将 shared 资源转换为绝对路径
      html = html.replace(/\.\.\/\.\.\/shared\//g, '/widget-templates/shared/');
      html = html.replace(/\.\.\/shared\//g, '/widget-templates/shared/');

      // 2. 将相对路径的 style.css 和 main.js 转换为绝对路径
      html = html.replace(/href="style\.css"/g, `href="${templateBasePath}style.css?v=${Date.now()}"`);
      html = html.replace(/src="style\.css"/g, `src="${templateBasePath}style.css?v=${Date.now()}"`);
      html = html.replace(/src="main\.js"/g, `src="${templateBasePath}main.js?v=${Date.now()}"`);

      // 3. 处理 ../../shared/bridge.js
      html = html.replace(/src="\.\.\/\.\.\/shared\/bridge\.js"/g, `src="/widget-templates/shared/bridge.js?v=${Date.now()}"`);

      // 4. 添加 data-style 属性到 html 元素（如果存在 style_preset）
      if (widgetParams.style_preset) {
        html = html.replace(/<html/, `<html data-style="${widgetParams.style_preset}"`);
      }

      html = html.replace('</head>', paramsScript + '</head>');

      frame.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.srcdoc = html;
      iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:inherit;';
      frame.appendChild(iframe);

    } catch (error) {
      console.error('渲染失败:', error);
      frame.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">!</div>
          <div class="empty-text">渲染失败</div>
          <div style="font-size:12px;opacity:0.5;margin-top:8px;">${error.message || ''}</div>
          <button class="btn btn-secondary" id="retryRenderBtn" style="margin-top:16px;width:auto;">重试</button>
        </div>
      `;
      const btn = document.getElementById('retryRenderBtn');
      if (btn) btn.addEventListener('click', () => this.renderComponent());
    }
  }

  bindEvents() {
    document.getElementById('previewBackBtn').addEventListener('click', () => {
      this.router.navigate('market');
    });

    document.getElementById('syncBtn').addEventListener('click', () => {
      this.handleSync();
    });

    document.getElementById('editBtn').addEventListener('click', () => {
      this.router.navigate('config', {
        type: this.currentData?.component_type,
        theme: this.currentData?.theme
      });
    });
  }

  async handleSync() {
    const btn = document.getElementById('syncBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span class="spinner" style="width:18px;height:18px;border-width:2px;"></span>
        同步中…
      </span>
    `;

    try {
      const response = await this.api.syncToCar({
        component_id: this.currentData?.component_id || 'temp_' + Date.now(),
        component_data: this.currentData
      });

      if (response.success) {
        this.showSyncSuccess();
      } else {
        showToast('同步失败: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('同步失败:', error);
      showToast('同步失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '同步到车机';
    }
  }

  showSyncSuccess() {
    const overlay = document.createElement('div');
    overlay.className = 'sync-success-overlay';
    overlay.innerHTML = `
      <div class="sync-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="sync-success-title">已同步到车机</div>
      <div class="sync-success-subtitle">下次上车即可看到你的专属卡片</div>
    `;
    document.body.appendChild(overlay);

    // 点击或 2.5 秒后关闭
    const dismiss = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    };

    overlay.addEventListener('click', dismiss);
    setTimeout(dismiss, 3500);
  }
}
