/**
 * Shared widget rendering utilities
 * Used by preview.js and finetune.js
 */

export const TEMPLATE_URL_MAP = {
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

  if (data.style_preset) p.style_preset = data.style_preset;
  if (data.primary_color) p.primary_color = data.primary_color;
  if (data.visual_style) p.visual_style = data.visual_style;

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
  const paramsScript = `<script>window.__WIDGET_PARAMS__ = ${JSON.stringify(widgetParams)};<\/script>`;

  // Fix relative paths for srcdoc mode
  html = html.replace(/\.\.\/\.\.\/shared\//g, '/widget-templates/shared/');
  html = html.replace(/\.\.\/shared\//g, '/widget-templates/shared/');
  html = html.replace(/href="style\.css"/g, `href="${templateBasePath}style.css?v=${Date.now()}"`);
  html = html.replace(/src="style\.css"/g, `src="${templateBasePath}style.css?v=${Date.now()}"`);
  html = html.replace(/src="main\.js"/g, `src="${templateBasePath}main.js?v=${Date.now()}"`);
  html = html.replace(/src="\.\.\/\.\.\/shared\/bridge\.js"/g, `src="/widget-templates/shared/bridge.js?v=${Date.now()}"`);
  html = html.replace(/src="\.\.\/\.\.\/shared\/color-engine\.js"/g, `src="/widget-templates/shared/color-engine.js?v=${Date.now()}"`);
  html = html.replace(/src="\.\.\/shared\/color-engine\.js"/g, `src="/widget-templates/shared/color-engine.js?v=${Date.now()}"`);

  if (widgetParams.style_preset) {
    html = html.replace(/<html/, `<html data-style="${widgetParams.style_preset}"`);
  }

  html = html.replace('</head>', paramsScript + '</head>');

  // Inject CSS zoom for responsive scaling
  // Templates are designed at 896px (car-end); auto-detect & zoom down for smaller containers
  // Use a runtime script inside iframe to self-measure — avoids timing/visibility issues
  const zoomScript = `<script>(function(){var dw=896,w=window.innerWidth;if(w>0&&w<dw*0.95)document.documentElement.style.zoom=w/dw})()<\/script>`;
  html = html.replace('</head>', zoomScript + '</head>');

  frameEl.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.srcdoc = html;
  iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:inherit;';
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
  iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:inherit;';
  frameEl.appendChild(iframe);
}

/** Map component_type+theme back to sceneId */
export function getSceneId(data) {
  if (!data) return null;
  const key = `${data.component_type}-${data.theme}`;
  const map = {
    'weather-realtime': 'weather',
    'anniversary-love': 'love',
    'calendar-schedule': 'calendar',
    'music-player': 'music',
    'anniversary-holiday': 'countdown',
    'anniversary-baby': 'baby',
    'alarm-clock': 'alarm',
    'news-daily': 'news',
  };
  return map[key] || data.component_type;
}
