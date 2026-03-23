/**
 * Color Extract — 背景图取色工具
 * 从图片底部 30% 区域提取主色调，用于纪念日卡毛玻璃面板上色
 */

(function() {
  'use strict';

  var ce = window._colorEngine || {};

  function rgbToHsl(r, g, b) {
    if (ce.rgbToHsl) return ce.rgbToHsl(r, g, b);
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
    if (ce.hslToRgb) return ce.hslToRgb(h, s, l);
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

  /**
   * extractPanelTint(img) → rgba string
   * 从图片底部 30% 区域提取主色调，压暗后返回适合毛玻璃面板的底色
   *
   * @param {HTMLImageElement} img — 已加载的背景图
   * @returns {string} — 'rgba(r,g,b,0.88)'
   */
  function extractPanelTint(img) {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var w = 80, h = 80;
      canvas.width = w;
      canvas.height = h;

      // 只采样图片底部 30%
      var srcY = img.naturalHeight * 0.7;
      var srcH = img.naturalHeight * 0.3;
      ctx.drawImage(img, 0, srcY, img.naturalWidth, srcH, 0, 0, w, h);

      var data = ctx.getImageData(0, 0, w, h).data;

      // 加权平均（中心区域权重更高）
      var rSum = 0, gSum = 0, bSum = 0, weight = 0;
      for (var i = 0; i < data.length; i += 4) {
        var px = (i / 4) % w;
        var py = Math.floor((i / 4) / w);
        var cx = Math.abs(px / w - 0.5), cy = Math.abs(py / h - 0.5);
        var pw = 1 + (1 - cx * 2) * (1 - cy * 2);
        rSum += data[i]     * pw;
        gSum += data[i + 1] * pw;
        bSum += data[i + 2] * pw;
        weight += pw;
      }

      var r = Math.round(rSum / weight);
      var g = Math.round(gSum / weight);
      var b = Math.round(bSum / weight);

      // 压暗：亮度不超过 0.35，饱和度保留 80%
      var hsl = rgbToHsl(r, g, b);
      var panelL = Math.min(hsl.l, 0.35);
      var panelS = hsl.s * 0.80;
      var panelRgb = hslToRgb(hsl.h, panelS, panelL);

      return 'rgba(' + panelRgb.r + ',' + panelRgb.g + ',' + panelRgb.b + ',0.88)';
    } catch (e) {
      // Fallback: 深灰半透明
      return 'rgba(20,20,25,0.88)';
    }
  }

  window.extractPanelTint = extractPanelTint;
})();
