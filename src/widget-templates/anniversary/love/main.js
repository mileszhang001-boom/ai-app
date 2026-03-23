/**
 * 恋爱纪念日 — Full-Bleed Photo + Bottom Text Overlay
 * Features: day counter, milestone detection, easter egg, bg_photo support
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    start_date: '2025-03-22',
    subtitle: ''
  };

  // -- Date calculation (timezone-safe) --
  function calculateDays(startDate) {
    var parts = startDate.split('-').map(Number);
    var start = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diff = now - start;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  }

  // -- Milestone detection --
  function getMilestone(days) {
    var milestones = [100, 200, 365, 500, 520, 700, 730, 999, 1000, 1095, 1314, 1461];
    if (milestones.indexOf(days) !== -1) return days;
    if (days > 0 && days % 100 === 0) return days;
    if (days > 0 && days % 365 === 0) return days;
    return null;
  }

  function getSubtitleForMilestone(days) {
    var milestone = getMilestone(days);
    if (!milestone) return null;
    var map = {
      100: '第一百天，我们的小小里程碑',
      200: '两百天，日子越来越甜',
      365: '整整一年，感谢你的陪伴',
      500: '五百天，半千日的温柔',
      520: '520天，我爱你',
      700: '七百天，每一天都算数',
      730: '两年了，时光不负有心人',
      999: '九九九，长长久久',
      1000: '一千天，三年的浪漫',
      1095: '三年整，最好的时光',
      1314: '一生一世，是你',
      1461: '四年了，闰年的约定'
    };
    return map[milestone] || '第' + milestone + '天，特别的日子';
  }

  // -- Background image loading with fade-in transition --
  function loadBackgroundImage() {
    var bgImage = params.background_image;
    if (!bgImage) return;
    var photoBg = document.getElementById('photoBg');
    if (!photoBg) return;

    var basePath = window.__TEMPLATE_BASE_PATH__ || './';
    var url = basePath + 'backgrounds/' + bgImage + '.webp';

    photoBg.classList.add('loading'); // 隐藏，显示底部渐变

    var img = new Image();
    img.onload = function() {
      photoBg.style.backgroundImage = 'url(' + url + ')';
      // Auto-extract panel tint from image
      if (window.extractPanelTint) {
        try {
          var tint = window.extractPanelTint(img);
          document.documentElement.style.setProperty('--panel-tint', tint);
        } catch(e) {}
      }
      requestAnimationFrame(function() { photoBg.classList.remove('loading'); }); // 渐入
    };
    img.onerror = function() {
      var jpgUrl = basePath + 'backgrounds/' + bgImage + '.jpg';
      var img2 = new Image();
      img2.onload = function() {
        photoBg.style.backgroundImage = 'url(' + jpgUrl + ')';
        // Auto-extract panel tint from image
        if (window.extractPanelTint) {
          try {
            var tint = window.extractPanelTint(img2);
            document.documentElement.style.setProperty('--panel-tint', tint);
          } catch(e) {}
        }
        requestAnimationFrame(function() { photoBg.classList.remove('loading'); });
      };
      img2.onerror = function() {
        photoBg.classList.remove('loading'); // 回退到渐变
      };
      img2.src = jpgUrl;
    };
    img.src = url;
  }

  // -- Render --
  function render() {
    var days = calculateDays(params.start_date);
    document.getElementById('dayCounter').textContent = days;

    var milestone = getMilestone(days);
    var sub = params.subtitle || getSubtitleForMilestone(days) || '每一天都算数';
    document.getElementById('subtitle').textContent = sub;

    // Date range
    var start = new Date(params.start_date.split('-').map(Number).reduce(function(_, v, i, a) { return i === 0 ? new Date(a[0], a[1] - 1, a[2]) : _; }, null) || params.start_date);
    var parts = params.start_date.split('-').map(Number);
    start = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    var fmt = function(d) {
      return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
    };
    document.getElementById('dateText').textContent = fmt(start) + ' — ' + fmt(now);
  }

  // -- Easter egg --
  function initEasterEgg() {
    var canvas = document.getElementById('easterEggCanvas');
    if (!canvas) return;
    canvas.width = 896;
    canvas.height = 1464;

    var widget = document.querySelector('.widget-love');
    if (widget) {
      widget.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var x = (e.clientX - rect.left) * scaleX;
        var y = (e.clientY - rect.top) * scaleY;
        if (window.triggerEasterEgg) window.triggerEasterEgg(canvas, x, y, 'love');
      });
    }
  }

  // -- Init --
  function init() {
    // Theme / color-engine
    if (params.primary_color && window.computePalette) {
      var palette = window.computePalette(params.primary_color);
      Object.keys(palette.cssVars).forEach(function(k) {
        document.documentElement.style.setProperty(k, palette.cssVars[k]);
      });
    }

    // Photo from user upload (DataURL) — with fade-in
    if (params.bg_photo) {
      var photoBg = document.getElementById('photoBg');
      if (photoBg) {
        photoBg.classList.add('loading');
        photoBg.style.backgroundImage = 'url(' + params.bg_photo + ')';
        // Auto-extract panel tint from user photo
        if (window.extractPanelTint) {
          var tintImg = new Image();
          tintImg.onload = function() {
            try {
              var tint = window.extractPanelTint(tintImg);
              document.documentElement.style.setProperty('--panel-tint', tint);
            } catch(e) {}
          };
          tintImg.src = params.bg_photo;
        }
        requestAnimationFrame(function() { photoBg.classList.remove('loading'); });
      }
    }

    loadBackgroundImage();
    render();
    initEasterEgg();

    // Check day change every 60s
    setInterval(render, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
