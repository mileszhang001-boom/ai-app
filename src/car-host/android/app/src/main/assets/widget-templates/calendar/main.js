/**
 * 日程卡片 · Liquid Glass
 * 毛玻璃时间线 + 大日期 + 农历 + 动态日程 + 倒计时
 * + FAB添加事件 + localStorage持久化 + 长按删除
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

  // ── 数据层：WidgetStorage 持久化 ──

  var store = window.WidgetStorage ? window.WidgetStorage('calendar') : null;

  function loadEvents() {
    if (store) {
      var saved = store.getAll();
      if (saved.length > 0) return saved;
    }
    // Seed from params
    var initial = params.events || [];
    if (store && initial.length > 0) {
      store.seed(initial.map(function(e) {
        return { time: e.time, title: e.title, location: e.location || '', color: e.color || '#3B82F6' };
      }));
      return store.getAll();
    }
    return initial;
  }

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

  // 当前活跃的删除确认气泡（同一时间只显示一个）
  var activeDeleteBubble = null;

  function dismissDeleteBubble() {
    if (activeDeleteBubble && activeDeleteBubble.parentNode) {
      activeDeleteBubble.parentNode.removeChild(activeDeleteBubble);
    }
    activeDeleteBubble = null;
  }

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

    // 清理旧的删除气泡
    dismissDeleteBubble();

    timelineEl.innerHTML = '';

    var currentIdx = getCurrentEventIndex(events);
    var now = new Date();
    var nowMinutes = now.getHours() * 60 + now.getMinutes();

    events.forEach(function(event, index) {
      var item = document.createElement('div');
      item.className = 'event-item';
      item.style.position = 'relative';

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
      // 自定义颜色
      if (event.color) {
        dotEl.style.background = event.color;
        dotEl.style.boxShadow = '0 0 18px ' + event.color + '55';
      }
      lineEl.appendChild(dotEl);

      // 信息
      var infoEl = document.createElement('div');
      infoEl.className = 'event-info';

      var titleEl = document.createElement('div');
      titleEl.className = 'event-title';
      titleEl.textContent = event.title;

      var locEl = document.createElement('div');
      locEl.className = 'event-location';
      locEl.textContent = event.location || '';

      infoEl.appendChild(titleEl);
      infoEl.appendChild(locEl);

      item.appendChild(timeEl);
      item.appendChild(lineEl);
      item.appendChild(infoEl);

      // ── 长按删除 ──
      if (store && event.id) {
        attachLongPress(item, event.id, events);
      }

      timelineEl.appendChild(item);

      // 连接线
      if (index < events.length - 1) {
        var connector = document.createElement('div');
        connector.className = 'event-connector';
        connector.style.height = '48px';
        connector.style.width = '4.5px';
        connector.style.marginLeft = '201px';
        timelineEl.appendChild(connector);
      }
    });
  }

  // ── 长按删除逻辑 ──

  function attachLongPress(itemEl, eventId, events) {
    var pressTimer = null;
    var LONG_PRESS_MS = 600;

    function onPressStart(e) {
      // 防止与滚动冲突
      pressTimer = setTimeout(function() {
        pressTimer = null;
        showDeleteConfirm(itemEl, eventId, events);
      }, LONG_PRESS_MS);
    }

    function onPressEnd(e) {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    function onPressMove(e) {
      // 手指移动时取消长按
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    // Touch events
    itemEl.addEventListener('touchstart', onPressStart, { passive: true });
    itemEl.addEventListener('touchend', onPressEnd);
    itemEl.addEventListener('touchcancel', onPressEnd);
    itemEl.addEventListener('touchmove', onPressMove, { passive: true });

    // Mouse events (for desktop/simulator)
    itemEl.addEventListener('mousedown', onPressStart);
    itemEl.addEventListener('mouseup', onPressEnd);
    itemEl.addEventListener('mouseleave', onPressEnd);
  }

  function showDeleteConfirm(itemEl, eventId, events) {
    // 先清除之前的气泡
    dismissDeleteBubble();

    var bubble = document.createElement('div');
    bubble.className = 'delete-confirm';
    bubble.textContent = '删除';

    bubble.addEventListener('click', function(e) {
      e.stopPropagation();
      if (store) {
        store.remove(eventId);
        var updated = loadEvents();
        renderTimeline(updated);
        renderCountdown(updated);
      }
    });

    itemEl.appendChild(bubble);
    activeDeleteBubble = bubble;

    // 点击其他区域时消除气泡
    var dismissHandler = function(e) {
      if (e.target !== bubble) {
        dismissDeleteBubble();
        document.removeEventListener('click', dismissHandler, true);
        document.removeEventListener('touchstart', dismissHandler, true);
      }
    };
    // 延迟绑定，避免本次事件触发
    setTimeout(function() {
      document.addEventListener('click', dismissHandler, true);
      document.addEventListener('touchstart', dismissHandler, true);
    }, 50);
  }

  function renderCountdown(events) {
    var countdownEl = document.getElementById('countdown');
    if (!countdownEl) return;

    var textEl = countdownEl.querySelector('.countdown-text');
    if (textEl) {
      textEl.textContent = getNextEventInfo(events);
    }
  }

  // ── 添加事件 Overlay ──

  var COLOR_OPTIONS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
  var REMINDER_OPTIONS = [
    { label: '无', value: '' },
    { label: '5分钟前', value: '5min' },
    { label: '15分钟前', value: '15min' },
    { label: '30分钟前', value: '30min' },
    { label: '1小时前', value: '1hour' }
  ];

  function openAddEventOverlay() {
    if (!window.createOverlay) return;

    var formState = {
      title: '',
      location: '',
      allDay: false,
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      reminder: '',
      color: '#3B82F6',
      notes: ''
    };

    // 默认日期/时间
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    formState.startDate = dateStr;
    formState.startTime = pad(now.getHours()) + ':' + pad(now.getMinutes());
    formState.endDate = dateStr;
    formState.endTime = pad(nextHour.getHours()) + ':' + pad(nextHour.getMinutes());

    var overlayApi = window.createOverlay({
      title: '新建日程',
      theme: 'light',
      showSave: true,
      saveText: '添加',
      cancelText: '取消',
      onSave: function() {
        // 验证标题
        if (!formState.title.trim()) {
          if (titleInput) {
            titleInput.style.borderColor = '#EF4444';
            titleInput.focus();
          }
          return;
        }

        // 确定时间
        var eventTime = formState.allDay ? '00:00' : formState.startTime;

        var newEvent = {
          time: eventTime,
          title: formState.title.trim(),
          location: formState.location.trim(),
          color: formState.color,
          allDay: formState.allDay,
          reminder: formState.reminder,
          notes: formState.notes.trim()
        };

        if (store) {
          store.add(newEvent);
        }

        // 刷新
        var updated = loadEvents();
        // 按时间排序
        updated.sort(function(a, b) {
          return getEventMinutes(a.time) - getEventMinutes(b.time);
        });
        if (store) {
          // 重写排序后的数据
          store.clear();
          updated.forEach(function(evt) { store.add(evt); });
        }

        renderTimeline(updated);
        renderCountdown(updated);

        overlayApi.hide();
      },
      onCancel: function() {},
      content: function(bodyEl) {
        buildFormContent(bodyEl, formState);
      }
    });

    // 存储 titleInput 引用（在 buildFormContent 中设置）
    var titleInput = null;

    function buildFormContent(bodyEl, state) {
      // ── 标题输入 ──
      var titleRow = document.createElement('div');
      titleRow.style.cssText = 'padding: 24px 36px 12px;';
      titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'overlay-input';
      titleInput.placeholder = '标题';
      titleInput.style.fontSize = '32px';
      titleInput.style.fontWeight = '500';
      titleInput.value = state.title;
      titleInput.addEventListener('input', function() {
        state.title = this.value;
        this.style.borderColor = '';
      });
      titleRow.appendChild(titleInput);
      bodyEl.appendChild(titleRow);

      // ── 地点输入 ──
      var locRow = document.createElement('div');
      locRow.style.cssText = 'padding: 8px 36px 20px;';
      var locInput = document.createElement('input');
      locInput.type = 'text';
      locInput.className = 'overlay-input';
      locInput.placeholder = '地点';
      locInput.value = state.location;
      locInput.addEventListener('input', function() {
        state.location = this.value;
      });
      locRow.appendChild(locInput);
      bodyEl.appendChild(locRow);

      // ── 分割线 ──
      var div1 = document.createElement('div');
      div1.className = 'overlay-divider full';
      bodyEl.appendChild(div1);

      // ── 全天开关 ──
      var allDayRow = document.createElement('div');
      allDayRow.className = 'overlay-row';
      allDayRow.style.justifyContent = 'space-between';

      var allDayLabel = document.createElement('span');
      allDayLabel.className = 'overlay-row-label';
      allDayLabel.textContent = '全天';

      var allDayToggle = document.createElement('div');
      allDayToggle.className = 'overlay-toggle' + (state.allDay ? ' on' : '');
      allDayToggle.addEventListener('click', function() {
        state.allDay = !state.allDay;
        if (state.allDay) {
          allDayToggle.classList.add('on');
          timeFieldsWrap.style.display = 'none';
        } else {
          allDayToggle.classList.remove('on');
          timeFieldsWrap.style.display = '';
        }
      });

      allDayRow.appendChild(allDayLabel);
      allDayRow.appendChild(allDayToggle);
      bodyEl.appendChild(allDayRow);

      // ── 时间字段容器（全天开启时隐藏） ──
      var timeFieldsWrap = document.createElement('div');
      if (state.allDay) timeFieldsWrap.style.display = 'none';

      // ── 开始时间 ──
      var startRow = document.createElement('div');
      startRow.className = 'overlay-row';
      startRow.style.gap = '12px';

      var startLabel = document.createElement('span');
      startLabel.className = 'overlay-row-label';
      startLabel.textContent = '开始';
      startLabel.style.width = '72px';
      startLabel.style.flexShrink = '0';

      var startDateInput = document.createElement('input');
      startDateInput.type = 'date';
      startDateInput.className = 'overlay-input';
      startDateInput.style.cssText = 'flex:1; text-align:center;';
      startDateInput.value = state.startDate;
      startDateInput.addEventListener('change', function() {
        state.startDate = this.value;
      });

      var startTimeInput = document.createElement('input');
      startTimeInput.type = 'time';
      startTimeInput.className = 'overlay-input';
      startTimeInput.style.cssText = 'width:180px; text-align:center; flex-shrink:0;';
      startTimeInput.value = state.startTime;
      startTimeInput.addEventListener('change', function() {
        state.startTime = this.value;
      });

      startRow.appendChild(startLabel);
      startRow.appendChild(startDateInput);
      startRow.appendChild(startTimeInput);
      timeFieldsWrap.appendChild(startRow);

      // ── 结束时间 ──
      var endRow = document.createElement('div');
      endRow.className = 'overlay-row';
      endRow.style.gap = '12px';

      var endLabel = document.createElement('span');
      endLabel.className = 'overlay-row-label';
      endLabel.textContent = '结束';
      endLabel.style.width = '72px';
      endLabel.style.flexShrink = '0';

      var endDateInput = document.createElement('input');
      endDateInput.type = 'date';
      endDateInput.className = 'overlay-input';
      endDateInput.style.cssText = 'flex:1; text-align:center;';
      endDateInput.value = state.endDate;
      endDateInput.addEventListener('change', function() {
        state.endDate = this.value;
      });

      var endTimeInput = document.createElement('input');
      endTimeInput.type = 'time';
      endTimeInput.className = 'overlay-input';
      endTimeInput.style.cssText = 'width:180px; text-align:center; flex-shrink:0;';
      endTimeInput.value = state.endTime;
      endTimeInput.addEventListener('change', function() {
        state.endTime = this.value;
      });

      endRow.appendChild(endLabel);
      endRow.appendChild(endDateInput);
      endRow.appendChild(endTimeInput);
      timeFieldsWrap.appendChild(endRow);

      bodyEl.appendChild(timeFieldsWrap);

      // ── 分割线 ──
      var div2 = document.createElement('div');
      div2.className = 'overlay-divider full';
      bodyEl.appendChild(div2);

      // ── 提醒 ──
      var reminderRow = document.createElement('div');
      reminderRow.className = 'overlay-row';
      reminderRow.style.justifyContent = 'space-between';

      var reminderLabel = document.createElement('span');
      reminderLabel.className = 'overlay-row-label';
      reminderLabel.textContent = '提醒';

      var reminderSelect = document.createElement('select');
      reminderSelect.className = 'overlay-input';
      reminderSelect.style.cssText = 'width:auto; min-width:180px; text-align:center; padding:12px 20px;';

      REMINDER_OPTIONS.forEach(function(opt) {
        var option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value === state.reminder) option.selected = true;
        reminderSelect.appendChild(option);
      });
      reminderSelect.addEventListener('change', function() {
        state.reminder = this.value;
      });

      reminderRow.appendChild(reminderLabel);
      reminderRow.appendChild(reminderSelect);
      bodyEl.appendChild(reminderRow);

      // ── 分割线 ──
      var div3 = document.createElement('div');
      div3.className = 'overlay-divider full';
      bodyEl.appendChild(div3);

      // ── 颜色标签 ──
      var colorRow = document.createElement('div');
      colorRow.className = 'overlay-row';
      colorRow.style.cssText = 'justify-content:space-between; padding-top:20px; padding-bottom:20px;';

      var colorLabel = document.createElement('span');
      colorLabel.className = 'overlay-row-label';
      colorLabel.textContent = '颜色';

      var colorPicker = document.createElement('div');
      colorPicker.style.cssText = 'display:flex; gap:16px; align-items:center;';

      var colorCircles = [];
      COLOR_OPTIONS.forEach(function(hex) {
        var circle = document.createElement('div');
        circle.style.cssText = 'width:40px; height:40px; border-radius:50%; cursor:pointer; transition:transform 0.15s; border:3px solid transparent;';
        circle.style.background = hex;
        if (hex === state.color) {
          circle.style.borderColor = '#fff';
          circle.style.transform = 'scale(1.15)';
        }
        circle.addEventListener('click', function() {
          state.color = hex;
          colorCircles.forEach(function(c) {
            c.style.borderColor = 'transparent';
            c.style.transform = 'scale(1)';
          });
          circle.style.borderColor = '#fff';
          circle.style.transform = 'scale(1.15)';
        });
        colorCircles.push(circle);
        colorPicker.appendChild(circle);
      });

      colorRow.appendChild(colorLabel);
      colorRow.appendChild(colorPicker);
      bodyEl.appendChild(colorRow);

      // ── 分割线 ──
      var div4 = document.createElement('div');
      div4.className = 'overlay-divider full';
      bodyEl.appendChild(div4);

      // ── 备注 ──
      var notesRow = document.createElement('div');
      notesRow.style.cssText = 'padding: 20px 36px 28px;';

      var notesLabel = document.createElement('div');
      notesLabel.className = 'overlay-row-label';
      notesLabel.style.marginBottom = '12px';
      notesLabel.textContent = '备注';

      var notesTextarea = document.createElement('textarea');
      notesTextarea.className = 'overlay-input';
      notesTextarea.placeholder = '添加备注...';
      notesTextarea.style.cssText = 'min-height:120px; resize:vertical; line-height:1.6;';
      notesTextarea.value = state.notes;
      notesTextarea.addEventListener('input', function() {
        state.notes = this.value;
      });

      notesRow.appendChild(notesLabel);
      notesRow.appendChild(notesTextarea);
      bodyEl.appendChild(notesRow);
    }

    overlayApi.show();
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

    // 加载事件：优先 localStorage，回退到 API / params
    var events;
    if (store) {
      events = loadEvents();
      // 如果 store 为空，尝试从 API 获取并 seed
      if (events.length === 0) {
        var apiEvents = await fetchEvents();
        if (apiEvents.length > 0 && store) {
          store.seed(apiEvents.map(function(e) {
            return { time: e.time, title: e.title, location: e.location || '', color: e.color || '#3B82F6' };
          }));
          events = store.getAll();
        } else {
          events = apiEvents;
        }
      }
    } else {
      events = await fetchEvents();
    }

    // 按时间排序
    events.sort(function(a, b) {
      return getEventMinutes(a.time) - getEventMinutes(b.time);
    });

    // 渲染日期
    renderDate();

    // 渲染时间线
    renderTimeline(events);

    // 渲染倒计时
    renderCountdown(events);

    // ── FAB 按钮 ──
    var fab = document.getElementById('fabAddEvent');
    if (fab) {
      fab.addEventListener('click', openAddEventOverlay);
    }

    // 每分钟更新倒计时和当前事件状态
    setInterval(function() {
      var current = store ? loadEvents() : events;
      current.sort(function(a, b) {
        return getEventMinutes(a.time) - getEventMinutes(b.time);
      });
      renderCountdown(current);
      renderTimeline(current);
    }, 60 * 1000);

    // 午夜更新日期 + 重新获取日程
    var now = new Date();
    var msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    setTimeout(async function() {
      renderDate();
      // 重新获取当天日程
      var newEvents = await fetchEvents();
      if (store) {
        store.clear();
        newEvents.forEach(function(e) {
          store.add({ time: e.time, title: e.title, location: e.location || '', color: e.color || '#3B82F6' });
        });
        events = store.getAll();
      } else {
        events = newEvents;
      }
      renderTimeline(events);
      renderCountdown(events);
      // 之后每24h更新
      setInterval(async function() {
        renderDate();
        var freshEvents = await fetchEvents();
        if (store) {
          store.clear();
          freshEvents.forEach(function(e) {
            store.add({ time: e.time, title: e.title, location: e.location || '', color: e.color || '#3B82F6' });
          });
          events = store.getAll();
        } else {
          events = freshEvents;
        }
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
