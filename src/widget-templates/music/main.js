/**
 * 音乐播放器 · Liquid Glass
 * MediaSession 接入 + 频谱可视化 + 空状态
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    song_name: '',
    artist: '',
    album_cover_url: '',
    lyrics_snippet: '',
    duration: '4:29',
    style_preset: 'dark-vinyl'
  };

  // ── 状态 ──
  var isPlaying = false;
  var currentSeconds = 0;
  var totalSeconds = 0;
  var playbackTimer = null;
  var mediaSessionCleanup = null;
  var hasMediaSession = false;

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
  var contentEl = document.querySelector('.content');
  var widgetEl = document.querySelector('.widget-music');

  // ── 工具函数 ──
  function parseDuration(str) {
    if (!str) return 269;
    var parts = str.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return 269;
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── 空状态 ──
  function showEmptyState() {
    if (!contentEl) return;
    contentEl.classList.add('empty-state');

    if (songNameEl) songNameEl.textContent = '未在播放音乐';
    if (artistEl) artistEl.textContent = '打开音乐应用开始收听';
    if (lyricsEl) lyricsEl.textContent = '';
    if (timeTotal) timeTotal.textContent = '0:00';
    if (timeElapsed) timeElapsed.textContent = '0:00';
    if (progressFill) progressFill.style.width = '0%';
    if (spectrum) spectrum.classList.add('paused');
    if (btnPlay) btnPlay.textContent = '▶';

    // 显示空状态图标
    var placeholder = albumArt ? albumArt.querySelector('.album-art-placeholder') : null;
    if (placeholder) {
      placeholder.setAttribute('data-empty', 'true');
    }
  }

  // ── 渲染歌曲信息 ──
  function renderTrackInfo(data) {
    if (contentEl) contentEl.classList.remove('empty-state');

    if (songNameEl) songNameEl.textContent = data.song_name || '未知歌曲';
    if (artistEl) artistEl.textContent = data.artist || '未知歌手';
    if (lyricsEl) lyricsEl.textContent = data.lyrics_snippet || params.lyrics_snippet || '';

    totalSeconds = data.duration || parseDuration(params.duration);
    currentSeconds = data.position || 0;

    if (timeTotal) timeTotal.textContent = formatTime(totalSeconds);
    updateProgress();

    // 更新播放状态
    if (data.isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }

    // 专辑封面
    var artUrl = data.albumArtUrl || params.album_cover_url;
    if (artUrl) {
      renderAlbumArt(artUrl, data.song_name);
    }
  }

  // ── 专辑封面 ──
  function renderAlbumArt(url, altText) {
    if (!url || !albumArt) return;

    var img = document.createElement('img');
    img.src = url;
    img.alt = altText || '专辑封面';
    img.onerror = function() {};
    img.onload = function() {
      var placeholder = albumArt.querySelector('.album-art-placeholder');
      if (placeholder) {
        albumArt.removeChild(placeholder);
      }
      // 移除旧图片
      var oldImg = albumArt.querySelector('img');
      if (oldImg) albumArt.removeChild(oldImg);
      albumArt.appendChild(img);

      if (albumBg) {
        albumBg.style.backgroundImage = 'url(' + url + ')';
        albumBg.style.backgroundSize = 'cover';
        albumBg.style.backgroundPosition = 'center';
      }
    };
  }

  // ── 进度条更新 ──
  function updateProgress() {
    if (totalSeconds <= 0) return;
    var pct = Math.min((currentSeconds / totalSeconds) * 100, 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (timeElapsed) timeElapsed.textContent = formatTime(currentSeconds);
  }

  // ── 播放控制 ──
  function startPlayback() {
    if (playbackTimer) clearInterval(playbackTimer);
    isPlaying = true;
    if (btnPlay) btnPlay.textContent = '⏸';
    if (spectrum) spectrum.classList.remove('paused');

    // 本地模拟进度推进（MediaSession 会周期同步覆盖）
    playbackTimer = setInterval(function() {
      currentSeconds++;
      if (currentSeconds >= totalSeconds) {
        currentSeconds = 0;
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
    if (window.AIWidgetBridge && window.AIWidgetBridge.mediaControl) {
      window.AIWidgetBridge.mediaControl(isPlaying ? 'pause' : 'play');
    }
    // 如果没有 MediaSession 回调，本地切换
    if (!hasMediaSession) {
      if (isPlaying) {
        stopPlayback();
      } else {
        startPlayback();
      }
    }
  }

  function handlePrev() {
    if (window.AIWidgetBridge && window.AIWidgetBridge.mediaControl) {
      window.AIWidgetBridge.mediaControl('prev');
    }
    if (!hasMediaSession) {
      currentSeconds = 0;
      updateProgress();
    }
  }

  function handleNext() {
    if (window.AIWidgetBridge && window.AIWidgetBridge.mediaControl) {
      window.AIWidgetBridge.mediaControl('next');
    }
    if (!hasMediaSession) {
      currentSeconds = 0;
      updateProgress();
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

    randomizeSpectrumDelays();
    bindEvents();

    // 初始为暂停状态
    if (spectrum) spectrum.classList.add('paused');

    // ── 接入 MediaSession ──
    if (window.AIWidgetBridge && window.AIWidgetBridge.getMediaSession) {
      window.AIWidgetBridge.getMediaSession().then(function(session) {
        if (session && session.song_name) {
          hasMediaSession = true;
          renderTrackInfo(session);
        } else {
          // 无播放中的媒体 → 检查 params 是否有预设
          if (params.song_name) {
            renderFromParams();
          } else {
            showEmptyState();
          }
        }
      }).catch(function() {
        if (params.song_name) {
          renderFromParams();
        } else {
          showEmptyState();
        }
      });

      // 监听变化
      if (window.AIWidgetBridge.onMediaSessionChange) {
        mediaSessionCleanup = window.AIWidgetBridge.onMediaSessionChange(function(session) {
          if (session && session.song_name) {
            hasMediaSession = true;
            // 同步进度
            currentSeconds = session.position || 0;
            totalSeconds = session.duration || totalSeconds;
            updateProgress();

            // 更新歌曲信息（切歌时）
            if (songNameEl && songNameEl.textContent !== session.song_name) {
              renderTrackInfo(session);
            }

            // 同步播放状态
            if (session.isPlaying && !isPlaying) {
              startPlayback();
            } else if (!session.isPlaying && isPlaying) {
              stopPlayback();
            }
          } else {
            showEmptyState();
          }
        });
      }
    } else {
      // 无 Bridge → 使用 params 或空状态
      if (params.song_name) {
        renderFromParams();
      } else {
        showEmptyState();
      }
    }

    // 主题变化监听
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.onThemeChange(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      });
    }
  }

  function renderFromParams() {
    totalSeconds = parseDuration(params.duration);
    renderTrackInfo({
      song_name: params.song_name,
      artist: params.artist,
      duration: totalSeconds,
      position: 0,
      isPlaying: false,
      albumArtUrl: params.album_cover_url,
      lyrics_snippet: params.lyrics_snippet
    });
    // Demo: 自动开始播放
    setTimeout(function() {
      startPlayback();
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
