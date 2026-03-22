/**
 * 恋爱纪念 · Liquid Glass Edition
 * 模式：正数（在一起第X天）
 * 特性：心形粒子 + 数字翻牌 + 里程碑感知
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
    const milestones = [100, 200, 365, 500, 520, 700, 730, 999, 1000, 1095, 1314, 1461];
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
    return map[milestone] || `第${milestone}天，特别的日子`;
  }

  // ── 文本内容更新 ──
  function updateSubtitle(days) {
    const subtitleEl = document.querySelector('.subtitle-cn');
    const captionEl = document.querySelector('.caption-cn');

    if (subtitleEl) {
      // 优先用户设置 > 里程碑文案 > 默认
      const milestoneText = getSubtitleForMilestone(days);
      subtitleEl.textContent = params.subtitle || milestoneText || '每一天都算数';
    }

    if (captionEl) {
      captionEl.textContent = '恋爱纪念日';
    }
  }

  // ── 数字翻牌动画 ──
  function flipNumber(targetValue) {
    if (currentValue === targetValue) return;

    digitGroup.classList.add('flip-out');

    setTimeout(() => {
      digitGroup.textContent = targetValue.toLocaleString();
      digitGroup.classList.remove('flip-out');
      digitGroup.classList.add('flip-in');
      currentValue = targetValue;

      setTimeout(() => {
        digitGroup.classList.remove('flip-in');
      }, 300);
    }, 300);
  }

  // ── 首次加载动画（数字递增） ──
  function animateInitial(targetValue) {
    const duration = 600;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const val = Math.floor(targetValue * easeOut);

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

  // ── 心形粒子系统 ──
  function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();

    // 获取当前主题色
    function getParticleColor() {
      const style = document.documentElement.getAttribute('data-style');
      const colorMap = {
        'vibrant-orange': [255, 140, 60],
        'ocean-blue': [0, 140, 220],
        'forest-green': [80, 200, 100],
        'sweet-pink': [255, 120, 150],
        'soft-purple': [160, 110, 255],
        'warm-yellow': [255, 200, 80],
        'minimal-dark': [255, 255, 255]
      };
      // dynamic color from color-engine
      if (style === 'dynamic' && window.computePalette) {
        var p = window.computePalette(window.__WIDGET_PARAMS__ && window.__WIDGET_PARAMS__.primary_color || '#CC2244');
        return p.particleRgb;
      }
      return colorMap[style] || [220, 140, 180];
    }

    // 心形路径公式
    function heartX(t) { return 16 * Math.pow(Math.sin(t), 3); }
    function heartY(t) { return -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)); }

    function createParticle() {
      const rgb = getParticleColor();
      const size = 6 + Math.random() * 9;
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
        isHeart: Math.random() < 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02
      };
    }

    function drawHeart(ctx, x, y, size, opacity, rgb) {
      ctx.save();
      ctx.translate(x, y);
      const scale = size / 18;
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      ctx.beginPath();
      for (let t = 0; t < Math.PI * 2; t += 0.05) {
        const hx = heartX(t);
        const hy = heartY(t);
        if (t === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawCircle(ctx, x, y, size, opacity, rgb) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
      ctx.fill();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 每帧有概率产生新粒子（保持在15-25个左右）
      if (particles.length < 20 && Math.random() < 0.08) {
        particles.push(createParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
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

        if (p.opacity <= 0 || p.life > p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        if (p.isHeart) {
          drawHeart(ctx, p.x, p.y, p.size * 2, p.opacity, p.rgb);
        } else {
          drawCircle(ctx, p.x, p.y, p.size, p.opacity, p.rgb);
        }
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
      window.AIWidgetBridge.getTheme().then(theme => {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(() => {
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

    const days = calculateDays(params.start_date);
    updateSubtitle(days);
    animateInitial(days);

    // 初始化粒子系统
    initParticles();

    // 每分钟检查一次（处理跨天 + 翻牌动效）
    setInterval(() => {
      const newDays = calculateDays(params.start_date);
      if (newDays !== currentValue) {
        updateSubtitle(newDays);
        flipNumber(newDays);
      }
    }, 60000);

    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.onThemeChange((theme) => {
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
