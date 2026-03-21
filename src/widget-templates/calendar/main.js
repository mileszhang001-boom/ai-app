/**
 * 日程卡片 · Liquid Glass
 * 毛玻璃时间线 + 大日期 + 农历 + 倒计时
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

  // 天干地支
  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var LUNAR_DAYS_STR = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  // 24 节气（简化：按公历日期近似查表）
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

  /**
   * 简化农历计算
   * 使用查表法做 demo 级近似，实际生产应使用完整农历库
   */
  function getLunarInfo(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();

    // 节气查找（允许前后1天匹配）
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

    // 简化农历日期推算（基于已知农历新年偏移）
    // 这里使用近似算法，Demo 用途足够
    var lunarData = approximateLunar(date);

    return {
      monthStr: LUNAR_MONTHS[lunarData.month - 1] + '月',
      dayStr: LUNAR_DAYS_STR[lunarData.day - 1],
      solarTerm: solarTerm
    };
  }

  /**
   * 近似农历推算
   * 基于每年农历新年的公历日期做偏移计算
   */
  function approximateLunar(date) {
    // 农历新年公历日期表
    var lunarNewYears = {
      2024: new Date(2024, 1, 10),  // 2024-02-10
      2025: new Date(2025, 0, 29),  // 2025-01-29
      2026: new Date(2026, 1, 17),  // 2026-02-17
      2027: new Date(2027, 1, 6)    // 2027-02-06
    };

    var year = date.getFullYear();
    var newYear = lunarNewYears[year];

    // 如果当前日期在农历新年之前，使用上一年
    if (!newYear || date < newYear) {
      year--;
      newYear = lunarNewYears[year];
    }

    if (!newYear) {
      // 超出查表范围，返回 mock 值
      return { month: 2, day: 21 };
    }

    // 计算距农历新年天数
    var diffDays = Math.floor((date - newYear) / (24 * 60 * 60 * 1000));

    // 简化月份计算（大月30天，小月29天交替）
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

  function parseEventTime(timeStr) {
    var parts = timeStr.split(':');
    return { hours: parseInt(parts[0], 10), minutes: parseInt(parts[1], 10) };
  }

  function getEventMinutes(timeStr) {
    var t = parseEventTime(timeStr);
    return t.hours * 60 + t.minutes;
  }

  function getCurrentEventIndex(events) {
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    // 找到当前正在进行的事件（当前时间在此事件与下一事件之间）
    for (var i = events.length - 1; i >= 0; i--) {
      var eventMin = getEventMinutes(events[i].time);
      if (nowMinutes >= eventMin) {
        return i;
      }
    }

    // 所有事件都在未来
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

  // ── 渲染 ──

  function renderDate() {
    var now = new Date();

    // 星期
    var weekdayEl = document.getElementById('weekdayName');
    if (weekdayEl) weekdayEl.textContent = WEEKDAY_NAMES[now.getDay()];

    // 日期数字
    var dateNumEl = document.getElementById('dateNumber');
    if (dateNumEl) dateNumEl.textContent = pad(now.getDate());

    // 月份
    var monthEl = document.getElementById('dateMonth');
    if (monthEl) monthEl.textContent = (now.getMonth() + 1) + '月';

    // 年份
    var yearEl = document.getElementById('dateYear');
    if (yearEl) yearEl.textContent = now.getFullYear();

    // 农历
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

    events.forEach(function(event, index) {
      // 事件项
      var item = document.createElement('div');
      item.className = 'event-item';

      // 标记当前事件
      if (index === currentIdx) {
        item.classList.add('current');
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

      // 在事件之间添加连接线（非最后一项）
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

  function init() {
    applyTheme();

    // 应用风格预设
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

    var events = params.events || [];

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

    // 午夜更新日期
    var now = new Date();
    var msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    setTimeout(function() {
      renderDate();
      // 之后每24h更新
      setInterval(renderDate, 24 * 60 * 60 * 1000);
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
