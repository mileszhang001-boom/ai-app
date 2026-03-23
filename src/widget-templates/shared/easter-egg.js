/**
 * Easter Egg — 彩蛋粒子引擎
 * love: 爱心 / baby: 星星玩具 / holiday: 礼花彩纸
 * triggerEasterEgg(canvas, x, y, type)
 * drawEasterEggFrame(ctx)
 * ~3.5KB
 */

(function() {
  'use strict';

  var POOL_SIZE = 12;
  var COOLDOWN = 2000;
  var lastTrigger = 0;
  var particles = [];
  var animating = false;
  var rafId = null;
  var activeCanvas = null;

  // 预分配粒子池（v2.0 缩减到 12，微动效风格）
  for (var i = 0; i < POOL_SIZE; i++) {
    particles.push({ active: false });
  }

  // ── 形状绘制 ──

  function heartX(t) { return 16 * Math.pow(Math.sin(t), 3); }
  function heartY(t) { return -(13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)); }

  function drawHeart(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    var scale = p.size / 18;
    ctx.scale(scale, scale);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (var t = 0; t < Math.PI * 2; t += 0.1) {
      var hx = heartX(t);
      var hy = heartY(t);
      if (t === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    var spikes = 5, outerR = p.size, innerR = p.size * 0.4;
    for (var i = 0; i < spikes * 2; i++) {
      var r = i % 2 === 0 ? outerR : innerR;
      var angle = (i * Math.PI / spikes) - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawConfetti(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation || 0);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    // 矩形彩纸
    ctx.fillRect(-p.size * 0.6, -p.size * 0.3, p.size * 1.2, p.size * 0.6);
    ctx.restore();
  }

  function drawSparkle(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    // 十字闪光
    var s = p.size * 0.4;
    ctx.fillRect(-s, -1, s * 2, 2);
    ctx.fillRect(-1, -s, 2, s * 2);
    ctx.restore();
  }

  // ── 粒子生成配置 ──

  var LOVE_COLORS = ['#FF6B8A', '#FF4D6D', '#FF8FA3', '#FB6F92', '#FF85A1'];
  var BABY_COLORS = ['#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F9A8D4'];
  var HOLIDAY_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8E53', '#C77DFF'];

  function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function initLoveParticle(p, x, y) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 2 + Math.random() * 4;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 3; // 偏向上浮
    p.gravity = 0.02;
    p.size = 4 + Math.random() * 6;
    p.opacity = 0.85;
    p.rotation = (Math.random() - 0.5) * 0.5;
    p.rotSpeed = (Math.random() - 0.5) * 0.05;
    p.color = randomColor(LOVE_COLORS);
    p.life = 0;
    p.maxLife = 40 + Math.random() * 25;
    p.type = 'heart';
    p.active = true;
  }

  function initBabyParticle(p, x, y) {
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    var speed = 3 + Math.random() * 5;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.gravity = 0.12; // 更强重力
    p.size = 4 + Math.random() * 6;
    p.opacity = 0.85;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.1;
    p.color = randomColor(BABY_COLORS);
    p.life = 0;
    p.maxLife = 50 + Math.random() * 30;
    p.type = Math.random() < 0.5 ? 'star' : 'circle';
    p.bounce = 0.4; // 弹跳系数
    p.groundY = y + 100 + Math.random() * 200;
    p.active = true;
  }

  function initHolidayParticle(p, x, y) {
    // 扇形喷射
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
    var speed = 5 + Math.random() * 8;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.gravity = 0.1;
    p.size = 3 + Math.random() * 6;
    p.opacity = 0.9;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 0.15;
    p.color = randomColor(HOLIDAY_COLORS);
    p.life = 0;
    p.maxLife = 45 + Math.random() * 30;
    p.type = Math.random() < 0.3 ? 'sparkle' : 'confetti';
    p.drift = (Math.random() - 0.5) * 0.08; // 左右摆动
    p.active = true;
  }

  // ── 更新与绘制 ──

  function updateParticle(p) {
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.rotSpeed || 0;

    // 阻力
    p.vx *= 0.98;

    // 横向飘动（holiday）
    if (p.drift) p.vx += Math.sin(p.life * 0.1) * p.drift;

    // 弹跳（baby）
    if (p.bounce && p.y > p.groundY && p.vy > 0) {
      p.vy = -p.vy * p.bounce;
      p.y = p.groundY;
      p.bounce *= 0.5;
    }

    // 淡出
    var fadeStart = p.maxLife * 0.35;
    if (p.life > fadeStart) {
      p.opacity = Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart));
    }

    if (p.life >= p.maxLife) {
      p.active = false;
    }
  }

  function drawParticle(ctx, p) {
    if (!p.active || p.opacity <= 0) return;
    switch (p.type) {
      case 'heart': drawHeart(ctx, p); break;
      case 'star': drawStar(ctx, p); break;
      case 'confetti': drawConfetti(ctx, p); break;
      case 'sparkle': drawSparkle(ctx, p); break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
    }
  }

  // ── 公共 API ──

  /**
   * 触发彩蛋粒子
   * @param {HTMLCanvasElement} canvas
   * @param {number} x - 点击 x（相对 canvas）
   * @param {number} y - 点击 y（相对 canvas）
   * @param {string} type - 'love' | 'baby' | 'holiday'
   */
  function triggerEasterEgg(canvas, x, y, type) {
    var now = Date.now();
    if (now - lastTrigger < COOLDOWN) return;
    lastTrigger = now;

    activeCanvas = canvas;
    var count = 5 + Math.floor(Math.random() * 4); // 5-8 微动效
    var inits = { love: initLoveParticle, baby: initBabyParticle, holiday: initHolidayParticle };
    var initFn = inits[type] || inits.love;

    var spawned = 0;
    for (var i = 0; i < POOL_SIZE && spawned < count; i++) {
      if (!particles[i].active) {
        initFn(particles[i], x, y);
        spawned++;
      }
    }

    // 如果没有集成到模板的 animate 循环，启动独立 rAF
    if (!animating) {
      animating = true;
      runLoop();
    }
  }

  /**
   * 在模板的 animate 循环中调用此函数绘制彩蛋粒子
   * 如果模板调用了此函数，独立 rAF 循环不会启动
   */
  function drawEasterEggFrame(ctx) {
    var anyActive = false;
    for (var i = 0; i < POOL_SIZE; i++) {
      if (particles[i].active) {
        updateParticle(particles[i]);
        drawParticle(ctx, particles[i]);
        anyActive = true;
      }
    }
    // 标记为外部驱动，停止独立循环
    animating = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    return anyActive;
  }

  // 独立 rAF 循环（当模板未集成时使用）
  function runLoop() {
    if (!animating || !activeCanvas) return;
    var ctx = activeCanvas.getContext('2d');
    var anyActive = false;

    for (var i = 0; i < POOL_SIZE; i++) {
      if (particles[i].active) {
        updateParticle(particles[i]);
        drawParticle(ctx, particles[i]);
        anyActive = true;
      }
    }

    if (anyActive) {
      rafId = requestAnimationFrame(runLoop);
    } else {
      animating = false;
      rafId = null;
    }
  }

  window.triggerEasterEgg = triggerEasterEgg;
  window.drawEasterEggFrame = drawEasterEggFrame;
})();
