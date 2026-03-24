/**
 * 闹钟卡片 · Clean Dark
 *
 * List view with section grouping, toggle, swipe-to-delete, countdown.
 * Color: computePalette(accent, 'clean') → --dyn-accent
 * Data: MOCK alarms, persisted via WidgetStorage('alarms')
 */

(function () {
  'use strict';

  // ── MOCK alarm data ──
  var MOCK_ALARMS = [
    { time: '07:30', label: '起床', group: 'routine', repeat: '工作日', enabled: true },
    { time: '08:00', label: '出门', group: 'routine', repeat: '工作日', enabled: true },
    { time: '12:00', label: '午休提醒', group: 'other', repeat: '每天', enabled: false }
  ];

  // ── DOM refs ──
  var $root = document.getElementById('widget-root');
  var $countdown = document.getElementById('countdownText');
  var $list = document.getElementById('alarmList');
  var $clockView = document.getElementById('clockView');
  var $fab = document.getElementById('fabAdd');
  var $viewToggle = document.getElementById('viewToggle');

  // ── Params from host ──
  var params = window.__WIDGET_PARAMS__ || {};
  var accentHex = params.accent_color || '#4ADE80';
  var defaultView = params.default_view || 'list'; // 'list' or 'clock'

  // ── Storage ──
  var storage = new WidgetStorage('alarms');

  // ── State ──
  var alarms = [];
  var swipedId = null; // currently swiped-open row id
  var currentView = defaultView; // 'list' or 'clock'
  var clockInterval = null;

  // ── Color engine: clean mode ──
  function applyAccent(hex) {
    if (typeof window.computePalette === 'function') {
      var palette = window.computePalette(hex, 'clean');
      var vars = palette.cssVars || {};
      var root = document.documentElement;
      for (var k in vars) {
        if (vars.hasOwnProperty(k)) root.style.setProperty(k, vars[k]);
      }
    }
    // Also set raw accent for toggle/fab
    document.documentElement.style.setProperty('--dyn-accent', hex);
  }

  // ── Load alarms (storage first, then seed with mock) ──
  function loadAlarms() {
    storage.seed(MOCK_ALARMS);
    alarms = storage.getAll();
  }

  // ── Save alarms to storage ──
  function saveAlarms() {
    // Clear and re-write all
    storage.clear();
    for (var i = 0; i < alarms.length; i++) {
      storage.add(alarms[i]);
    }
  }

  // ── Group alarms by section ──
  function groupAlarms() {
    var routine = [];
    var other = [];
    for (var i = 0; i < alarms.length; i++) {
      if (alarms[i].group === 'routine') {
        routine.push(alarms[i]);
      } else {
        other.push(alarms[i]);
      }
    }
    return { routine: routine, other: other };
  }

  // ── Sort alarms by time within each group ──
  function sortByTime(arr) {
    return arr.sort(function (a, b) {
      return a.time.localeCompare(b.time);
    });
  }

  // ── Render entire list ──
  function render() {
    var groups = groupAlarms();
    var html = '';

    // Routine section
    if (groups.routine.length > 0) {
      html += '<div class="alarm-section">';
      html += '<div class="alarm-section-label">作息</div>';
      var sorted = sortByTime(groups.routine);
      for (var i = 0; i < sorted.length; i++) {
        html += renderRow(sorted[i]);
      }
      html += '</div>';
    }

    // Other section
    if (groups.other.length > 0) {
      html += '<div class="alarm-section">';
      html += '<div class="alarm-section-label muted">其他</div>';
      var sortedOther = sortByTime(groups.other);
      for (var j = 0; j < sortedOther.length; j++) {
        html += renderRow(sortedOther[j]);
      }
      html += '</div>';
    }

    $list.innerHTML = html;
    updateCountdown();
    bindRowEvents();
  }

  // ── Render a single alarm row ──
  function renderRow(alarm) {
    var enabledClass = alarm.enabled ? '' : ' disabled';
    var toggleClass = alarm.enabled ? ' on' : '';
    var repeatLabel = alarm.repeat ? alarm.repeat + ' · ' : '';
    var swipedClass = (swipedId && swipedId === alarm.id) ? ' swiped' : '';

    return ''
      + '<div class="alarm-row-wrapper' + swipedClass + '" data-id="' + alarm.id + '">'
      +   '<div class="alarm-row' + enabledClass + '">'
      +     '<div class="alarm-row-left">'
      +       '<div class="alarm-row-time">' + alarm.time + '</div>'
      +       '<div class="alarm-row-label">' + repeatLabel + alarm.label + '</div>'
      +     '</div>'
      +     '<div class="alarm-toggle' + toggleClass + '" data-id="' + alarm.id + '">'
      +       '<div class="alarm-toggle-knob"></div>'
      +     '</div>'
      +   '</div>'
      +   '<button class="alarm-row-delete" data-id="' + alarm.id + '">删除</button>'
      + '</div>';
  }

  // ── Bind events on rendered rows ──
  function bindRowEvents() {
    // Toggle clicks
    var toggles = $list.querySelectorAll('.alarm-toggle');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', handleToggle);
    }

    // Delete clicks
    var deleteBtns = $list.querySelectorAll('.alarm-row-delete');
    for (var j = 0; j < deleteBtns.length; j++) {
      deleteBtns[j].addEventListener('click', handleDelete);
    }

    // Swipe on rows
    var wrappers = $list.querySelectorAll('.alarm-row-wrapper');
    for (var k = 0; k < wrappers.length; k++) {
      bindSwipe(wrappers[k]);
    }
  }

  // ── Toggle handler ──
  function handleToggle(e) {
    e.stopPropagation();
    var id = this.getAttribute('data-id');
    for (var i = 0; i < alarms.length; i++) {
      if (alarms[i].id === id) {
        alarms[i].enabled = !alarms[i].enabled;
        break;
      }
    }
    saveAlarms();
    // Re-load to get fresh IDs from storage
    alarms = storage.getAll();
    swipedId = null;
    render();
  }

  // ── Delete handler ──
  function handleDelete(e) {
    e.stopPropagation();
    var id = this.getAttribute('data-id');
    alarms = alarms.filter(function (a) { return a.id !== id; });
    saveAlarms();
    alarms = storage.getAll();
    swipedId = null;
    render();
  }

  // ── Swipe-to-delete gesture ──
  function bindSwipe(wrapper) {
    var row = wrapper.querySelector('.alarm-row');
    var id = wrapper.getAttribute('data-id');
    var startX = 0;
    var currentX = 0;
    var isDragging = false;
    var threshold = 64;

    row.addEventListener('touchstart', function (e) {
      // Close any other swiped row first
      if (swipedId && swipedId !== id) {
        swipedId = null;
        render();
        return;
      }
      startX = e.touches[0].clientX;
      currentX = 0;
      isDragging = true;
    }, { passive: true });

    row.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      var dx = e.touches[0].clientX - startX;
      // Only allow left swipe (negative dx)
      if (dx > 0) {
        dx = 0;
      }
      // Cap at -140 (delete button width + padding)
      if (dx < -140) dx = -140;
      currentX = dx;
      row.style.transform = 'translateX(' + dx + 'px)';
      row.style.transition = 'none';

      // Show delete when threshold reached
      if (dx < -threshold) {
        wrapper.classList.add('swiped');
      } else {
        wrapper.classList.remove('swiped');
      }
    }, { passive: true });

    row.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      row.style.transition = '';

      if (currentX < -threshold) {
        // Snap open
        row.style.transform = 'translateX(-120px)';
        swipedId = id;
      } else {
        // Snap back
        row.style.transform = 'translateX(0)';
        swipedId = null;
      }
    }, { passive: true });
  }

  // ── Countdown to next enabled alarm ──
  function updateCountdown() {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var nearest = null;
    var nearestDiff = Infinity;

    for (var i = 0; i < alarms.length; i++) {
      if (!alarms[i].enabled) continue;
      var parts = alarms[i].time.split(':');
      var alarmMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      var diff = alarmMinutes - nowMinutes;
      // If alarm time is past today, it rings tomorrow
      if (diff <= 0) diff += 24 * 60;
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearest = alarms[i];
      }
    }

    if (nearest) {
      var hours = Math.floor(nearestDiff / 60);
      var mins = nearestDiff % 60;
      var text = '';
      if (hours > 0) text += hours + ' 小时 ';
      text += mins + ' 分钟后响铃';
      $countdown.textContent = text;
    } else {
      $countdown.textContent = '无启用的闹钟';
    }
  }

  // ── Pad number to 2 digits ──
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // ── Get next alarm time string ──
  function getNextAlarmTime() {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var nearest = null;
    var nearestDiff = Infinity;

    for (var i = 0; i < alarms.length; i++) {
      if (!alarms[i].enabled) continue;
      var parts = alarms[i].time.split(':');
      var alarmMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      var diff = alarmMinutes - nowMinutes;
      if (diff <= 0) diff += 24 * 60;
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearest = alarms[i];
      }
    }
    return nearest ? nearest.time : null;
  }

  // ── Render clock/dial view ──
  function renderClockView() {
    if (!$clockView) return;
    var now = new Date();
    var h = now.getHours() % 12;
    var m = now.getMinutes();
    var s = now.getSeconds();
    var hAngle = (h + m / 60) * 30 - 90;
    var mAngle = (m + s / 60) * 6 - 90;

    // Hour markers
    var markers = '';
    for (var i = 0; i < 12; i++) {
      var angle = i * 30;
      var rad = angle * Math.PI / 180;
      var cx = 100 + 82 * Math.cos(rad);
      var cy = 100 + 82 * Math.sin(rad);
      var r = (i % 3 === 0) ? 4 : 2;
      markers += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(245,245,240,0.3)"/>';
    }

    // Hour hand
    var hRad = hAngle * Math.PI / 180;
    var hx = 100 + 50 * Math.cos(hRad);
    var hy = 100 + 50 * Math.sin(hRad);

    // Minute hand
    var mRad = mAngle * Math.PI / 180;
    var mx = 100 + 72 * Math.cos(mRad);
    var my = 100 + 72 * Math.sin(mRad);

    var accent = 'var(--dyn-accent, #4ADE80)';
    var nextAlarm = getNextAlarmTime();
    var nextAlarmText = nextAlarm ? '下一闹钟 · ' + nextAlarm : '无启用的闹钟';

    $clockView.innerHTML = ''
      + '<svg viewBox="0 0 200 200">'
      +   '<circle cx="100" cy="100" r="92" fill="none" stroke="rgba(245,245,240,0.08)" stroke-width="2"/>'
      +   '<circle cx="100" cy="100" r="88" fill="rgba(255,255,255,0.02)"/>'
      +   markers
      +   '<line x1="100" y1="100" x2="' + hx + '" y2="' + hy + '" stroke="#F5F5F0" stroke-width="4" stroke-linecap="round"/>'
      +   '<line x1="100" y1="100" x2="' + mx + '" y2="' + my + '" stroke="' + accent + '" stroke-width="2.5" stroke-linecap="round"/>'
      +   '<circle cx="100" cy="100" r="5" fill="#F5F5F0"/>'
      +   '<circle cx="100" cy="100" r="2.5" fill="' + accent + '"/>'
      + '</svg>'
      + '<div class="clock-time">' + pad(now.getHours()) + ':' + pad(m) + '</div>'
      + '<div class="clock-next-alarm">' + nextAlarmText + '</div>';
  }

  // ── Switch between list and clock view ──
  function switchView(view) {
    currentView = view;
    if (view === 'clock') {
      $list.classList.add('hidden');
      $clockView.classList.remove('hidden');
      $clockView.style.display = '';
      if ($viewToggle) $viewToggle.textContent = '\u2630'; // ☰ list icon
      if ($viewToggle) $viewToggle.classList.add('active');
      renderClockView();
      // Start clock update interval
      if (clockInterval) clearInterval(clockInterval);
      clockInterval = setInterval(renderClockView, 60000);
    } else {
      $list.classList.remove('hidden');
      $clockView.classList.add('hidden');
      if ($viewToggle) $viewToggle.textContent = '\u23F1'; // ⏱ clock icon
      if ($viewToggle) $viewToggle.classList.remove('active');
      // Stop clock interval when not visible
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
    }
  }

  // ── Setup view toggle click ──
  function setupViewToggle() {
    if (!$viewToggle) return;
    $viewToggle.addEventListener('click', function () {
      switchView(currentView === 'list' ? 'clock' : 'list');
    });
  }

  // ── FAB: add alarm stub overlay ──
  function setupFab() {
    $fab.addEventListener('click', function () {
      if (typeof window.createOverlay !== 'function') {
        console.log('[Alarm] Add alarm tapped — overlay not available');
        return;
      }

      var overlay = createOverlay({
        title: '添加闹钟',
        theme: 'dark',
        showSave: true,
        saveText: '保存',
        onSave: function () {
          // Stub: add a new alarm with default values
          var newAlarm = {
            time: '09:00',
            label: '新闹钟',
            group: 'other',
            repeat: '每天',
            enabled: true
          };
          alarms.push(newAlarm);
          saveAlarms();
          alarms = storage.getAll();
          render();
          overlay.hide();
        },
        content: function (body) {
          body.style.padding = '36px';
          body.innerHTML = ''
            + '<div style="color: rgba(245,245,240,0.6); font-size: 28px; text-align: center; padding: 48px 0;">'
            + '闹钟设置功能开发中...'
            + '</div>';
        }
      });
      overlay.show();
    });
  }

  // ── Close swiped row on tap outside ──
  function setupOutsideTap() {
    document.addEventListener('click', function (e) {
      if (swipedId && !e.target.closest('.alarm-row-wrapper')) {
        swipedId = null;
        render();
      }
    });
  }

  // ── Countdown auto-refresh every 60s ──
  function startCountdownTimer() {
    setInterval(function () {
      updateCountdown();
    }, 60000);
  }

  // ── Init ──
  function init() {
    applyAccent(accentHex);
    loadAlarms();
    render();
    setupFab();
    setupOutsideTap();
    setupViewToggle();
    startCountdownTimer();
    // Apply initial view from params
    if (defaultView === 'clock') {
      switchView('clock');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
