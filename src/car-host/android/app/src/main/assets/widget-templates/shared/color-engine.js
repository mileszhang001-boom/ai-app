/**
 * Color Engine — 动态配色引擎
 * 输入一个 hex 颜色，输出完整的 Liquid Glass 调色板
 * ~80行, ~2KB
 */

(function() {
  'use strict';

  // hex → {r,g,b}
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // rgb → hsl (h:0-360, s:0-1, l:0-1)
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

  // hsl → rgb
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

  // 亮色调整：lightness +offset, 饱和度保持
  function lighten(rgb, amount) {
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.min(1, hsl.l + amount);
    return hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  /**
   * computePalette(hex) → 完整调色板
   */
  function computePalette(hex) {
    var c = hexToRgb(hex);
    var hsl = rgbToHsl(c.r, c.g, c.b);

    // 极浅色保护：饱和度至少 0.20
    var sat = Math.max(hsl.s, 0.20);
    // 极深色保护：亮度至少 0.10
    var baseLightness = Math.max(hsl.l, 0.10);

    // 背景色：取 hue，中饱和深亮度（从纯黑到"深色有色调"）
    var bg1 = hslToRgb(hsl.h, sat * 0.50, 0.15);
    var bg2 = hslToRgb(hsl.h, sat * 0.55, 0.17);
    var bg3 = hslToRgb(hsl.h, sat * 0.40, 0.10);

    // 亮化版本 (用于 label/divider)
    var bright = lighten(c, 0.20);

    var palette = {
      bgGradient: 'linear-gradient(155deg, rgb(' + bg1.r + ',' + bg1.g + ',' + bg1.b + ') 0%, rgb(' + bg2.r + ',' + bg2.g + ',' + bg2.b + ') 35%, rgb(' + bg3.r + ',' + bg3.g + ',' + bg3.b + ') 100%)',
      glowPrimary: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.32)',
      glowSecondary: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.20)',
      glowTertiary: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.10)',
      ambientLine: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.50)',
      glassBg: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.10)',
      glassBorder: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.16)',
      labelColor: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.50)',
      dividerColor: 'rgba(' + bright.r + ',' + bright.g + ',' + bright.b + ', 0.20)',
      particleRgb: [bright.r, bright.g, bright.b],
      // ring stroke (alarm)
      ringStroke: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.60)',
      // accent for active elements
      accentColor: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.70)',
      accentBg: 'rgba(' + c.r + ',' + c.g + ',' + c.b + ', 0.10)',
    };

    // CSS custom properties map
    palette.cssVars = {
      '--dyn-bg': palette.bgGradient,
      '--dyn-glow-primary': palette.glowPrimary,
      '--dyn-glow-secondary': palette.glowSecondary,
      '--dyn-glow-tertiary': palette.glowTertiary,
      '--dyn-ambient-line': palette.ambientLine,
      '--dyn-glass-bg': palette.glassBg,
      '--dyn-glass-border': palette.glassBorder,
      '--dyn-label-color': palette.labelColor,
      '--dyn-divider-color': palette.dividerColor,
      '--dyn-ring-stroke': palette.ringStroke,
      '--dyn-accent': palette.accentColor,
      '--dyn-accent-bg': palette.accentBg,
    };

    return palette;
  }

  // 暴露到全局
  window.computePalette = computePalette;

})();
