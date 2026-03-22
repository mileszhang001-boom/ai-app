/**
 * Finetune Page — dedicated fine-tuning interface
 *
 * Layout:
 *  - Status bar + nav (y=0..88)
 *  - Mini card preview (y=88, h=170)
 *  - ConfigPanel in finetune mode (y=258, fills remaining)
 */

import { showToast } from '../main.js';
import { renderWidgetInFrame, getSceneId, showGenerateOverlay } from '../utils/render-widget.js';
import { ConfigPanel } from '../components/config-panel.js';

export class FineTunePage {
  constructor(api, router) {
    this.api = api;
    this.router = router;
    this.currentData = null;
    this.configPanel = null;
  }

  async render(params) {
    const container = document.getElementById('page-finetune');
    this.currentData = params.data;

    if (!this.currentData) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF;">无数据</div>';
      return;
    }

    const sceneId = getSceneId(this.currentData);

    container.innerHTML = `
      <div class="finetune-page">
        <div class="top-nav">
          <button class="top-nav-back" id="finetuneBackBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="top-nav-title">微调</div>
          <div style="width:36px"></div>
        </div>

        <div class="finetune-mini-preview">
          <div class="finetune-mini-card" id="finetuneMiniFrame">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>

        <div class="finetune-panel-area" id="finetunePanelArea"></div>
      </div>
    `;

    this._bindEvents();
    this._renderMiniPreview();
    this._initConfigPanel(sceneId);
  }

  _bindEvents() {
    document.getElementById('finetuneBackBtn')?.addEventListener('click', () => {
      this.router.back();
    });
  }

  async _renderMiniPreview() {
    const frame = document.getElementById('finetuneMiniFrame');
    if (!frame || !this.currentData) return;
    try {
      await renderWidgetInFrame(frame, this.currentData);
    } catch (err) {
      console.error('Mini preview render failed:', err);
      frame.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9CA3AF;font-size:12px;">预览加载失败</div>';
    }
  }

  _initConfigPanel(sceneId) {
    const panelArea = document.getElementById('finetunePanelArea');
    if (!panelArea) return;

    this.configPanel = new ConfigPanel({
      container: panelArea,
      mode: 'finetune',
      sceneId,
      currentData: this.currentData,
      api: this.api,
      onGenerate: async (newData) => {
        const { overlay, waitForMinDuration } = showGenerateOverlay();
        try {
          await waitForMinDuration();
          overlay.remove();
          // Pop the previous "preview" entry so back goes to market
          const stack = this.router.pageStack;
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].name === 'preview') { stack.splice(i, 1); break; }
          }
          // _replace: don't push "finetune" to stack
          this.router.navigate('preview', { data: newData, isNew: false, _replace: true });
        } catch {
          overlay.remove();
          showToast('应用修改失败', 'error');
        }
      },
    });
  }
}
