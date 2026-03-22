/**
 * 天气卡片 · Liquid Glass
 * 动态天气粒子 + 真实数据 + AI穿衣建议
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    city: '北京',
    weather_type: 'sunny'
  };

  // Mock 天气数据
  var mockWeather = {
    sunny: {
      temp: 26, feelsLike: 28, desc: '晴', humidity: 35, wind: '3', aqi: '优',
      icon: '☀️',
      forecast: [
        { label: '明天', icon: '⛅', high: 28, low: 18 },
        { label: '后天', icon: '☀️', high: 30, low: 19 },
        { label: '周六', icon: '🌤️', high: 27, low: 17 }
      ],
      suggestion: '天气晴好，适合户外活动。紫外线较强，建议涂抹防晒霜。'
    },
    cloudy: {
      temp: 22, feelsLike: 21, desc: '多云', humidity: 55, wind: '2', aqi: '良',
      icon: '⛅',
      forecast: [
        { label: '明天', icon: '🌧️', high: 20, low: 14 },
        { label: '后天', icon: '⛅', high: 22, low: 15 },
        { label: '周六', icon: '☀️', high: 25, low: 16 }
      ],
      suggestion: '多云天气，温度适中。建议携带薄外套，以防温差。'
    },
    rainy: {
      temp: 18, feelsLike: 16, desc: '小雨', humidity: 80, wind: '4', aqi: '良',
      icon: '🌧️',
      forecast: [
        { label: '明天', icon: '🌧️', high: 17, low: 12 },
        { label: '后天', icon: '⛅', high: 20, low: 13 },
        { label: '周六', icon: '☀️', high: 23, low: 15 }
      ],
      suggestion: '雨天路滑，请小心驾驶。记得带伞，穿防水外套。'
    },
    snowy: {
      temp: -2, feelsLike: -6, desc: '小雪', humidity: 70, wind: '3', aqi: '优',
      icon: '❄️',
      forecast: [
        { label: '明天', icon: '❄️', high: -1, low: -8 },
        { label: '后天', icon: '⛅', high: 2, low: -5 },
        { label: '周六', icon: '☀️', high: 5, low: -3 }
      ],
      suggestion: '雪天降温明显，注意保暖防滑。车辆出行请检查防冻液。'
    }
  };

  var cachedData = null;

  async function fetchWeather() {
    if (cachedData) return cachedData;

    try {
      if (window.AIWidgetBridge && window.AIWidgetBridge.isCarEnvironment && window.AIWidgetBridge.isCarEnvironment()) {
        var response = await window.AIWidgetBridge.fetchData('/api/weather?city=' + encodeURIComponent(params.city));
        cachedData = JSON.parse(response.data);
        return cachedData;
      }

      try {
        var resp = await fetch('/api/weather?city=' + encodeURIComponent(params.city));
        if (resp.ok) {
          cachedData = await resp.json();
          return cachedData;
        }
      } catch (e) { /* fall through */ }
    } catch (e) { /* fall through */ }

    // Mock fallback
    var type = params.weather_type || 'sunny';
    cachedData = mockWeather[type] || mockWeather.sunny;
    return cachedData;
  }

  function renderWeather(data) {
    var widget = document.querySelector('.widget-weather');

    // 设置天气状态
    var type = params.weather_type || 'sunny';
    widget.setAttribute('data-weather', type);

    // 温度 - 动画递增
    animateTemp(data.temp);

    // 天气描述
    var descEl = document.getElementById('weatherDesc');
    if (descEl) descEl.textContent = data.desc;

    // 体感温度
    var feelsEl = document.getElementById('feelsLike');
    if (feelsEl) feelsEl.textContent = '体感 ' + data.feelsLike + '°';

    // 详情
    var humEl = document.getElementById('humidity');
    if (humEl) humEl.textContent = data.humidity + '%';
    var windEl = document.getElementById('wind');
    if (windEl) windEl.textContent = data.wind + '级';
    var aqiEl = document.getElementById('aqi');
    if (aqiEl) aqiEl.textContent = data.aqi;

    // 3日预报
    if (data.forecast) {
      data.forecast.forEach(function(day, i) {
        var el = document.getElementById('forecast' + i);
        if (!el) return;
        el.querySelector('.forecast-label').textContent = day.label;
        el.querySelector('.forecast-icon').textContent = day.icon;
        el.querySelector('.forecast-temp').textContent = day.high + '°/' + day.low + '°';
      });
    }

    // AI建议
    var sugEl = document.getElementById('suggestion');
    if (sugEl) sugEl.textContent = data.suggestion || '';
  }

  function animateTemp(target) {
    var el = document.getElementById('currentTemp');
    if (!el) return;
    var duration = 600;
    var start = 0;
    var startTime = performance.now();

    function update(now) {
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * ease);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function updateDate() {
    var now = new Date();
    var dateEl = document.getElementById('weatherDate');
    if (dateEl) {
      dateEl.textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日';
    }
    var locEl = document.getElementById('locationName');
    if (locEl) locEl.textContent = params.city || '北京';
  }

  // ── 城市切换 overlay ──
  var CITIES = [
    { name: '北京', desc: '晴', temp: '26°' },
    { name: '上海', desc: '多云', temp: '24°' },
    { name: '广州', desc: '阵雨', temp: '27°' },
    { name: '深圳', desc: '晴', temp: '28°' },
    { name: '杭州', desc: '多云转晴', temp: '23°' },
    { name: '成都', desc: '阴', temp: '22°' }
  ];

  var cityStore = window.WidgetStorage ? window.WidgetStorage('weather') : null;

  function openCitySwitcher() {
    if (!window.createOverlay) return;

    var overlay = window.createOverlay({
      title: '切换地点',
      theme: 'dark',
      showSave: false,
      cancelText: '✕',
      content: function(body) {
        // 搜索框
        var searchWrap = document.createElement('div');
        searchWrap.style.cssText = 'padding:16px 36px;';
        var searchInput = document.createElement('input');
        searchInput.className = 'overlay-input';
        searchInput.placeholder = '搜索城市';
        searchInput.style.cssText = 'height:56px; border-radius:16px; font-size:28px;';
        searchWrap.appendChild(searchInput);
        body.appendChild(searchWrap);

        // 分割线
        var d1 = document.createElement('div');
        d1.className = 'overlay-divider full';
        body.appendChild(d1);

        // 当前位置
        var curRow = document.createElement('div');
        curRow.className = 'overlay-row';
        curRow.innerHTML = '<span style="color:#60A5FA;font-size:28px;font-family:MiSans_VF,sans-serif;">📍 当前位置</span>' +
          '<span class="overlay-row-value">' + (params.city || '北京') + '</span>';
        body.appendChild(curRow);

        var d2 = document.createElement('div');
        d2.className = 'overlay-divider full';
        body.appendChild(d2);

        // 已保存城市标签
        var savedLabel = document.createElement('div');
        savedLabel.style.cssText = 'padding:14px 36px; font-size:24px; color:rgba(100,116,139,1); font-family:MiSans_VF,sans-serif;';
        savedLabel.textContent = '已保存的城市';
        body.appendChild(savedLabel);

        // 城市列表
        var cityList = document.createElement('div');
        cityList.className = 'city-list';

        function renderCities(filter) {
          cityList.innerHTML = '';
          var filtered = CITIES.filter(function(c) {
            if (!filter) return true;
            return c.name.indexOf(filter) >= 0;
          });
          filtered.forEach(function(city, idx) {
            var row = document.createElement('div');
            row.className = 'overlay-row';
            row.style.cssText = 'cursor:pointer; min-height:120px; flex-direction:column; align-items:flex-start; justify-content:center; padding:16px 36px;';
            row.innerHTML =
              '<div style="display:flex;width:100%;align-items:center;">' +
                '<span style="font-size:32px;font-weight:500;color:#F5F5F0;font-family:MiSans_VF,sans-serif;">' + city.name + '</span>' +
                '<span style="margin-left:auto;font-size:36px;font-weight:300;color:#F5F5F0;font-family:MiSans_VF,sans-serif;">' + city.temp + '</span>' +
              '</div>' +
              '<span style="font-size:26px;color:#94A3B8;font-family:MiSans_VF,sans-serif;margin-top:8px;">' + city.desc + '</span>';

            row.addEventListener('click', function() {
              params.city = city.name;
              cachedData = null;
              updateDate();
              fetchWeather().then(function(data) {
                renderWeather(data);
              });
              if (cityStore) cityStore.set('selected_city', city.name);
              overlay.hide();
            });
            cityList.appendChild(row);

            // 分割线（非最后一个）
            if (idx < filtered.length - 1) {
              var divider = document.createElement('div');
              divider.className = 'overlay-divider full';
              divider.style.background = 'rgba(51,65,85,1)';
              cityList.appendChild(divider);
            }
          });
        }

        renderCities('');
        searchInput.addEventListener('input', function() {
          renderCities(searchInput.value.trim());
        });

        body.appendChild(cityList);
      }
    });

    overlay.show();
  }

  function initCitySwitcher() {
    // 恢复上次选中的城市
    if (cityStore) {
      var saved = cityStore.get('selected_city');
      if (saved) params.city = saved;
    }

    var locEl = document.getElementById('locationName');
    if (locEl) {
      locEl.addEventListener('click', openCitySwitcher);
    }
  }

  // ── 天气粒子系统 ──
  function initWeatherParticles() {
    var canvas = document.getElementById('weatherCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    var type = params.weather_type || 'sunny';

    function createParticle() {
      if (type === 'rainy') {
        return {
          x: Math.random() * canvas.width,
          y: -30,
          length: 30 + Math.random() * 45,
          speed: 12 + Math.random() * 12,
          opacity: 0.08 + Math.random() * 0.12
        };
      } else if (type === 'snowy') {
        return {
          x: Math.random() * canvas.width,
          y: -30,
          size: 4.5 + Math.random() * 9,
          speed: 1.5 + Math.random() * 3,
          drift: (Math.random() - 0.5) * 1.5,
          opacity: 0.15 + Math.random() * 0.2,
          wobble: Math.random() * Math.PI * 2
        };
      } else if (type === 'sunny') {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height * 0.4,
          size: 3 + Math.random() * 6,
          opacity: 0,
          targetOpacity: 0.06 + Math.random() * 0.10,
          fadeIn: true,
          life: 0,
          maxLife: 200 + Math.random() * 300,
          speed: 0.3
        };
      }
      // cloudy: soft drifting wisps
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        size: 90 + Math.random() * 150,
        opacity: 0.02 + Math.random() * 0.03,
        drift: 0.3 + Math.random() * 0.6
      };
    }

    var maxParticles = type === 'rainy' ? 60 : type === 'snowy' ? 40 : type === 'sunny' ? 15 : 8;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles.length < maxParticles && Math.random() < 0.15) {
        particles.push(createParticle());
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];

        if (type === 'rainy') {
          ctx.strokeStyle = 'rgba(150, 200, 255, ' + p.opacity + ')';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 6, p.y + p.length);
          ctx.stroke();
          p.y += p.speed;
          p.x -= 1.5;
          if (p.y > canvas.height) { particles.splice(i, 1); }
        }
        else if (type === 'snowy') {
          p.wobble += 0.02;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220, 230, 255, ' + p.opacity + ')';
          ctx.fill();
          p.y += p.speed;
          p.x += p.drift + Math.sin(p.wobble) * 0.9;
          if (p.y > canvas.height) { particles.splice(i, 1); }
        }
        else if (type === 'sunny') {
          p.life++;
          if (p.fadeIn) {
            p.opacity += 0.003;
            if (p.opacity >= p.targetOpacity) p.fadeIn = false;
          }
          if (p.life > p.maxLife * 0.6) p.opacity -= 0.002;
          if (p.opacity <= 0 || p.life > p.maxLife) { particles.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 220, 150, ' + p.opacity + ')';
          ctx.fill();
          p.y -= p.speed;
        }
        else {
          // cloudy wisps
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200, 210, 230, ' + p.opacity + ')';
          ctx.fill();
          p.x += p.drift;
          if (p.x > canvas.width + p.size) p.x = -p.size;
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
    window.addEventListener('resize', resize);
  }

  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  async function init() {
    applyTheme();
    if (params.style_preset) {
      document.documentElement.setAttribute('data-style', params.style_preset);
    }

    // ── 动态配色引擎 ──
    if (params.primary_color && window.computePalette) {
      var palette = window.computePalette(params.primary_color);
      Object.keys(palette.cssVars).forEach(function(k) {
        document.documentElement.style.setProperty(k, palette.cssVars[k]);
      });
      document.documentElement.setAttribute('data-style', 'dynamic');
    }

    // ── 视觉风格宏 ──
    if (params.visual_style) {
      document.documentElement.setAttribute('data-visual-style', params.visual_style);
    }

    initCitySwitcher();
    updateDate();
    var data = await fetchWeather();
    renderWeather(data);
    initWeatherParticles();

    // 每30分钟刷新
    setInterval(async function() {
      cachedData = null;
      var fresh = await fetchWeather();
      renderWeather(fresh);
    }, 30 * 60 * 1000);

    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.onThemeChange(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
