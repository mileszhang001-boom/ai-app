/**
 * Homepage — AI Creative Workshop entry point
 *
 * Layout: status bar + header + 3×3 scene grid + bottom input
 */

import { showToast } from '../main.js';
import { ConfigPanel } from '../components/config-panel.js';
import { showGenerateOverlay } from '../utils/render-widget.js';

// Lucide-style SVG icon paths (24×24 viewBox)
const ICON_PATHS = {
  'cloud-sun':   '<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>',
  'heart':       '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'calendar':    '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  'music':       '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  'sun':         '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'baby':        '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  'alarm-clock': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/><path d="M6.38 18.7 4 21"/><path d="M17.64 18.67 20 21"/>',
  'newspaper':   '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 1 1-4 0V7a1 1 0 0 1 1-1h1"/><path d="M10 10h8"/><path d="M10 14h4"/><path d="M10 18h6"/>',
};

function getIcon(name, color) {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ''}</svg>`;
}

const SCENE_CARDS = [
  { id: 'weather',   name: '实时天气',   bgColor: '#D4E5FF', iconColor: '#4A6CF7', icon: 'cloud-sun' },
  { id: 'love',      name: '恋爱纪念',   bgColor: '#FFE0EC', iconColor: '#E84393', icon: 'heart' },
  { id: 'calendar',  name: '日程安排',   bgColor: '#E0F0E3', iconColor: '#27AE60', icon: 'calendar' },
  { id: 'music',     name: '音乐播放',   bgColor: '#EDE0FF', iconColor: '#7B5CFA', icon: 'music' },
  { id: 'countdown', name: '放假倒计时', bgColor: '#FFF8E1', iconColor: '#F59E0B', icon: 'sun' },
  { id: 'baby',      name: '宝宝相册',   bgColor: '#E0F7FA', iconColor: '#0891B2', icon: 'baby' },
  { id: 'alarm',     name: '闹钟',       bgColor: '#EDE0FF', iconColor: '#7B5CFA', icon: 'alarm-clock' },
  { id: 'news',      name: '每日新闻',   bgColor: '#FCE4EC', iconColor: '#E84393', icon: 'newspaper' },
];

export class TemplateMarket {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.isGenerating = false;
    this.configPanel = null;
    this.configOverlay = null;
  }

  async render() {
    this.isGenerating = false;
    this.closeConfigPanel();
    const container = document.getElementById('page-market');
    this._renderPage(container);
  }

  _renderPage(container) {

    container.innerHTML = `
      <div class="home-page">
        <div class="home-top-content">
          <!-- Header -->
          <div class="home-header">
            <div class="home-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>
              </svg>
            </div>
            <div class="home-header-text">
              <div class="home-header-title">AI创意工坊</div>
              <div class="home-header-subtitle">一句话生成你的专属车机卡片</div>
            </div>
          </div>

          <!-- Scene grid -->
          <div class="scene-section-new">
            <div class="scene-section-title">热门场景</div>
            <div class="scene-grid-new">
              ${SCENE_CARDS.map(s => `
                <button class="scene-card-new" data-scene="${s.id}">
                  <div class="scene-card-thumb" style="background:${s.bgColor}">
                    ${getIcon(s.icon, s.iconColor)}

                  </div>
                  <div class="scene-card-name">${s.name}</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Bottom input -->
        <div class="home-bottom-input">
          <div class="bottom-input-label">没找到想要的？试试自由创作</div>
          <div class="bottom-input-row">
            <input type="text" class="bottom-text-input" id="homeInput"
                   placeholder="描述你想要的卡片，AI从零编写代码..." maxlength="200">
            <button class="bottom-send-btn" id="homeSendBtn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div class="free-input-hint">💡 使用大模型端到端生成，可能需要 10-15 秒</div>
        </div>
      </div>
    `;

    this._bindEvents(container);
  }

  _bindEvents(container) {
    const input = container.querySelector('#homeInput');
    const sendBtn = container.querySelector('#homeSendBtn');

    // Enable/disable send button
    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });

    // Send on click
    sendBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (text) this._handleFreeTextGenerate(text);
    });

    // Send on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const text = input.value.trim();
        if (text) this._handleFreeTextGenerate(text);
      }
    });

    // Scene card clicks
    container.querySelectorAll('.scene-card-new').forEach(card => {
      card.addEventListener('click', () => {
        this.openConfigPanel(card.dataset.scene);
      });
    });
  }

  /** Free text → chatGenerate → 4-step animation → preview */
  async _handleFreeTextGenerate(text) {
    if (this.isGenerating) return;
    this.isGenerating = true;

    const input = document.getElementById('homeInput');
    const sendBtn = document.getElementById('homeSendBtn');
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    const isCodeMode = true;
    const { overlay, waitForMinDuration } = showGenerateOverlay(isCodeMode);

    try {
      const response = await this.api.chatGenerate(text, null, 'code');
      await waitForMinDuration();
      overlay.remove();

      if (response.success) {
        this.router.navigate('preview', { data: response.data, isCodeMode });
      } else {
        const errorMsg = response.error || '生成失败，请重试';
        if (errorMsg.includes('暂时还不支持')) {
          this._showUnsupportedHint(errorMsg);
        } else {
          showToast(errorMsg, 'error');
        }
      }
    } catch (err) {
      overlay.remove();
      console.error('生成失败:', err);
      showToast('生成失败，请重试', 'error');
    } finally {
      this.isGenerating = false;
      if (input) { input.disabled = false; input.value = ''; }
      if (sendBtn) sendBtn.disabled = true;
    }
  }

  /** Open config panel as bottom sheet overlay */
  openConfigPanel(sceneId) {
    this.closeConfigPanel();

    // Overlay
    this.configOverlay = document.createElement('div');
    this.configOverlay.className = 'config-overlay';
    document.body.appendChild(this.configOverlay);
    document.body.classList.add('scroll-locked');

    // Panel container
    const panelWrap = document.createElement('div');
    panelWrap.className = 'config-panel-wrap';
    this.configOverlay.appendChild(panelWrap);

    // Click overlay to dismiss
    this.configOverlay.addEventListener('click', (e) => {
      if (e.target === this.configOverlay) this.closeConfigPanel();
    });

    // Create ConfigPanel
    this.configPanel = new ConfigPanel({
      container: panelWrap,
      mode: 'create',
      sceneId,
      api: this.api,
      onGenerate: async (data) => {
        this.closeConfigPanel();
        const { overlay, waitForMinDuration } = showGenerateOverlay();
        try {
          await waitForMinDuration();
          overlay.remove();
          this.router.navigate('preview', { data });
        } catch {
          overlay.remove();
          showToast('生成失败', 'error');
        }
      },
      onDismiss: () => this.closeConfigPanel(),
    });
  }

  _showUnsupportedHint(message) {
    const overlay = document.createElement('div');
    overlay.className = 'generate-overlay';
    const lines = message.split('\n');
    const title = lines[0];
    const suggestions = lines.slice(1)
      .filter(l => l.trim())
      .map(l => {
        const text = l.replace(/^\s*·\s*/, '');
        const match = text.match(/（如[：:](.+?)）/);
        const label = text.replace(/（如[：:].+?）/, '').trim();
        const example = match ? match[1] : '';
        return { label, example };
      });

    overlay.innerHTML = `
      <div class="nl-unsupported">
        <div class="nl-unsupported-icon">💡</div>
        <div class="nl-unsupported-title">${title}</div>
        <div class="nl-unsupported-list">
          ${suggestions.map(s => `
            <button class="nl-unsupported-item" ${s.example ? `data-example="${s.example}"` : ''}>
              <span>${s.label}</span>
              ${s.example ? `<span class="nl-unsupported-eg">"${s.example}"</span>` : ''}
            </button>
          `).join('')}
        </div>
        <button class="nl-unsupported-close">知道了</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.nl-unsupported-item[data-example]').forEach(item => {
      item.addEventListener('click', () => {
        const example = item.dataset.example;
        const input = document.getElementById('homeInput');
        if (input) {
          input.value = example;
          const sendBtn = document.getElementById('homeSendBtn');
          if (sendBtn) sendBtn.disabled = false;
        }
        overlay.remove();
        this._handleFreeTextGenerate(example);
      });
    });

    overlay.querySelector('.nl-unsupported-close').addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    });
  }

  closeConfigPanel() {
    if (this.configPanel) {
      this.configPanel.destroy();
      this.configPanel = null;
    }
    if (this.configOverlay) {
      this.configOverlay.remove();
      this.configOverlay = null;
    }
    document.body.classList.remove('scroll-locked');
  }
}
