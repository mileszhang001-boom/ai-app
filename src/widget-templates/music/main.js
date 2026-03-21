/**
 * 音乐播放器 · Liquid Glass
 * 模拟播放 + 频谱可视化 + JSBridge 集成
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    song_name: '晴天',
    artist: '周杰伦',
    album_cover_url: '',
    lyrics_snippet: '故事的小黄花 从出生那年就飘着',
    duration: '4:29',
    style_preset: 'dark-vinyl'
  };

  // ── 状态 ──
  var isPlaying = false;
  var currentSeconds = 0;
  var totalSeconds = parseDuration(params.duration || '4:29');
  var playbackTimer = null;

  // ── DOM 引用 ──
  var songNameEl = document.getElementById('songName');
  var artistEl = document.getElementById('artistName');
  var lyricsEl = document.getElementById('lyricsLine');
  var progressFill = document.getElementById('progressFill');
  var timeElapsed = document.getElementById('timeElapsed');
  var timeTotal = document.getElementById('timeTotal');
  var btnPlay = document.getElementById('btnPlay');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  var albumBg = document.getElementById('albumBg');
  var albumArt = document.getElementById('albumArt');
  var spectrum = document.querySelector('.spectrum');

  // ── 工具函数 ──
  function parseDuration(str) {
    var parts = str.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 269; // 默认 4:29
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── 渲染基本信息 ──
  function renderTrackInfo() {
    if (songNameEl) songNameEl.textContent = params.song_name || '晴天';
    if (artistEl) artistEl.textContent = params.artist || '周杰伦';
    if (lyricsEl) lyricsEl.textContent = params.lyrics_snippet || '故事的小黄花 从出生那年就飘着';
    if (timeTotal) timeTotal.textContent = formatTime(totalSeconds);
    if (timeElapsed) timeElapsed.textContent = formatTime(0);
  }

  // ── 专辑封面 ──
  function renderAlbumArt() {
    var url = params.album_cover_url;
    if (url && url.length > 0) {
      // 用真实图片替换占位
      var img = document.createElement('img');
      img.src = url;
      img.alt = params.song_name || '专辑封面';
      img.onerror = function() {
        // 图片加载失败，保留占位
      };
      img.onload = function() {
        var placeholder = albumArt.querySelector('.album-art-placeholder');
        if (placeholder) {
          albumArt.removeChild(placeholder);
        }
        albumArt.appendChild(img);

        // 更新背景模糊
        if (albumBg) {
          albumBg.style.backgroundImage = 'url(' + url + ')';
          albumBg.style.backgroundSize = 'cover';
          albumBg.style.backgroundPosition = 'center';
        }
      };
    }
  }

  // ── 进度条更新 ──
  function updateProgress() {
    if (totalSeconds <= 0) return;
    var pct = Math.min((currentSeconds / totalSeconds) * 100, 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (timeElapsed) timeElapsed.textContent = formatTime(currentSeconds);
  }

  // ── 模拟播放 ──
  function startPlayback() {
    if (playbackTimer) return;
    isPlaying = true;

    if (btnPlay) btnPlay.textContent = '⏸';
    if (spectrum) spectrum.classList.remove('paused');

    playbackTimer = setInterval(function() {
      currentSeconds++;
      if (currentSeconds >= totalSeconds) {
        currentSeconds = 0; // 循环播放
      }
      updateProgress();
    }, 1000);
  }

  function stopPlayback() {
    isPlaying = false;
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
    if (btnPlay) btnPlay.textContent = '▶';
    if (spectrum) spectrum.classList.add('paused');
  }

  function togglePlayback() {
    if (isPlaying) {
      stopPlayback();
      // JSBridge: 暂停
      if (window.AIWidgetBridge) {
        try {
          window.AIWidgetBridge.storageSet('music_state', 'paused');
        } catch (e) { /* ignore */ }
      }
    } else {
      startPlayback();
      // JSBridge: 播放
      if (window.AIWidgetBridge) {
        try {
          window.AIWidgetBridge.storageSet('music_state', 'playing');
        } catch (e) { /* ignore */ }
      }
    }
  }

  function handlePrev() {
    currentSeconds = 0;
    updateProgress();
    // JSBridge: 上一首
    if (window.AIWidgetBridge) {
      try {
        window.AIWidgetBridge.storageSet('music_action', 'prev');
      } catch (e) { /* ignore */ }
    }
  }

  function handleNext() {
    currentSeconds = 0;
    updateProgress();
    // JSBridge: 下一首
    if (window.AIWidgetBridge) {
      try {
        window.AIWidgetBridge.storageSet('music_action', 'next');
      } catch (e) { /* ignore */ }
    }
  }

  // ── 频谱条随机化 ──
  function randomizeSpectrumDelays() {
    var bars = document.querySelectorAll('.spectrum-bar');
    for (var i = 0; i < bars.length; i++) {
      var delay = (Math.random() * 0.4).toFixed(2);
      var duration = (0.6 + Math.random() * 0.4).toFixed(2);
      bars[i].style.animationDelay = delay + 's';
      bars[i].style.animationDuration = duration + 's';
    }
  }

  // ── 主题应用 ──
  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  // ── 事件绑定 ──
  function bindEvents() {
    if (btnPlay) btnPlay.addEventListener('click', togglePlayback);
    if (btnPrev) btnPrev.addEventListener('click', handlePrev);
    if (btnNext) btnNext.addEventListener('click', handleNext);
  }

  // ── 初始化 ──
  function init() {
    applyTheme();

    // 应用风格预设
    var style = params.style_preset || 'dark-vinyl';
    document.documentElement.setAttribute('data-style', style);

    // ── 动态配色引擎 ──
    if (params.primary_color && window.computePalette) {
      var palette = window.computePalette(params.primary_color);
      Object.keys(palette.cssVars).forEach(function(k) {
        document.documentElement.style.setProperty(k, palette.cssVars[k]);
      });
      document.documentElement.setAttribute('data-style', 'dynamic');
    }

    // ── 视觉风格宏 ──
    if (params.visual_style) {
      document.documentElement.setAttribute('data-visual-style', params.visual_style);
    }

    renderTrackInfo();
    renderAlbumArt();
    updateProgress();
    randomizeSpectrumDelays();
    bindEvents();

    // 初始为暂停状态，频谱静止
    if (spectrum) spectrum.classList.add('paused');

    // 自动开始播放模拟（Demo 展示用）
    setTimeout(function() {
      startPlayback();
    }, 800);

    // 主题变化监听
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.onThemeChange(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
