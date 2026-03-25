/**
 * Anniversary / Birthday — main.js
 * Pencil Design Reference: Card-Birthday (2LUjp)
 * Countdown to next birthday
 * Easter egg type: 'birthday' (cake/gift/balloon)
 */

(function() {
  'use strict';

  // ── AI params / mock fallback ──
  var params = window.__WIDGET_PARAMS__ || {
    birthday_date: '2026-04-09',
    person_name: '妈妈',
    background_image: '',
    primary_color: ''
  };

  var dataMode = window.__WIDGET_DATA_MODE__ || 'preview';

  // ── Visual style ──
  if (params.visual_style) {
    document.documentElement.setAttribute('data-visual-style', params.visual_style);
  }

  // ── Random text pools ──
  var LABEL_DEFAULT = ['天后就是TA的生日', '天的期待', '天后的惊喜', '天后一起庆祝'];
  var LABEL_WEEK = ['天！快准备礼物吧'];
  var LABEL_TOMORROW = ['明天就是TA的生日啦'];
  var LABEL_TODAY = ['今天是TA的生日！', '生日快乐！'];
  var COPY_WITH_NAME = ['给{name}准备一份惊喜吧', '{name}的专属生日愿望', '和{name}一起许个愿', '{name}，生日快乐', '期待{name}的生日派对'];
  var COPY_NO_NAME = ['准备一份特别的惊喜吧', '许一个美好的生日愿望', '又长大了一岁', '生日快乐，愿一切美好'];
  var COPY_TODAY_NAME = ['{name}，今天是属于你的日子', '祝{name}生日快乐，万事如意'];

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function makeLabel(days) {
    if (days === 0) return pickRandom(LABEL_TODAY);
    if (days === 1) return pickRandom(LABEL_TOMORROW);
    if (days <= 7) return pickRandom(LABEL_WEEK);
    return pickRandom(LABEL_DEFAULT);
  }

  function makeCopy(name, days) {
    if (days === 0 && name) return pickRandom(COPY_TODAY_NAME).replace('{name}', name);
    if (name) return pickRandom(COPY_WITH_NAME).replace('{name}', name);
    return pickRandom(COPY_NO_NAME);
  }

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

  function todayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  /** Calculate days until next birthday (auto wrap to next year) */
  function daysUntilBirthday(birthdayStr) {
    var bd = parseDate(birthdayStr);
    if (!bd) return 0;
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    // This year's birthday
    var thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    thisYear.setHours(0, 0, 0, 0);

    var diff = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) {
      // Birthday already passed this year, get next year's
      var nextYear = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
      nextYear.setHours(0, 0, 0, 0);
      diff = Math.ceil((nextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    return diff;
  }

  /** Format the next birthday date as YYYY.MM.DD */
  function nextBirthdayStr(birthdayStr) {
    var bd = parseDate(birthdayStr);
    if (!bd) return '';
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    thisYear.setHours(0, 0, 0, 0);
    if (thisYear.getTime() < today.getTime()) {
      thisYear.setFullYear(today.getFullYear() + 1);
    }
    var y = thisYear.getFullYear();
    var m = String(thisYear.getMonth() + 1).padStart(2, '0');
    var d = String(thisYear.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + d;
  }

  // ── DOM references ──
  var els = {};
  function $(id) { return els[id] || (els[id] = document.getElementById(id)); }

  // ── Render ──
  function render() {
    var days = daysUntilBirthday(params.birthday_date);

    // Hero number
    $('numBd').textContent = String(days);

    // Label
    $('labelBd').textContent = makeLabel(days);

    // Copy (with person_name)
    $('copyBd').textContent = makeCopy(params.person_name, days);

    // Date
    $('dateBd').textContent = nextBirthdayStr(params.birthday_date);
  }

  // ── Background image loading + color extraction ──
  function loadBackground() {
    var src = params.background_image || (basePath + 'backgrounds/birthday_bg_01.jpg');

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      $('photo-area').style.backgroundImage = 'url(' + img.src + ')';

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
      var fallbacks = [
        basePath + 'backgrounds/birthday_bg_02.jpg',
        basePath + 'backgrounds/birthday_bg_03.jpg'
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

  // ── Dynamic color engine ──
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

  // ── Easter egg ──
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
      window.triggerEasterEgg(canvas, x, y, 'birthday');
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

    applyDynamicColor();
    render();
    loadBackground();
    initEasterEgg();

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
