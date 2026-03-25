/**
 * Shared widget rendering utilities
 * Used by preview.js and finetune.js
 */

export const TEMPLATE_URL_MAP = {
  'anniversary-love':    '/widget-templates/anniversary/love/index.html',
  'anniversary-baby':    '/widget-templates/anniversary/baby/index.html',
  'anniversary-holiday': '/widget-templates/anniversary/holiday/index.html',
  'anniversary-birthday': '/widget-templates/anniversary/birthday/index.html',
  'weather-weather':     '/widget-templates/weather/index.html',
  'music-music':         '/widget-templates/music/index.html',
  'calendar-calendar':   '/widget-templates/calendar/index.html',
  'news-news':           '/widget-templates/news/index.html',
  'alarm-clock':         '/widget-templates/alarm/index.html',
  // Legacy aliases (backward compat with old AI output)
  'news-daily':          '/widget-templates/news/index.html',
  'news':                '/widget-templates/news/index.html',
  'alarm':               '/widget-templates/alarm/index.html',
  'weather-realtime':    '/widget-templates/weather/index.html',
  'weather':             '/widget-templates/weather/index.html',
  'music-player':        '/widget-templates/music/index.html',
  'music':               '/widget-templates/music/index.html',
  'calendar-schedule':   '/widget-templates/calendar/index.html',
  'calendar':            '/widget-templates/calendar/index.html',
};

export function getTemplateUrl(data) {
  if (!data) return null;
  const { component_type, theme } = data;
  return TEMPLATE_URL_MAP[`${component_type}-${theme}`]
      || TEMPLATE_URL_MAP[component_type]
      || null;
}

export function buildWidgetParams(data) {
  if (!data || !data.params) return {};
  const p = { ...data.params };

  // Top-level fields → params (only if not already set in params)
  if (data.style_preset && !p.style_preset) p.style_preset = data.style_preset;
  if (data.primary_color && !p.primary_color) p.primary_color = data.primary_color;
  if (data.visual_style && !p.visual_style) p.visual_style = data.visual_style;

  // AI generated fields → params
  if (data.ai_generated) {
    if (data.ai_generated.description && !p.description) {
      p.description = data.ai_generated.description;
    }
    if (data.ai_generated.ai_suggestion && !p.ai_suggestion) {
      p.ai_suggestion = data.ai_generated.ai_suggestion;
    }
  }

  // Legacy field name migration (old AI output → SCHEMA names)
  if (data.component_type === 'anniversary') {
    if (p.date && !p.start_date && !p.target_date) {
      if (data.theme === 'holiday') p.target_date = p.date;
      else p.start_date = p.date;
      delete p.date;
    }
    if (p.message && !p.description) {
      p.description = p.message;
      delete p.message;
    }
    if (p.subtitle && !p.description) {
      p.description = p.subtitle;
    }
    if (p.bg_photo && !p.background_image) {
      p.background_image = p.bg_photo;
      delete p.bg_photo;
    }
    // Holiday: emoji → holiday_icon
    if (data.theme === 'holiday' && p.emoji && !p.holiday_icon) {
      p.holiday_icon = p.emoji;
      delete p.emoji;
    }
  }

  // Alarm: display_style → default_view, dial → clock
  if (data.component_type === 'alarm') {
    if (p.display_style && !p.default_view) {
      p.default_view = p.display_style === 'dial' ? 'clock' : p.display_style;
      delete p.display_style;
    }
  }

  // News: categories → topics
  if (data.component_type === 'news') {
    if (p.categories && !p.topics) {
      p.topics = p.categories;
      delete p.categories;
    }
  }

  return p;
}

export async function renderWidgetInFrame(frameEl, data) {
  const templateUrl = getTemplateUrl(data);
  if (!templateUrl) {
    frameEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF;font-size:13px;">未找到模板</div>';
    return;
  }

  const cacheBuster = `v=${Date.now()}`;
  const templateBasePath = templateUrl.replace('index.html', '');

  const resp = await fetch(`${templateUrl}?${cacheBuster}`, { cache: 'no-cache' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  let html = await resp.text();

  const widgetParams = buildWidgetParams(data);
  const paramsScript = `<script>window.__WIDGET_DATA_MODE__ = "preview";window.__WIDGET_PARAMS__ = ${JSON.stringify(widgetParams)};<\/script>`;

  // Fix relative paths for srcdoc mode
  const ts = Date.now();

  // 1. shared 目录：统一替换为绝对路径（匹配 src= 和 href=）
  html = html.replace(/(src|href)="\.\.\/\.\.\/shared\//g, '$1="/widget-templates/shared/');
  html = html.replace(/(src|href)="\.\.\/shared\//g, '$1="/widget-templates/shared/');

  // 2. 本地文件：style.css, main.js → 绝对路径 + cache busting
  html = html.replace(/href="style\.css"/g, `href="${templateBasePath}style.css?v=${ts}"`);
  html = html.replace(/src="style\.css"/g, `src="${templateBasePath}style.css?v=${ts}"`);
  html = html.replace(/src="main\.js"/g, `src="${templateBasePath}main.js?v=${ts}"`);

  // 3. 所有 /widget-templates/ 引用添加 cache busting
  html = html.replace(/(src|href)="(\/widget-templates\/[^"?]+)"/g, `$1="$2?v=${ts}"`);

  // 只在 style_preset 非默认 glass 时覆盖 index.html 的 data-style
  if (widgetParams.style_preset && widgetParams.style_preset !== 'glass') {
    html = html.replace(/data-style="[^"]*"/, `data-style="${widgetParams.style_preset}"`);
  }

  // 注入 templateBasePath 供模板 JS 使用（解决 srcdoc 中相对路径问题）
  const basePathScript = `<script>window.__TEMPLATE_BASE_PATH__ = "${templateBasePath}";<\/script>`;
  html = html.replace('</head>', basePathScript + paramsScript + '</head>');

  // Inject CSS zoom for responsive scaling
  // Templates are designed at 896px (car-end); auto-detect & zoom down for smaller containers
  // Use a runtime script inside iframe to self-measure — avoids timing/visibility issues
  const zoomScript = `<script>(function(){var dw=896,w=window.innerWidth;if(w>0&&w<dw*0.95)document.documentElement.style.zoom=w/dw})()<\/script>`;
  html = html.replace('</head>', zoomScript + '</head>');

  // DEBUG: 输出实际注入 iframe 的 data-style 和 params
  const _dbgMatch = html.match(/data-style="([^"]*)"/);
  const _dbgTheme = html.match(/data-theme="([^"]*)"/);
  console.log('[render-widget] data-style:', _dbgMatch?.[1] || 'NONE');
  console.log('[render-widget] __WIDGET_PARAMS__:', JSON.stringify(widgetParams).substring(0, 200));
  console.log('[render-widget] template:', templateUrl);

  frameEl.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.srcdoc = html;
  iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:inherit;background:#0e1013;';
  frameEl.appendChild(iframe);
}

/** Generate animation overlay — returns { overlay, waitForMinDuration } */
export function showGenerateOverlay(isCodeMode = false) {
  const steps = isCodeMode
    ? ['分析需求', '设计布局', '编写样式', '生成动效', '组装代码']
    : ['理解需求', '匹配风格', '生成布局', '填充数据'];
  const stepInterval = isCodeMode ? 1500 : 300;
  const minDuration = isCodeMode ? 8000 : 1500;
  const title = isCodeMode ? '🧪 AI正在编写代码...' : '✨ AI正在创作...';

  const overlay = document.createElement('div');
  overlay.className = 'generate-overlay';
  overlay.innerHTML = `
    <div class="generate-flow">
      <div class="generate-flow-title">${title}</div>
      <div class="generate-steps">
        ${steps.map(s => `<div class="generate-step"><span class="step-text">${s}</span><span class="step-check">✓</span></div>`).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const stepEls = overlay.querySelectorAll('.generate-step');
  const startTime = Date.now();
  stepEls.forEach((step, i) => {
    setTimeout(() => step.classList.add('done'), stepInterval * (i + 1));
  });

  return {
    overlay,
    async waitForMinDuration() {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));
    }
  };
}

/** Render AI-generated HTML code in a sandboxed iframe */
export function renderCodeWidgetInFrame(frameEl, htmlContent) {
  let html = htmlContent;

  // Inject CSS zoom script (same self-measuring logic as template mode)
  const zoomScript = `<script>(function(){var dw=896,w=window.innerWidth;if(w>0&&w<dw*0.95)document.documentElement.style.zoom=w/dw})()<\/script>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', zoomScript + '</head>');
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', zoomScript + '</body>');
  } else {
    html += zoomScript;
  }

  frameEl.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.sandbox = 'allow-scripts';
  iframe.srcdoc = html;
  iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:inherit;background:#0e1013;';
  frameEl.appendChild(iframe);
}

/** Map component_type+theme back to sceneId */
export function getSceneId(data) {
  if (!data) return null;
  const key = `${data.component_type}-${data.theme}`;
  const map = {
    'anniversary-love': 'love',
    'anniversary-baby': 'baby',
    'anniversary-holiday': 'countdown',
    'anniversary-birthday': 'birthday',
    'weather-weather': 'weather',
    'weather-realtime': 'weather',
    'music-music': 'music',
    'music-player': 'music',
    'calendar-calendar': 'calendar',
    'calendar-schedule': 'calendar',
    'news-news': 'news',
    'news-daily': 'news',
    'alarm-clock': 'alarm',
  };
  return map[key] || data.component_type;
}
