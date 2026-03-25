/**
 * 天气卡片 · Liquid Glass
 * Mesh gradient sky + sun glow + glass pills + 3-day forecast + AI suggestion
 * Data: preview → MOCK, live → /api/weather?city=
 */

(function () {
  'use strict';

  // ── Preset cities for city picker ──
  var PRESET_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];

  // ── MOCK data per city for preview mode ──
  var MOCK_CITY_DATA = {
    '北京': {
      temperature: 18, condition: '多云', icon: '⛅', feels_like: 16, humidity: 35, wind: '北风 3级', uv: '中等',
      forecast: [
        { day: '明天', icon: '☀️', high: 20, low: 10 },
        { day: '后天', icon: '⛅', high: 22, low: 12 },
        { day: '周一', icon: '☀️', high: 24, low: 13 }
      ],
      ai_suggestion: '多云天气，温差较大，建议带件薄外套。空气干燥，注意补水。'
    },
    '上海': {
      temperature: 22, condition: '阴', icon: '☁️', feels_like: 21, humidity: 72, wind: '东风 2级', uv: '弱',
      forecast: [
        { day: '明天', icon: '🌧', high: 20, low: 16 },
        { day: '后天', icon: '⛅', high: 23, low: 17 },
        { day: '周一', icon: '☀️', high: 25, low: 18 }
      ],
      ai_suggestion: '阴天湿度较高，明天有雨，出门记得带伞。体感温润，穿长袖即可。'
    },
    '广州': {
      temperature: 28, condition: '雷阵雨', icon: '⛈️', feels_like: 32, humidity: 85, wind: '南风 2级', uv: '较强',
      forecast: [
        { day: '明天', icon: '🌧', high: 29, low: 23 },
        { day: '后天', icon: '⛅', high: 31, low: 24 },
        { day: '周一', icon: '☀️', high: 32, low: 25 }
      ],
      ai_suggestion: '午后有雷阵雨，出门带伞。湿度大体感闷热，建议穿透气面料。'
    },
    '深圳': {
      temperature: 27, condition: '多云转晴', icon: '⛅', feels_like: 30, humidity: 78, wind: '东南风 3级', uv: '较强',
      forecast: [
        { day: '明天', icon: '☀️', high: 30, low: 24 },
        { day: '后天', icon: '☀️', high: 31, low: 25 },
        { day: '周一', icon: '⛅', high: 29, low: 23 }
      ],
      ai_suggestion: '下午转晴，适合户外活动。紫外线较强，注意防晒。'
    },
    '杭州': {
      temperature: 20, condition: '小雨', icon: '🌧', feels_like: 18, humidity: 80, wind: '东风 1级', uv: '弱',
      forecast: [
        { day: '明天', icon: '🌧', high: 19, low: 14 },
        { day: '后天', icon: '⛅', high: 22, low: 15 },
        { day: '周一', icon: '☀️', high: 24, low: 16 }
      ],
      ai_suggestion: '细雨绵绵，路面湿滑注意驾驶安全。建议穿防水外套。'
    },
    '成都': {
      temperature: 19, condition: '阴', icon: '☁️', feels_like: 18, humidity: 70, wind: '微风', uv: '弱',
      forecast: [
        { day: '明天', icon: '☁️', high: 20, low: 14 },
        { day: '后天', icon: '⛅', high: 22, low: 15 },
        { day: '周一', icon: '☀️', high: 23, low: 16 }
      ],
      ai_suggestion: '阴天微风，气温舒适。适合逛街散步，穿件卫衣刚好。'
    },
    '武汉': {
      temperature: 23, condition: '晴', icon: '☀️', feels_like: 25, humidity: 55, wind: '南风 2级', uv: '强',
      forecast: [
        { day: '明天', icon: '☀️', high: 26, low: 17 },
        { day: '后天', icon: '⛅', high: 24, low: 16 },
        { day: '周一', icon: '🌧', high: 20, low: 14 }
      ],
      ai_suggestion: '晴好天气，紫外线强，外出注意防晒。周一有雨，提前备伞。'
    },
    '西安': {
      temperature: 16, condition: '晴转多云', icon: '⛅', feels_like: 14, humidity: 40, wind: '西北风 3级', uv: '中等',
      forecast: [
        { day: '明天', icon: '☁️', high: 18, low: 8 },
        { day: '后天', icon: '⛅', high: 20, low: 10 },
        { day: '周一', icon: '☀️', high: 22, low: 11 }
      ],
      ai_suggestion: '早晚温差大，建议洋葱穿搭。风力较大，骑行注意安全。'
    }
  };

  // Default MOCK (fallback)
  var MOCK = MOCK_CITY_DATA['北京'];

  // Current city state
  var currentCity = '北京';

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

  // ── Initialize city from params (fixes preview always showing 北京) ──
  if (params.city) {
    currentCity = params.city;
    MOCK = MOCK_CITY_DATA[currentCity] || MOCK;
  }

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

  // ── Temperature animation ──
  var prevTemp = null;

  function animateNumber(el, from, to, suffix, duration) {
    duration = duration || 800;
    suffix = suffix || '';
    var start = performance.now();
    var diff = to - from;
    if (diff === 0) { el.textContent = to + suffix; return; }
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      el.textContent = Math.round(from + diff * ease) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Render all sections from data ──
  function render(data) {
    // City
    $cityName.textContent = (data.city || '北京') + '  ▾';

    // Date
    $dateText.textContent = formatDate(new Date());

    // Hero
    $sunIcon.textContent = data.icon || '☀️';
    // Animate temperature number
    var newTemp = data.temperature != null ? data.temperature : null;
    if (newTemp != null) {
      animateNumber($temperature, prevTemp != null ? prevTemp : 0, newTemp, '°');
      prevTemp = newTemp;
    } else {
      $temperature.textContent = '--°';
    }
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

  // ── Get mock data for current city ──
  function getMockForCity(city) {
    var data = MOCK_CITY_DATA[city] || MOCK;
    // Attach city name to data
    var result = {};
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) result[keys[i]] = data[keys[i]];
    result.city = city;
    return result;
  }

  // ── Data fetch ──
  function fetchData() {
    // Preview mode uses per-city MOCK
    if (dataMode === 'preview') {
      render(mergeParams(getMockForCity(currentCity)));
      return;
    }

    // Live mode: try API, fallback to MOCK
    var city = params.city || currentCity;
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
        render(mergeParams(getMockForCity(currentCity)));
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

  // ── City click handler — opens overlay with city list + search (Pencil Node gmj9b) ──
  function setupCityPicker() {
    var cityEl = document.getElementById('cityName') || document.querySelector('.city-name');
    if (!cityEl) return;
    cityEl.style.cursor = 'pointer';
    cityEl.addEventListener('click', function () {
      if (!window.createOverlay) { console.warn('overlay.js not loaded'); return; }
      var overlay = createOverlay({
        title: '切换地点',
        showSave: false,
        content: function (contentEl) {
          // Search input
          var searchWrap = document.createElement('div');
          searchWrap.style.cssText = 'padding:8px 0 16px;';
          var searchInput = document.createElement('input');
          searchInput.type = 'text';
          searchInput.placeholder = '搜索城市';
          searchInput.style.cssText = 'width:100%;padding:16px 20px;font-size:28px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:#F5F5F0;outline:none;';
          searchWrap.appendChild(searchInput);
          contentEl.appendChild(searchWrap);

          // Current location row
          var locRow = document.createElement('div');
          locRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06);';
          locRow.innerHTML = '<span style="font-size:28px;color:#60A5FA;">\uD83D\uDCCD 当前位置</span><span style="font-size:28px;color:#F5F5F0;">' + currentCity + '</span>';
          contentEl.appendChild(locRow);

          // Section label
          var label = document.createElement('div');
          label.textContent = '已保存的城市';
          label.style.cssText = 'font-size:24px;color:rgba(245,245,240,0.4);padding:20px 0 12px;';
          contentEl.appendChild(label);

          // City list container
          var listEl = document.createElement('div');
          listEl.id = 'cityList';
          contentEl.appendChild(listEl);

          function renderCityList(filter) {
            listEl.innerHTML = '';
            var cities = PRESET_CITIES;
            if (filter) {
              cities = cities.filter(function (c) { return c.indexOf(filter) !== -1; });
            }
            for (var i = 0; i < cities.length; i++) {
              var city = cities[i];
              var mockData = MOCK_CITY_DATA[city];
              var row = document.createElement('div');
              row.setAttribute('data-city', city);
              row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:opacity 0.15s;';
              var leftDiv = document.createElement('div');
              leftDiv.innerHTML = '<div style="font-size:32px;font-weight:500;color:#F5F5F0;">' + city + '</div>' +
                (mockData ? '<div style="font-size:24px;color:rgba(245,245,240,0.4);margin-top:4px;">' + mockData.condition + '</div>' : '');
              var rightSpan = document.createElement('span');
              rightSpan.style.cssText = 'font-size:36px;font-weight:300;color:#F5F5F0;';
              rightSpan.textContent = mockData ? mockData.temperature + '°' : '--°';
              row.appendChild(leftDiv);
              row.appendChild(rightSpan);
              row.addEventListener('click', function (e) {
                var target = e.currentTarget;
                var newCity = target.getAttribute('data-city');
                if (newCity) {
                  currentCity = newCity;
                  overlay.hide();
                  fetchData();
                }
              });
              listEl.appendChild(row);
            }
            if (cities.length === 0) {
              listEl.innerHTML = '<div style="text-align:center;padding:32px;color:rgba(245,245,240,0.3);font-size:28px;">无匹配城市</div>';
            }
          }

          renderCityList('');

          searchInput.addEventListener('input', function () {
            renderCityList(searchInput.value.trim());
          });
        }
      });
      overlay.show();
    });
  }

  // ── Init ──
  function init() {
    if (params.visual_style) { document.documentElement.setAttribute('data-visual-style', params.visual_style); }
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
