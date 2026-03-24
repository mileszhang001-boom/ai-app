/**
 * Color Engine v2 — 动态配色引擎（双模式）
 *
 * computePalette(hex, mode)
 *   mode='mood'  → 完整调色板（背景渐变+玻璃+强调+粒子），用于天气/新闻/音乐
 *   mode='clean' → 仅强调色变量（背景固定不变），用于日程/闹钟
 */

(function() {
  'use strict';

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s: s, l: l };
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      function hue2rgb(p, q, t) {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function lighten(rgb, amount) {
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.min(1, hsl.l + amount);
    return hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  /**
   * computePalette(hex, mode) → 调色板
   * @param {string} hex - 用户选的颜色，如 '#4A90E2'
   * @param {string} mode - 'mood'(默认) | 'clean'
   */
  function computePalette(hex, mode) {
    mode = mode || 'mood';
    var c = hexToRgb(hex);
    var hsl = rgbToHsl(c.r, c.g, c.b);

    // ── 极端颜色保护 ──
    var sat = hsl.s;
    // 纯白
    if (hsl.l > 0.95) { hsl.h = 210; sat = 0.30; }
    // 纯黑
    else if (hsl.l < 0.05 && sat < 0.05) { hsl.h = 210; sat = 0.30; }
    // 灰色系（低饱和）
    else if (sat < 0.10) { hsl.h = 210; sat = 0.15; }
    // 一般保护：饱和度至少 0.20
    else { sat = Math.max(sat, 0.20); }

    // 亮化版本
    var bright = lighten(c, 0.20);

    // ── 强调色变量（clean + mood 都需要）──
    var palette = {
      ringStroke: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.60)',
      accentColor: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.70)',
      accentBg: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.10)',
      labelColor: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.50)',
      glassBorder: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.22)',
      dividerColor: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.20)',
      particleRgb: [bright.r, bright.g, bright.b],
    };

    // CSS 变量（clean 模式只输出强调色）
    palette.cssVars = {
      '--dyn-accent': palette.accentColor,
      '--dyn-accent-bg': palette.accentBg,
      '--dyn-ring-stroke': palette.ringStroke,
      '--dyn-label-color': palette.labelColor,
      '--dyn-glass-border': palette.glassBorder,
      '--dyn-divider-color': palette.dividerColor,
    };

    // ── Mood 模式：额外输出背景渐变 + 玻璃 + 光晕 ──
    if (mode === 'mood') {
      // v2 参数：更高饱和度 + 更亮背景
      var bg1 = hslToRgb(hsl.h, sat * 0.70, 0.20);
      var bg2 = hslToRgb(hsl.h, sat * 0.75, 0.23);
      var bg3 = hslToRgb(hsl.h, sat * 0.55, 0.13);

      palette.bgGradient = 'linear-gradient(155deg, rgb(' + bg1.r + ',' + bg1.g + ',' + bg1.b + ') 0%, rgb(' + bg2.r + ',' + bg2.g + ',' + bg2.b + ') 35%, rgb(' + bg3.r + ',' + bg3.g + ',' + bg3.b + ') 100%)';
      palette.glowPrimary = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.32)';
      palette.glowSecondary = 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.20)';
      palette.glowTertiary = 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.10)';
      palette.ambientLine = 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.50)';
      palette.glassBg = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.15)';

      palette.cssVars['--dyn-bg'] = palette.bgGradient;
      palette.cssVars['--dyn-glow-primary'] = palette.glowPrimary;
      palette.cssVars['--dyn-glow-secondary'] = palette.glowSecondary;
      palette.cssVars['--dyn-glow-tertiary'] = palette.glowTertiary;
      palette.cssVars['--dyn-ambient-line'] = palette.ambientLine;
      palette.cssVars['--dyn-glass-bg'] = palette.glassBg;
    }

    return palette;
  }

  // 暴露到全局（同时暴露工具函数供 color-extract 使用）
  window.computePalette = computePalette;
  window._colorEngine = { hexToRgb: hexToRgb, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb };

})();
