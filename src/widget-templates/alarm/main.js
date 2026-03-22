/**
 * 闹钟 · Liquid Glass Edition
 * 进度环 + 实时倒计时 + 日夜感知
 */

(function() {
  'use strict';

  const params = window.__WIDGET_PARAMS__ || {
    alarm_time: '07:30',
    label: '工作日闹钟',
    repeat: 'weekdays'
  };

  const alarmTimeEl = document.getElementById('nextAlarmTime');
  const scheduleEl = document.getElementById('alarmSchedule');
  const labelEl = document.getElementById('alarmLabel');
  const ringProgress = document.getElementById('ringProgress');
  const timeRemainingEl = document.getElementById('timeRemaining');
  const currentTimeEl = document.getElementById('currentTime');

  const REPEAT_LABELS = {
    none: 'ONCE',
    weekdays: 'WEEKDAYS',
    weekends: 'WEEKENDS',
    daily: 'EVERY DAY'
  };

  // 环的周长 (2 * PI * r, r=88 in SVG viewBox units)
  const CIRCUMFERENCE = 2 * Math.PI * 88; // ~553

  function parseAlarmTime(timeStr) {
    const parts = timeStr.split(':').map(Number);
    return { hours: parts[0] || 0, minutes: parts[1] || 0 };
  }

  // 计算距下一次闹钟的秒数
  function getSecondsUntilAlarm() {
    const alarm = parseAlarmTime(params.alarm_time);
    const now = new Date();
    const alarmToday = new Date(now);
    alarmToday.setHours(alarm.hours, alarm.minutes, 0, 0);

    let diff = alarmToday - now;
    if (diff <= 0) {
      // 闹钟已过，算到明天
      diff += 24 * 60 * 60 * 1000;
    }
    return Math.floor(diff / 1000);
  }

  // 更新进度环
  function updateRing() {
    const secondsLeft = getSecondsUntilAlarm();
    const totalSeconds = 24 * 60 * 60;
    const progress = 1 - (secondsLeft / totalSeconds);
    const offset = CIRCUMFERENCE * (1 - progress);

    if (ringProgress) {
      ringProgress.style.strokeDasharray = CIRCUMFERENCE;
      ringProgress.style.strokeDashoffset = offset;
    }
  }

  // 格式化剩余时间
  function formatRemaining(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return h + '小时' + m + '分钟后';
    }
    return m + '分钟后';
  }

  // 更新当前时间显示
  function updateCurrentTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (currentTimeEl) {
      currentTimeEl.textContent = h + ':' + m;
    }
  }

  // 日夜感知
  function updateDayNight() {
    const hour = new Date().getHours();
    const isDay = hour >= 6 && hour < 18;
    document.querySelector('.widget-alarm').setAttribute('data-time', isDay ? 'day' : 'night');
  }

  function updateDisplay() {
    if (alarmTimeEl && params.alarm_time) {
      alarmTimeEl.textContent = params.alarm_time;
    }

    if (scheduleEl) {
      scheduleEl.textContent = REPEAT_LABELS[params.repeat] || REPEAT_LABELS.weekdays;
    }

    if (labelEl && params.label) {
      labelEl.textContent = params.label;
    }

    // 更新剩余时间
    const secondsLeft = getSecondsUntilAlarm();
    if (timeRemainingEl) {
      timeRemainingEl.textContent = formatRemaining(secondsLeft);
    }

    // 更新进度环
    updateRing();

    // 更新当前时间
    updateCurrentTime();

    // 日夜感知
    updateDayNight();
  }

  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

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

    updateDisplay();

    // 每分钟更新
    setInterval(updateDisplay, 60000);

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
