/**
 * 天气卡片 · Liquid Glass
 * Mesh gradient sky + sun glow + glass pills + 3-day forecast + AI suggestion
 * Data: preview → MOCK, live → /api/weather?city=
 */

(function () {
  'use strict';

  // ── MOCK data for preview mode ──
  var MOCK = {
    city: '北京',
    temperature: 26,
    condition: '晴',
    icon: '☀️',
    feels_like: 28,
    humidity: 45,
    wind: '东南风 3级',
    uv: '较强',
    forecast: [
      { day: '明天', icon: '⛅', high: 27, low: 18 },
      { day: '后天', icon: '🌧', high: 22, low: 15 },
      { day: '周一', icon: '☀️', high: 28, low: 19 }
    ],
    ai_suggestion: '天气晴好，适合户外活动。紫外线较强，建议涂抹防晒霜。'
  };

  // ── Weather condition → mesh gradient color mapping ──
  var CONDITION_COLORS = {
    sunny:  ['#87CEEB', '#5BA3D9', '#3A7BD5', '#2C5F8A'],
    cloudy: ['#8FA4B8', '#7B93A8', '#5A7A92', '#4A6678'],
    rainy:  ['#4A5568', '#3A4A5E', '#2D3748', '#1A2332'],
    snowy:  ['#C4B5D4', '#9B8BBF', '#7B6BA0', '#5B4B80'],
    night:  ['#1A1A3E', '#2A2A5E', '#1A1A3E', '#0A0A2E']
  };

  // Map Chinese condition text → category key
  var CONDITION_MAP = {
    '晴': 'sunny', '多云': 'cloudy', '阴': 'cloudy',
    '小雨': 'rainy', '中雨': 'rainy', '大雨': 'rainy',
    '暴雨': 'rainy', '雷阵雨': 'rainy', '阵雨': 'rainy',
    '小雪': 'snowy', '中雪': 'snowy', '大雪': 'snowy',
    '雨夹雪': 'snowy', '暴雪': 'snowy',
    '雾': 'cloudy', '霾': 'cloudy'
  };

  // ── DOM references ──
  var $root       = document.getElementById('widget-root');
  var $sunGlow    = document.getElementById('sun-glow');
  var $cityName   = document.getElementById('cityName');
  var $dateText   = document.getElementById('dateText');
  var $sunIcon    = document.getElementById('sunIcon');
  var $temperature = document.getElementById('temperature');
  var $condition  = document.getElementById('condition');
  var $feelsLike  = document.getElementById('feelsLike');
  var $humidity   = document.getElementById('humidity');
  var $wind       = document.getElementById('wind');
  var $uv         = document.getElementById('uv');
  var $aiText     = document.getElementById('aiText');

  // ── Params from host (render-widget injects __WIDGET_PARAMS__) ──
  var params = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';

  // ── Date formatting: "M月D日 周X" ──
  var WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function formatDate(date) {
    var d = date || new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var weekday = WEEKDAY_NAMES[d.getDay()];
    return month + '月' + day + '日 ' + weekday;
  }

  // ── Resolve weather category from condition string ──
  function resolveCategory(conditionText) {
    if (!conditionText) return 'sunny';
    // Direct match
    if (CONDITION_MAP[conditionText]) return CONDITION_MAP[conditionText];
    // Fuzzy: check if condition contains a known key
    var keys = Object.keys(CONDITION_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (conditionText.indexOf(keys[i]) !== -1) return CONDITION_MAP[keys[i]];
    }
    // Time-of-day check for night
    var hour = new Date().getHours();
    if (hour >= 19 || hour < 6) return 'night';
    return 'sunny';
  }

  // ── Apply mesh gradient background per weather condition ──
  function applyBackground(category) {
    var colors = CONDITION_COLORS[category] || CONDITION_COLORS.sunny;
    var bg = [
      'radial-gradient(ellipse at 0% 0%, ' + colors[0] + ', transparent 70%)',
      'radial-gradient(ellipse at 100% 0%, ' + colors[1] + ', transparent 70%)',
      'radial-gradient(ellipse at 0% 100%, ' + colors[2] + ', transparent 70%)',
      'radial-gradient(ellipse at 100% 100%, ' + colors[3] + ', transparent 70%)',
      'linear-gradient(135deg, ' + colors[0] + ' 0%, ' + colors[2] + ' 100%)'
    ].join(', ');
    $root.style.background = bg;
  }

  // ── Sun glow visibility ──
  function updateSunGlow(category) {
    if (category === 'rainy' || category === 'cloudy' || category === 'night') {
      $sunGlow.classList.add('hidden');
    } else {
      $sunGlow.classList.remove('hidden');
    }
  }

  // ── Render all sections from data ──
  function render(data) {
    // City
    $cityName.textContent = (data.city || '北京') + '  ▾';

    // Date
    $dateText.textContent = formatDate(new Date());

    // Hero
    $sunIcon.textContent = data.icon || '☀️';
    $temperature.textContent = (data.temperature != null ? data.temperature : '--') + '°';
    $condition.textContent = data.condition || '--';
    $feelsLike.textContent = '体感 ' + (data.feels_like != null ? data.feels_like : '--') + '°';

    // Pills
    $humidity.textContent = (data.humidity != null ? data.humidity + '%' : '--%');
    $wind.textContent = data.wind || '--';
    $uv.textContent = data.uv || '--';

    // Forecast
    var forecast = data.forecast || [];
    for (var i = 0; i < 3; i++) {
      var el = document.getElementById('forecast' + i);
      if (!el) continue;
      var f = forecast[i];
      if (f) {
        el.querySelector('.forecast-label').textContent = f.day || '--';
        el.querySelector('.forecast-icon').textContent = f.icon || '--';
        el.querySelector('.forecast-temp').textContent =
          (f.high != null ? f.high : '--') + '°/' + (f.low != null ? f.low : '--') + '°';
      }
    }

    // AI suggestion
    $aiText.textContent = data.ai_suggestion || '--';

    // Background & glow
    var category = resolveCategory(data.condition);
    applyBackground(category);
    updateSunGlow(category);
  }

  // ── Data fetch ──
  function fetchData() {
    // Preview mode always uses MOCK
    if (dataMode === 'preview') {
      render(mergeParams(MOCK));
      return;
    }

    // Live mode: try API, fallback to MOCK
    var city = params.city || MOCK.city;
    fetch('/api/weather?city=' + encodeURIComponent(city))
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        // API may return { data: {...} } or flat object
        var apiData = json.data || json;
        render(mergeParams(apiData));
      })
      .catch(function (err) {
        console.warn('[Weather] API fetch failed, using MOCK:', err);
        render(mergeParams(MOCK));
      });
  }

  // Merge host params onto data (params override API fields)
  function mergeParams(data) {
    var merged = {};
    // Copy data first
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) merged[keys[i]] = data[keys[i]];
    // Override with host params
    if (params.city) merged.city = params.city;
    if (params.style_preset) merged.style_preset = params.style_preset;
    return merged;
  }

  // ── City click handler (placeholder — log for now) ──
  function setupCityPicker() {
    $cityName.addEventListener('click', function () {
      console.log('[Weather] City picker tapped — placeholder, city:', params.city || MOCK.city);
      // Future: open overlay city picker
      // if (window.WidgetOverlay) { ... }
    });
  }

  // ── Init ──
  function init() {
    setupCityPicker();
    fetchData();
  }

  // Wait for DOM if needed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
