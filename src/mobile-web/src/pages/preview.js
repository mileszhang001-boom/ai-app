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
  'weather-realtime':    '/widget-templates/weather/index.html',
  'weather':             '/widget-templates/weather/index.html',
  'music-player':        '/widget-templates/music/index.html',
  'music':               '/widget-templates/music/index.html',
  'calendar-schedule':   '/widget-templates/calendar/index.html',
  'calendar':            '/widget-templates/calendar/index.html',
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
      <div class="preview-container">
        <div class="preview-bezel">
          <div class="preview-frame" id="previewFrame">
            <div class="loading">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-actions">
        <button id="syncBtn" class="btn">同步到车机</button>
        <button id="editBtn" class="btn btn-secondary">微调效果</button>
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

    // 透传动态配色 + 视觉风格
    if (data.primary_color) {
      p.primary_color = data.primary_color;
    }
    if (data.visual_style) {
      p.visual_style = data.visual_style;
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

      // 3. 处理 ../../shared/bridge.js 和 color-engine.js
      html = html.replace(/src="\.\.\/\.\.\/shared\/bridge\.js"/g, `src="/widget-templates/shared/bridge.js?v=${Date.now()}"`);
      html = html.replace(/src="\.\.\/\.\.\/shared\/color-engine\.js"/g, `src="/widget-templates/shared/color-engine.js?v=${Date.now()}"`);
      html = html.replace(/src="\.\.\/shared\/color-engine\.js"/g, `src="/widget-templates/shared/color-engine.js?v=${Date.now()}"`);

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
      this.router.back();
    });

    document.getElementById('syncBtn').addEventListener('click', () => {
      this.handleSync();
    });

    document.getElementById('editBtn').addEventListener('click', () => {
      this.showTweakSheet();
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

  showTweakSheet() {
    // 移除已有面板
    const existing = document.querySelector('.tweak-sheet-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'tweak-sheet-overlay';
    overlay.innerHTML = `
      <div class="tweak-sheet">
        <div class="tweak-handle"></div>
        <div class="tweak-title">微调效果</div>
        <div class="tweak-hint">告诉 AI 你想调整什么</div>
        <div class="tweak-input-wrapper">
          <textarea id="tweakInput" class="nl-input" rows="2" placeholder="换成蓝色、改成极简风格..."></textarea>
          <button id="tweakSendBtn" class="nl-send-btn" disabled aria-label="发送">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div id="tweakResult" style="display:none;">
          <div class="analysis-text" id="tweakText" style="margin:12px 0 8px;"></div>
          <button id="tweakConfirmBtn" class="btn">确认应用</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const tweakInput = overlay.querySelector('#tweakInput');
    const tweakSendBtn = overlay.querySelector('#tweakSendBtn');
    const tweakResult = overlay.querySelector('#tweakResult');
    const tweakText = overlay.querySelector('#tweakText');
    const tweakConfirmBtn = overlay.querySelector('#tweakConfirmBtn');
    let tweakData = null;

    // 输入启用/禁用按钮
    tweakInput.addEventListener('input', () => {
      tweakSendBtn.disabled = !tweakInput.value.trim();
    });

    // 回车发送
    tweakInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (tweakInput.value.trim()) tweakSendBtn.click();
      }
    });

    // 发送微调请求
    tweakSendBtn.addEventListener('click', async () => {
      const text = tweakInput.value.trim();
      if (!text) return;

      tweakSendBtn.disabled = true;
      tweakSendBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>';
      tweakInput.disabled = true;

      try {
        const response = await this.api.chatGenerate(text, this.currentData);
        if (response.success) {
          tweakData = response.data;
          tweakText.textContent = '调整为：' + (response.data.description || '已更新');
          tweakResult.style.display = '';
        } else {
          showToast(response.error || '调整失败', 'error');
        }
      } catch (err) {
        console.error('微调失败:', err);
        showToast('调整失败，请重试', 'error');
      } finally {
        tweakSendBtn.disabled = false;
        tweakSendBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
        tweakInput.disabled = false;
        tweakInput.value = '';
      }
    });

    // 确认应用
    tweakConfirmBtn.addEventListener('click', () => {
      if (!tweakData) return;
      this.currentData = tweakData;
      overlay.remove();

      // 在 iframe 重新加载期间显示 loading
      const frame = document.getElementById('previewFrame');
      if (frame) {
        frame.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      }
      this.renderComponent();
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // 自动聚焦
    setTimeout(() => tweakInput.focus(), 100);
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
