/**
 * 放假倒计时 · Liquid Glass Edition
 * 模式：倒数（距离假期还有X天）
 * 特性：彩纸粒子 + 数字翻牌 + 倒计时里程碑感知
 */

(function() {
  'use strict';

  const params = window.__WIDGET_PARAMS__ || {
    target_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    subtitle: ''
  };

  const digitGroup = document.getElementById('digitGroup');
  let currentValue = -1;

  // ── 计算倒计时（本地时区安全）──
  function calculateCountdown(targetDate) {
    const parts = targetDate.split('-').map(Number);
    const target = new Date(parts[0], parts[1] - 1, parts[2]);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { days: Math.max(days, 0), isOverdue: days <= 0 };
  }

  // ── 倒计时里程碑检测 ──
  function getMilestone(days) {
    const milestones = [0, 1, 3, 7, 14, 30, 60, 90, 100];
    if (milestones.includes(days)) return days;
    return null;
  }

  function getSubtitleForMilestone(days) {
    const milestone = getMilestone(days);
    if (milestone === null) return null;
    const map = {
      0: '假期到了！尽情享受吧',
      1: '明天就放假啦！',
      3: '还有3天，倒计时开始',
      7: '一周后就是假期了',
      14: '两周倒计时，准备出发',
      30: '一个月后，假期在等你',
      60: '两个月，假期在向你招手',
      90: '三个月，好事值得等待',
      100: '还有100天，做个计划吧'
    };
    return map[milestone] || null;
  }

  // ── 文本内容更新 ──
  function updateSubtitle(days) {
    const subtitleEl = document.querySelector('.subtitle-cn');
    const captionEl = document.querySelector('.caption-cn');

    if (subtitleEl) {
      const milestoneText = getSubtitleForMilestone(days);
      subtitleEl.textContent = params.subtitle || milestoneText || '假期在向你招手';
    }

    if (captionEl) {
      if (params.title) {
        captionEl.textContent = params.title + ' · 放假倒计时';
      } else {
        captionEl.textContent = '放假倒计时';
      }
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

  // ── 首次加载动画（数字递增）──
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

  // ── 彩纸/闪光粒子系统 ──
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
    function getParticleColors() {
      const style = document.documentElement.getAttribute('data-style');
      const colorMap = {
        'vibrant-orange': [[255, 140, 60], [255, 180, 100], [255, 106, 0]],
        'ocean-blue':     [[0, 140, 220], [0, 180, 255], [100, 200, 255]],
        'forest-green':   [[80, 200, 100], [100, 220, 120], [60, 180, 80]],
        'sweet-pink':     [[255, 120, 150], [255, 180, 200], [255, 107, 157]],
        'soft-purple':    [[160, 110, 255], [179, 136, 255], [200, 170, 255]],
        'warm-yellow':    [[255, 200, 80], [255, 214, 0], [255, 180, 40]],
        'minimal-dark':   [[255, 255, 255], [200, 200, 200], [180, 180, 180]]
      };
      if (style === 'dynamic' && window.computePalette) {
        var p = window.computePalette(window.__WIDGET_PARAMS__ && window.__WIDGET_PARAMS__.primary_color || '#CC2244');
        var rgb = p.particleRgb;
        return [rgb, [rgb[0], Math.min(255, rgb[1]+40), Math.min(255, rgb[2]+40)], [Math.max(0, rgb[0]-20), rgb[1], rgb[2]]];
      }
      return colorMap[style] || [[80, 200, 120], [120, 220, 160], [60, 180, 100]];
    }

    // 彩纸形状类型：矩形条/方形/菱形
    function createParticle() {
      const colors = getParticleColors();
      const rgb = colors[Math.floor(Math.random() * colors.length)];
      const shapeType = Math.random();
      let shape;
      if (shapeType < 0.4) shape = 'rect';        // 矩形彩纸条
      else if (shapeType < 0.7) shape = 'diamond'; // 菱形
      else shape = 'sparkle';                       // 闪光点

      return {
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 40,
        size: shape === 'sparkle' ? (1.5 + Math.random() * 2.5) : (3 + Math.random() * 5),
        speedY: 0.4 + Math.random() * 0.8,
        speedX: (Math.random() - 0.5) * 0.6,
        opacity: 0,
        targetOpacity: 0.12 + Math.random() * 0.22,
        fadeIn: true,
        life: 0,
        maxLife: 350 + Math.random() * 400,
        rgb: rgb,
        shape: shape,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.015,
        aspect: 1.5 + Math.random() * 2  // 矩形长宽比
      };
    }

    function drawRect(ctx, p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = `rgb(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]})`;
      const w = p.size * p.aspect;
      const h = p.size;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    function drawDiamond(ctx, p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = `rgb(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]})`;
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawSparkle(ctx, p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${p.opacity})`;
      ctx.fill();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 每帧有概率产生新粒子（保持在15-25个左右）
      if (particles.length < 22 && Math.random() < 0.07) {
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

        // 横向轻微摆动 + 旋转
        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * 0.4;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.opacity <= 0 || p.life > p.maxLife || p.y > canvas.height + 30) {
          particles.splice(i, 1);
          continue;
        }

        if (p.shape === 'rect') {
          drawRect(ctx, p);
        } else if (p.shape === 'diamond') {
          drawDiamond(ctx, p);
        } else {
          drawSparkle(ctx, p);
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

    const countdown = calculateCountdown(params.target_date);
    updateSubtitle(countdown.days);
    animateInitial(countdown.days);

    // 初始化粒子系统
    initParticles();

    // 每分钟检查一次（处理跨天 + 翻牌动效）
    setInterval(() => {
      const newCountdown = calculateCountdown(params.target_date);
      if (newCountdown.days !== currentValue) {
        updateSubtitle(newCountdown.days);
        flipNumber(newCountdown.days);
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
