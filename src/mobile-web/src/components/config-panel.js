/**
 * ConfigPanel — shared configuration bottom-sheet component
 *
 * Used in:
 *  - market.js (mode='create', inside overlay)
 *  - finetune.js (mode='finetune', embedded)
 */

const SCENE_MAP = {
  weather:   { component_type: 'weather',     theme: 'realtime', title: '实时天气',     subtitle: '天气信息卡片' },
  love:      { component_type: 'anniversary', theme: 'love',     title: '恋爱纪念',     subtitle: '记录甜蜜时光' },
  calendar:  { component_type: 'calendar',    theme: 'schedule', title: '日程安排',     subtitle: '今日日程一览' },
  music:     { component_type: 'music',       theme: 'player',   title: '音乐播放',     subtitle: '车载音乐控制' },
  countdown: { component_type: 'anniversary', theme: 'holiday',  title: '放假倒计时',   subtitle: '期待美好假期' },
  baby:      { component_type: 'anniversary', theme: 'baby',     title: '宝宝相册',     subtitle: '记录成长瞬间' },
  alarm:     { component_type: 'alarm',       theme: 'clock',    title: '闹钟',         subtitle: '智能提醒助手' },
  news:      { component_type: 'news',        theme: 'daily',    title: '每日新闻',     subtitle: '今日要闻速览' },
};

const STYLE_OPTIONS = {
  weather:   [
    { id: 'glass',    name: '毛玻璃', desc: '经典通透' },
    { id: 'minimal',  name: '极简',   desc: '清爽简洁' },
    { id: 'material', name: '质感',   desc: '层次丰富' },
  ],
  love: [
    { id: 'glass',    name: '浪漫',   desc: '柔美光晕' },
    { id: 'minimal',  name: '简约',   desc: '优雅克制' },
    { id: 'pixel',    name: '像素',   desc: '复古可爱' },
  ],
  countdown: [
    { id: 'glass',    name: '活力',   desc: '缤纷彩纸' },
    { id: 'minimal',  name: '极简',   desc: '清爽简洁' },
    { id: 'material', name: '质感',   desc: '层次丰富' },
  ],
  baby: [
    { id: 'glass',    name: '梦幻',   desc: '星星闪烁' },
    { id: 'minimal',  name: '简约',   desc: '温馨清新' },
    { id: 'pixel',    name: '像素',   desc: '趣味可爱' },
  ],
  music: [
    { id: 'glass',    name: '沉浸',   desc: '氛围光晕' },
    { id: 'minimal',  name: '极简',   desc: '纯粹播放' },
    { id: 'material', name: '霓虹',   desc: '炫彩夺目' },
  ],
  alarm: [
    { id: 'glass',    name: '数码',   desc: '科技质感' },
    { id: 'minimal',  name: '极简',   desc: '清爽简洁' },
    { id: 'material', name: '经典',   desc: '沉稳大气' },
  ],
  calendar: [
    { id: 'glass',    name: '商务',   desc: '专业高效' },
    { id: 'minimal',  name: '清新',   desc: '轻松自然' },
    { id: 'material', name: '质感',   desc: '层次丰富' },
  ],
  news: [
    { id: 'glass',    name: '简报',   desc: '快速浏览' },
    { id: 'minimal',  name: '极简',   desc: '专注阅读' },
    { id: 'material', name: '杂志',   desc: '图文并茂' },
  ],
  _default: [
    { id: 'glass',    name: '毛玻璃', desc: '经典通透' },
    { id: 'minimal',  name: '极简',   desc: '清爽简洁' },
    { id: 'material', name: '质感',   desc: '层次丰富' },
  ],
};

const COLOR_PRESETS = ['#4A6CF7', '#E84393', '#27AE60', '#F59E0B', '#7B5CFA', '#0891B2'];

const SCENE_DEFAULT_COLORS = {
  weather:   '#4A6CF7',
  love:      '#E84393',
  calendar:  '#27AE60',
  music:     '#7B5CFA',
  countdown: '#F59E0B',
  baby:      '#0891B2',
  alarm:     '#7B5CFA',
  news:      '#E84393',
};

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
const DENSITY_OPTIONS = ['简洁', '标准', '详细'];

export { SCENE_MAP };

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
    this.scene = SCENE_MAP[sceneId] || SCENE_MAP.weather;
    this.currentData = currentData;
    this.api = api;
    this.onGenerate = onGenerate;
    this.onDismiss = onDismiss;

    // State
    this.selectedStyle = currentData?.style_preset || currentData?.visual_style || 'glass';
    this.selectedColor = currentData?.primary_color || SCENE_DEFAULT_COLORS[sceneId] || COLOR_PRESETS[0];
    this.selectedCity = currentData?.params?.city || '北京';
    this.selectedDensity = '标准';
    this.photoDataUrl = currentData?.params?.bg_photo || null;

    this.render();
  }

  render() {
    const styles = STYLE_OPTIONS[this.sceneId] || STYLE_OPTIONS._default;
    const isFinetune = this.mode === 'finetune';

    this.container.innerHTML = `
      <div class="config-panel">
        ${!isFinetune ? '<div class="config-handle"></div>' : ''}

        <div class="config-header">
          <div class="config-title">${this.scene.title}</div>
          <div class="config-subtitle">${this.scene.subtitle}</div>
        </div>

        ${isFinetune ? this._renderAiSuggestion() : ''}

        <div class="config-body">
          <!-- Style selector -->
          <div class="config-section">
            <div class="config-section-label">选择风格</div>
            <div class="style-selector">
              ${styles.map(s => `
                <button class="style-card${s.id === this.selectedStyle ? ' selected' : ''}" data-style="${s.id}">
                  <div class="style-card-name">${s.name}</div>
                  <div class="style-card-desc">${s.desc}</div>
                </button>
              `).join('')}
            </div>
          </div>

          ${this._renderSceneFields()}

          <!-- Color picker -->
          <div class="config-section">
            <div class="config-section-label">主题配色</div>
            <div class="color-circles">
              ${COLOR_PRESETS.map(c => `
                <button class="color-circle${c === this.selectedColor ? ' selected' : ''}"
                        data-color="${c}"
                        style="background:${c}"></button>
              `).join('')}
            </div>
          </div>

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

  _renderSceneFields() {
    if (this.sceneId === 'weather') {
      return `
        <div class="config-section">
          <div class="config-section-label">城市</div>
          <div class="city-pills">
            ${CITIES.map(c => `
              <button class="city-pill${c === this.selectedCity ? ' selected' : ''}" data-city="${c}">${c}</button>
            `).join('')}
          </div>
        </div>
        <div class="config-section">
          <div class="config-section-label">信息量</div>
          <div class="segment-control">
            ${DENSITY_OPTIONS.map(d => `
              <button class="segment-item${d === this.selectedDensity ? ' selected' : ''}" data-density="${d}">${d}</button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (['love', 'baby', 'countdown'].includes(this.sceneId)) {
      const labels = {
        love:      { date: '在一起日期', name: '对方昵称',   ph: 'TA的昵称' },
        baby:      { date: '宝宝生日',   name: '宝宝名字',   ph: '宝宝的名字' },
        countdown: { date: '目标日期',   name: '事件名称',   ph: '如：国庆节' },
      };
      const l = labels[this.sceneId];
      const dateVal = this.currentData?.params?.start_date || this.currentData?.params?.target_date || this.currentData?.params?.date || '';
      const nameVal = this.currentData?.params?.nickname || this.currentData?.params?.event_name || this.currentData?.params?.title || '';

      const photoSection = ['love', 'baby'].includes(this.sceneId) ? `
        <div class="config-section">
          <div class="config-section-label">背景照片</div>
          <div class="photo-upload-area" id="photoUploadArea">
            <input type="file" accept="image/*" id="configPhotoInput" hidden>
            <div class="photo-upload-placeholder" id="photoPlaceholder">点击上传照片</div>
            <img id="photoPreview" class="photo-upload-preview" style="display:none">
          </div>
        </div>
      ` : '';

      return `
        <div class="config-section">
          <div class="config-section-label">${l.date}</div>
          <input type="date" class="config-date-input" id="configDate" value="${dateVal}">
        </div>
        <div class="config-section">
          <div class="config-section-label">${l.name}</div>
          <input type="text" class="config-text-input" id="configName" placeholder="${l.ph}" value="${nameVal}">
        </div>
        ${photoSection}
      `;
    }

    // music, alarm, calendar, news — no extra fields
    return '';
  }

  _bindEvents() {
    const panel = this.container;

    // Style cards
    panel.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        panel.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedStyle = card.dataset.style;
      });
    });

    // Color circles
    panel.querySelectorAll('.color-circle').forEach(circle => {
      circle.addEventListener('click', () => {
        panel.querySelectorAll('.color-circle').forEach(c => {
          c.classList.remove('selected');
          c.style.boxShadow = '';
        });
        circle.classList.add('selected');
        circle.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${circle.dataset.color}`;
        this.selectedColor = circle.dataset.color;
      });
    });
    // Apply initial selected ring
    const initialSelected = panel.querySelector('.color-circle.selected');
    if (initialSelected) {
      initialSelected.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${initialSelected.dataset.color}`;
    }

    // City pills
    panel.querySelectorAll('.city-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        panel.querySelectorAll('.city-pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.selectedCity = pill.dataset.city;
      });
    });

    // Density segments
    panel.querySelectorAll('.segment-item').forEach(item => {
      item.addEventListener('click', () => {
        panel.querySelectorAll('.segment-item').forEach(s => s.classList.remove('selected'));
        item.classList.add('selected');
        this.selectedDensity = item.dataset.density;
      });
    });

    // Photo upload
    const photoArea = panel.querySelector('#photoUploadArea');
    const photoInput = panel.querySelector('#configPhotoInput');
    const photoPreview = panel.querySelector('#photoPreview');
    const photoPlaceholder = panel.querySelector('#photoPlaceholder');
    if (photoArea && photoInput) {
      // Restore existing photo
      if (this.photoDataUrl && photoPreview && photoPlaceholder) {
        photoPreview.src = this.photoDataUrl;
        photoPreview.style.display = 'block';
        photoPlaceholder.style.display = 'none';
      }
      photoArea.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 800;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            this.photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            if (photoPreview) {
              photoPreview.src = this.photoDataUrl;
              photoPreview.style.display = 'block';
            }
            if (photoPlaceholder) photoPlaceholder.style.display = 'none';
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Generate button
    const genBtn = panel.querySelector('#configGenerateBtn');
    if (genBtn) {
      genBtn.addEventListener('click', () => this._handleGenerate());
    }
  }

  _collectData() {
    const data = {
      component_type: this.scene.component_type,
      theme: this.scene.theme,
      style_preset: this.selectedStyle,
      visual_style: this.selectedStyle,
      primary_color: this.selectedColor,
      params: {},
      description: this.scene.title,
    };

    if (this.photoDataUrl && ['love', 'baby'].includes(this.sceneId)) {
      data.params.bg_photo = this.photoDataUrl;
    }

    if (this.sceneId === 'weather') {
      data.params.city = this.selectedCity;
    }

    if (['love', 'baby', 'countdown'].includes(this.sceneId)) {
      const dateInput = this.container.querySelector('#configDate');
      const nameInput = this.container.querySelector('#configName');
      if (this.sceneId === 'countdown') {
        data.params.target_date = dateInput?.value || '';
        data.params.event_name = nameInput?.value || '放假倒计时';
        data.params.title = nameInput?.value || '放假倒计时';
      } else if (this.sceneId === 'baby') {
        data.params.start_date = dateInput?.value || '';
        data.params.nickname = nameInput?.value || '宝宝';
        data.params.title = nameInput?.value || '宝宝';
      } else {
        data.params.start_date = dateInput?.value || '';
        data.params.nickname = nameInput?.value || '';
        data.params.title = nameInput?.value || '我们的纪念日';
      }
    }

    return data;
  }

  async _handleGenerate() {
    const freeText = this.container.querySelector('#configFreeInput')?.value?.trim();
    const baseData = this._collectData();
    const genBtn = this.container.querySelector('#configGenerateBtn');

    if (freeText) {
      // Show loading state on button during API call
      if (genBtn) {
        genBtn.disabled = true;
        genBtn._origText = genBtn.textContent;
        genBtn.textContent = '生成中...';
      }

      const prompt = `${this.scene.title}：${freeText}`;
      try {
        const response = await this.api.chatGenerate(prompt, baseData);
        if (response.success) {
          const merged = { ...response.data };
          merged.style_preset = this.selectedStyle;
          merged.visual_style = this.selectedStyle;
          merged.primary_color = this.selectedColor;
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

  destroy() {
    this.container.innerHTML = '';
  }
}
