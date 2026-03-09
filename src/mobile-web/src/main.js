/**
 * AI小组件手机端主入口
 */

import { PageRouter } from './router.js';
import { APIClient } from './api.js';
import { TemplateMarket } from './pages/market.js';
import { ConfigPage } from './pages/config.js';
import { PreviewPage } from './pages/preview.js';
import { MyWidgetsPage } from './pages/my-widgets.js';
import { SyncPage } from './pages/sync.js';

// API 客户端（使用相对路径，由 Vite 代理到后端）
const api = new APIClient('');

// 页面路由器
const router = new PageRouter();

// 初始化页面
const marketPage = new TemplateMarket(api, router);
const configPage = new ConfigPage(api, router);
const previewPage = new PreviewPage(api, router);
const myWidgetsPage = new MyWidgetsPage(api, router);
const syncPage = new SyncPage(api, router);

// 注册页面
router.register('market', marketPage);
router.register('config', configPage);
router.register('preview', previewPage);
router.register('my-widgets', myWidgetsPage);
router.register('sync', syncPage);

// 底部导航处理
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = item.dataset.page;
    router.navigate(pageName);
  });
});

// 初始页面
router.navigate('market');

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) {
    const pageName = e.state.page;
    const page = router.pages[pageName];
    if (page) {
      document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageName);
      });
      const pageEl = document.getElementById(`page-${pageName}`);
      if (pageEl) pageEl.classList.add('active');
      page.render(e.state.params || {});
      router.currentPageName = pageName;
      router.currentParams = e.state.params || {};
      router.currentPage = page;
    }
  } else {
    router.back();
  }
});

// Toast 提示函数
let toastTimer = null;

export function showToast(message, type = 'info') {
  // 清除之前的定时器
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  // 移除旧的 toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.maxWidth = '80vw';
  document.body.appendChild(toast);

  // 强制重绘
  toast.offsetHeight;

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 2000);
}

// 导出 API 实例供其他模块使用
export { api };
