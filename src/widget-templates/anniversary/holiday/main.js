/**
 * Anniversary / Holiday — main.js
 * Pencil Design Reference: Card-Holiday (7EC5L)
 * Countdown to target holiday date
 * Easter egg type: 'holiday' (confetti)
 */

(function() {
  'use strict';

  // ── AI params / mock fallback ──
  var params = window.__WIDGET_PARAMS__ || {
    target_date: '2026-05-01',
    target_end_date: '2026-05-05',
    holiday_name: '五一小长假',
    holiday_icon: '✈️',
    title: '出发！',
    description: '假期即将来临，准备出发吧',
    background_image: '',
    primary_color: ''
  };

  var dataMode = window.__WIDGET_DATA_MODE__ || 'preview';

  // ── Resolve background image base path ──
  function getBasePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('main.js') !== -1) {
        return src.substring(0, src.lastIndexOf('/') + 1);
      }
    }
    return './';
  }

  var basePath = getBasePath();

  // ── Date helpers ──
  function parseDate(str) {
    if (!str) return null;
    var parts = str.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = parseDate(dateStr);
    if (!d || isNaN(d.getTime())) return dateStr;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  function daysDiff(fromStr, toStr) {
    var from = parseDate(fromStr);
    var to = parseDate(toStr);
    if (!from || !to) return 0;
    var diff = to.getTime() - from.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ── DOM references ──
  var els = {};
  function $(id) { return els[id] || (els[id] = document.getElementById(id)); }

  // ── Render ──
  function render() {
    var targetDate = params.target_date;
    var countdown = daysDiff(todayStr(), targetDate);

    // Tag pill
    $('tagIcon').textContent = params.holiday_icon || '✈️';
    $('tagText').textContent = params.holiday_name || '假期';

    // Countdown number + label
    if (countdown > 0) {
      $('numH').textContent = String(countdown);
      $('labelH').textContent = '天';
    } else {
      // Holiday has arrived or passed
      $('numH').textContent = '已到达';
      $('numH').style.fontSize = '80px';
      $('numH').style.fontWeight = '500';
      $('labelH').textContent = '';
    }

    // Subtitle
    $('subtitle').textContent = params.description || '';

    // Date range
    var startFormatted = formatDate(params.target_date);
    var endFormatted = formatDate(params.target_end_date);
    if (startFormatted && endFormatted && params.target_end_date !== params.target_date) {
      $('dateH').textContent = startFormatted + ' \u2014 ' + endFormatted;
    } else if (startFormatted) {
      $('dateH').textContent = startFormatted;
    }
  }

  // ── Background image loading + color extraction ──
  function loadBackground() {
    var src = params.background_image || (basePath + 'backgrounds/holiday_bg_01.jpg');

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      $('photo-area').style.backgroundImage = 'url(' + img.src + ')';

      // Extract color from image and tint the panel
      if (window.extractPanelTint) {
        try {
          var tint = window.extractPanelTint(img);
          var panel = $('glass-panel');
          if (panel && tint) {
            panel.style.background = 'linear-gradient(180deg, ' + tint + ' 0%, ' + tint + ' 100%)';
            panel.style.opacity = '0.85';
          }
        } catch (e) { /* keep CSS default */ }
      }
    };
    img.onerror = function() {
      // Fallback: try numbered backgrounds
      var fallbacks = [
        basePath + 'backgrounds/holiday_bg_02.jpg',
        basePath + 'backgrounds/holiday_bg_03.jpg'
      ];
      var idx = 0;
      function tryNext() {
        if (idx >= fallbacks.length) return;
        var fb = new Image();
        fb.crossOrigin = 'anonymous';
        fb.onload = function() {
          $('photo-area').style.backgroundImage = 'url(' + fb.src + ')';
        };
        fb.onerror = function() { idx++; tryNext(); };
        fb.src = fallbacks[idx];
      }
      tryNext();
    };
    img.src = src;
  }

  // ── Dynamic color engine (when AI provides primary_color) ──
  function applyDynamicColor() {
    if (!params.primary_color || !window.computePalette) return;
    var palette = window.computePalette(params.primary_color, 'mood');
    if (palette && palette.cssVars) {
      Object.keys(palette.cssVars).forEach(function(k) {
        document.documentElement.style.setProperty(k, palette.cssVars[k]);
      });
      document.documentElement.setAttribute('data-style', 'dynamic');
    }
  }

  // ── Easter egg (confetti on tap) ──
  function initEasterEgg() {
    var canvas = $('easterEggCanvas');
    if (!canvas || !window.triggerEasterEgg) return;

    canvas.width = 896;
    canvas.height = 1464;

    var root = $('widget-root');
    root.addEventListener('click', function(e) {
      var rect = root.getBoundingClientRect();
      var scaleX = 896 / rect.width;
      var scaleY = 1464 / rect.height;
      var x = (e.clientX - rect.left) * scaleX;
      var y = (e.clientY - rect.top) * scaleY;
      window.triggerEasterEgg(canvas, x, y, 'holiday');
    });
  }

  // ── Theme ──
  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  // ── Init ──
  function init() {
    applyTheme();

    if (params.style_preset) {
      document.documentElement.setAttribute('data-style', params.style_preset);
    }
    if (params.visual_style) {
      document.documentElement.setAttribute('data-visual-style', params.visual_style);
    }

    applyDynamicColor();
    render();
    loadBackground();
    initEasterEgg();

    // Listen for theme changes
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
