/**
 * 模板引擎 - 参数注入和渲染
 *
 * 负责：
 * 1. 加载模板文件
 * 2. 将参数注入模板（{{param}} 替换）
 * 3. 组合模板与风格样式
 * 4. 输出完整的 H5 包
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * 模板配置
 */
const TEMPLATES = {
  anniversary: {
    love: {
      id: 'anniversary_love',
      name: '恋爱纪念',
      mode: 'countup',
      description: '记录甜蜜时光，在一起的第X天',
      params: {
        title: { type: 'string', required: true, default: '在一起的第___天', maxLength: 20 },
        start_date: { type: 'date', required: true },
        subtitle: { type: 'string', required: false, aiGenerated: true, maxLength: 30 }
      },
      styles: ['sweet-pink', 'vibrant-orange', 'soft-purple', 'minimal-dark']
    },
    baby: {
      id: 'anniversary_baby',
      name: '宝宝成长',
      mode: 'countup',
      description: '记录宝宝的成长足迹',
      params: {
        title: { type: 'string', required: true, default: '宝宝出生的第___天', maxLength: 20 },
        start_date: { type: 'date', required: true },
        subtitle: { type: 'string', required: false, aiGenerated: true, maxLength: 30 }
      },
      styles: ['soft-purple', 'sweet-pink', 'ocean-blue', 'warm-yellow']
    },
    holiday: {
      id: 'anniversary_holiday',
      name: '放假倒计时',
      mode: 'countdown',
      description: '期待美好假期，倒计时模式',
      params: {
        title: { type: 'string', required: true, maxLength: 20 },
        target_date: { type: 'datetime', required: true },
        subtitle: { type: 'string', required: false, aiGenerated: true, maxLength: 30 },
        emoji: { type: 'string', required: false, default: '🏖️' },
        show_hours: { type: 'boolean', required: false, default: true },
        show_minutes: { type: 'boolean', required: false, default: true }
      },
      styles: ['vibrant-orange', 'warm-yellow', 'ocean-blue', 'forest-green']
    }
  },
  news: {
    daily: {
      id: 'news_daily',
      name: '每日新闻',
      description: 'AI 摘要的每日新闻卡片',
      params: {
        category: { type: 'enum', values: ['general', 'tech', 'auto'], default: 'general' },
        max_items: { type: 'number', min: 3, max: 8, default: 5 }
      },
      styles: ['minimal-dark', 'clean-light']
    }
  },
  alarm: {
    clock: {
      id: 'alarm_clock',
      name: '闹钟',
      description: '显示下一个闹钟 + 快捷设置',
      params: {
        default_hours: { type: 'number', required: false, default: 8 },
        label: { type: 'string', required: false, maxLength: 15 }
      },
      styles: ['analog-minimal', 'digital-neon']
    }
  }
};

/**
 * 渲染选项
 */
export class RendererOptions {
  constructor() {
    this.minify = false;           // 是否压缩
    this.includeBridge = true;     // 是否包含 JSBridge
    this.inlineStyles = false;    // 是否内联样式
    this.outputFormat = 'html';   // 输出格式: html | bundle
  }
}

/**
 * 模板引擎主类
 */
export class TemplateEngine {
  constructor(options = new RendererOptions()) {
    this.options = options;
  }

  /**
   * 渲染模板
   * @param {string} templateType - 模板类型: anniversary | news | alarm
   * @param {string} theme - 主题: love | baby | holiday | daily | clock
   * @param {Object} params - 模板参数
   * @param {string} stylePreset - 风格预设
   * @returns {Promise<{html: string, assets: Object}>}
   */
  async render(templateType, theme, params, stylePreset = null) {
    // 获取模板配置
    const templateConfig = this.getTemplateConfig(templateType, theme);
    if (!templateConfig) {
      throw new Error(`Template not found: ${templateType}/${theme}`);
    }

    // 验证参数
    this.validateParams(templateConfig.params, params);

    // 添加默认参数
    const mergedParams = { ...params };
    for (const [key, config] of Object.entries(templateConfig.params)) {
      if (mergedParams[key] === undefined && config.default !== undefined) {
        mergedParams[key] = config.default;
      }
    }

    // 获取风格预设（如果未指定，使用第一个）
    const style = stylePreset || templateConfig.styles[0];

    // 加载模板文件
    const templateDir = path.join(PROJECT_ROOT, 'src', 'widget-templates', templateType, theme);
    const htmlContent = await fs.readFile(path.join(templateDir, 'index.html'), 'utf-8');
    const cssContent = await fs.readFile(path.join(templateDir, 'style.css'), 'utf-8');
    const jsContent = await fs.readFile(path.join(templateDir, 'main.js'), 'utf-8');

    // 加载共享资源
    const tokensCss = await fs.readFile(
      path.join(PROJECT_ROOT, 'src', 'widget-templates', 'shared', 'tokens.css'),
      'utf-8'
    );

    // 注入参数到 HTML
    let renderedHtml = this.injectParams(htmlContent, mergedParams);

    // 设置风格属性
    renderedHtml = this.applyStylePreset(renderedHtml, style);

    // 组合样式
    let combinedCss = tokensCss + '\n' + cssContent;

    // 添加风格变量注入
    combinedCss = this.injectStyleVariables(combinedCss, style);

    // 构建最终 HTML
    if (this.options.inlineStyles) {
      // 内联样式
      renderedHtml = renderedHtml.replace('</head>', `<style>${combinedCss}</style></head>`);
    }

    // 添加参数注入脚本
    const paramsScript = `<script>window.__WIDGET_PARAMS__ = ${JSON.stringify(mergedParams)};</script>`;
    renderedHtml = renderedHtml.replace('<script src="../shared/bridge.js"></script>',
      paramsScript + '<script src="../shared/bridge.js"></script>');

    // 路径修正（用于独立运行）
    renderedHtml = this.fixPaths(renderedHtml, templateType, theme);

    return {
      html: renderedHtml,
      css: combinedCss,
      js: jsContent,
      params: mergedParams,
      config: templateConfig
    };
  }

  /**
   * 获取模板配置
   */
  getTemplateConfig(type, theme) {
    return TEMPLATES[type]?.[theme];
  }

  /**
   * 验证参数
   */
  validateParams(schema, params) {
    for (const [key, config] of Object.entries(schema)) {
      if (config.required && params[key] === undefined) {
        throw new Error(`Required parameter missing: ${key}`);
      }

      if (params[key] !== undefined) {
        // 类型检查
        if (config.type === 'number' && typeof params[key] !== 'number') {
          throw new Error(`Parameter ${key} must be a number`);
        }
        if (config.type === 'boolean' && typeof params[key] !== 'boolean') {
          throw new Error(`Parameter ${key} must be a boolean`);
        }
        if (config.type === 'enum' && !config.values.includes(params[key])) {
          throw new Error(`Parameter ${key} must be one of: ${config.values.join(', ')}`);
        }

        // 长度检查
        if (config.maxLength && String(params[key]).length > config.maxLength) {
          throw new Error(`Parameter ${key} exceeds maximum length of ${config.maxLength}`);
        }

        // 数值范围检查
        if (config.min !== undefined && params[key] < config.min) {
          throw new Error(`Parameter ${key} must be at least ${config.min}`);
        }
        if (config.max !== undefined && params[key] > config.max) {
          throw new Error(`Parameter ${key} must be at most ${config.max}`);
        }
      }
    }
  }

  /**
   * 注入参数到模板
   */
  injectParams(template, params) {
    let result = template;

    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, 'g');
      result = result.replace(regex, this.escapeHtml(String(value)));
    }

    return result;
  }

  /**
   * 应用风格预设
   */
  applyStylePreset(html, style) {
    // 替换 data-style 属性
    if (!html.includes('data-style=')) {
      // 如果没有设置，在卡片容器上添加
      html = html.replace(
        /(<div class="widget-card"[^>]*?)(>)/,
        `$1 data-style="${style}"$2`
      );
    }
    return html;
  }

  /**
   * 注入样式变量
   */
  injectStyleVariables(css, style) {
    // 确保风格变量已定义
    if (!css.includes(`[data-style="${style}"]`)) {
      // 添加风格定义
      const styleVar = `--style-${style}`;
      const styleDef = `\n[data-style="${style}"] .widget-card {\n  background: var(${styleVar}, linear-gradient(135deg, #1A1A2E, #16213E));\n}`;
      css += styleDef;
    }
    return css;
  }

  /**
   * 修正资源路径（用于独立运行）
   */
  fixPaths(html, type, theme) {
    // 修正相对路径
    html = html.replace(/\.\.\/\.\.\/shared\//g, '/shared/');
    html = html.replace(/\.\.\/\.\.\/\.\.\/shared\//g, '/shared/');
    html = html.replace(/\.\.\/style\.css/g, `/styles/${theme}.css`);
    html = html.replace(/\.\.\/main\.js/g, `/scripts/${theme}.js`);

    return html;
  }

  /**
   * 转义 HTML
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 获取所有可用模板
   */
  getAvailableTemplates() {
    return TEMPLATES;
  }

  /**
   * 获取模板的参数 schema
   */
  getParamSchema(type, theme) {
    const config = this.getTemplateConfig(type, theme);
    return config?.params;
  }

  /**
   * 获取模板的可用风格
   */
  getAvailableStyles(type, theme) {
    const config = this.getTemplateConfig(type, theme);
    return config?.styles || [];
  }
}

/**
 * 创建默认渲染器实例
 */
export const createRenderer = (options) => new TemplateEngine(options);

/**
 * 便捷函数：快速渲染
 */
export async function renderWidget(type, theme, params, style) {
  const engine = new TemplateEngine();
  return engine.render(type, theme, params, style);
}
