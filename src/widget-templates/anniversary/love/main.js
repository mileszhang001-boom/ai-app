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
      title: p.title || m.title || '在一起',
      nickname: p.nickname || m.nickname || '',
      description: p.description || p.subtitle || m.description || '',
      background_image: p.background_image || p.bg_photo || m.background_image || ''
    };
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
    document.getElementById('label').textContent = '天的' + data.title;
    document.getElementById('subtitle').textContent = data.description;
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
  render(data);
  bindInteractions();
})();
