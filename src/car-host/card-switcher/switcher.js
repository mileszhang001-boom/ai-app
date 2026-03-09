/**
 * 车端卡片切换器
 *
 * 负责：
 * - 管理多组件切换（← → 按钮 + 圆点指示器）
 * - 切换动画（左右滑动过渡，200ms）
 * - 自动隐藏箭头（3秒无操作后淡出）
 * - 记住上次查看的组件索引
 */

const HIDE_DELAY = 3000;  // 箭头自动隐藏延迟
const ANIM_DURATION = 200; // 切换动画时长 ms

export class CardSwitcher {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - 容器元素
   * @param {HTMLIFrameElement} options.iframe - 组件渲染 iframe
   * @param {Function} options.onSwitch - 切换回调 (index, widget) => void
   */
  constructor(options) {
    this.container = options.container;
    this.iframe = options.iframe;
    this.onSwitch = options.onSwitch || (() => {});

    this.widgets = [];
    this.currentIndex = 0;
    this.hideTimer = null;

    this._createControls();
    this._bindEvents();
    this._restoreIndex();
  }

  /**
   * 创建导航控件 DOM
   */
  _createControls() {
    // 左箭头
    this.leftArrow = this._createElement('div', 'card-nav-arrow card-nav-left', `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <polyline points="15 18 9 12 15 6" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);
    this.leftArrow.addEventListener('click', () => this.prev());

    // 右箭头
    this.rightArrow = this._createElement('div', 'card-nav-arrow card-nav-right', `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <polyline points="9 6 15 12 9 18" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);
    this.rightArrow.addEventListener('click', () => this.next());

    // 圆点指示器
    this.dotContainer = this._createElement('div', 'card-dot-indicator');

    this.container.appendChild(this.leftArrow);
    this.container.appendChild(this.rightArrow);
    this.container.appendChild(this.dotContainer);
  }

  _createElement(tag, className, innerHTML = '') {
    const el = document.createElement(tag);
    el.className = className;
    el.innerHTML = innerHTML;
    return el;
  }

  /**
   * 绑定事件
   */
  _bindEvents() {
    // 键盘
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // 触摸/鼠标 → 重置隐藏计时
    this.container.addEventListener('mousemove', () => this._resetHideTimer());
    this.container.addEventListener('touchstart', () => this._resetHideTimer());
  }

  /**
   * 设置组件列表
   */
  setWidgets(widgets) {
    this.widgets = widgets || [];
    const shouldHide = this.widgets.length <= 1;

    this.leftArrow.style.display = shouldHide ? 'none' : '';
    this.rightArrow.style.display = shouldHide ? 'none' : '';
    this.dotContainer.style.display = shouldHide ? 'none' : '';

    if (this.currentIndex >= this.widgets.length) {
      this.currentIndex = 0;
    }

    this._updateDots();

    if (this.widgets.length > 0) {
      this._loadCurrent();
    }
  }

  /**
   * 切换到下一个
   */
  next() {
    if (this.widgets.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.widgets.length;
    this._loadCurrent('right');
    this._saveIndex();
  }

  /**
   * 切换到上一个
   */
  prev() {
    if (this.widgets.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.widgets.length) % this.widgets.length;
    this._loadCurrent('left');
    this._saveIndex();
  }

  /**
   * 加载当前组件
   */
  _loadCurrent(direction) {
    const widget = this.widgets[this.currentIndex];
    if (!widget) return;

    // 动画
    if (direction) {
      this.iframe.style.transition = 'none';
      this.iframe.style.opacity = '0';
      this.iframe.style.transform = direction === 'right' ? 'translateX(30px)' : 'translateX(-30px)';
      void this.iframe.offsetWidth; // reflow
      this.iframe.style.transition = `opacity ${ANIM_DURATION}ms ease-out, transform ${ANIM_DURATION}ms ease-out`;
      this.iframe.style.opacity = '1';
      this.iframe.style.transform = 'translateX(0)';
    }

    this._updateDots();
    this._resetHideTimer();
    this.onSwitch(this.currentIndex, widget);
  }

  /**
   * 更新圆点
   */
  _updateDots() {
    this.dotContainer.innerHTML = this.widgets.map((_, i) => {
      const active = i === this.currentIndex;
      return `<span style="
        display:inline-block;
        width:${active ? '16px' : '6px'};
        height:6px;
        border-radius:${active ? '3px' : '50%'};
        background:rgba(255,255,255,${active ? '0.9' : '0.3'});
        transition:all 0.3s ease;
        margin:0 3px;
      "></span>`;
    }).join('');
  }

  /**
   * 自动隐藏箭头
   */
  _resetHideTimer() {
    clearTimeout(this.hideTimer);
    this.leftArrow.style.opacity = '0.3';
    this.rightArrow.style.opacity = '0.3';

    this.hideTimer = setTimeout(() => {
      this.leftArrow.style.opacity = '0';
      this.rightArrow.style.opacity = '0';
    }, HIDE_DELAY);
  }

  /**
   * 持久化当前索引
   */
  _saveIndex() {
    try {
      localStorage.setItem('car_widget_index', String(this.currentIndex));
    } catch {}
  }

  _restoreIndex() {
    try {
      const saved = localStorage.getItem('car_widget_index');
      if (saved !== null) {
        this.currentIndex = parseInt(saved, 10) || 0;
      }
    } catch {}
  }
}
