/**
 * 页面路由器
 */

export class PageRouter {
  constructor() {
    this.pages = {};
    this.currentPage = null;
    this.currentPageName = null;
    this.currentParams = {};
    this.pageStack = [];
  }

  register(name, page) {
    this.pages[name] = page;
  }

  navigate(pageName, params = {}) {
    const page = this.pages[pageName];
    if (!page) {
      console.error(`Page not found: ${pageName}`);
      return;
    }

    // 清理残留浮层
    document.querySelectorAll('.generate-overlay, .tweak-sheet-overlay, .sync-success-overlay').forEach(el => el.remove());

    if (this.currentPageName) {
      this.pageStack.push({
        name: this.currentPageName,
        params: this.currentParams
      });
    }

    document.querySelectorAll('.page').forEach(el => {
      el.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageName);
    });

    const pageElement = document.getElementById(`page-${pageName}`);
    if (pageElement) {
      pageElement.classList.add('active');
    }

    page.render(params);
    this.currentPageName = pageName;
    this.currentParams = params;
    this.currentPage = page;

    if (params.updateUrl !== false) {
      history.pushState({ page: pageName, params }, '', `#${pageName}`);
    }
  }

  back() {
    // 清理残留浮层
    document.querySelectorAll('.generate-overlay, .tweak-sheet-overlay, .sync-success-overlay').forEach(el => el.remove());

    if (this.pageStack.length > 0) {
      const prev = this.pageStack.pop();
      const page = this.pages[prev.name];
      if (!page) return;

      document.querySelectorAll('.page').forEach(el => {
        el.classList.remove('active');
      });
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === prev.name);
      });
      const pageElement = document.getElementById(`page-${prev.name}`);
      if (pageElement) {
        pageElement.classList.add('active');
      }

      page.render(prev.params);
      this.currentPageName = prev.name;
      this.currentParams = prev.params;
      this.currentPage = page;
    }
  }
}
