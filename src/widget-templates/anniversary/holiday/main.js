/**
 * 假期倒计时 — Full-Bleed Photo + Full-Width Gradient Panel
 * Features: countdown, tag pill, easter egg, bg_photo support
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    target_date: new Date(Date.now() + 86400000 * 23).toISOString().slice(0, 10),
    title: '',
    event_name: '',
    subtitle: ''
  };

  // -- Countdown calculation (timezone-safe) --
  function calculateCountdown(targetDate) {
    var parts = targetDate.split('-').map(Number);
    var target = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diff = target - now;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { days: Math.max(days, 0), isOverdue: days <= 0 };
  }

  // -- Background image loading (v0.4 with __TEMPLATE_BASE_PATH__) --
  function loadBackgroundImage() {
    var bgImage = params.background_image;
    if (!bgImage) return;
    var photoBg = document.getElementById('photoBg');
    if (!photoBg) return;

    var basePath = window.__TEMPLATE_BASE_PATH__ || './';
    var url = basePath + 'backgrounds/' + bgImage + '.webp';

    var img = new Image();
    img.onload = function() {
      photoBg.style.backgroundImage = 'url(' + url + ')';
    };
    img.onerror = function() {
      var jpgUrl = basePath + 'backgrounds/' + bgImage + '.jpg';
      photoBg.style.backgroundImage = 'url(' + jpgUrl + ')';
    };
    img.src = url;
  }

  // -- Render --
  function render() {
    var countdown = calculateCountdown(params.target_date);
    document.getElementById('dayCounter').textContent = countdown.days;

    // Tag text from params
    var tagText = params.title || params.event_name || '假期倒计时';
    document.getElementById('tagText').textContent = tagText;

    // Date range
    var parts = params.target_date.split('-').map(Number);
    var now = new Date();
    var fmt = function(d) {
      return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
    };
    var targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    document.getElementById('dateText').textContent = fmt(now) + ' — ' + fmt(targetDate);
  }

  // -- Easter egg --
  function initEasterEgg() {
    var canvas = document.getElementById('easterEggCanvas');
    if (!canvas) return;
    canvas.width = 896;
    canvas.height = 1464;

    var widget = document.querySelector('.widget-holiday');
    if (widget) {
      widget.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var x = (e.clientX - rect.left) * scaleX;
        var y = (e.clientY - rect.top) * scaleY;
        if (window.triggerEasterEgg) window.triggerEasterEgg(canvas, x, y, 'holiday');
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

    // Photo from user upload (DataURL)
    if (params.bg_photo) {
      var photoBg = document.getElementById('photoBg');
      if (photoBg) {
        photoBg.style.backgroundImage = 'url(' + params.bg_photo + ')';
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
