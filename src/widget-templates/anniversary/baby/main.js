/**
 * 宝宝成长 · Liquid Glass Edition
 * 模式：正数（出生第X天）
 * 特性：星星粒子 + 数字翻牌 + 里程碑感知
 */

(function() {
  'use strict';

  const params = window.__WIDGET_PARAMS__ || {
    start_date: new Date().toISOString().slice(0, 10),
    subtitle: ''
  };

  const digitGroup = document.getElementById('digitGroup');
  let currentValue = 0;

  // ── 计算天数（本地时区安全）──
  function calculateDays(startDate) {
    const parts = startDate.split('-').map(Number);
    const start = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 0;
  }

  // ── 里程碑检测 ──
  function getMilestone(days) {
    const milestones = [7, 30, 42, 100, 180, 200, 300, 365, 500, 600, 700, 730, 900, 999, 1000, 1095, 1461];
    if (milestones.includes(days)) return days;
    // 整百天
    if (days > 0 && days % 100 === 0) return days;
    // 整年
    if (days > 0 && days % 365 === 0) return days;
    return null;
  }

  function getSubtitleForMilestone(days) {
    const milestone = getMilestone(days);
    if (!milestone) return null;
    const map = {
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

  // ── 文本内容更新 ──
  function updateSubtitle(days) {
    const subtitleEl = document.querySelector('.subtitle-cn');
    const captionEl = document.querySelector('.caption-cn');

    if (subtitleEl) {
      // 优先用户设置 > 里程碑文案 > 默认
      const milestoneText = getSubtitleForMilestone(days);
      subtitleEl.textContent = params.subtitle || milestoneText || '每一天都是新的奇迹';
    }

    if (captionEl) {
      captionEl.textContent = '宝宝成长 · 纪念日';
    }
  }

  // ── 数字翻牌动画 ──
  function flipNumber(targetValue) {
    if (currentValue === targetValue) return;

    digitGroup.classList.add('flip-out');

    setTimeout(function() {
      digitGroup.textContent = targetValue.toLocaleString();
      digitGroup.classList.remove('flip-out');
      digitGroup.classList.add('flip-in');
      currentValue = targetValue;

      setTimeout(function() {
        digitGroup.classList.remove('flip-in');
      }, 300);
    }, 300);
  }

  // ── 首次加载动画（数字递增） ──
  function animateInitial(targetValue) {
    var duration = 600;
    var startTime = performance.now();

    function update(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easeOut = 1 - Math.pow(1 - progress, 3);
      var val = Math.floor(targetValue * easeOut);

      digitGroup.textContent = val.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        digitGroup.textContent = targetValue.toLocaleString();
        currentValue = targetValue;
      }
    }

    requestAnimationFrame(update);
  }

  // ── 背景图加载 ──
  function loadBackgroundImage() {
    var bgImage = params.background_image;
    if (!bgImage) return;
    var photoBg = document.getElementById('photoBg');
    if (!photoBg) return;

    // Build URL - images are in ./backgrounds/ directory
    var url = './backgrounds/' + bgImage + '.webp';

    var img = new Image();
    img.onload = function() {
      photoBg.style.backgroundImage = 'url(' + url + ')';
      photoBg.style.backgroundSize = 'cover';
      photoBg.style.backgroundPosition = 'center';
      photoBg.style.opacity = '0.4';
    };
    img.onerror = function() {
      // Fallback: try jpg
      photoBg.style.backgroundImage = 'url(./backgrounds/' + bgImage + '.jpg)';
      photoBg.style.backgroundSize = 'cover';
      photoBg.style.backgroundPosition = 'center';
      photoBg.style.opacity = '0.4';
    };
    img.src = url;
  }

  // ── 星星粒子系统 ──
  function initParticles() {
    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var particles = [];
    var animId;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    // 获取当前主题色
    function getParticleColor() {
      var style = document.documentElement.getAttribute('data-style');
      var colorMap = {
        'vibrant-orange': [255, 140, 60],
        'ocean-blue': [0, 140, 220],
        'forest-green': [80, 200, 100],
        'sweet-pink': [255, 120, 150],
        'soft-purple': [160, 110, 255],
        'warm-yellow': [255, 200, 80]
      };
      // dynamic color from color-engine
      if (style === 'dynamic' && window.computePalette) {
        var p = window.computePalette(window.__WIDGET_PARAMS__ && window.__WIDGET_PARAMS__.primary_color || '#CC2244');
        return p.particleRgb;
      }
      return colorMap[style] || [140, 180, 255]; // 默认靛蓝
    }

    // 星星路径：五角星
    function drawStar(ctx, x, y, size, opacity, rgb) {
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';

      var spikes = 5;
      var outerR = size;
      var innerR = size * 0.4;
      var rot = Math.PI / 2 * 3;
      var step = Math.PI / spikes;

      ctx.beginPath();
      for (var i = 0; i < spikes; i++) {
        var xOuter = Math.cos(rot) * outerR;
        var yOuter = Math.sin(rot) * outerR;
        ctx.lineTo(xOuter, yOuter);
        rot += step;
        var xInner = Math.cos(rot) * innerR;
        var yInner = Math.sin(rot) * innerR;
        ctx.lineTo(xInner, yInner);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawCircle(ctx, x, y, size, opacity, rgb) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + opacity + ')';
      ctx.fill();
    }

    function createParticle() {
      var rgb = getParticleColor();
      var size = 6 + Math.random() * 9;
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 60,
        size: size,
        speedY: -(0.9 + Math.random() * 1.5),
        speedX: (Math.random() - 0.5) * 0.9,
        opacity: 0,
        targetOpacity: 0.15 + Math.random() * 0.25,
        fadeIn: true,
        life: 0,
        maxLife: 300 + Math.random() * 400,
        rgb: rgb,
        isStar: Math.random() < 0.35,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      };
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 每帧有概率产生新粒子（保持在15-25个左右）
      if (particles.length < 20 && Math.random() < 0.08) {
        particles.push(createParticle());
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life++;

        // 缓慢淡入
        if (p.fadeIn) {
          p.opacity += 0.005;
          if (p.opacity >= p.targetOpacity) {
            p.fadeIn = false;
          }
        }

        // 生命末期淡出
        if (p.life > p.maxLife * 0.7) {
          p.opacity -= 0.003;
        }

        // 横向轻微摆动
        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * 0.9;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.opacity <= 0 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        if (p.isStar) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.translate(-p.x, -p.y);
          drawStar(ctx, p.x, p.y, p.size * 1.8, p.opacity, p.rgb);
          ctx.restore();
        } else {
          drawCircle(ctx, p.x, p.y, p.size, p.opacity, p.rgb);
        }
      }

      // Easter egg particle rendering
      if (window.drawEasterEggFrame) window.drawEasterEggFrame(ctx);

      animId = requestAnimationFrame(animate);
    }

    animate();

    // ── Easter egg click handler ──
    var widgetRoot = document.querySelector('.widget-baby');
    if (widgetRoot) {
      widgetRoot.addEventListener('click', function(e) {
        if (window.triggerEasterEgg) {
          var rect = canvas.getBoundingClientRect();
          var x = (e.clientX - rect.left) * (canvas.width / rect.width);
          var y = (e.clientY - rect.top) * (canvas.height / rect.height);
          window.triggerEasterEgg(canvas, x, y, 'baby');
        }
      });
    }

    // 响应窗口大小变化
    window.addEventListener('resize', resize);
  }

  // ── 主题应用 ──
  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  // ── 初始化 ──
  function init() {
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

    // ── 照片氛围背景 ──
    if (params.bg_photo) {
      var photoBg = document.getElementById('photoBg');
      if (photoBg) {
        photoBg.style.backgroundImage = 'url(' + params.bg_photo + ')';
      }
    }

    // ── 预设背景图 ──
    loadBackgroundImage();

    var days = calculateDays(params.start_date);
    updateSubtitle(days);
    animateInitial(days);

    // 初始化粒子系统
    initParticles();

    // 每分钟检查一次（处理跨天 + 翻牌动效）
    setInterval(function() {
      var newDays = calculateDays(params.start_date);
      if (newDays !== currentValue) {
        updateSubtitle(newDays);
        flipNumber(newDays);
      }
    }, 60000);

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
