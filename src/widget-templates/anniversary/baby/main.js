/**
 * 宝宝成长纪念日 — Full-Bleed Photo + Amber Glass Panel
 * Features: month counter, milestone detection, easter egg, bg_photo support
 */

(function() {
  'use strict';

  var _raw = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';
  var isPreview = dataMode === 'preview';

  var MOCK = {
    birth_date: '2024-09-22',
    baby_name: '小星星',
    description: '宝贝健康长大',
    background_image: ''
  };

  function mergeParams(p) {
    var m = isPreview ? MOCK : {};
    return {
      birth_date: p.birth_date || m.birth_date || '2024-01-01',
      baby_name: p.baby_name || m.baby_name || '',
      description: p.description || p.subtitle || m.description || '',
      background_image: p.background_image || p.bg_photo || m.background_image || ''
    };
  }

  var params = mergeParams(_raw);
  if (_raw.visual_style) { document.documentElement.setAttribute('data-visual-style', _raw.visual_style); }

  // -- Random pool functions --
  var LABEL_DAYS = ['天的成长','天的陪伴','天的奇妙旅程'];
  var LABEL_MONTHS = ['个月的成长','个月的蜕变'];
  var COPY_WITH_NAME = ['{name}的成长日记','{name}每天都在进步','记录{name}的每一步'];
  var COPY_NO_NAME = ['宝贝的成长日记','记录每一个珍贵瞬间'];

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function makeCopy(name) {
    if (name) return pickRandom(COPY_WITH_NAME).replace('{name}', name);
    return pickRandom(COPY_NO_NAME);
  }

  // -- Month calculation (timezone-safe) --
  function calculateMonths(birthDate) {
    var parts = birthDate.split('-').map(Number);
    var birth = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);

    var months = (now.getFullYear() - birth.getFullYear()) * 12
               + (now.getMonth() - birth.getMonth());

    // If we haven't reached the birth day yet this month, subtract one
    if (now.getDate() < birth.getDate()) {
      months--;
    }
    return months >= 0 ? months : 0;
  }

  // -- Background image loading with fade-in transition --
  function loadBackgroundImage() {
    var bgImage = params.background_image;
    if (!bgImage) {
      // Use default background
      var basePath = window.__TEMPLATE_BASE_PATH__ || './';
      bgImage = 'baby_bg_01';
      loadImageUrl(basePath + 'backgrounds/' + bgImage + '.jpg');
      return;
    }

    var basePath = window.__TEMPLATE_BASE_PATH__ || './';
    var url = basePath + 'backgrounds/' + bgImage + '.jpg';
    loadImageUrl(url);
  }

  function loadImageUrl(url) {
    var photoBg = document.getElementById('photoBg');
    if (!photoBg) return;

    photoBg.classList.add('loading');

    var img = new Image();
    img.onload = function() {
      photoBg.style.backgroundImage = 'url(' + img.src + ')';
      // Auto-extract panel tint from image
      if (window.extractPanelTint) {
        try {
          var tint = window.extractPanelTint(img);
          document.documentElement.style.setProperty('--panel-tint', tint);
        } catch(e) {}
      }
      requestAnimationFrame(function() { photoBg.classList.remove('loading'); });
    };
    img.onerror = function() {
      // Try .webp fallback
      var webpUrl = url.replace(/\.jpg$/, '.webp');
      var img2 = new Image();
      img2.onload = function() {
        photoBg.style.backgroundImage = 'url(' + img2.src + ')';
        if (window.extractPanelTint) {
          try {
            var tint = window.extractPanelTint(img2);
            document.documentElement.style.setProperty('--panel-tint', tint);
          } catch(e) {}
        }
        requestAnimationFrame(function() { photoBg.classList.remove('loading'); });
      };
      img2.onerror = function() {
        photoBg.classList.remove('loading'); // Fall back to CSS gradient
      };
      img2.src = webpUrl;
    };
    img.src = url;
  }

  // -- Render --
  function render() {
    var months = calculateMonths(params.birth_date);

    // Day vs month mode: ≤90 days shows days, >90 shows months
    var parts0 = params.birth_date.split('-').map(Number);
    var birthDate = new Date(parts0[0], parts0[1] - 1, parts0[2]);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diffDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) diffDays = 0;

    var useDaysMode = diffDays <= 90;

    if (useDaysMode) {
      document.getElementById('dayCounter').textContent = diffDays;
    } else {
      document.getElementById('dayCounter').textContent = months;
    }

    // Label text: random pick based on mode
    var labelEl = document.getElementById('labelText');
    if (labelEl) {
      labelEl.textContent = useDaysMode ? pickRandom(LABEL_DAYS) : pickRandom(LABEL_MONTHS);
    }

    // Subtitle: random copy based on baby_name
    document.getElementById('subtitle').textContent = makeCopy(params.baby_name);

    // Date format: "YYYY.MM.DD 出生"
    var parts = params.birth_date.split('-').map(Number);
    var birth = new Date(parts[0], parts[1] - 1, parts[2]);
    var fmt = function(d) {
      return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
    };
    document.getElementById('dateText').textContent = fmt(birth) + ' 出生';
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

    // Check month change every 60s
    setInterval(render, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
