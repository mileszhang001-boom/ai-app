/**
 * API 客户端
 */

export class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async request(url, options = {}) {
    const fullUrl = `${this.baseURL}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }

    return response.json();
  }

  async get(url) {
    return this.request(url, { method: 'GET' });
  }

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  // 获取所有模板
  async getTemplates() {
    return this.get('/api/templates');
  }

  // 获取模板 schema
  async getTemplateSchema(type, theme) {
    return this.get(`/api/templates/${type}/${theme}`);
  }

  // AI 生成组件
  async generateComponent(data) {
    return this.post('/api/generate', data);
  }

  // 渲染组件
  async renderComponent(data) {
    return this.post('/api/render', data);
  }

  // 同步到车机
  async syncToCar(data) {
    return this.post('/api/sync', data);
  }

  // 获取同步状态
  async getSyncStatus(syncId) {
    return this.get(`/api/sync/${syncId}`);
  }

  // 获取新闻
  async getNews(category = 'general', limit = 5) {
    return this.get(`/api/news?category=${category}&limit=${limit}`);
  }

  // 获取用户组件列表 (修复: widgets 而不是 components)
  async getUserWidgets(userId = 'demo_user') {
    return this.get(`/api/widgets/user/${userId}`);
  }

  // 创建/更新组件
  async saveWidget(data) {
    return this.post('/api/widgets', data);
  }

  // 获取单个组件
  async getWidget(widgetId) {
    return this.get(`/api/widgets/${widgetId}`);
  }

  // 删除组件
  async deleteWidget(widgetId) {
    return this.delete(`/api/widgets/${widgetId}`);
  }

  // 兼容旧方法名
  async getComponents() {
    return this.getUserWidgets();
  }

  async getComponent(componentId) {
    return this.getWidget(componentId);
  }

  async deleteComponent(componentId) {
    return this.deleteWidget(componentId);
  }
}
