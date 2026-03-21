/**
 * 首页 — AI 创建入口
 *
 * 纯自然语言交互，一句话生成车机桌面卡片
 */

import { showToast } from '../main.js';

// 轮播的 placeholder 示例
const PLACEHOLDER_EXAMPLES = [
  '和女朋友6月1日在一起的，做个纪念日',
  '国庆倒计时，我已经迫不及待了',
  '宝宝3月15日出生，记录成长',
  '每天早上7点叫我起床',
  '想看今天的新闻摘要',
  '今天天气怎么样？穿什么合适',
  '给我来个音乐播放器卡片',
  '今天有什么会议安排',
  '距离五一还有多久？做个倒计时',
];

// 场景卡片配置
const SCENE_CARDS = [
  { icon: '💕', label: '恋爱纪念', text: '和女朋友6月1日在一起的，做个纪念日' },
  { icon: '🌤️', label: '实时天气', text: '北京今天天气怎么样' },
  { icon: '🎵', label: '音乐播放', text: '给我来个音乐播放器卡片' },
  { icon: '📅', label: '日程安排', text: '今天有什么会议' },
  { icon: '🏖️', label: '假期倒计时', text: '国庆倒计时' },
  { icon: '👶', label: '宝宝成长', text: '宝宝3月15日出生，记录成长' },
  { icon: '⏰', label: '智能闹钟', text: '每天早上7点叫我起床' },
  { icon: '📰', label: '每日新闻', text: '想看今天的新闻' },
  { icon: '💛', label: '结婚纪念', text: '我和老婆结婚两周年了' },
];

export class TemplateMarket {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.placeholderIndex = 0;
    this.placeholderTimer = null;
    this.isGenerating = false;
    this.analysisData = null;   // 上一次分析结果（用于微调上下文）
  }

  async render() {
    // 清理残留状态（从预览页返回时）
    this.stopPlaceholderAnimation();
    this.analysisData = null;
    this.isGenerating = false;

    const container = document.getElementById('page-market');
    this.renderPage(container);
  }

  renderPage(container) {
    container.innerHTML = `
      <div class="top-nav">
        <div class="top-nav-title">AI 创意工坊</div>
        <div class="top-nav-back" style="visibility: hidden;"></div>
      </div>
      <div class="container">

        <!-- Hero 区域 -->
        <div class="hero-section">
          <div class="hero-tagline">告诉 AI 你的想法</div>
        </div>

        <!-- AI 输入区域 -->
        <div class="nl-create-section">
          <div class="nl-input-wrapper">
            <textarea
              id="nlInput"
              class="nl-input"
              rows="3"
              maxlength="200"
            ></textarea>
            <button id="nlSendBtn" class="nl-send-btn" disabled aria-label="发送">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 分析气泡 -->
        <div id="analysisBubble" class="analysis-bubble" style="display:none;">
          <div class="analysis-icon">✨</div>
          <div class="analysis-text" id="analysisText"></div>
          <div class="analysis-actions">
            <button id="analysisConfirmBtn" class="btn">确认生成</button>
          </div>
          <div class="analysis-hint">不满意？直接输入修改意见</div>
        </div>

        <!-- 场景卡片 -->
        <div class="scene-section" id="sceneSection">
          <div class="scene-label">试试这些场景</div>
          <div class="scene-grid">
            ${SCENE_CARDS.map(s => `
              <button class="scene-card" data-text="${s.text}">
                <span class="scene-icon">${s.icon}</span>
                <span class="scene-name">${s.label}</span>
              </button>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    this.bindEvents(container);
    this.startPlaceholderAnimation();
  }

  bindEvents(container) {
    const input = container.querySelector('#nlInput');
    const sendBtn = container.querySelector('#nlSendBtn');

    // 输入时启用/禁用发送按钮
    input.addEventListener('input', () => {
      const hasText = input.value.trim().length > 0;
      sendBtn.disabled = !hasText;
      if (hasText) {
        this.stopPlaceholderAnimation();
        input.classList.add('has-content');
      } else {
        // 清空输入 → 重置分析状态
        this.startPlaceholderAnimation();
        input.classList.remove('has-content');
        this.resetAnalysis();
      }
    });

    // 发送按钮
    sendBtn.addEventListener('click', () => {
      this.handleNLGenerate(input.value.trim());
    });

    // 回车发送（Shift+Enter 换行）
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = input.value.trim();
        if (text) this.handleNLGenerate(text);
      }
    });

    // 场景卡片点击
    container.querySelectorAll('.scene-card').forEach(card => {
      card.addEventListener('click', () => {
        const text = card.dataset.text;
        input.value = text;
        input.classList.add('has-content');
        this.stopPlaceholderAnimation();
        this.handleNLGenerate(text);
      });
    });

    // 确认生成按钮
    const confirmBtn = container.querySelector('#analysisConfirmBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        this.confirmGenerate();
      });
    }
  }

  resetAnalysis() {
    this.analysisData = null;
    const bubble = document.getElementById('analysisBubble');
    const sceneSection = document.getElementById('sceneSection');
    if (bubble) bubble.style.display = 'none';
    if (sceneSection) sceneSection.style.display = '';
    const input = document.getElementById('nlInput');
    if (input) input.placeholder = PLACEHOLDER_EXAMPLES[this.placeholderIndex];
  }

  showAnalysisBubble(description) {
    const bubble = document.getElementById('analysisBubble');
    const textEl = document.getElementById('analysisText');
    const sceneSection = document.getElementById('sceneSection');

    if (textEl) textEl.textContent = '我猜你想做：' + description;
    if (bubble) {
      bubble.style.display = '';
      bubble.style.animation = 'none';
      // force reflow
      bubble.offsetHeight;
      bubble.style.animation = 'slideUp 0.3s ease-out';
    }
    // 收起场景卡片
    if (sceneSection) sceneSection.style.display = 'none';

    // 更新输入框 placeholder
    const input = document.getElementById('nlInput');
    if (input) {
      input.value = '';
      input.placeholder = '继续输入来调整...';
    }
  }

  confirmGenerate() {
    if (!this.analysisData) return;

    // 短暂 overlay
    const overlay = document.createElement('div');
    overlay.className = 'generate-overlay';
    overlay.innerHTML = `
      <div class="nl-gen-content">
        <div class="spinner-lg"></div>
        <div class="gen-step">渲染你的专属卡片…</div>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.remove();
      this.router.navigate('preview', { data: this.analysisData });
    }, 600);
  }

  startPlaceholderAnimation() {
    const input = document.getElementById('nlInput');
    if (!input || input.value.trim()) return;

    // 设置初始 placeholder
    this.placeholderIndex = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length);
    input.placeholder = PLACEHOLDER_EXAMPLES[this.placeholderIndex];

    // 每 3.5 秒切换一次
    this.stopPlaceholderAnimation();
    this.placeholderTimer = setInterval(() => {
      if (input.value.trim()) return;
      this.placeholderIndex = (this.placeholderIndex + 1) % PLACEHOLDER_EXAMPLES.length;
      // 淡出 → 更新 → 淡入
      input.classList.add('placeholder-fade');
      setTimeout(() => {
        input.placeholder = PLACEHOLDER_EXAMPLES[this.placeholderIndex];
        input.classList.remove('placeholder-fade');
      }, 300);
    }, 3500);
  }

  stopPlaceholderAnimation() {
    if (this.placeholderTimer) {
      clearInterval(this.placeholderTimer);
      this.placeholderTimer = null;
    }
  }

  async handleNLGenerate(text) {
    if (this.isGenerating || !text) return;
    this.isGenerating = true;

    const sendBtn = document.getElementById('nlSendBtn');
    const input = document.getElementById('nlInput');

    // 发送按钮显示 spinner（不用全屏 overlay）
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>';
    input.disabled = true;

    try {
      // 有 analysisData 时作为微调上下文
      const response = await this.api.chatGenerate(text, this.analysisData);

      if (response.success) {
        this.analysisData = response.data;
        this.showAnalysisBubble(response.data.description || '卡片');
      } else {
        const errorMsg = response.error || '请换一种说法试试';
        if (errorMsg.includes('暂时还不支持')) {
          this.showUnsupportedHint(errorMsg);
        } else {
          showToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      console.error('NL生成失败:', error);
      showToast('生成失败，请重试', 'error');
    } finally {
      this.isGenerating = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        `;
      }
      if (input) input.disabled = false;
    }
  }

  showUnsupportedHint(message) {
    const overlay = document.createElement('div');
    overlay.className = 'generate-overlay';
    // 将后端返回的多行消息转为 HTML
    const lines = message.split('\n');
    const title = lines[0]; // "暂时还不支持这类组件，试试以下场景："
    const suggestions = lines.slice(1)
      .filter(l => l.trim())
      .map(l => {
        const text = l.replace(/^\s*·\s*/, '');
        // 提取括号里的示例作为可点击 chip
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

    // 点击建议项直接填入输入框并触发生成
    overlay.querySelectorAll('.nl-unsupported-item[data-example]').forEach(item => {
      item.addEventListener('click', () => {
        const example = item.dataset.example;
        const input = document.getElementById('nlInput');
        if (input) {
          input.value = example;
          input.classList.add('has-content');
          const sendBtn = document.getElementById('nlSendBtn');
          if (sendBtn) sendBtn.disabled = false;
        }
        overlay.remove();
        this.handleNLGenerate(example);
      });
    });

    // 关闭按钮
    overlay.querySelector('.nl-unsupported-close').addEventListener('click', () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    });
  }
}
