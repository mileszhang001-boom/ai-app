/**
 * 放假倒计时 · Ambient Light
 * 模式：倒数（距离假期还有X天）
 */

(function() {
  'use strict';

  // 模板参数（由模板引擎注入）
  const params = window.__WIDGET_PARAMS__ || {
    target_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),  // 默认使用明天（倒计时）
    subtitle: ''
  };

  // DOM 元素
  const dayCounter = document.getElementById('dayCounter');

  // 计算倒计时（本地时区安全，基于日期差）
  function calculateCountdown(targetDate) {
    const parts = targetDate.split('-').map(Number);
    const target = new Date(parts[0], parts[1] - 1, parts[2]);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diff = target - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return { days: 0, isOverdue: true };
    }

    return { days, isOverdue: false };
  }

  // 更新副标题和辅助信息
  function updateSubtitle() {
    const subtitleEl = document.querySelector('.subtitle-cn');
    const captionEl = document.querySelector('.caption-cn');

    // 设置副标题，使用用户提供的或默认值
    if (subtitleEl) {
      const defaultSubtitle = '假期在向你招手';
      subtitleEl.textContent = params.subtitle || defaultSubtitle;
    }

    if (captionEl && params.title) {
      captionEl.textContent = params.title + ' · 放假倒计时';
    } else if (captionEl) {
      captionEl.textContent = '放假倒计时';
    }
  }

  // 动画更新数字
  function animateNumber(element, targetValue) {
    const duration = 500;
    const startValue = parseInt(element.textContent) || 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic 缓动
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

      element.textContent = currentValue.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    element.classList.add('updating');
    requestAnimationFrame(update);

    setTimeout(() => {
      element.classList.remove('updating');
    }, duration);
  }

  // 更新显示
  function updateDisplay() {
    const countdown = calculateCountdown(params.target_date);

    // 永远显示数字，不显示"已开始"等文字
    animateNumber(dayCounter, countdown.days);
  }

  // 应用主题
  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(theme => {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(() => {
        // 默认暗色主题
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  function init() {
    applyTheme();
    if (params.style_preset) {
      document.documentElement.setAttribute('data-style', params.style_preset);
    }
    updateSubtitle();
    updateDisplay();

    // 每分钟更新一次
    setInterval(updateDisplay, 60000);

    // 监听主题变化
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.onThemeChange((theme) => {
        document.documentElement.setAttribute('data-theme', theme.mode);
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
