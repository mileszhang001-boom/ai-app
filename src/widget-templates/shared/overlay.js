/**
 * Overlay — 通用弹窗组件
 * createOverlay() / createFullscreenOverlay()
 * ~3KB
 */

(function() {
  'use strict';

  /**
   * createOverlay({
   *   title: '标题',
   *   theme: 'dark' | 'light',
   *   showSave: true,
   *   saveText: '保存',
   *   cancelText: '取消',
   *   onSave: (data) => {},
   *   onCancel: () => {},
   *   content: (bodyEl) => {}   // 各模板在这里填充自己的表单
   * })
   *
   * 返回 { show(), hide(), destroy(), body, backdrop }
   */
  function createOverlay(opts) {
    opts = opts || {};
    var theme = opts.theme || 'dark';
    var showSave = opts.showSave !== false;

    // ── DOM 构建 ──
    var backdrop = document.createElement('div');
    backdrop.className = 'overlay-backdrop';
    if (theme !== 'dark') backdrop.setAttribute('data-overlay-theme', theme);

    var panel = document.createElement('div');
    panel.className = 'overlay-panel';

    // Header
    var header = document.createElement('div');
    header.className = 'overlay-header';
    header.style.position = 'relative';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'overlay-header-btn cancel';
    cancelBtn.textContent = opts.cancelText || '取消';

    var title = document.createElement('span');
    title.className = 'overlay-header-title';
    title.textContent = opts.title || '';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'overlay-header-btn save';
    saveBtn.textContent = opts.saveText || '保存';
    if (!showSave) saveBtn.style.visibility = 'hidden';

    header.appendChild(cancelBtn);
    header.appendChild(title);
    header.appendChild(saveBtn);

    var divider = document.createElement('div');
    divider.className = 'overlay-header-divider';

    // Body
    var body = document.createElement('div');
    body.className = 'overlay-body';

    panel.appendChild(header);
    panel.appendChild(divider);
    panel.appendChild(body);
    backdrop.appendChild(panel);

    // ── 事件 ──
    var destroyed = false;

    function hide() {
      if (destroyed) return;
      backdrop.classList.remove('visible');
      setTimeout(function() { destroy(); }, 300);
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelBtn.removeEventListener('click', onCancel);
      saveBtn.removeEventListener('click', onSave);
      backdrop.removeEventListener('click', onBackdropClick);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    function onCancel(e) {
      e.stopPropagation();
      if (opts.onCancel) opts.onCancel();
      hide();
    }

    function onSave(e) {
      e.stopPropagation();
      if (opts.onSave) opts.onSave();
      // onSave 决定是否关闭：如果需要验证，在 onSave 内手动调用 hide()
    }

    function onBackdropClick(e) {
      if (e.target === backdrop) {
        if (opts.onCancel) opts.onCancel();
        hide();
      }
    }

    cancelBtn.addEventListener('click', onCancel);
    saveBtn.addEventListener('click', onSave);
    backdrop.addEventListener('click', onBackdropClick);

    // 填充内容
    if (opts.content) opts.content(body);

    // ── API ──
    var api = {
      show: function() {
        if (destroyed) return;
        document.body.appendChild(backdrop);
        // 强制 reflow 再添加 class，确保动画触发
        backdrop.offsetHeight;
        backdrop.classList.add('visible');
      },
      hide: hide,
      destroy: destroy,
      body: body,
      backdrop: backdrop,
      panel: panel
    };

    return api;
  }

  /**
   * createFullscreenOverlay({
   *   background: '#0A0E14',
   *   content: (containerEl) => {},
   *   onClose: () => {}
   * })
   *
   * 全屏 overlay，用于新闻详情等
   */
  function createFullscreenOverlay(opts) {
    opts = opts || {};

    var container = document.createElement('div');
    container.className = 'overlay-fullscreen';
    container.style.background = opts.background || '#0A0E14';

    var destroyed = false;

    if (opts.content) opts.content(container);

    function hide() {
      if (destroyed) return;
      container.classList.remove('visible');
      setTimeout(function() { destroy(); }, 300);
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      if (container.parentNode) container.parentNode.removeChild(container);
    }

    return {
      show: function() {
        if (destroyed) return;
        document.body.appendChild(container);
        container.offsetHeight;
        container.classList.add('visible');
      },
      hide: hide,
      destroy: destroy,
      container: container
    };
  }

  window.createOverlay = createOverlay;
  window.createFullscreenOverlay = createFullscreenOverlay;
})();
