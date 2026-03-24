/**
 * ConfigPanel — schema-driven configuration bottom-sheet component
 *
 * Used in:
 *  - market.js (mode='create', inside overlay)
 *  - finetune.js (mode='finetune', embedded)
 *
 * All template-specific logic is driven by TEMPLATE_CONFIGS.
 * No hardcoded scene branching — fields are rendered generically by type.
 */

// ─── Template Configuration Schema ──────────────────────────────────────────

const TEMPLATE_CONFIGS = {
  love: {
    component_type: 'anniversary', theme: 'love',
    title: '恋爱纪念', subtitle: '记录爱情时光',
    defaultColor: '#FF6B8A',
    fields: [
      { key: 'start_date', type: 'date_picker', label: '在一起的日期', constraints: { max: 'today' }, required: true },
      { key: 'title', type: 'text_input', label: '标题', placeholder: '在一起', constraints: { maxLength: 8 }, fallback: '在一起' },
      { key: 'nickname', type: 'text_input', label: '对方昵称', placeholder: '小美', constraints: { maxLength: 6 } },
      { key: 'background_image', type: 'image_picker', label: '背景图', presets: 'love' },
    ],
  },
  baby: {
    component_type: 'anniversary', theme: 'baby',
    title: '宝宝成长', subtitle: '记录成长点滴',
    defaultColor: '#F5C842',
    fields: [
      { key: 'birth_date', type: 'date_picker', label: '出生日期', constraints: { max: 'today' }, required: true },
      { key: 'title', type: 'text_input', label: '标题', placeholder: '成长', constraints: { maxLength: 8 }, fallback: '成长' },
      { key: 'baby_name', type: 'text_input', label: '宝宝昵称', placeholder: '小宝', constraints: { maxLength: 6 } },
      { key: 'background_image', type: 'image_picker', label: '背景图', presets: 'baby' },
    ],
  },
  countdown: {
    component_type: 'anniversary', theme: 'holiday',
    title: '放假倒计时', subtitle: '期待美好假期',
    defaultColor: '#FF8C42',
    fields: [
      { key: 'target_date', type: 'date_picker', label: '目标日期', constraints: { min: 'today' }, required: true },
      { key: 'holiday_name', type: 'text_input', label: '假期名称', placeholder: '五一假期', constraints: { maxLength: 8 }, required: true },
      { key: 'title', type: 'text_input', label: '标题', placeholder: '出发！', constraints: { maxLength: 8 }, fallback: '出发！' },
      { key: 'background_image', type: 'image_picker', label: '背景图', presets: 'holiday' },
    ],
  },
  weather: {
    component_type: 'weather', theme: 'weather',
    title: '天气', subtitle: '实时天气信息',
    defaultColor: '#FFD700',
    fields: [
      { key: 'city', type: 'text_input', label: '默认城市', placeholder: '输入城市名搜索', constraints: { maxLength: 10 } },
    ],
  },
  music: {
    component_type: 'music', theme: 'music',
    title: '音乐播放器', subtitle: '沉浸音乐体验',
    defaultColor: '#8B5CF6',
    fields: [
      { key: 'visual_style', type: 'enum_select', label: '视觉风格', options: [
        { value: 'glass', label: '毛玻璃' },
        { value: 'minimal', label: '极简' },
        { value: 'material', label: '质感' },
        { value: 'pixel', label: '像素' },
      ], fallback: 'glass' },
    ],
  },
  calendar: {
    component_type: 'calendar', theme: 'calendar',
    title: '日历日程', subtitle: '高效管理时间',
    defaultColor: '#3B82F6',
    fields: [
      { key: 'accent_color', type: 'color_picker', label: '主题色', colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'] },
    ],
  },
  news: {
    component_type: 'news', theme: 'news',
    title: '每日新闻', subtitle: '精选资讯速览',
    defaultColor: '#4A90E2',
    fields: [
      { key: 'topics', type: 'multi_select', label: '关注话题', options: [
        { value: 'tech', label: '科技' },
        { value: 'auto', label: '汽车' },
        { value: 'finance', label: '财经' },
        { value: 'sports', label: '体育' },
        { value: 'entertainment', label: '娱乐' },
        { value: 'health', label: '健康' },
      ], fallback: ['tech', 'auto'] },
      { key: 'display_style', type: 'enum_select', label: '展示样式', options: [
        { value: 'card', label: '卡片' },
        { value: 'list', label: '列表' },
      ], fallback: 'card' },
    ],
  },
  alarm: {
    component_type: 'alarm', theme: 'clock',
    title: '闹钟', subtitle: '智能提醒助手',
    defaultColor: '#4ADE80',
    fields: [
      { key: 'default_view', type: 'segment', label: '默认视图', options: [
        { value: 'list', label: '列表' },
        { value: 'clock', label: '表盘' },
      ], fallback: 'list' },
      { key: 'accent_color', type: 'color_picker', label: '主题色', colors: ['#4ADE80', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'] },
    ],
  },
};

// ─── Background Image Presets ────────────────────────────────────────────────

const BG_PRESETS = {
  love: [
    '/widget-templates/anniversary/love/backgrounds/love_bg_01.jpg',
    '/widget-templates/anniversary/love/backgrounds/love_bg_02.jpg',
    '/widget-templates/anniversary/love/backgrounds/love_bg_03.jpg',
    '/widget-templates/anniversary/love/backgrounds/love_bg_04.jpg',
    '/widget-templates/anniversary/love/backgrounds/love_bg_05.jpg',
  ],
  baby: [
    '/widget-templates/anniversary/baby/backgrounds/baby_bg_01.jpg',
    '/widget-templates/anniversary/baby/backgrounds/baby_bg_02.jpg',
    '/widget-templates/anniversary/baby/backgrounds/baby_bg_03.jpg',
    '/widget-templates/anniversary/baby/backgrounds/baby_bg_04.jpg',
    '/widget-templates/anniversary/baby/backgrounds/baby_bg_05.jpg',
  ],
  holiday: [
    '/widget-templates/anniversary/holiday/backgrounds/holiday_bg_01.jpg',
    '/widget-templates/anniversary/holiday/backgrounds/holiday_bg_02.jpg',
    '/widget-templates/anniversary/holiday/backgrounds/holiday_bg_03.jpg',
    '/widget-templates/anniversary/holiday/backgrounds/holiday_bg_04.jpg',
    '/widget-templates/anniversary/holiday/backgrounds/holiday_bg_05.jpg',
  ],
};

// ─── Build SCENE_MAP from TEMPLATE_CONFIGS (for backward compat export) ──────

const SCENE_MAP = {};
for (const [id, cfg] of Object.entries(TEMPLATE_CONFIGS)) {
  SCENE_MAP[id] = {
    component_type: cfg.component_type,
    theme: cfg.theme,
    title: cfg.title,
    subtitle: cfg.subtitle,
  };
}

export { SCENE_MAP, TEMPLATE_CONFIGS };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get today's date string in YYYY-MM-DD format */
function _todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Extract a file name stem from a preset path, e.g. "love_bg_01" */
function _presetId(path) {
  return path.split('/').pop().replace(/\.\w+$/, '');
}

// ─── ConfigPanel Class ───────────────────────────────────────────────────────

export class ConfigPanel {
  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.container
   * @param {'create'|'finetune'} opts.mode
   * @param {string} opts.sceneId
   * @param {Object} [opts.currentData]
   * @param {Object} opts.api
   * @param {Function} opts.onGenerate - called with generated data
   * @param {Function} [opts.onDismiss]
   */
  constructor({ container, mode = 'create', sceneId, currentData, api, onGenerate, onDismiss }) {
    this.container = container;
    this.mode = mode;
    this.sceneId = sceneId;
    this.config = TEMPLATE_CONFIGS[sceneId] || TEMPLATE_CONFIGS.weather;
    this.currentData = currentData;
    this.api = api;
    this.onGenerate = onGenerate;
    this.onDismiss = onDismiss;

    // Dynamic state for field values (keyed by field.key)
    this.fieldValues = {};
    this._initFieldValues();

    // Custom photo upload state (for image_picker fields)
    this.photoDataUrl = currentData?.params?.background_image || currentData?.params?.bg_photo || null;

    this.render();
  }

  /** Initialize field values from currentData or fallbacks */
  _initFieldValues() {
    const params = this.currentData?.params || {};

    for (const field of this.config.fields) {
      const existing = params[field.key];

      switch (field.type) {
        case 'date_picker':
          this.fieldValues[field.key] = existing || '';
          break;

        case 'text_input':
          this.fieldValues[field.key] = existing || '';
          break;

        case 'image_picker': {
          // Might be stored as a preset ID or empty
          this.fieldValues[field.key] = existing || '';
          break;
        }

        case 'color_picker':
          this.fieldValues[field.key] = existing || (field.colors ? field.colors[0] : '');
          break;

        case 'segment':
        case 'enum_select':
          this.fieldValues[field.key] = existing || field.fallback || '';
          break;

        case 'multi_select':
          this.fieldValues[field.key] = existing || (field.fallback ? [...field.fallback] : []);
          break;

        default:
          this.fieldValues[field.key] = existing || '';
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  render() {
    const isFinetune = this.mode === 'finetune';

    this.container.innerHTML = `
      <div class="config-panel">
        ${!isFinetune ? '<div class="config-handle"></div>' : ''}

        <div class="config-header">
          <div class="config-title">${this.config.title}</div>
          <div class="config-subtitle">${this.config.subtitle}</div>
        </div>

        ${isFinetune ? this._renderAiSuggestion() : ''}

        <div class="config-body">
          ${this._renderSceneFields(this.sceneId)}

          <!-- Free input -->
          <div class="config-section">
            <div class="config-free-row">
              <input type="text" class="config-free-input" id="configFreeInput"
                     placeholder="还想调什么？告诉AI...">
            </div>
          </div>
        </div>

        <div class="config-footer">
          <button class="btn-gradient" id="configGenerateBtn">
            ${isFinetune ? '✨ 应用修改' : '✨ 生成卡片'}
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _renderAiSuggestion() {
    const suggestions = {
      weather:   '试试切换到极简风格，信息更清晰',
      love:      '加上你们的合照，更有纪念意义',
      calendar:  '试试商务风格，更适合工作日程',
      music:     '换个霓虹配色，更有氛围感',
      countdown: '加上活力配色，更有期待感',
      baby:      '试试梦幻风格，更温馨可爱',
      alarm:     '换个清新配色，早起更有精神',
      news:      '切换到简洁模式，快速浏览',
    };
    const text = suggestions[this.sceneId] || '试试其他风格或配色';
    return `
      <div class="ai-suggestion-bar">
        <span class="ai-suggestion-icon">💡</span>
        <span class="ai-suggestion-text">${text}</span>
      </div>
    `;
  }

  // ─── Generic Field Rendering ─────────────────────────────────────────────

  /**
   * Look up TEMPLATE_CONFIGS[sceneId] and render all fields generically.
   */
  _renderSceneFields(sceneId) {
    const cfg = TEMPLATE_CONFIGS[sceneId];
    if (!cfg || !cfg.fields || cfg.fields.length === 0) return '';

    return cfg.fields.map(field => this._renderField(field)).join('');
  }

  /** Dispatch to the correct renderer by field.type */
  _renderField(field) {
    switch (field.type) {
      case 'date_picker':    return this._renderDatePicker(field);
      case 'text_input':     return this._renderTextInput(field);
      case 'image_picker':   return this._renderImagePicker(field);
      case 'color_picker':   return this._renderColorPicker(field);
      case 'segment':        return this._renderSegment(field);
      case 'enum_select':    return this._renderEnumSelect(field);
      case 'multi_select':   return this._renderMultiSelect(field);
      default:               return '';
    }
  }

  _renderDatePicker(field) {
    const value = this.fieldValues[field.key] || '';
    const today = _todayStr();
    let attrs = '';
    if (field.constraints?.max === 'today') attrs += ` max="${today}"`;
    if (field.constraints?.min === 'today') attrs += ` min="${today}"`;
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <input type="date" class="config-date-input" data-field="${field.key}" value="${value}"${attrs}>
      </div>
    `;
  }

  _renderTextInput(field) {
    const value = this.fieldValues[field.key] || '';
    const maxLen = field.constraints?.maxLength ? ` maxlength="${field.constraints.maxLength}"` : '';
    const placeholder = field.placeholder || '';
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <input type="text" class="config-text-input" data-field="${field.key}"
               placeholder="${placeholder}" value="${value}"${maxLen}>
      </div>
    `;
  }

  _renderImagePicker(field) {
    const presetKey = field.presets;
    const presetPaths = presetKey ? (BG_PRESETS[presetKey] || []) : [];
    if (presetPaths.length === 0) return '';

    const currentBg = this.fieldValues[field.key] || '';

    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <div class="bg-grid" data-field="${field.key}">
          ${presetPaths.map(path => {
            const id = _presetId(path);
            const isSelected = id === currentBg;
            return `
              <button class="bg-grid-item${isSelected ? ' selected' : ''}" data-bg="${id}" data-bg-path="${path}">
                <div class="bg-grid-thumb" style="background-image:url('${path}');background-size:cover;background-position:center;"></div>
              </button>`;
          }).join('')}
          <label class="bg-grid-item bg-upload-slot${this.photoDataUrl ? ' selected' : ''}" id="bgUploadSlot_${field.key}" for="configPhotoInput_${field.key}">
            <input type="file" accept="image/*" id="configPhotoInput_${field.key}" data-field="${field.key}" style="display:none;">
            <div class="bg-grid-thumb bg-upload-thumb" id="bgUploadThumb_${field.key}">
              ${this.photoDataUrl ? `<img src="${this.photoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">` : '<span class="bg-upload-icon">+📷</span>'}
            </div>
            <div class="bg-grid-label">自定义</div>
          </label>
        </div>
      </div>
    `;
  }

  _renderColorPicker(field) {
    const colors = field.colors || [];
    const selected = this.fieldValues[field.key] || colors[0] || '';
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <div class="color-circles" data-field="${field.key}">
          ${colors.map(c => `
            <button class="color-circle${c === selected ? ' selected' : ''}"
                    data-color="${c}"
                    style="background:${c}${c === selected ? `;box-shadow:0 0 0 2px #fff, 0 0 0 4px ${c}` : ''}"></button>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderSegment(field) {
    const options = field.options || [];
    const selected = this.fieldValues[field.key] || field.fallback || '';
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <div class="alarm-style-picker" data-field="${field.key}">
          ${options.map(opt => `
            <button class="alarm-style-btn${opt.value === selected ? ' selected' : ''}" data-value="${opt.value}">
              <span class="alarm-style-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderEnumSelect(field) {
    const options = field.options || [];
    const selected = this.fieldValues[field.key] || field.fallback || '';
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <div class="alarm-style-picker" data-field="${field.key}">
          ${options.map(opt => `
            <button class="alarm-style-btn${opt.value === selected ? ' selected' : ''}" data-value="${opt.value}">
              <span class="alarm-style-label">${opt.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  _renderMultiSelect(field) {
    const options = field.options || [];
    const selected = this.fieldValues[field.key] || field.fallback || [];
    return `
      <div class="config-section">
        <div class="config-section-label">${field.label}</div>
        <div class="category-pills" data-field="${field.key}">
          ${options.map(opt => `
            <button class="category-pill${selected.includes(opt.value) ? ' selected' : ''}" data-value="${opt.value}">${opt.label}</button>
          `).join('')}
        </div>
        <div class="config-hint" style="font-size:11px;color:#999;margin-top:4px;">至少选1个</div>
      </div>
    `;
  }

  // ─── Event Binding ───────────────────────────────────────────────────────

  _bindEvents() {
    const panel = this.container;

    // Bind all fields generically
    for (const field of this.config.fields) {
      switch (field.type) {
        case 'date_picker':
          this._bindDatePicker(panel, field);
          break;
        case 'text_input':
          this._bindTextInput(panel, field);
          break;
        case 'image_picker':
          this._bindImagePicker(panel, field);
          break;
        case 'color_picker':
          this._bindColorPicker(panel, field);
          break;
        case 'segment':
        case 'enum_select':
          this._bindSegmentOrEnum(panel, field);
          break;
        case 'multi_select':
          this._bindMultiSelect(panel, field);
          break;
      }
    }

    // Generate button
    const genBtn = panel.querySelector('#configGenerateBtn');
    if (genBtn) {
      genBtn.addEventListener('click', () => this._handleGenerate());
    }
  }

  _bindDatePicker(panel, field) {
    const input = panel.querySelector(`input[data-field="${field.key}"]`);
    if (!input) return;
    input.addEventListener('change', () => {
      this.fieldValues[field.key] = input.value;
    });
  }

  _bindTextInput(panel, field) {
    const input = panel.querySelector(`input[data-field="${field.key}"]`);
    if (!input) return;
    input.addEventListener('input', () => {
      this.fieldValues[field.key] = input.value;
    });
  }

  _bindImagePicker(panel, field) {
    const grid = panel.querySelector(`.bg-grid[data-field="${field.key}"]`);
    if (!grid) return;

    // Preset items
    grid.querySelectorAll('.bg-grid-item:not(.bg-upload-slot)').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.bg-grid-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.fieldValues[field.key] = btn.dataset.bg;
        // Clear custom photo when preset is chosen
        this.photoDataUrl = null;
        const thumb = panel.querySelector(`#bgUploadThumb_${field.key}`);
        if (thumb) thumb.innerHTML = '<span class="bg-upload-icon">+📷</span>';
      });
    });

    // Upload slot
    const fileInput = panel.querySelector(`#configPhotoInput_${field.key}`);
    const uploadSlot = panel.querySelector(`#bgUploadSlot_${field.key}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onerror = () => {
            if (window.showToast) window.showToast('图片加载失败', 'error');
          };
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 600;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Tiered compression: JPEG quality 0.5 → 0.3 → reject
            let quality = 0.5;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            if (dataUrl.length > 200000) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.3);
            }
            if (dataUrl.length > 200000) {
              if (window.showToast) window.showToast('图片过大，请选择较小的图片', 'error');
              return;
            }

            this.photoDataUrl = dataUrl;
            this.fieldValues[field.key] = '';  // Clear preset selection
            // Update UI
            grid.querySelectorAll('.bg-grid-item').forEach(b => b.classList.remove('selected'));
            if (uploadSlot) uploadSlot.classList.add('selected');
            const thumb = panel.querySelector(`#bgUploadThumb_${field.key}`);
            if (thumb) thumb.innerHTML = `<img src="${this.photoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  }

  _bindColorPicker(panel, field) {
    const wrapper = panel.querySelector(`.color-circles[data-field="${field.key}"]`);
    if (!wrapper) return;
    wrapper.querySelectorAll('.color-circle').forEach(circle => {
      circle.addEventListener('click', () => {
        wrapper.querySelectorAll('.color-circle').forEach(c => {
          c.classList.remove('selected');
          c.style.boxShadow = '';
        });
        circle.classList.add('selected');
        circle.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${circle.dataset.color}`;
        this.fieldValues[field.key] = circle.dataset.color;
      });
    });
  }

  _bindSegmentOrEnum(panel, field) {
    const wrapper = panel.querySelector(`.alarm-style-picker[data-field="${field.key}"]`);
    if (!wrapper) return;
    wrapper.querySelectorAll('.alarm-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.alarm-style-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.fieldValues[field.key] = btn.dataset.value;
      });
    });
  }

  _bindMultiSelect(panel, field) {
    const wrapper = panel.querySelector(`.category-pills[data-field="${field.key}"]`);
    if (!wrapper) return;
    wrapper.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const val = pill.dataset.value;
        const arr = this.fieldValues[field.key];
        if (pill.classList.contains('selected')) {
          // Deselect — but keep at least 1
          if (arr.length > 1) {
            this.fieldValues[field.key] = arr.filter(v => v !== val);
            pill.classList.remove('selected');
          }
        } else {
          arr.push(val);
          pill.classList.add('selected');
        }
      });
    });
  }

  // ─── Data Collection ─────────────────────────────────────────────────────

  /**
   * Collect values from all rendered fields generically using the config.
   */
  _collectData() {
    const cfg = this.config;
    const data = {
      component_type: cfg.component_type,
      theme: cfg.theme,
      style_preset: 'glass',
      visual_style: 'glass',
      primary_color: cfg.defaultColor,
      params: {},
      description: cfg.title,
    };

    for (const field of cfg.fields) {
      const val = this.fieldValues[field.key];

      switch (field.type) {
        case 'date_picker':
          data.params[field.key] = val || '';
          break;

        case 'text_input':
          data.params[field.key] = val || field.fallback || '';
          break;

        case 'image_picker':
          // Preset bg ID
          if (val) {
            data.params[field.key] = val;
          }
          // Custom photo upload
          if (this.photoDataUrl) {
            data.params.background_image = this.photoDataUrl;
          }
          break;

        case 'color_picker':
          // Color pickers update the component's primary color
          data.primary_color = val || cfg.defaultColor;
          data.params[field.key] = val || cfg.defaultColor;
          break;

        case 'segment':
        case 'enum_select':
          data.params[field.key] = val || field.fallback || '';
          break;

        case 'multi_select':
          data.params[field.key] = (val && val.length > 0) ? val : (field.fallback || []);
          break;
      }
    }

    return data;
  }

  // ─── Generate Handler ────────────────────────────────────────────────────

  async _handleGenerate() {
    const freeText = this.container.querySelector('#configFreeInput')?.value?.trim();
    const baseData = this._collectData();
    const genBtn = this.container.querySelector('#configGenerateBtn');

    if (freeText) {
      // Show loading state
      if (genBtn) {
        genBtn.disabled = true;
        genBtn._origText = genBtn.textContent;
        genBtn.textContent = '生成中...';
      }

      const prompt = `${this.config.title}：${freeText}`;
      try {
        const response = await this.api.chatGenerate(prompt, baseData);
        if (response.success) {
          const merged = { ...response.data };
          merged.style_preset = 'glass';
          merged.visual_style = 'glass';
          if (this.onGenerate) this.onGenerate(merged);
        } else {
          if (this.onGenerate) this.onGenerate(baseData);
        }
      } catch {
        if (this.onGenerate) this.onGenerate(baseData);
      } finally {
        if (genBtn) {
          genBtn.disabled = false;
          genBtn.textContent = genBtn._origText || '✨ 生成卡片';
        }
      }
    } else {
      if (this.onGenerate) this.onGenerate(baseData);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  show() {
    this.container.style.display = '';
  }

  hide() {
    this.container.style.display = 'none';
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
