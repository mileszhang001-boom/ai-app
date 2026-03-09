/**
 * 参数配置页面
 */

import { showToast } from '../main.js';

export class ConfigPage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.currentType = null;
    this.currentTheme = null;
    this.schema = null;
    this.editMode = false;
    this.widgetData = null;
    this.formData = {}; // 保存表单数据
  }

  async render(params) {
    this.currentType = params.type;
    this.currentTheme = params.theme;
    this.editMode = params.editMode || false;
    this.widgetData = params.widgetData || null;
    const container = document.getElementById('page-config');

    container.innerHTML = `
      <div class="top-nav">
        <button class="top-nav-back" data-action="back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="top-nav-title">${this.getTitle()}</div>
        <div></div>
      </div>
      <div class="container">
        <form id="configForm" class="form">
          ${this.renderFormSkeleton()}
        </form>
        <button id="saveBtn" class="btn">${this.editMode ? '保存修改' : 'AI 生成'}</button>
        <button id="previewBtn" class="btn btn-secondary" style="margin-top: 12px; display: none;">直接预览</button>
      </div>
    `;

    // 如果是编辑模式，优先加载组件数据
    if (this.editMode && this.widgetData) {
      // 复制完整的组件数据，包括 params 和 style_preset
      this.formData = {
        ...this.widgetData.params,
        style_preset: this.widgetData.style_preset
      };
      this.loadFormFields();
    } else {
      // 否则加载 schema
      await this.loadSchema();
    }

    // 绑定事件
    this.bindEvents();
  }

  getTitle() {
    const titles = {
      'anniversary-love': '恋爱纪念',
      'anniversary-baby': '宝宝成长',
      'anniversary-holiday': '放假倒计时',
      'news-daily': '每日新闻',
      'alarm': '闹钟'
    };
    const key = `${this.currentType}-${this.currentTheme}`;
    return titles[key] || '配置组件';
  }

  renderFormSkeleton() {
    return `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
  }

  loadFormFields() {
    const form = document.getElementById('configForm');
    form.innerHTML = this.renderFormFields();

    // 填充已有数据
    this.fillFormValues();

    // 显示预览按钮
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) previewBtn.style.display = 'block';
  }

  async loadSchema() {
    try {
      const response = await this.api.getTemplateSchema(this.currentType, this.currentTheme);
      this.schema = response;

      this.loadFormFields();

    } catch (error) {
      console.error('加载表单失败:', error);
      const form = document.getElementById('configForm');
      form.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">😢</div>
          <div class="empty-text">加载失败，请重试</div>
          <button class="btn" style="margin-top: 16px; width: auto;" data-action="retry">
            重试
          </button>
        </div>
      `;

      const retryBtn = form.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.loadSchema();
        });
      }
    }
  }

  renderFormFields() {
    let html = '';

    if (this.currentType === 'anniversary') {
      if (this.currentTheme === 'holiday') {
        html += this.renderField('title', '标题', 'text', '', '如：国庆快乐');
        html += this.renderField('date', '目标日期 *', 'date', '', '请选择未来日期');
        html += this.renderField('message', '副标题（留空让AI生成）', 'text');
        html += this.renderStyleSelect();
      } else {
        html += this.renderField('date', '起始日期 *', 'date', '', '请选择日期');
        html += this.renderField('message', '副标题（留空让AI生成）', 'text');
        html += this.renderStyleSelect();
      }
    } else if (this.currentType === 'news') {
      html += this.renderStyleSelect();
    } else if (this.currentType === 'alarm') {
      html += this.renderField('label', '标签', 'text', '', '如：工作日闹钟');
      html += this.renderField('time', '时间', 'time', '07:30');
      html += this.renderStyleSelect();
    }

    return html;
  }

  renderField(name, label, type, defaultValue = '', placeholder = '') {
    const savedValue = this.formData[name] !== undefined ? this.formData[name] : defaultValue;
    const phAttr = placeholder ? ` placeholder="${placeholder}"` : '';

    let inputHtml = '';

    if (type === 'date') {
      const dateValue = savedValue || '';
      inputHtml = `<input class="form-input" type="${type}" name="${name}" value="${dateValue}"${phAttr}>`;
    } else if (type === 'time') {
      inputHtml = `<input class="form-input" type="${type}" name="${name}" value="${savedValue}"${phAttr}>`;
    } else {
      inputHtml = `<input class="form-input" type="${type}" name="${name}" value="${savedValue}"${phAttr}>`;
    }

    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        ${inputHtml}
      </div>
    `;
  }

  renderStyleSelect() {
    const styles = this.schema?.style_presets || [];
    const savedStyle = this.formData.style_preset || styles[0];
    let options = styles.map(s =>
      `<option value="${s}"${s === savedStyle ? ' selected' : ''}>${this.getStyleName(s)}</option>`
    ).join('');

    return `
      <div class="form-group">
        <label class="form-label">风格</label>
        <select class="form-select" name="style_preset">
          ${options}
        </select>
      </div>
    `;
  }

  getStyleName(style) {
    const names = {
      'vibrant-orange': '活力橙',
      'ocean-blue': '海洋蓝',
      'forest-green': '森林绿',
      'minimal-dark': '极简暗',
      'sweet-pink': '甜蜜粉',
      'warm-yellow': '温暖黄',
      'soft-purple': '柔和紫',
      'tech-blue': '科技蓝',
      'clean-light': '经典亮',
      'analog-minimal': '极简表盘',
      'digital-neon': '数码霓虹'
    };
    return names[style] || style;
  }

  fillFormValues() {
    // 填充编辑模式的数据
    if (this.editMode && this.widgetData) {
      const params = this.widgetData.params || {};
      for (const [key, value] of Object.entries(params)) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
          input.value = value;
        }
      }
    }

    // 不再自动填充今天日期，由用户手动选择
  }

  bindEvents() {
    // 返回按钮
    document.querySelector('[data-action="back"]').addEventListener('click', () => {
      this.router.back();
    });

    // 保存/生成按钮
    document.getElementById('saveBtn').addEventListener('click', () => {
      if (this.editMode) {
        this.handleSave();
      } else {
        this.handleGenerate();
      }
    });

    // 预览按钮
    document.getElementById('previewBtn').addEventListener('click', () => {
      this.handlePreview();
    });
  }

  getFormData() {
    const form = document.getElementById('configForm');
    const formData = new FormData(form);
    const params = {};

    for (const [key, value] of formData.entries()) {
      if (key !== 'style_preset') {
        params[key] = value;
      }
    }

    return {
      component_type: this.currentType,
      theme: this.currentTheme,
      params: params,
      style_preset: formData.get('style_preset')
    };
  }

  async handleSave() {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    try {
      const data = this.getFormData();

      // 添加用户ID
      data.user_id = 'demo_user';

      // 如果是编辑模式，添加 widget_id
      if (this.editMode && this.widgetData) {
        data.widget_id = this.widgetData.widget_id;
      }

      const response = await this.api.saveWidget(data);

      if (response.success) {
        showToast('保存成功！', 'success');
        this.router.navigate('my-widgets');
      } else {
        showToast('保存失败: ' + (response.error || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存修改';
    }
  }

  async handleGenerate() {
    if (!this.validateForm()) return;

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;

    // 显示全屏生成进度
    const overlay = this.showGenerateOverlay();

    try {
      const data = this.getFormData();
      this.formData = { ...data.params, style_preset: data.style_preset };

      const response = await this.api.generateComponent(data);

      if (response.success) {
        // 显示完成步骤
        this.updateGenerateStep(overlay, 2);
        await new Promise(r => setTimeout(r, 400));
        overlay.remove();
        this.router.navigate('preview', { data: response.data });
      } else {
        overlay.remove();
        showToast('生成失败: ' + (response.error || '未知错误'), 'error');
      }
    } catch (error) {
      overlay.remove();
      console.error('生成失败:', error);
      showToast('生成失败，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'AI 生成';
    }
  }

  showGenerateOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'generate-overlay';
    overlay.innerHTML = `
      <div class="spinner-lg"></div>
      <div class="gen-step" data-step="0">分析你的需求…</div>
      <div class="gen-step dim" data-step="1">AI 生成文案与参数…</div>
      <div class="gen-step dim" data-step="2">渲染组件预览…</div>
    `;
    document.body.appendChild(overlay);

    // 自动推进步骤
    setTimeout(() => this.updateGenerateStep(overlay, 1), 800);

    return overlay;
  }

  updateGenerateStep(overlay, activeStep) {
    if (!overlay.parentNode) return;
    overlay.querySelectorAll('.gen-step').forEach(el => {
      const step = parseInt(el.dataset.step);
      el.classList.toggle('dim', step > activeStep);
      if (step < activeStep) {
        el.style.color = 'rgba(0,200,83,0.7)';
        el.textContent = '✓ ' + el.textContent.replace('✓ ', '');
      }
    });
  }

  validateForm() {
    if (this.currentType === 'anniversary') {
      const dateInput = document.querySelector('[name="date"]');
      if (dateInput && !dateInput.value) {
        showToast('请选择日期', 'error');
        dateInput.focus();
        return false;
      }
    }
    return true;
  }

  async handlePreview() {
    if (!this.validateForm()) return;
    const data = this.getFormData();
    console.log('[Config] Preview data:', data); // Debug
    // 保存完整表单数据（包括最外层的style_preset）
    this.formData = { ...data.params, style_preset: data.style_preset };
    this.router.navigate('preview', { data });
  }
}
