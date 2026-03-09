/**
 * 模板市场页面
 */

export class TemplateMarket {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.templates = null;
  }

  async render() {
    const container = document.getElementById('page-market');

    if (!this.templates) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
        </div>
      `;

      try {
        const response = await this.api.getTemplates();
        this.templates = response.templates || response;
      } catch (error) {
        console.error('加载模板失败:', error);
        // 即使API失败，也显示默认模板，不影响用户使用
        this.templates = this.getDefaultTemplates();
      }
    }

    this.renderTemplateGrid(container);
  }

  getDefaultTemplates() {
    // API失败时的默认模板，保证用户仍能使用
    return {
      anniversary: {
        love: {
          id: 'anniversary_love',
          name: '恋爱纪念',
          mode: 'countup',
          description: '记录甜蜜时光，在一起的第X天',
          style_presets: ['sweet-pink', 'vibrant-orange', 'soft-purple', 'minimal-dark']
        },
        baby: {
          id: 'anniversary_baby',
          name: '宝宝成长',
          mode: 'countup',
          description: '记录宝宝成长的足迹',
          style_presets: ['soft-purple', 'sweet-pink', 'ocean-blue', 'warm-yellow']
        },
        holiday: {
          id: 'anniversary_holiday',
          name: '放假倒计时',
          mode: 'countdown',
          description: '期待美好假期，倒计时模式',
          style_presets: ['vibrant-orange', 'warm-yellow', 'ocean-blue', 'forest-green']
        }
      },
      news: {
        daily: {
          id: 'news_daily',
          name: '每日新闻',
          description: 'AI 摘要的每日新闻卡片',
          style_presets: ['minimal-dark', 'clean-light']
        }
      },
      alarm: {
        clock: {
          id: 'alarm_clock',
          name: '闹钟',
          description: '显示下一个闹钟 + 快捷设置',
          style_presets: ['analog-minimal', 'digital-neon']
        }
      }
    };
  }

  renderTemplateGrid(container) {
    let html = `
      <div class="top-nav">
        <div class="top-nav-title">模板市场</div>
        <div class="top-nav-back" style="visibility: hidden;"></div>
      </div>
      <div class="container">
        <div class="card">
          <div class="card-title">选择一个组件类型</div>
          <div class="template-grid">
    `;

    // 纪念日组件
    html += `
      <div class="template-card" data-type="anniversary" data-theme="love">
        <div class="template-icon">💕</div>
        <div class="template-name">恋爱纪念</div>
        <div class="template-desc">在一起的第X天</div>
      </div>
      <div class="template-card" data-type="anniversary" data-theme="baby">
        <div class="template-icon">👶</div>
        <div class="template-name">宝宝成长</div>
        <div class="template-desc">记录成长足迹</div>
      </div>
      <div class="template-card" data-type="anniversary" data-theme="holiday">
        <div class="template-icon">🏖️</div>
        <div class="template-name">放假倒计时</div>
        <div class="template-desc">期待美好假期</div>
      </div>
    `;

    // 新闻组件
    html += `
      <div class="template-card" data-type="news" data-theme="daily">
        <div class="template-icon">📰</div>
        <div class="template-name">每日新闻</div>
        <div class="template-desc">AI 摘要新闻</div>
      </div>
    `;

    // 闹钟组件
    html += `
      <div class="template-card" data-type="alarm" data-theme="clock">
        <div class="template-icon">⏰</div>
        <div class="template-name">闹钟</div>
        <div class="template-desc">快捷设置闹钟</div>
      </div>
    `;

    html += `
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // 绑定点击事件
    container.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const theme = card.dataset.theme;
        this.router.navigate('config', { type, theme });
      });
    });
  }
}
