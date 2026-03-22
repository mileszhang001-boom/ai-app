/**
 * 日程卡片 · Liquid Glass
 * 毛玻璃时间线 + 大日期 + 农历 + 动态日程 + 倒计时
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    events: [
      { time: '09:00', title: '产品评审会议', location: '3楼会议室A' },
      { time: '14:00', title: 'UI设计走查', location: '线上会议' },
      { time: '16:30', title: '周报总结', location: '工位' }
    ],
    show_lunar: true,
    style_preset: 'business-gray'
  };

  var WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // ── 农历计算（简化版，覆盖 2024-2027 常用范围） ──

  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var LUNAR_DAYS_STR = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  var SOLAR_TERMS = {
    '01-05': '小寒', '01-20': '大寒',
    '02-04': '立春', '02-19': '雨水',
    '03-06': '惊蛰', '03-21': '春分',
    '04-05': '清明', '04-20': '谷雨',
    '05-06': '立夏', '05-21': '小满',
    '06-06': '芒种', '06-21': '夏至',
    '07-07': '小暑', '07-23': '大暑',
    '08-07': '立秋', '08-23': '处暑',
    '09-08': '白露', '09-23': '秋分',
    '10-08': '寒露', '10-23': '霜降',
    '11-07': '立冬', '11-22': '小雪',
    '12-07': '大雪', '12-22': '冬至'
  };

  function getLunarInfo(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();

    var solarTerm = '';
    for (var offset = -1; offset <= 1; offset++) {
      var checkDate = new Date(date);
      checkDate.setDate(day + offset);
      var key = pad(checkDate.getMonth() + 1) + '-' + pad(checkDate.getDate());
      if (SOLAR_TERMS[key]) {
        solarTerm = SOLAR_TERMS[key];
        break;
      }
    }

    var lunarData = approximateLunar(date);

    return {
      monthStr: LUNAR_MONTHS[lunarData.month - 1] + '月',
      dayStr: LUNAR_DAYS_STR[lunarData.day - 1],
      solarTerm: solarTerm
    };
  }

  function approximateLunar(date) {
    var lunarNewYears = {
      2024: new Date(2024, 1, 10),
      2025: new Date(2025, 0, 29),
      2026: new Date(2026, 1, 17),
      2027: new Date(2027, 1, 6)
    };

    var year = date.getFullYear();
    var newYear = lunarNewYears[year];

    if (!newYear || date < newYear) {
      year--;
      newYear = lunarNewYears[year];
    }

    if (!newYear) {
      return { month: 2, day: 21 };
    }

    var diffDays = Math.floor((date - newYear) / (24 * 60 * 60 * 1000));

    var lunarMonth = 1;
    var lunarDay = 1;
    var daysInMonth = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    var accumulated = 0;

    for (var i = 0; i < 12; i++) {
      if (accumulated + daysInMonth[i] > diffDays) {
        lunarMonth = i + 1;
        lunarDay = diffDays - accumulated + 1;
        break;
      }
      accumulated += daysInMonth[i];
    }

    return { month: lunarMonth, day: lunarDay };
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  // ── 获取当前/下一个事件 ──

  function getEventMinutes(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function getCurrentEventIndex(events) {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (var i = events.length - 1; i >= 0; i--) {
      var eventMin = getEventMinutes(events[i].time);
      if (nowMinutes >= eventMin) {
        return i;
      }
    }

    return -1;
  }

  function getNextEventInfo(events) {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (var i = 0; i < events.length; i++) {
      var eventMin = getEventMinutes(events[i].time);
      if (eventMin > nowMinutes) {
        var diff = eventMin - nowMinutes;
        if (diff >= 60) {
          var h = Math.floor(diff / 60);
          var m = diff % 60;
          return m > 0
            ? '距下一个事件还有 ' + h + ' 小时 ' + m + ' 分钟'
            : '距下一个事件还有 ' + h + ' 小时';
        }
        return '距下一个事件还有 ' + diff + ' 分钟';
      }
    }

    return '今日事件已全部结束';
  }

  // ── 动态日程获取 ──

  async function fetchEvents() {
    try {
      var resp = await fetch('/api/calendar/today');
      if (resp.ok) {
        var data = await resp.json();
        if (data && data.events && data.events.length > 0) {
          return data.events;
        }
      }
    } catch (e) {
      // API unavailable, fall through
    }
    // fallback to params
    return params.events || [];
  }

  // ── 渲染 ──

  function renderDate() {
    var now = new Date();

    var weekdayEl = document.getElementById('weekdayName');
    if (weekdayEl) weekdayEl.textContent = WEEKDAY_NAMES[now.getDay()];

    var dateNumEl = document.getElementById('dateNumber');
    if (dateNumEl) dateNumEl.textContent = pad(now.getDate());

    var monthEl = document.getElementById('dateMonth');
    if (monthEl) monthEl.textContent = (now.getMonth() + 1) + '月';

    var yearEl = document.getElementById('dateYear');
    if (yearEl) yearEl.textContent = now.getFullYear();

    if (params.show_lunar !== false) {
      var lunarEl = document.getElementById('lunarInfo');
      if (lunarEl) {
        var lunar = getLunarInfo(now);
        var text = lunar.monthStr + lunar.dayStr;
        if (lunar.solarTerm) {
          text += ' \u00b7 ' + lunar.solarTerm;
        }
        lunarEl.textContent = text;
      }
    }
  }

  function renderTimeline(events) {
    var timelineEl = document.getElementById('timeline');
    if (!timelineEl) return;

    timelineEl.innerHTML = '';

    var currentIdx = getCurrentEventIndex(events);
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    events.forEach(function(event, index) {
      var item = document.createElement('div');
      item.className = 'event-item';

      var eventMin = getEventMinutes(event.time);

      // 标记当前事件
      if (index === currentIdx) {
        item.classList.add('current');
      }

      // 标记已过去的事件
      if (eventMin < nowMinutes && index !== currentIdx) {
        item.classList.add('past');
      }

      // 时间
      var timeEl = document.createElement('div');
      timeEl.className = 'event-time';
      timeEl.textContent = event.time;

      // 竖线 + 圆点
      var lineEl = document.createElement('div');
      lineEl.className = 'event-line';

      var dotEl = document.createElement('div');
      dotEl.className = 'event-dot';
      lineEl.appendChild(dotEl);

      // 信息
      var infoEl = document.createElement('div');
      infoEl.className = 'event-info';

      var titleEl = document.createElement('div');
      titleEl.className = 'event-title';
      titleEl.textContent = event.title;

      var locEl = document.createElement('div');
      locEl.className = 'event-location';
      locEl.textContent = event.location;

      infoEl.appendChild(titleEl);
      infoEl.appendChild(locEl);

      item.appendChild(timeEl);
      item.appendChild(lineEl);
      item.appendChild(infoEl);

      timelineEl.appendChild(item);

      // 连接线
      if (index < events.length - 1) {
        var connector = document.createElement('div');
        connector.className = 'event-connector';
        connector.style.height = '16px';
        connector.style.width = '1.5px';
        connector.style.marginLeft = '67px';
        timelineEl.appendChild(connector);
      }
    });
  }

  function renderCountdown(events) {
    var countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    var textEl = countdownEl.querySelector('.countdown-text');
    if (textEl) {
      textEl.textContent = getNextEventInfo(events);
    }
  }

  // ── 主题 ──

  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  // ── 初始化 ──

  async function init() {
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

    // 获取动态日程
    var events = await fetchEvents();

    // 渲染日期
    renderDate();

    // 渲染时间线
    renderTimeline(events);

    // 渲染倒计时
    renderCountdown(events);

    // 每分钟更新倒计时和当前事件状态
    setInterval(function() {
      renderCountdown(events);
      renderTimeline(events);
    }, 60 * 1000);

    // 午夜更新日期 + 重新获取日程
    var now = new Date();
    var msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    setTimeout(async function() {
      renderDate();
      // 重新获取当天日程
      var newEvents = await fetchEvents();
      events = newEvents;
      renderTimeline(events);
      renderCountdown(events);
      // 之后每24h更新
      setInterval(async function() {
        renderDate();
        var freshEvents = await fetchEvents();
        events = freshEvents;
        renderTimeline(events);
        renderCountdown(events);
      }, 24 * 60 * 60 * 1000);
    }, msToMidnight + 1000);

    // 监听主题变化
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
