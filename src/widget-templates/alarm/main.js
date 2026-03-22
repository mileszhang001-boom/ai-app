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

  // ── 闹钟设置浮层 ──
  var overlay = document.getElementById('alarmSettingOverlay');
  var timeInput = document.getElementById('alarmTimeInput');
  var confirmBtn = document.getElementById('alarmConfirmBtn');

  function showAlarmSetting() {
    if (!overlay || !timeInput) return;
    timeInput.value = params.alarm_time || '07:30';
    // 同步重复选项
    var btns = overlay.querySelectorAll('.repeat-btn');
    btns.forEach(function(b) {
      b.classList.toggle('selected', b.getAttribute('data-repeat') === params.repeat);
    });
    overlay.classList.add('visible');
  }

  function hideAlarmSetting() {
    if (overlay) overlay.classList.remove('visible');
  }

  function initAlarmSetting() {
    // 点击时间数字打开设置
    if (alarmTimeEl) {
      alarmTimeEl.style.cursor = 'pointer';
      alarmTimeEl.addEventListener('click', showAlarmSetting);
    }

    // 重复按钮切换
    if (overlay) {
      overlay.querySelectorAll('.repeat-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          overlay.querySelectorAll('.repeat-btn').forEach(function(b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
        });
      });
    }

    // 确认按钮
    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        var newTime = timeInput ? timeInput.value : params.alarm_time;
        var selectedRepeatBtn = overlay.querySelector('.repeat-btn.selected');
        var newRepeat = selectedRepeatBtn ? selectedRepeatBtn.getAttribute('data-repeat') : params.repeat;

        // 更新参数
        params.alarm_time = newTime;
        params.repeat = newRepeat;

        // 更新重复标签
        var repeatLabels = { weekdays: '工作日闹钟', daily: '每天闹钟', weekends: '周末闹钟', none: '单次闹钟' };
        params.label = repeatLabels[newRepeat] || params.label;

        // 刷新显示
        updateDisplay();
        hideAlarmSetting();

        // 通知车端
        if (window.AIWidgetBridge) {
          if (window.AIWidgetBridge.setAlarm) {
            window.AIWidgetBridge.setAlarm({ time: newTime, repeat: newRepeat });
          }
          if (window.AIWidgetBridge.storageSet) {
            window.AIWidgetBridge.storageSet('alarm_settings', JSON.stringify({
              alarm_time: newTime,
              repeat: newRepeat,
              label: params.label
            }));
          }
        }
      });
    }

    // 点击浮层背景关闭
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) hideAlarmSetting();
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

    // 尝试恢复持久化设定
    if (window.AIWidgetBridge && window.AIWidgetBridge.storageGet) {
      window.AIWidgetBridge.storageGet('alarm_settings').then(function(val) {
        if (val) {
          try {
            var saved = JSON.parse(val);
            if (saved.alarm_time) params.alarm_time = saved.alarm_time;
            if (saved.repeat) params.repeat = saved.repeat;
            if (saved.label) params.label = saved.label;
          } catch (e) {}
        }
        updateDisplay();
      }).catch(function() { updateDisplay(); });
    } else {
      updateDisplay();
    }

    // 初始化设置浮层
    initAlarmSetting();

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
