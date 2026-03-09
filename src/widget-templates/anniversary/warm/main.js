/**
 * 温暖纪念 · Ambient Light
 * 模式：正数（第X天）
 */

(function() {
  'use strict';

  // 模板参数（由模板引擎注入）
  const params = window.__WIDGET_PARAMS__ || {
    title: '温暖相伴的第___天',
    start_date: '2024-03-07',
    subtitle: '温暖相伴的每一天'
  };

  // DOM 元素
  const dayCounter = document.getElementById('dayCounter');

  // 计算天数
  function calculateDays(startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diff = now - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return days >= 0 ? days : 0;
  }

  // 更新文本内容
  function updateText() {
    const subtitleEl = document.querySelector('.subtitle-cn');
    const captionEl = document.querySelector('.caption-cn');

    if (subtitleEl && params.subtitle) {
      subtitleEl.textContent = params.subtitle;
    }

    if (captionEl && params.title) {
      captionEl.textContent = params.title + ' · 温暖纪念';
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

      // easeOutQuad 缓动 - 更柔和
      const easeOut = 1 - (1 - progress) * (1 - progress);
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
    const days = calculateDays(params.start_date);
    animateNumber(dayCounter, days);
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

  // 初始化
  function init() {
    applyTheme();
    updateText();
    updateDisplay();

    // 每分钟更新一次（处理跨天）
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
