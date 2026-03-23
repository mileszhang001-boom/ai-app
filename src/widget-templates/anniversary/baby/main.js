/**
 * 宝宝成长纪念日 — Full-Bleed Photo + Bottom Text Overlay
 * Features: month/day counter, milestone detection, easter egg, bg_photo support
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    start_date: '2024-09-22',
    subtitle: '',
    baby_name: '小星星'
  };

  // -- Calculate months between two dates --
  function calculateMonths(startDate) {
    var parts = startDate.split('-').map(Number);
    var start = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    // Adjust if the day hasn't been reached yet this month
    if (now.getDate() < start.getDate()) months--;
    return months >= 0 ? months : 0;
  }

  // -- Calculate days (for sub-month display) --
  function calculateDays(startDate) {
    var parts = startDate.split('-').map(Number);
    var start = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diff = now - start;
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  }

  // -- Milestone detection (based on days) --
  function getMilestone(days) {
    var milestones = [7, 30, 42, 100, 180, 200, 300, 365, 500, 600, 700, 730, 900, 999, 1000, 1095, 1461];
    if (milestones.indexOf(days) !== -1) return days;
    if (days > 0 && days % 100 === 0) return days;
    if (days > 0 && days % 365 === 0) return days;
    return null;
  }

  function getSubtitleForMilestone(days) {
    var milestone = getMilestone(days);
    if (!milestone) return null;
    var map = {
      7: '宝宝满一周啦',
      30: '宝宝满月啦，小小里程碑',
      42: '宝宝满42天，妈妈出月子',
      100: '宝宝一百天啦',
      180: '半年了，宝宝长大好多',
      200: '两百天，每天都在成长',
      300: '三百天，宝宝越来越棒',
      365: '宝宝一周岁啦，生日快乐',
      500: '五百天，小小冒险家',
      600: '六百天，世界真奇妙',
      700: '七百天，每天都是惊喜',
      730: '宝宝两岁啦，生日快乐',
      900: '九百天，宝宝的小宇宙',
      999: '九九九天，最棒的数字',
      1000: '一千天，三年的奇迹',
      1095: '宝宝三岁啦，大宝贝',
      1461: '宝宝四岁啦，小小少年'
    };
    return map[milestone] || '第' + milestone + '天，宝宝的特别日子';
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
    var months = calculateMonths(params.start_date);
    var days = calculateDays(params.start_date);

    // Display months if >= 1 month, else days
    var displayNumber;
    var labelEl = document.getElementById('labelText');
    if (months >= 1) {
      displayNumber = months;
      if (labelEl) labelEl.textContent = '个月的成长';
    } else {
      displayNumber = days;
      if (labelEl) labelEl.textContent = '天的成长';
    }
    document.getElementById('dayCounter').textContent = displayNumber;

    // Subtitle: baby name or milestone text
    var babyName = params.baby_name || params.subtitle || '';
    var milestoneText = getSubtitleForMilestone(days);
    var sub = babyName || milestoneText || '每一天都是新的奇迹';
    document.getElementById('subtitle').textContent = sub;

    // Date text
    var parts = params.start_date.split('-').map(Number);
    var fmt = function(y, m, d) {
      return y + '.' + ('0' + m).slice(-2) + '.' + ('0' + d).slice(-2);
    };
    document.getElementById('dateText').textContent = fmt(parts[0], parts[1], parts[2]) + ' 出生';
  }

  // -- Easter egg --
  function initEasterEgg() {
    var canvas = document.getElementById('easterEggCanvas');
    if (!canvas) return;
    canvas.width = 896;
    canvas.height = 1464;

    var widget = document.querySelector('.widget-baby');
    if (widget) {
      widget.addEventListener('click', function(e) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var x = (e.clientX - rect.left) * scaleX;
        var y = (e.clientY - rect.top) * scaleY;
        if (window.triggerEasterEgg) window.triggerEasterEgg(canvas, x, y, 'baby');
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
