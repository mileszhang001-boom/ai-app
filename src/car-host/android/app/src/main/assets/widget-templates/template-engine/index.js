/**
 * 模板引擎入口
 *
 * 用于服务器端渲染 H5 组件模板
 */

export {
  TemplateEngine,
  RendererOptions,
  createRenderer,
  renderWidget
} from './renderer.js';

/**
 * 模板类型枚举
 */
export const TemplateType = {
  ANNIVERSARY: 'anniversary',
  NEWS: 'news',
  ALARM: 'alarm'
};

/**
 * 纪念日主题枚举
 */
export const AnniversaryTheme = {
  LOVE: 'love',
  BABY: 'baby',
  HOLIDAY: 'holiday'
};

/**
 * 风格预设枚举
 */
export const StylePreset = {
  VIBRANT_ORANGE: 'vibrant-orange',
  OCEAN_BLUE: 'ocean-blue',
  FOREST_GREEN: 'forest-green',
  MINIMAL_DARK: 'minimal-dark',
  SWEET_PINK: 'sweet-pink',
  WARM_YELLOW: 'warm-yellow',
  SOFT_PURPLE: 'soft-purple',
  TECH_BLUE: 'tech-blue',
  CLEAN_LIGHT: 'clean-light',
  ANALOG_MINIMAL: 'analog-minimal',
  DIGITAL_NEON: 'digital-neon'
};

/**
 * 获取所有模板配置
 */
export function getAllTemplates() {
  const { createRenderer } = await import('./renderer.js');
  const engine = createRenderer();
  return engine.getAvailableTemplates();
}

/**
 * 获取模板参数 schema
 */
export function getTemplateSchema(type, theme) {
  const { createRenderer } = await import('./renderer.js');
  const engine = createRenderer();
  return engine.getParamSchema(type, theme);
}

/**
 * 获取可用风格列表
 */
export function getAvailableStyles(type, theme) {
  const { createRenderer } = await import('./renderer.js');
  const engine = createRenderer();
  return engine.getAvailableStyles(type, theme);
}
