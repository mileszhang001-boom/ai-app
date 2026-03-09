/**
 * 车端 WebView 容器
 *
 * 负责：
 * - 管理 iframe/WebView 的生命周期
 * - 向组件注入参数（通过 postMessage）
 * - 组件可见性管理（不可见时暂停动画/定时器）
 * - 错误捕获和自动重载
 */

const MAX_RELOAD_ATTEMPTS = 3;
const RELOAD_DELAY = 2000;

export class WebViewContainer {
  /**
   * @param {HTMLIFrameElement} iframe
   */
  constructor(iframe) {
    this.iframe = iframe;
    this.currentURL = null;
    this.currentParams = null;
    this.reloadAttempts = 0;
    this.visible = true;

    this._bindErrorHandler();
  }

  /**
   * 加载组件
   * @param {string} url - 组件模板 URL
   * @param {Object} params - 注入参数
   */
  load(url, params = {}) {
    this.currentURL = url;
    this.currentParams = params;
    this.reloadAttempts = 0;

    this.iframe.src = url;

    this.iframe.onload = () => {
      this.reloadAttempts = 0;
      this._injectParams(params);
      this._setVisibility(this.visible);
    };

    this.iframe.onerror = () => {
      this._handleError();
    };
  }

  /**
   * 向组件注入参数
   */
  _injectParams(params) {
    try {
      this.iframe.contentWindow.postMessage({
        type: 'widget-params',
        params: params
      }, '*');
    } catch (e) {
      console.warn('[WebView] Failed to inject params:', e.message);
    }
  }

  /**
   * 更新参数（不重新加载）
   */
  updateParams(params) {
    this.currentParams = { ...this.currentParams, ...params };
    this._injectParams(this.currentParams);
  }

  /**
   * 设置可见性
   * 不可见时通知组件暂停动画/定时器
   */
  setVisible(visible) {
    this.visible = visible;
    this._setVisibility(visible);
  }

  _setVisibility(visible) {
    try {
      this.iframe.contentWindow.postMessage({
        type: 'widget-visibility',
        visible: visible
      }, '*');
    } catch {}
  }

  /**
   * 错误处理 + 自动重载
   */
  _handleError() {
    if (this.reloadAttempts < MAX_RELOAD_ATTEMPTS) {
      this.reloadAttempts++;
      console.warn(`[WebView] Reload attempt ${this.reloadAttempts}/${MAX_RELOAD_ATTEMPTS}`);
      setTimeout(() => {
        if (this.currentURL) {
          this.iframe.src = this.currentURL;
        }
      }, RELOAD_DELAY);
    } else {
      console.error('[WebView] Max reload attempts reached');
    }
  }

  _bindErrorHandler() {
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'widget-error') {
        console.error('[WebView] Widget error:', e.data.error);
        this._handleError();
      }
    });
  }

  /**
   * 销毁容器
   */
  destroy() {
    this.iframe.src = 'about:blank';
    this.iframe.onload = null;
    this.iframe.onerror = null;
    this.currentURL = null;
    this.currentParams = null;
  }
}
