/**
 * Calendar Widget — main.js
 * Light theme, CLEAN color mode, swipe-to-delete, lunar calendar
 * Data: preview -> MOCK, live -> WidgetStorage('calendar')
 */

(function () {
  'use strict';

  // ── MOCK events ──
  var MOCK_EVENTS = [
    { id: 'e1', time: '09:00', title: '产品评审会', location: '3号会议室', color: '#3B82F6' },
    { id: 'e2', time: '14:00', title: '设计走查',   location: '线上',       color: '#F59E0B' },
    { id: 'e3', time: '17:30', title: '团队周会',   location: '1号会议室', color: '#10B981' }
  ];

  // ── Weekday names ──
  var WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // ── Lunar calendar lookup ──
  // Simplified algorithm for approximate lunar date display.
  // Uses a table of lunar month data for common years.
  var LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  var LUNAR_MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var LUNAR_DAY_CN = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  function lunarYearDays(y) {
    var i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
      sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    }
    return sum + lunarLeapDays(y);
  }

  function lunarLeapMonth(y) {
    return LUNAR_INFO[y - 1900] & 0xf;
  }

  function lunarLeapDays(y) {
    if (lunarLeapMonth(y)) {
      return (LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  function lunarMonthDays(y, m) {
    return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  function solarToLunar(year, month, day) {
    // Base: 1900-01-31 is lunar 1900-01-01
    var baseDate = new Date(1900, 0, 31);
    var objDate = new Date(year, month - 1, day);
    var offset = Math.floor((objDate - baseDate) / 86400000);

    var lunarYear, lunarMonth, lunarDay;
    var isLeap = false;
    var temp = 0;

    // Calculate year
    for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
      temp = lunarYearDays(lunarYear);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      lunarYear--;
    }

    // Leap month for this year
    var leap = lunarLeapMonth(lunarYear);

    // Calculate month
    for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
      // Leap month
      if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
        --lunarMonth;
        isLeap = true;
        temp = lunarLeapDays(lunarYear);
      } else {
        temp = lunarMonthDays(lunarYear, lunarMonth);
      }
      if (isLeap && lunarMonth === (leap + 1)) {
        isLeap = false;
      }
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --lunarMonth;
      }
    }
    if (offset < 0) {
      offset += temp;
      --lunarMonth;
    }

    lunarDay = offset + 1;

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap
    };
  }

  function formatLunarDate(lunar) {
    var prefix = lunar.isLeap ? '闰' : '';
    return prefix + LUNAR_MONTH_CN[lunar.month - 1] + '月' + LUNAR_DAY_CN[lunar.day - 1];
  }

  // ── DOM refs ──
  var $titleText      = document.getElementById('titleText');
  var $weekText       = document.getElementById('weekText');
  var $bigDate        = document.getElementById('bigDate');
  var $dateMonth      = document.getElementById('dateMonth');
  var $dateLunar      = document.getElementById('dateLunar');
  var $eventList      = document.getElementById('eventList');
  var $nextMeeting    = document.getElementById('nextMeeting');
  var $nextMeetingText = document.getElementById('nextMeetingText');
  var $fabAddCal      = document.getElementById('fabAddCal');

  // ── Params from host ──
  var params   = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'preview';
  var storage  = new WidgetStorage('calendar');

  // ── Color Engine (CLEAN mode) ──
  function applyAccentColor() {
    var accent = params.accent_color || '#3B82F6';
    if (typeof window.computePalette === 'function') {
      var palette = window.computePalette(accent, 'clean');
      var root = document.getElementById('widget-root');
      if (root && palette.cssVars) {
        var vars = palette.cssVars;
        for (var key in vars) {
          if (vars.hasOwnProperty(key)) {
            root.style.setProperty(key, vars[key]);
          }
        }
      }
    }
  }

  // ── Date rendering ──
  function renderDate() {
    var now = new Date();
    var day = now.getDate();
    var month = now.getMonth() + 1;
    var year = now.getFullYear();
    var weekday = WEEKDAY_NAMES[now.getDay()];

    $bigDate.textContent = day;
    $weekText.textContent = weekday;
    $dateMonth.textContent = month + '月 ' + year;

    // Lunar
    try {
      var lunar = solarToLunar(year, month, day);
      $dateLunar.textContent = formatLunarDate(lunar);
    } catch (e) {
      $dateLunar.textContent = '';
    }
  }

  // ── Event rendering ──
  var currentEvents = [];

  function renderEvents(events) {
    currentEvents = events;
    $eventList.innerHTML = '';

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var row = document.createElement('div');
      row.className = 'event-row';
      row.setAttribute('data-id', ev.id || ('ev' + i));

      var inner = document.createElement('div');
      inner.className = 'event-row-inner';

      // Time
      var timeEl = document.createElement('div');
      timeEl.className = 'event-time';
      timeEl.textContent = ev.time || '--:--';

      // Dot
      var dotEl = document.createElement('div');
      dotEl.className = 'event-dot';
      dotEl.style.background = ev.color || 'var(--dyn-accent, #3B82F6)';

      // Info
      var infoEl = document.createElement('div');
      infoEl.className = 'event-info';

      var titleEl = document.createElement('div');
      titleEl.className = 'event-title';
      titleEl.textContent = ev.title || '';

      var locEl = document.createElement('div');
      locEl.className = 'event-location';
      locEl.textContent = ev.location || '';

      infoEl.appendChild(titleEl);
      infoEl.appendChild(locEl);

      inner.appendChild(timeEl);
      inner.appendChild(dotEl);
      inner.appendChild(infoEl);
      row.appendChild(inner);

      // Delete button (hidden by default)
      var delBtn = document.createElement('button');
      delBtn.className = 'event-delete-btn';
      delBtn.textContent = '删除';
      row.appendChild(delBtn);

      $eventList.appendChild(row);

      // Bind swipe + delete
      bindSwipe(row, inner, delBtn, ev.id || ('ev' + i));
    }
  }

  // ── Swipe-to-delete ──
  function bindSwipe(row, inner, delBtn, eventId) {
    var startX = 0;
    var currentX = 0;
    var isSwiping = false;
    var isSwiped = false;
    var THRESHOLD = 64;

    row.addEventListener('touchstart', function (e) {
      // Close any other swiped rows
      closeAllSwipedExcept(row);
      startX = e.touches[0].clientX;
      currentX = 0;
      isSwiping = true;
    }, { passive: true });

    row.addEventListener('touchmove', function (e) {
      if (!isSwiping) return;
      var dx = e.touches[0].clientX - startX;
      // Only allow left swipe (negative dx)
      if (dx > 0) dx = 0;
      // Clamp to -120
      if (dx < -120) dx = -120;
      currentX = dx;
      inner.style.transition = 'none';
      inner.style.transform = 'translateX(' + dx + 'px)';
      // Show delete if past threshold
      if (dx < -THRESHOLD) {
        delBtn.style.display = 'flex';
      }
    }, { passive: true });

    row.addEventListener('touchend', function () {
      isSwiping = false;
      inner.style.transition = 'transform 0.25s ease-out';
      if (currentX < -THRESHOLD) {
        // Snap open
        inner.style.transform = 'translateX(-120px)';
        delBtn.style.display = 'flex';
        row.classList.add('swiped');
        isSwiped = true;
      } else {
        // Snap back
        inner.style.transform = 'translateX(0)';
        delBtn.style.display = 'none';
        row.classList.remove('swiped');
        isSwiped = false;
      }
    }, { passive: true });

    delBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      // Animate out
      row.style.transition = 'opacity 0.2s ease, height 0.2s ease, margin 0.2s ease';
      row.style.opacity = '0';
      row.style.height = '0';
      row.style.overflow = 'hidden';
      setTimeout(function () {
        // Remove from DOM
        if (row.parentNode) row.parentNode.removeChild(row);
        // Remove from data
        removeEvent(eventId);
      }, 200);
    });
  }

  function closeAllSwipedExcept(exceptRow) {
    var rows = $eventList.querySelectorAll('.event-row.swiped');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i] !== exceptRow) {
        rows[i].classList.remove('swiped');
        var inner = rows[i].querySelector('.event-row-inner');
        var btn = rows[i].querySelector('.event-delete-btn');
        if (inner) {
          inner.style.transition = 'transform 0.25s ease-out';
          inner.style.transform = 'translateX(0)';
        }
        if (btn) btn.style.display = 'none';
      }
    }
  }

  function removeEvent(id) {
    for (var i = 0; i < currentEvents.length; i++) {
      if (currentEvents[i].id === id || ('ev' + i) === id) {
        currentEvents.splice(i, 1);
        break;
      }
    }
    storage.remove(id);
    renderNextMeeting(currentEvents);
  }

  // ── Next meeting countdown ──
  function renderNextMeeting(events) {
    if (!events || events.length === 0) {
      $nextMeeting.style.display = 'none';
      return;
    }

    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();
    var nextEvent = null;
    var minDiff = Infinity;

    for (var i = 0; i < events.length; i++) {
      var parts = (events[i].time || '').split(':');
      if (parts.length !== 2) continue;
      var evMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      var diff = evMinutes - nowMinutes;
      if (diff > 0 && diff < minDiff) {
        minDiff = diff;
        nextEvent = events[i];
      }
    }

    if (nextEvent && minDiff < Infinity) {
      $nextMeeting.style.display = 'flex';
      if (minDiff >= 60) {
        var hours = Math.floor(minDiff / 60);
        var mins = minDiff % 60;
        $nextMeetingText.textContent = '距下次会议还有 ' + hours + ' 小时' + (mins > 0 ? ' ' + mins + ' 分钟' : '');
      } else {
        $nextMeetingText.textContent = '距下次会议还有 ' + minDiff + ' 分钟';
      }
    } else {
      // All events have passed or no valid times
      $nextMeeting.style.display = 'flex';
      $nextMeetingText.textContent = '今日日程已完成';
    }
  }

  // ── FAB handler ──
  function setupFab() {
    $fabAddCal.addEventListener('click', function () {
      console.log('[Calendar] FAB tapped — add event stub');
      // Future: open overlay add-event form
    });
  }

  // ── Data loading ──
  function loadEvents() {
    if (dataMode === 'preview') {
      renderEvents(MOCK_EVENTS);
      renderNextMeeting(MOCK_EVENTS);
      return;
    }

    // Live mode: try storage, fallback to MOCK
    var stored = storage.getAll();
    if (stored && stored.length > 0) {
      renderEvents(stored);
      renderNextMeeting(stored);
    } else {
      // Seed with mock data
      storage.seed(MOCK_EVENTS.map(function (ev) {
        return { id: ev.id, time: ev.time, title: ev.title, location: ev.location, color: ev.color };
      }));
      var seeded = storage.getAll();
      renderEvents(seeded.length > 0 ? seeded : MOCK_EVENTS);
      renderNextMeeting(seeded.length > 0 ? seeded : MOCK_EVENTS);
    }
  }

  // ── Init ──
  function init() {
    if (params.visual_style) { document.documentElement.setAttribute('data-visual-style', params.visual_style); }
    applyAccentColor();
    renderDate();
    loadEvents();
    setupFab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
