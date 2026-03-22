/**
 * AI小组件手机端主入口
 */

import { PageRouter } from './router.js';
import { APIClient } from './api.js';
import { TemplateMarket } from './pages/market.js';
import { PreviewPage } from './pages/preview.js';
import { FineTunePage } from './pages/finetune.js';

// API 客户端（使用相对路径，由 Vite 代理到后端）
const api = new APIClient('');

// 页面路由器
const router = new PageRouter();

// 初始化页面
const marketPage = new TemplateMarket(api, router);
const previewPage = new PreviewPage(api, router);
const finetunePage = new FineTunePage(api, router);

// 注册页面
router.register('market', marketPage);
router.register('preview', previewPage);
router.register('finetune', finetunePage);

// 初始页面
router.navigate('market');

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) {
    const pageName = e.state.page;
    const page = router.pages[pageName];
    if (page) {
      document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
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
  if (toastTimer) clearTimeout(toastTimer);

  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  toast.offsetHeight;
  requestAnimationFrame(() => toast.classList.add('show'));

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  }, 2000);
}

export { api };
