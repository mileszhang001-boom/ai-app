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

// 场景化 6 色推荐（广色域 + 场景属性匹配）
const SCENE_COLOR_MAP = {
  weather:   ['#4A90E2', '#48D1CC', '#F8C557', '#27AE60', '#AF7AC5', '#FF6B6B'],  // 亮色、清新、自然感
  news:      ['#5B6CF7', '#FF6B6B', '#27AE60', '#F59E0B', '#0891B2', '#7B5CFA'],  // 沉稳、信息感、分类对应
  music:     ['#E84393', '#7B5CFA', '#FF6B6B', '#F59E0B', '#4A90E2', '#48D1CC'],  // 情绪感强、浓烈、个性化
  calendar:  ['#3B82F6', '#64748B', '#10B981', '#F59E0B', '#8B5CF6', '#334155'],  // 白底简洁：蓝/灰/绿/橙/紫/深灰
  alarm:     ['#4ADE80', '#3B82F6', '#F59E0B', '#64748B', '#8B5CF6', '#94A3B8'],  // 黑底简洁：绿/蓝/橙/灰/紫/浅灰
};

const SCENE_DEFAULT_COLORS = {
  weather:   '#4A90E2',
  love:      '#E84393',
  calendar:  '#3B82F6',
  music:     '#E84393',
  countdown: '#F59E0B',
  baby:      '#48D1CC',
  alarm:     '#4ADE80',
  news:      '#5B6CF7',
};

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

const NEWS_CATEGORIES = [
  { id: 'tech', label: '科技' },
  { id: 'automotive', label: '汽车' },
  { id: 'finance', label: '财经' },
  { id: 'sports', label: '体育' },
  { id: 'lifestyle', label: '生活' },
];

const ALARM_STYLES = [
  { id: 'list', label: '列表', icon: '☰' },
  { id: 'dial', label: '表盘', icon: '🕐' },
];

const BG_PRESETS = {
  love: [
    { id: 'love_bg_01', label: '海边漫步' },
    { id: 'love_bg_02', label: '午后咖啡' },
    { id: 'love_bg_03', label: '樱花小径' },
    { id: 'love_bg_04', label: '霓虹夜色' },
    { id: 'love_bg_05', label: '星空物语' },
  ],
  baby: [
    { id: 'baby_bg_01', label: '温馨小屋' },
    { id: 'baby_bg_02', label: '阳光花园' },
    { id: 'baby_bg_03', label: '梦幻气球' },
    { id: 'baby_bg_04', label: '积木乐园' },
    { id: 'baby_bg_05', label: '童话世界' },
  ],
  countdown: [
    { id: 'holiday_bg_01', label: '璀璨烟火' },
    { id: 'holiday_bg_02', label: '椰林海风' },
    { id: 'holiday_bg_03', label: '雪山晨光' },
    { id: 'holiday_bg_04', label: '灯火阑珊' },
    { id: 'holiday_bg_05', label: '热气球之旅' },
  ],
};

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
    this.selectedColor = currentData?.primary_color || SCENE_DEFAULT_COLORS[sceneId] || COLOR_PRESETS[0];
    this.selectedCity = currentData?.params?.city || '北京';
    this.photoDataUrl = currentData?.params?.bg_photo || null;
    this.selectedCategories = currentData?.params?.categories || ['tech', 'automotive'];
    this.selectedAlarmStyle = currentData?.params?.display_style || 'list';
    this.selectedBgImage = currentData?.params?.background_image || '';

    this.render();
  }

  render() {
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
          ${this._renderSceneFields()}

          <!-- Color picker -->
          ${this._shouldShowColorPicker() ? `
          <div class="config-section">
            <div class="config-section-label">${this._getColorPickerLabel()}</div>
            <div class="color-circles">
              ${(SCENE_COLOR_MAP[this.sceneId] || SCENE_COLOR_MAP.weather).map(c => `
                <button class="color-circle${c === this.selectedColor ? ' selected' : ''}"
                        data-color="${c}"
                        style="background:${c}"></button>
              `).join('')}
            </div>
          </div>
          ` : ''}

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

  _shouldShowColorPicker() {
    return !['love', 'baby', 'countdown'].includes(this.sceneId);
  }

  _getColorPickerLabel() {
    if (['calendar', 'alarm'].includes(this.sceneId)) return '强调色';
    return '主题配色';
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
    // weather: 城市在卡片内切换，config 不需要城市选择
    if (this.sceneId === 'weather') {
      return '';
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

      // 统一背景选择器：5 预设缩略图 + 1 上传入口
      const bgPresets = BG_PRESETS[this.sceneId] || [];
      const themeDirMap = { love: 'love', baby: 'baby', countdown: 'holiday' };
      const themeDir = themeDirMap[this.sceneId] || this.sceneId;
      const bgSection = bgPresets.length ? `
        <div class="config-section">
          <div class="config-section-label">背景</div>
          <div class="bg-grid">
            ${bgPresets.map(bg => {
              const bgUrl = '/widget-templates/anniversary/' + themeDir + '/backgrounds/' + bg.id + '.jpg';
              return `
              <button class="bg-grid-item${bg.id === this.selectedBgImage ? ' selected' : ''}" data-bg="${bg.id}">
                <div class="bg-grid-thumb" style="background-image:url('${bgUrl}');background-size:cover;background-position:center;"></div>
                <div class="bg-grid-label">${bg.label}</div>
              </button>`;
            }).join('')}
            <label class="bg-grid-item bg-upload-slot${this.photoDataUrl ? ' selected' : ''}" id="bgUploadSlot" for="configPhotoInput">
              <input type="file" accept="image/*" id="configPhotoInput" style="display:none;">
              <div class="bg-grid-thumb bg-upload-thumb" id="bgUploadThumb">
                ${this.photoDataUrl ? `<img src="${this.photoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">` : '<span class="bg-upload-icon">+📷</span>'}
              </div>
              <div class="bg-grid-label">自定义</div>
            </label>
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
        ${bgSection}
      `;
    }

    if (this.sceneId === 'news') {
      return `
        <div class="config-section">
          <div class="config-section-label">关注领域</div>
          <div class="category-pills">
            ${NEWS_CATEGORIES.map(c => `
              <button class="category-pill${this.selectedCategories.includes(c.id) ? ' selected' : ''}" data-cat="${c.id}">${c.label}</button>
            `).join('')}
          </div>
          <div class="config-hint" style="font-size:11px;color:#999;margin-top:4px;">至少选1个，最多5个</div>
        </div>
      `;
    }

    if (this.sceneId === 'alarm') {
      return `
        <div class="config-section">
          <div class="config-section-label">显示风格</div>
          <div class="alarm-style-picker">
            ${ALARM_STYLES.map(s => `
              <button class="alarm-style-btn${s.id === this.selectedAlarmStyle ? ' selected' : ''}" data-style="${s.id}">
                <span class="alarm-style-icon">${s.icon}</span>
                <span class="alarm-style-label">${s.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    // music, calendar — no extra fields
    return '';
  }

  _bindEvents() {
    const panel = this.container;

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

    // Unified background: upload slot uses <label for="configPhotoInput"> (most reliable on mobile)
    const bgPhotoInput = panel.querySelector('#configPhotoInput');
    const bgUploadSlot = panel.querySelector('#bgUploadSlot');
    if (bgPhotoInput) {
      bgPhotoInput.addEventListener('change', (e) => {
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
            this.selectedBgImage = '';  // 清除预设选择
            // Update UI
            panel.querySelectorAll('.bg-grid-item').forEach(b => b.classList.remove('selected'));
            bgUploadSlot.classList.add('selected');
            const thumb = panel.querySelector('#bgUploadThumb');
            if (thumb) thumb.innerHTML = `<img src="${this.photoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // News category multi-select pills
    panel.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.cat;
        if (pill.classList.contains('selected')) {
          // Deselect — but must keep at least 1
          if (this.selectedCategories.length > 1) {
            this.selectedCategories = this.selectedCategories.filter(c => c !== cat);
            pill.classList.remove('selected');
          }
        } else {
          this.selectedCategories.push(cat);
          pill.classList.add('selected');
        }
      });
    });

    // Alarm style picker
    panel.querySelectorAll('.alarm-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.alarm-style-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedAlarmStyle = btn.dataset.style;
      });
    });

    // Background preset grid (exclude upload slot which has its own handler)
    panel.querySelectorAll('.bg-grid-item:not(.bg-upload-slot)').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.bg-grid-item').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedBgImage = btn.dataset.bg;
        // Deselect custom photo when preset is chosen
        this.photoDataUrl = null;
        const thumb = panel.querySelector('#bgUploadThumb');
        if (thumb) thumb.innerHTML = '<span class="bg-upload-icon">+📷</span>';
      });
    });

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
      style_preset: 'glass',
      visual_style: 'glass',
      primary_color: this.selectedColor,
      params: {},
      description: this.scene.title,
    };

    if (this.photoDataUrl && ['love', 'baby'].includes(this.sceneId)) {
      data.params.bg_photo = this.photoDataUrl;
    }

    if (this.selectedBgImage && ['love', 'baby', 'countdown'].includes(this.sceneId)) {
      data.params.background_image = this.selectedBgImage;
    }

    // weather 城市在卡片内切换，不从 config 传

    if (this.sceneId === 'news') {
      data.params.categories = this.selectedCategories;
    }

    if (this.sceneId === 'alarm') {
      data.params.display_style = this.selectedAlarmStyle;
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
          merged.style_preset = 'glass';
          merged.visual_style = 'glass';
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
