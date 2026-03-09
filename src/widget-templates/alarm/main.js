/**
 * 闹钟 · Ambient Light
 * 3 层信息卡片：时间 + 英文标注 + 中文说明
 */

(function() {
  'use strict';

  const params = window.__WIDGET_PARAMS__ || {
    alarm_time: '10:45',
    label: '工作日闹钟',
    repeat: 'weekdays'
  };

  const alarmTimeEl = document.getElementById('nextAlarmTime');
  const scheduleEl = document.getElementById('alarmSchedule');
  const labelEl = document.getElementById('alarmLabel');

  const REPEAT_LABELS = {
    none: 'once',
    weekdays: 'weekdays',
    weekends: 'weekends',
    daily: 'every day'
  };

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
    updateDisplay();

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
