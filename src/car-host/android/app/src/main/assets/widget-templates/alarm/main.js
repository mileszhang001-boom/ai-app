/**
 * 闹钟 · 多闹钟管理 — Liquid Glass Edition
 * 列表视图 + 表盘视图 + 新建闹钟 + localStorage 持久化
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {};
  var store = window.WidgetStorage ? window.WidgetStorage('alarm') : null;
  var displayStyle = params.display_style || 'list';

  // 数据分层：preview 用默认闹钟 + 角标，live 用真实数据
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';

  // ── 默认闹钟数据 ──

  var defaultAlarms = [
    { time: '07:30', period: 'AM', repeat: 'weekdays', label: '起床', enabled: true },
    { time: '12:30', period: 'PM', repeat: 'daily', label: '午休', enabled: true },
    { time: '07:00', period: 'AM', repeat: 'weekends', label: '', enabled: false }
  ];

  var REPEAT_LABELS = {
    daily: '每天',
    weekdays: '工作日',
    weekends: '周末',
    none: '仅一次'
  };

  var DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

  // ── 数据加载 ──

  function loadAlarms() {
    if (store) {
      var saved = store.getAll();
      if (saved.length > 0) return saved;
      // 初始化种子数据
      var seed = [];
      if (params.alarm_time) {
        var h = parseInt(params.alarm_time.split(':')[0], 10);
        seed.push({
          time: params.alarm_time,
          period: h >= 12 ? 'PM' : 'AM',
          repeat: params.repeat || 'daily',
          label: params.label || '',
          enabled: true
        });
      }
      if (seed.length === 0) seed = defaultAlarms.slice();
      store.seed(seed);
      return store.getAll();
    }
    return defaultAlarms.slice();
  }

  // ── 工具函数 ──

  function to24Hour(time, period) {
    var parts = time.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  function formatMinutes(totalMin) {
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    if (h > 0 && m > 0) return h + '小时' + m + '分钟后响铃';
    if (h > 0) return h + '小时后响铃';
    if (m > 0) return m + '分钟后响铃';
    return '即将响铃';
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function getRepeatText(alarm) {
    if (alarm.days && alarm.days.length > 0 && alarm.days.length < 7) {
      return alarm.days.map(function(d) { return '周' + DAY_NAMES[d]; }).join(' ');
    }
    if (alarm.days && alarm.days.length === 7) return '每天';
    return REPEAT_LABELS[alarm.repeat] || '每天';
  }

  function shouldAlarmFireToday(alarm) {
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun
    var dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon

    if (alarm.days && alarm.days.length > 0) {
      return alarm.days.indexOf(dayIndex) !== -1;
    }
    if (alarm.repeat === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (alarm.repeat === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    return true; // daily or none
  }

  // ── 倒计时计算 ──

  function updateCountdown(alarms) {
    var el = document.getElementById('countdownText');
    if (!el) return;

    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var bestDiff = Infinity;

    for (var i = 0; i < alarms.length; i++) {
      if (!alarms[i].enabled) continue;
      var alarmMin = to24Hour(alarms[i].time, alarms[i].period);
      var diff;

      if (shouldAlarmFireToday(alarms[i]) && alarmMin > nowMin) {
        diff = alarmMin - nowMin;
      } else {
        // 计算到明天的该闹钟
        diff = (24 * 60 - nowMin) + alarmMin;
      }

      if (diff < bestDiff) bestDiff = diff;
    }

    if (bestDiff === Infinity) {
      el.textContent = '无启用的闹钟';
    } else {
      el.textContent = formatMinutes(bestDiff);
    }
  }

  // ══════════════════════════════════
  //  列表视图
  // ══════════════════════════════════

  function renderListView(alarms) {
    var container = document.getElementById('alarmListContainer');
    if (!container) return;
    container.innerHTML = '';

    // v2.0: 去掉分类，按时间排序平铺
    var sorted = alarms.slice().sort(function(a, b) {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });

    for (var j = 0; j < sorted.length; j++) {
      var alarm = sorted[j];
      // 滑动容器
      var swipeWrap = document.createElement('div');
      swipeWrap.className = 'alarm-swipe-wrap';
      swipeWrap.style.cssText = 'position:relative; overflow:hidden;';

      var row = document.createElement('div');
      row.className = 'alarm-row' + (alarm.enabled ? '' : ' disabled');
      row.style.cssText = 'position:relative; transition:transform 0.2s ease; z-index:1;';

      var display12 = get12HourDisplay(alarm.time, alarm.period);

      row.innerHTML =
        '<div class="alarm-row-left">' +
          '<span class="alarm-time">' + display12.time + '</span>' +
          '<span class="alarm-period">' + display12.period + '</span>' +
        '</div>' +
        '<div class="alarm-detail">' +
          '<span class="alarm-repeat">' + getRepeatText(alarm) + '</span>' +
          (alarm.label ? '<span class="alarm-label">' + alarm.label + '</span>' : '') +
        '</div>' +
        '<div class="alarm-toggle ' + (alarm.enabled ? 'on' : '') + '" data-id="' + alarm.id + '">' +
          '<div class="toggle-knob"></div>' +
        '</div>';

      // 左滑删除按钮（隐藏在右侧）
      var deleteBtn = document.createElement('div');
      deleteBtn.className = 'alarm-delete-reveal';
      deleteBtn.style.cssText = 'position:absolute; right:0; top:0; bottom:0; width:120px; background:rgba(255,60,60,0.85); display:flex; align-items:center; justify-content:center; color:#fff; font-size:28px; font-weight:500; z-index:0; border-radius:0 16px 16px 0;';
      deleteBtn.textContent = '删除';

      swipeWrap.appendChild(deleteBtn);
      swipeWrap.appendChild(row);

      // 左滑手势
      (function(wrap, rowEl, delBtn, alarmId) {
        var startX = 0, currentX = 0, swiping = false;
        rowEl.addEventListener('touchstart', function(e) {
          startX = e.touches[0].clientX;
          swiping = true;
          rowEl.style.transition = 'none';
        }, { passive: true });
        rowEl.addEventListener('touchmove', function(e) {
          if (!swiping) return;
          currentX = e.touches[0].clientX - startX;
          if (currentX < 0) {
            rowEl.style.transform = 'translateX(' + Math.max(currentX, -120) + 'px)';
          }
        }, { passive: true });
        rowEl.addEventListener('touchend', function() {
          swiping = false;
          rowEl.style.transition = 'transform 0.2s ease';
          if (currentX < -60) {
            rowEl.style.transform = 'translateX(-120px)';
          } else {
            rowEl.style.transform = 'translateX(0)';
          }
          currentX = 0;
        }, { passive: true });
        delBtn.addEventListener('click', function() {
          if (store && alarmId) {
            store.remove(alarmId);
            refreshAll();
          }
        });
      })(swipeWrap, row, deleteBtn, alarm.id);

      container.appendChild(swipeWrap);
    }

    // 绑定开关事件
    bindToggles();
  }

  function timeToMinutes(t) {
    var parts = t.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
  }

  function get12HourDisplay(time, period) {
    // 如果已经存储了period，直接用
    if (period) {
      return { time: time, period: period };
    }
    // 否则从24小时制转换
    var parts = time.split(':');
    var h = parseInt(parts[0], 10);
    var m = parts[1];
    var p = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { time: pad(h12) + ':' + m, period: p };
  }

  function bindToggles() {
    var toggles = document.querySelectorAll('.alarm-toggle');
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        toggleAlarm(id);
      });
    }
  }

  function toggleAlarm(id) {
    if (!store) return;
    var alarm = store.getById(id);
    if (!alarm) return;
    store.update(id, { enabled: !alarm.enabled });
    refreshAll();
  }

  // ══════════════════════════════════
  //  表盘视图
  // ══════════════════════════════════

  function renderDialView(alarms) {
    drawClockFace(alarms);
    renderDialInfo(alarms);
    renderDialAlarmList(alarms);
  }

  function drawClockFace(alarms) {
    var svg = document.getElementById('clockFace');
    if (!svg) return;
    svg.innerHTML = '';

    var cx = 200, cy = 200, r = 170;

    // 外圈
    var rim = createSVG('circle', { cx: cx, cy: cy, r: r, class: 'clock-rim' });
    svg.appendChild(rim);

    // 刻度
    for (var i = 0; i < 60; i++) {
      var angle = (i * 6 - 90) * Math.PI / 180;
      var isMajor = (i % 5 === 0);
      var innerR = isMajor ? r - 16 : r - 10;
      var outerR = r - 4;

      var tick = createSVG('line', {
        x1: cx + innerR * Math.cos(angle),
        y1: cy + innerR * Math.sin(angle),
        x2: cx + outerR * Math.cos(angle),
        y2: cy + outerR * Math.sin(angle),
        class: isMajor ? 'clock-tick-major' : 'clock-tick'
      });
      svg.appendChild(tick);
    }

    // 数字 1-12
    for (var n = 1; n <= 12; n++) {
      var numAngle = (n * 30 - 90) * Math.PI / 180;
      var numR = r - 36;
      var text = createSVG('text', {
        x: cx + numR * Math.cos(numAngle),
        y: cy + numR * Math.sin(numAngle),
        class: 'clock-number'
      });
      text.textContent = n;
      svg.appendChild(text);
    }

    // 闹钟标记
    for (var a = 0; a < alarms.length; a++) {
      var alarm = alarms[a];
      var alarmMin = to24Hour(alarm.time, alarm.period);
      // 将24小时映射到12小时表盘
      var hour12 = (alarmMin / 60) % 12;
      var markerAngle = (hour12 * 30 - 90) * Math.PI / 180;
      var markerR = r - 4;

      var marker = createSVG('circle', {
        cx: cx + markerR * Math.cos(markerAngle),
        cy: cy + markerR * Math.sin(markerAngle),
        r: 6,
        class: alarm.enabled ? 'alarm-marker' : 'alarm-marker-disabled'
      });
      svg.appendChild(marker);
    }

    // 指针 — 指向下一个启用的闹钟
    var nextAlarm = getNextEnabledAlarm(alarms);
    if (nextAlarm) {
      var nextMin = to24Hour(nextAlarm.time, nextAlarm.period);
      var nextHour12 = (nextMin / 60) % 12;
      var nextMinPart = nextMin % 60;

      // 时针
      var hourAngle = ((nextHour12 + nextMinPart / 60) * 30 - 90) * Math.PI / 180;
      var hourLen = 90;
      var hourHand = createSVG('line', {
        x1: cx, y1: cy,
        x2: cx + hourLen * Math.cos(hourAngle),
        y2: cy + hourLen * Math.sin(hourAngle),
        class: 'clock-hand-hour'
      });
      svg.appendChild(hourHand);

      // 分针
      var minAngle = (nextMinPart * 6 - 90) * Math.PI / 180;
      var minLen = 120;
      var minHand = createSVG('line', {
        x1: cx, y1: cy,
        x2: cx + minLen * Math.cos(minAngle),
        y2: cy + minLen * Math.sin(minAngle),
        class: 'clock-hand-minute'
      });
      svg.appendChild(minHand);
    }

    // 中心点
    var dot = createSVG('circle', { cx: cx, cy: cy, r: 5, class: 'clock-center-dot' });
    svg.appendChild(dot);
  }

  function createSVG(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (attrs.hasOwnProperty(k)) {
        el.setAttribute(k, attrs[k]);
      }
    }
    return el;
  }

  function getNextEnabledAlarm(alarms) {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var bestDiff = Infinity;
    var bestAlarm = null;

    for (var i = 0; i < alarms.length; i++) {
      if (!alarms[i].enabled) continue;
      var alarmMin = to24Hour(alarms[i].time, alarms[i].period);
      var diff;

      if (shouldAlarmFireToday(alarms[i]) && alarmMin > nowMin) {
        diff = alarmMin - nowMin;
      } else {
        diff = (24 * 60 - nowMin) + alarmMin;
      }

      if (diff < bestDiff) {
        bestDiff = diff;
        bestAlarm = alarms[i];
      }
    }

    return bestAlarm;
  }

  function renderDialInfo(alarms) {
    var timeEl = document.getElementById('dialTime');
    var countdownEl = document.getElementById('dialCountdown');

    var next = getNextEnabledAlarm(alarms);
    if (next && timeEl) {
      var display = get12HourDisplay(next.time, next.period);
      timeEl.textContent = display.time + ' ' + display.period;
    } else if (timeEl) {
      timeEl.textContent = '--:-- --';
    }

    if (countdownEl) {
      var now = new Date();
      var nowMin = now.getHours() * 60 + now.getMinutes();
      if (next) {
        var alarmMin = to24Hour(next.time, next.period);
        var diff;
        if (shouldAlarmFireToday(next) && alarmMin > nowMin) {
          diff = alarmMin - nowMin;
        } else {
          diff = (24 * 60 - nowMin) + alarmMin;
        }
        countdownEl.textContent = formatMinutes(diff);
      } else {
        countdownEl.textContent = '无启用的闹钟';
      }
    }
  }

  function renderDialAlarmList(alarms) {
    var container = document.getElementById('dialAlarmList');
    if (!container) return;
    container.innerHTML = '';

    for (var i = 0; i < alarms.length; i++) {
      var alarm = alarms[i];
      var display = get12HourDisplay(alarm.time, alarm.period);
      var row = document.createElement('div');
      row.className = 'dial-alarm-row' + (alarm.enabled ? '' : ' disabled');
      row.innerHTML =
        '<span class="dial-alarm-time">' + display.time + '</span>' +
        '<span class="dial-alarm-period">' + display.period + '</span>' +
        (alarm.label ? '<span class="dial-alarm-label">' + alarm.label + '</span>' : '<span class="dial-alarm-label"></span>') +
        '<span class="dial-alarm-dot"></span>';
      container.appendChild(row);
    }
  }

  // ══════════════════════════════════
  //  新建闹钟浮层
  // ══════════════════════════════════

  function openNewAlarmOverlay() {
    // 状态
    var selectedHour = 8;
    var selectedMinute = 0;
    var selectedPeriod = 'AM';
    var selectedDays = [];
    var labelText = '';

    // 创建DOM
    var backdrop = document.createElement('div');
    backdrop.className = 'new-alarm-backdrop';

    var panel = document.createElement('div');
    panel.className = 'new-alarm-panel';

    // Header
    var header = document.createElement('div');
    header.className = 'new-alarm-header';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'new-alarm-header-btn cancel';
    cancelBtn.textContent = '取消';

    var titleEl = document.createElement('span');
    titleEl.className = 'new-alarm-header-title';
    titleEl.textContent = '新建闹钟';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'new-alarm-header-btn save';
    saveBtn.textContent = '保存';

    header.appendChild(cancelBtn);
    header.appendChild(titleEl);
    header.appendChild(saveBtn);

    // 时间显示
    var timeDisplay = document.createElement('div');
    timeDisplay.className = 'new-alarm-time-display';
    var timeText = document.createElement('span');
    timeText.className = 'new-alarm-time-text';
    timeDisplay.appendChild(timeText);

    // 时间选择器
    var pickers = document.createElement('div');
    pickers.className = 'new-alarm-pickers';

    // 小时列
    var hourCol = document.createElement('div');
    hourCol.className = 'picker-column';
    var hourUp = document.createElement('button');
    hourUp.className = 'picker-btn';
    hourUp.innerHTML = '&#9650;';
    var hourValue = document.createElement('div');
    hourValue.className = 'picker-value';
    var hourDown = document.createElement('button');
    hourDown.className = 'picker-btn';
    hourDown.innerHTML = '&#9660;';
    var hourLabel = document.createElement('div');
    hourLabel.className = 'picker-label';
    hourLabel.textContent = '时';

    hourCol.appendChild(hourUp);
    hourCol.appendChild(hourValue);
    hourCol.appendChild(hourDown);
    hourCol.appendChild(hourLabel);

    // 分隔符
    var sep = document.createElement('div');
    sep.className = 'picker-separator';
    sep.textContent = ':';

    // 分钟列
    var minCol = document.createElement('div');
    minCol.className = 'picker-column';
    var minUp = document.createElement('button');
    minUp.className = 'picker-btn';
    minUp.innerHTML = '&#9650;';
    var minValue = document.createElement('div');
    minValue.className = 'picker-value';
    var minDown = document.createElement('button');
    minDown.className = 'picker-btn';
    minDown.innerHTML = '&#9660;';
    var minLabel = document.createElement('div');
    minLabel.className = 'picker-label';
    minLabel.textContent = '分';

    minCol.appendChild(minUp);
    minCol.appendChild(minValue);
    minCol.appendChild(minDown);
    minCol.appendChild(minLabel);

    // AM/PM
    var ampmContainer = document.createElement('div');
    ampmContainer.className = 'ampm-toggle';
    var amBtn = document.createElement('button');
    amBtn.className = 'ampm-btn';
    amBtn.textContent = 'AM';
    var pmBtn = document.createElement('button');
    pmBtn.className = 'ampm-btn';
    pmBtn.textContent = 'PM';
    ampmContainer.appendChild(amBtn);
    ampmContainer.appendChild(pmBtn);

    pickers.appendChild(hourCol);
    pickers.appendChild(sep);
    pickers.appendChild(minCol);
    pickers.appendChild(ampmContainer);

    // 重复设置
    var repeatSection = document.createElement('div');
    repeatSection.className = 'new-alarm-section';
    var repeatTitle = document.createElement('div');
    repeatTitle.className = 'new-alarm-section-title';
    repeatTitle.textContent = '重复';
    repeatSection.appendChild(repeatTitle);

    var daysRow = document.createElement('div');
    daysRow.className = 'repeat-days';

    var dayBtns = [];
    for (var d = 0; d < 7; d++) {
      var dayBtn = document.createElement('button');
      dayBtn.className = 'day-circle';
      dayBtn.textContent = DAY_NAMES[d];
      dayBtn.setAttribute('data-day', d);
      daysRow.appendChild(dayBtn);
      dayBtns.push(dayBtn);
    }
    repeatSection.appendChild(daysRow);

    // 快捷预设
    var presetsRow = document.createElement('div');
    presetsRow.className = 'repeat-presets';

    var presetWeekdays = document.createElement('button');
    presetWeekdays.className = 'preset-btn';
    presetWeekdays.textContent = '工作日';

    var presetDaily = document.createElement('button');
    presetDaily.className = 'preset-btn';
    presetDaily.textContent = '每天';

    var presetWeekends = document.createElement('button');
    presetWeekends.className = 'preset-btn';
    presetWeekends.textContent = '周末';

    presetsRow.appendChild(presetWeekdays);
    presetsRow.appendChild(presetDaily);
    presetsRow.appendChild(presetWeekends);
    repeatSection.appendChild(presetsRow);

    // 标签输入
    var labelSection = document.createElement('div');
    labelSection.className = 'new-alarm-section';
    var labelTitle = document.createElement('div');
    labelTitle.className = 'new-alarm-section-title';
    labelTitle.textContent = '标签';
    var labelInput = document.createElement('input');
    labelInput.className = 'new-alarm-label-input';
    labelInput.type = 'text';
    labelInput.placeholder = '闹钟标签（可选）';
    labelInput.maxLength = 20;
    labelSection.appendChild(labelTitle);
    labelSection.appendChild(labelInput);

    // 底部间距
    var spacer = document.createElement('div');
    spacer.className = 'new-alarm-bottom-spacer';

    // 组装
    panel.appendChild(header);
    panel.appendChild(timeDisplay);
    panel.appendChild(pickers);
    panel.appendChild(repeatSection);
    panel.appendChild(labelSection);
    panel.appendChild(spacer);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    // ── 更新显示 ──

    function updateTimeDisplay() {
      timeText.innerHTML = pad(selectedHour) +
        '<span class="new-alarm-time-colon">:</span>' +
        pad(selectedMinute) +
        ' <span style="font-size:48px;color:rgba(245,245,240,0.4);">' + selectedPeriod + '</span>';
      hourValue.textContent = pad(selectedHour);
      minValue.textContent = pad(selectedMinute);

      amBtn.className = 'ampm-btn' + (selectedPeriod === 'AM' ? ' active' : '');
      pmBtn.className = 'ampm-btn' + (selectedPeriod === 'PM' ? ' active' : '');
    }

    function updateDayButtons() {
      for (var i = 0; i < dayBtns.length; i++) {
        var idx = parseInt(dayBtns[i].getAttribute('data-day'), 10);
        dayBtns[i].className = 'day-circle' + (selectedDays.indexOf(idx) !== -1 ? ' active' : '');
      }
      // 更新预设按钮高亮
      var weekdaySet = [0, 1, 2, 3, 4];
      var weekendSet = [5, 6];
      var allSet = [0, 1, 2, 3, 4, 5, 6];

      presetWeekdays.className = 'preset-btn' + (arraysEqual(selectedDays.slice().sort(), weekdaySet) ? ' active' : '');
      presetDaily.className = 'preset-btn' + (arraysEqual(selectedDays.slice().sort(), allSet) ? ' active' : '');
      presetWeekends.className = 'preset-btn' + (arraysEqual(selectedDays.slice().sort(), weekendSet) ? ' active' : '');
    }

    function arraysEqual(a, b) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    // ── 事件绑定 ──

    hourUp.addEventListener('click', function() {
      selectedHour = selectedHour >= 12 ? 1 : selectedHour + 1;
      updateTimeDisplay();
    });

    hourDown.addEventListener('click', function() {
      selectedHour = selectedHour <= 1 ? 12 : selectedHour - 1;
      updateTimeDisplay();
    });

    minUp.addEventListener('click', function() {
      selectedMinute = selectedMinute >= 55 ? 0 : selectedMinute + 5;
      updateTimeDisplay();
    });

    minDown.addEventListener('click', function() {
      selectedMinute = selectedMinute <= 0 ? 55 : selectedMinute - 5;
      updateTimeDisplay();
    });

    amBtn.addEventListener('click', function() {
      selectedPeriod = 'AM';
      updateTimeDisplay();
    });

    pmBtn.addEventListener('click', function() {
      selectedPeriod = 'PM';
      updateTimeDisplay();
    });

    // 日期圈点击
    for (var di = 0; di < dayBtns.length; di++) {
      dayBtns[di].addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-day'), 10);
        var pos = selectedDays.indexOf(idx);
        if (pos !== -1) {
          selectedDays.splice(pos, 1);
        } else {
          selectedDays.push(idx);
          selectedDays.sort();
        }
        updateDayButtons();
      });
    }

    // 预设按钮
    presetWeekdays.addEventListener('click', function() {
      selectedDays = [0, 1, 2, 3, 4];
      updateDayButtons();
    });

    presetDaily.addEventListener('click', function() {
      selectedDays = [0, 1, 2, 3, 4, 5, 6];
      updateDayButtons();
    });

    presetWeekends.addEventListener('click', function() {
      selectedDays = [5, 6];
      updateDayButtons();
    });

    // 关闭/保存
    function close() {
      backdrop.classList.remove('visible');
      setTimeout(function() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 300);
    }

    cancelBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      close();
    });

    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) close();
    });

    saveBtn.addEventListener('click', function(e) {
      e.stopPropagation();

      var repeatVal = 'daily';
      if (selectedDays.length > 0 && selectedDays.length < 7) {
        var weekdayCheck = [0, 1, 2, 3, 4];
        var weekendCheck = [5, 6];
        if (arraysEqual(selectedDays, weekdayCheck)) {
          repeatVal = 'weekdays';
        } else if (arraysEqual(selectedDays, weekendCheck)) {
          repeatVal = 'weekends';
        } else {
          repeatVal = 'custom';
        }
      } else if (selectedDays.length === 7) {
        repeatVal = 'daily';
      }

      var newAlarm = {
        time: pad(selectedHour) + ':' + pad(selectedMinute),
        period: selectedPeriod,
        repeat: repeatVal,
        days: selectedDays.length > 0 ? selectedDays : null,
        label: labelInput.value.trim(),
        enabled: true,
        category: '自定义'
      };

      if (store) {
        store.add(newAlarm);
      }

      close();
      refreshAll();
    });

    // 初始化显示
    updateTimeDisplay();
    updateDayButtons();

    // 动画展示
    backdrop.offsetHeight;
    backdrop.classList.add('visible');
  }

  // ══════════════════════════════════
  //  视图切换
  // ══════════════════════════════════

  function initStyleSwitch() {
    var listView = document.getElementById('alarmListView');
    var dialView = document.getElementById('alarmDialView');
    var menu = document.querySelector('.alarm-menu');

    if (displayStyle === 'dial') {
      if (listView) listView.style.display = 'none';
      if (dialView) dialView.style.display = '';
    } else {
      if (listView) listView.style.display = '';
      if (dialView) dialView.style.display = 'none';
    }

    // 点击菜单切换视图
    if (menu) {
      menu.addEventListener('click', function() {
        if (displayStyle === 'list') {
          displayStyle = 'dial';
          if (listView) listView.style.display = 'none';
          if (dialView) dialView.style.display = '';
        } else {
          displayStyle = 'list';
          if (listView) listView.style.display = '';
          if (dialView) dialView.style.display = 'none';
        }
        refreshAll();
      });
    }
  }

  // ══════════════════════════════════
  //  刷新全部
  // ══════════════════════════════════

  function refreshAll() {
    var alarms = loadAlarms();
    updateCountdown(alarms);

    if (displayStyle === 'dial') {
      renderDialView(alarms);
    } else {
      renderListView(alarms);
    }
  }

  // ══════════════════════════════════
  //  初始化
  // ══════════════════════════════════

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

    // 动态配色引擎
    if (params.primary_color && window.computePalette) {
      var palette = window.computePalette(params.primary_color, 'clean');
      Object.keys(palette.cssVars).forEach(function(k) {
        document.documentElement.style.setProperty(k, palette.cssVars[k]);
      });
      document.documentElement.setAttribute('data-style', 'dynamic');
    }

    // 视觉风格宏
    if (params.visual_style) {
      document.documentElement.setAttribute('data-visual-style', params.visual_style);
    }

    // preview 模式：示例提醒在预览页外部显示（DESIGN.md §4.1）

    // 初始化视图切换
    initStyleSwitch();

    // FAB 按钮
    var fab = document.getElementById('fabAddAlarm');
    if (fab) {
      fab.addEventListener('click', function() {
        openNewAlarmOverlay();
      });
    }

    // 首次渲染
    refreshAll();

    // 每分钟更新倒计时
    setInterval(function() {
      var alarms = loadAlarms();
      updateCountdown(alarms);
    }, 60000);

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
