'use strict';
(function() {
  // ① Read injected parameters
  var params = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';
  var isPreview = dataMode === 'preview';

  // ② Mock data (for phone preview)
  var MOCK = {
    start_date: '2025-03-22',
    title: '在一起',
    nickname: '小美',
    description: '与你相伴的每一天',
    background_image: '' // use preset
  };

  // ③ Merge params: user input > AI generated > mock
  function mergeParams(p) {
    var m = isPreview ? MOCK : {};
    return {
      start_date: p.start_date || m.start_date || '2024-01-01',
      nickname: p.nickname || m.nickname || '',
      description: p.description || p.subtitle || m.description || '',
      background_image: p.background_image || p.bg_photo || m.background_image || ''
    };
  }

  var LABEL_POOL = ['天的相伴','天的陪伴','天的甜蜜','天的守护','天的浪漫'];
  var COPY_WITH_NAME = ['与{name}相伴的每一天','{name}，感谢你的陪伴','有{name}的日子真好','和{name}一起走过的时光'];
  var COPY_NO_NAME = ['感谢每一天的陪伴','爱是最美的纪念'];

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function makeCopy(name) {
    if (name) return pickRandom(COPY_WITH_NAME).replace('{name}', name);
    return pickRandom(COPY_NO_NAME);
  }

  // ④ Color engine: extract from background image
  function initColors(imgEl) {
    if (window.extractPanelTint) {
      var tint = window.extractPanelTint(imgEl);
      if (tint) {
        var panel = document.getElementById('glass-panel');
        if (panel) panel.style.background = tint;
      }
    }
  }

  // ⑤ Days calculation
  function daysDiff(dateStr) {
    var start = new Date(dateStr);
    var now = new Date();
    start.setHours(0,0,0,0); now.setHours(0,0,0,0);
    return Math.max(0, Math.floor((now - start) / 86400000));
  }

  // ⑥ Format date: YYYY.MM.DD
  function fmtDate(d) {
    var dt = new Date(d);
    return dt.getFullYear() + '.' + String(dt.getMonth()+1).padStart(2,'0') + '.' + String(dt.getDate()).padStart(2,'0');
  }

  // ⑦ Render
  function render(data) {
    var days = daysDiff(data.start_date);
    document.getElementById('bigNum').textContent = days;
    document.getElementById('label').textContent = pickRandom(LABEL_POOL);
    document.getElementById('subtitle').textContent = makeCopy(data.nickname);
    document.getElementById('dateText').textContent = fmtDate(data.start_date) + ' — ' + fmtDate(new Date());

    // Background image
    var basePath = window.__TEMPLATE_BASE_PATH__ || '';
    var bgUrl = data.background_image || (basePath + 'backgrounds/love_bg_01.jpg');
    var photoArea = document.getElementById('photo-area');

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      photoArea.style.backgroundImage = 'url(' + img.src + ')';
      initColors(img);
    };
    img.onerror = function() {
      // Fallback to preset
      photoArea.style.backgroundImage = 'url(' + basePath + 'backgrounds/love_bg_01.jpg)';
    };
    img.src = bgUrl;
  }

  // ⑧ Easter egg
  function bindInteractions() {
    var panel = document.getElementById('glass-panel');
    var canvas = document.getElementById('easterEggCanvas');
    if (panel && canvas && window.triggerEasterEgg) {
      canvas.width = 896;
      canvas.height = 1464;
      panel.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var x = (e.clientX - rect.left) * (canvas.width / rect.width);
        var y = (e.clientY - rect.top) * (canvas.height / rect.height);
        triggerEasterEgg(canvas, x, y, 'love');
      });
    }
  }

  // ⑨ Startup
  var data = mergeParams(params);
  if (params.visual_style) { document.documentElement.setAttribute('data-visual-style', params.visual_style); }
  render(data);
  bindInteractions();
})();
