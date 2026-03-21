/**
 * 温暖纪念 · Liquid Glass Edition
 * 模式：正数（温暖相伴第X天）
 * 特性：萤火虫粒子 + 数字翻牌 + 里程碑感知
 */

(function() {
  'use strict';

  const params = window.__WIDGET_PARAMS__ || {
    title: '温暖相伴的第___天',
    start_date: '2024-03-07',
    subtitle: '温暖相伴的每一天'
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
    const milestones = [100, 200, 365, 500, 700, 730, 999, 1000, 1095, 1461];
    if (milestones.includes(days)) return days;
    // 整百天
    if (days > 0 && days % 100 === 0) return days;
    // 整年
    if (days > 0 && days % 365 === 0) return days;
    return null;
  }

  function getSubtitleForMilestone(days) {
    var milestone = getMilestone(days);
    if (!milestone) return null;
    var map = {
      100: '一百天的温暖，刚刚开始',
      200: '两百天，温度从未消退',
      365: '一整年，四季都有你',
      500: '五百天，日积月累的暖意',
      700: '七百天，默契已成习惯',
      730: '两年了，温暖一直都在',
      999: '九九九天，长长久久的陪伴',
      1000: '一千天，三年的温暖旅程',
      1095: '三年整，最温暖的时光',
      1461: '四年了，每一天都值得'
    };
    return map[milestone] || '第' + milestone + '天，温暖依旧';
  }

  // ── 文本内容更新 ──
  function updateSubtitle(days) {
    var subtitleEl = document.querySelector('.subtitle-cn');
    var captionEl = document.querySelector('.caption-cn');

    if (subtitleEl) {
      var milestoneText = getSubtitleForMilestone(days);
      subtitleEl.textContent = params.subtitle || milestoneText || '温暖相伴的每一天';
    }

    if (captionEl) {
      captionEl.textContent = '纪念日 · 温暖回忆';
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

  // ── 萤火虫粒子系统（Warm Glow / Firefly） ──
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

    // 萤火虫暖色色板
    var warmColors = [
      [255, 140, 60],   // 琥珀橙
      [255, 180, 80],   // 暖金
      [255, 160, 50],   // 深琥珀
      [255, 200, 100],  // 浅暖黄
      [255, 120, 40]    // 焦橙
    ];

    // dynamic color override
    var dynParams = window.__WIDGET_PARAMS__ || {};
    if (dynParams.primary_color && window.computePalette) {
      var pal = window.computePalette(dynParams.primary_color);
      var rgb = pal.particleRgb;
      warmColors = [
        rgb,
        [Math.min(255, rgb[0]+40), Math.min(255, rgb[1]+40), rgb[2]],
        [Math.max(0, rgb[0]-20), rgb[1], Math.max(0, rgb[2]-20)],
        [Math.min(255, rgb[0]+60), Math.min(255, rgb[1]+60), Math.min(255, rgb[2]+20)],
        [Math.max(0, rgb[0]-40), Math.max(0, rgb[1]-20), rgb[2]]
      ];
    }

    function randomColor() {
      return warmColors[Math.floor(Math.random() * warmColors.length)];
    }

    function createParticle() {
      var rgb = randomColor();
      var size = 2 + Math.random() * 4;
      return {
        x: Math.random() * canvas.width,
        y: canvas.height * 0.2 + Math.random() * canvas.height * 0.7,
        size: size,
        baseSize: size,
        // 萤火虫：缓慢随机漂移，不像心形那样统一上升
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: 0,
        targetOpacity: 0.12 + Math.random() * 0.28,
        phase: 'fadeIn',  // fadeIn -> glow -> fadeOut
        life: 0,
        maxLife: 400 + Math.random() * 500,
        rgb: rgb,
        // 呼吸节奏：每颗萤火虫有自己的呼吸周期
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.015 + Math.random() * 0.025,
        // 横向飘动
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.012,
        wobbleAmp: 0.4 + Math.random() * 0.6,
        // 光晕半径（萤火虫特有的柔光圈）
        glowRadius: size * (2.5 + Math.random() * 1.5)
      };
    }

    function drawFirefly(p) {
      // 外圈柔光（模拟萤火虫光晕）
      var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glowRadius);
      gradient.addColorStop(0, 'rgba(' + p.rgb[0] + ', ' + p.rgb[1] + ', ' + p.rgb[2] + ', ' + (p.opacity * 0.4) + ')');
      gradient.addColorStop(0.4, 'rgba(' + p.rgb[0] + ', ' + p.rgb[1] + ', ' + p.rgb[2] + ', ' + (p.opacity * 0.15) + ')');
      gradient.addColorStop(1, 'rgba(' + p.rgb[0] + ', ' + p.rgb[1] + ', ' + p.rgb[2] + ', 0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // 核心亮点
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.rgb[0] + ', ' + p.rgb[1] + ', ' + p.rgb[2] + ', ' + p.opacity + ')';
      ctx.fill();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 控制萤火虫数量在 12-18 之间
      if (particles.length < 15 && Math.random() < 0.05) {
        particles.push(createParticle());
      }

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life++;

        // 呼吸效果：萤火虫的亮度周期性变化
        p.breathPhase += p.breathSpeed;
        var breathFactor = 0.6 + 0.4 * Math.sin(p.breathPhase);
        p.size = p.baseSize * (0.8 + 0.2 * breathFactor);

        // 生命周期：淡入 → 发光 → 淡出
        if (p.phase === 'fadeIn') {
          p.opacity += 0.008;
          if (p.opacity >= p.targetOpacity) {
            p.opacity = p.targetOpacity;
            p.phase = 'glow';
          }
        } else if (p.phase === 'glow') {
          // 动态亮度由呼吸控制
          p.opacity = p.targetOpacity * breathFactor;
          if (p.life > p.maxLife * 0.7) {
            p.phase = 'fadeOut';
          }
        } else if (p.phase === 'fadeOut') {
          p.opacity -= 0.004;
        }

        // 缓慢漂移 + 横向轻摆
        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmp;
        p.y += p.speedY + Math.cos(p.wobble * 0.7) * 0.15;

        // 移除已消亡的粒子
        if (p.opacity <= 0 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        drawFirefly(p);
      }

      animId = requestAnimationFrame(animate);
    }

    animate();

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

    var days = calculateDays(params.start_date);
    updateSubtitle(days);
    animateInitial(days);

    // 初始化萤火虫粒子系统
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
