/**
 * 模板市场页面
 *
 * 顶部：自然语言输入框（AI 创建入口）
 * 下方：模板网格（手动选择入口，同时作为灵感提示）
 */

import { showToast } from '../main.js';

// 轮播的 placeholder 示例
const PLACEHOLDER_EXAMPLES = [
  '和女朋友6月1日在一起的，做个纪念日',
  '国庆倒计时，我已经迫不及待了',
  '宝宝3月15日出生，记录成长',
  '每天早上7点叫我起床',
  '想看今天的新闻摘要',
  '我和老婆结婚两周年了',
  '距离五一还有多久？做个倒计时',
];

export class TemplateMarket {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.templates = null;
    this.placeholderIndex = 0;
    this.placeholderTimer = null;
    this.isGenerating = false;
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
        this.templates = this.getDefaultTemplates();
      }
    }

    this.renderPage(container);
  }

  getDefaultTemplates() {
    return {
      anniversary: {
        love: {
          id: 'anniversary_love', name: '恋爱纪念', mode: 'countup',
          description: '记录甜蜜时光，在一起的第X天',
          style_presets: ['sweet-pink', 'vibrant-orange', 'soft-purple', 'minimal-dark']
        },
        baby: {
          id: 'anniversary_baby', name: '宝宝成长', mode: 'countup',
          description: '记录宝宝成长的足迹',
          style_presets: ['soft-purple', 'sweet-pink', 'ocean-blue', 'warm-yellow']
        },
        holiday: {
          id: 'anniversary_holiday', name: '放假倒计时', mode: 'countdown',
          description: '期待美好假期，倒计时模式',
          style_presets: ['vibrant-orange', 'warm-yellow', 'ocean-blue', 'forest-green']
        }
      },
      news: {
        daily: {
          id: 'news_daily', name: '每日新闻',
          description: 'AI 摘要的每日新闻卡片',
          style_presets: ['minimal-dark', 'clean-light']
        }
      },
      alarm: {
        clock: {
          id: 'alarm_clock', name: '闹钟',
          description: '显示下一个闹钟 + 快捷设置',
          style_presets: ['analog-minimal', 'digital-neon']
        }
      }
    };
  }

  renderPage(container) {
    container.innerHTML = `
      <div class="top-nav">
        <div class="top-nav-title">AI 创意工坊</div>
        <div class="top-nav-back" style="visibility: hidden;"></div>
      </div>
      <div class="container">

        <!-- AI 自然语言创建区域 -->
        <div class="nl-create-section">
          <div class="nl-create-header">
            <div class="nl-create-badge">AI</div>
            <span>告诉我你想要什么卡片</span>
          </div>
          <div class="nl-input-wrapper">
            <textarea
              id="nlInput"
              class="nl-input"
              rows="2"
              maxlength="200"
            ></textarea>
            <button id="nlSendBtn" class="nl-send-btn" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div class="nl-examples" id="nlExamples">
            <span class="nl-examples-label">试试说：</span>
            <div class="nl-example-chips">
              <button class="nl-chip" data-text="和女朋友6月1日在一起的，做个纪念日">恋爱纪念日</button>
              <button class="nl-chip" data-text="国庆倒计时">国庆倒计时</button>
              <button class="nl-chip" data-text="宝宝3月15日出生，记录成长">宝宝成长</button>
              <button class="nl-chip" data-text="每天早上7点叫我起床">早起闹钟</button>
              <button class="nl-chip" data-text="想看今天的新闻">每日新闻</button>
            </div>
          </div>
        </div>

        <!-- 分隔 -->
        <div class="section-divider">
          <div class="divider-line"></div>
          <span class="divider-text">或选择模板</span>
          <div class="divider-line"></div>
        </div>

        <!-- 模板网格 -->
        <div class="template-grid">
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
          <div class="template-card" data-type="news" data-theme="daily">
            <div class="template-icon">📰</div>
            <div class="template-name">每日新闻</div>
            <div class="template-desc">AI 摘要新闻</div>
          </div>
          <div class="template-card" data-type="alarm" data-theme="clock">
            <div class="template-icon">⏰</div>
            <div class="template-name">闹钟</div>
            <div class="template-desc">快捷设置闹钟</div>
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
      // 有输入时停止 placeholder 动画
      if (hasText) {
        this.stopPlaceholderAnimation();
        input.classList.add('has-content');
      } else {
        this.startPlaceholderAnimation();
        input.classList.remove('has-content');
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

    // 示例 chip 点击
    container.querySelectorAll('.nl-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.dataset.text;
        input.value = text;
        input.classList.add('has-content');
        sendBtn.disabled = false;
        this.stopPlaceholderAnimation();
        // 直接触发生成
        this.handleNLGenerate(text);
      });
    });

    // 模板卡片点击（保留原有功能）
    container.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const type = card.dataset.type;
        const theme = card.dataset.theme;
        this.router.navigate('config', { type, theme });
      });
    });
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

    // 显示加载状态
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="spinner" style="width:18px;height:18px;border-width:2px;"></div>';
    input.disabled = true;

    // 显示全屏生成进度
    const overlay = this.showGenerateOverlay(text);

    try {
      const response = await this.api.chatGenerate(text);

      if (response.success) {
        // 完成最后一步动画
        this.updateOverlayStep(overlay, 2);
        await new Promise(r => setTimeout(r, 500));
        overlay.remove();
        this.router.navigate('preview', { data: response.data });
      } else {
        overlay.remove();
        const errorMsg = response.error || '请换一种说法试试';
        // 如果是"暂不支持"类错误，显示带建议的提示面板
        if (errorMsg.includes('暂时还不支持')) {
          this.showUnsupportedHint(errorMsg);
        } else {
          showToast(errorMsg, 'error');
        }
      }
    } catch (error) {
      overlay.remove();
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

  showGenerateOverlay(userText) {
    const overlay = document.createElement('div');
    overlay.className = 'generate-overlay';
    // 截取用户输入的前 30 字作为展示
    const displayText = userText.length > 30 ? userText.slice(0, 30) + '…' : userText;
    overlay.innerHTML = `
      <div class="nl-gen-content">
        <div class="nl-gen-user-msg">"${displayText}"</div>
        <div class="spinner-lg"></div>
        <div class="gen-step" data-step="0">理解你的想法…</div>
        <div class="gen-step dim" data-step="1">AI 选择模板 & 生成创意文案…</div>
        <div class="gen-step dim" data-step="2">渲染你的专属卡片…</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // 自动推进步骤
    setTimeout(() => this.updateOverlayStep(overlay, 1), 600);

    return overlay;
  }

  updateOverlayStep(overlay, activeStep) {
    if (!overlay.parentNode) return;
    overlay.querySelectorAll('.gen-step').forEach(el => {
      const step = parseInt(el.dataset.step);
      el.classList.toggle('dim', step > activeStep);
      if (step < activeStep) {
        el.style.color = 'rgba(0,200,83,0.7)';
        const text = el.textContent.replace(/^✓\s*/, '');
        el.textContent = '✓ ' + text;
      }
    });
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
