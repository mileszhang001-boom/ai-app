/**
 * 音乐播放器卡片 · Liquid Glass
 * Pencil Node: qXG2n (Card-Music)
 * 频谱动画 + 进度条 + MediaSession + 空状态
 */

(function() {
  'use strict';

  // ── Params & Data Mode ──
  var params = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';

  var MOCK = {
    song_name: '夜曲',
    artist: '周杰伦',
    album: '十一月的萧邦',
    cover_url: './covers/cover_mock.jpg',
    lyrics_snippet: '\u266A 一步两步三步四步望着天 看星星 一颗两颗三颗四颗 连成线 ...',
    current_time: 102,
    total_time: 275,
    is_playing: true
  };

  // ── DOM Refs ──
  var root       = document.getElementById('widget-root');
  var bgBlur     = document.getElementById('album-bg-blur');
  var albumArt   = document.getElementById('album-art');
  var songNameEl = document.getElementById('song-name');
  var artistEl   = document.getElementById('artist');
  var lyricsEl   = document.getElementById('lyrics');
  var spectrum   = document.getElementById('spectrum');
  var progressFill = document.getElementById('progress-fill');
  var timeLeft   = document.getElementById('time-left');
  var timeRight  = document.getElementById('time-right');
  var btnPrev    = document.getElementById('btn-prev');
  var btnPlay    = document.getElementById('btn-play');
  var btnNext    = document.getElementById('btn-next');
  var emptyState = document.getElementById('empty-state');
  var glowPurple = document.getElementById('glow-purple');

  // ── State ──
  var isPlaying = false;
  var currentTime = 0;
  var totalTime = 0;
  var progressTimer = null;
  var unsubMedia = null;

  // ── Visual Style ──
  if (params.visual_style) {
    document.documentElement.setAttribute('data-visual-style', params.visual_style);
  }

  // ── Icons (using WidgetIcons) ──
  function renderIcons() {
    var Icons = window.WidgetIcons;
    if (!Icons) {
      // Emoji fallback
      btnPrev.textContent = '\u23EE';
      btnPlay.textContent = '\u25B6';
      btnNext.textContent = '\u23ED';
      return;
    }
    btnPrev.innerHTML = Icons.get('prev', 56);
    btnPlay.innerHTML = Icons.get('play', 80);
    btnNext.innerHTML = Icons.get('next', 56);
  }

  function setPlayIcon(playing) {
    var Icons = window.WidgetIcons;
    if (!Icons) {
      btnPlay.textContent = playing ? '\u23F8' : '\u25B6';
      return;
    }
    btnPlay.innerHTML = Icons.get(playing ? 'pause' : 'play', 80);
  }

  // ── Time Format: seconds → M:SS ──
  function formatTime(sec) {
    if (!sec || sec < 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ── Show Empty State ──
  function showEmpty() {
    root.classList.add('empty');
    emptyState.classList.add('visible');
    stopProgressTimer();
    spectrum.className = 'spectrum-paused';
  }

  // ── Show Playing State ──
  function showPlaying() {
    root.classList.remove('empty');
    emptyState.classList.remove('visible');
  }

  // ── Render Session Data ──
  function renderSession(data) {
    if (!data || (!data.song_name && !data.artist)) {
      showEmpty();
      return;
    }

    showPlaying();

    // Song info
    songNameEl.textContent = data.song_name || '--';
    artistEl.textContent = data.artist || '--';
    lyricsEl.textContent = data.lyrics_snippet || data.lyrics || '';

    // Cover image
    var coverUrl = data.cover_url || data.albumArtUrl || '';
    if (coverUrl) {
      albumArt.style.backgroundImage = 'url(' + coverUrl + ')';
      bgBlur.style.backgroundImage = 'url(' + coverUrl + ')';
      // Remove the placeholder gradient
      albumArt.style.backgroundColor = 'transparent';
    } else {
      // Keep default placeholder
      albumArt.style.backgroundImage = '';
      bgBlur.style.backgroundImage = '';
    }

    // Time
    currentTime = data.current_time || data.position || 0;
    totalTime = data.total_time || data.duration || 0;
    isPlaying = data.is_playing !== undefined ? data.is_playing : (data.isPlaying !== undefined ? data.isPlaying : false);

    updateProgress();
    setPlayIcon(isPlaying);

    // Spectrum
    if (isPlaying) {
      spectrum.className = 'spectrum-playing';
      startProgressTimer();
    } else {
      spectrum.className = 'spectrum-paused';
      stopProgressTimer();
    }

    // Glow color from cover (optional: extract dominant color)
    if (coverUrl && window.ColorExtract) {
      try {
        window.ColorExtract(coverUrl, function(hex) {
          if (hex && glowPurple) {
            glowPurple.style.background = 'radial-gradient(circle, ' + hex + '40 0%, transparent 70%)';
          }
        });
      } catch (e) { /* ignore */ }
    }
  }

  // ── Progress ──
  function updateProgress() {
    if (totalTime <= 0) {
      progressFill.style.width = '0%';
      timeLeft.textContent = '0:00';
      timeRight.textContent = '0:00';
      return;
    }
    var pct = Math.min(100, (currentTime / totalTime) * 100);
    progressFill.style.width = pct + '%';
    timeLeft.textContent = formatTime(currentTime);
    timeRight.textContent = formatTime(totalTime);
  }

  function startProgressTimer() {
    stopProgressTimer();
    progressTimer = setInterval(function() {
      if (isPlaying && currentTime < totalTime) {
        currentTime += 1;
        updateProgress();
      }
    }, 1000);
  }

  function stopProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  // ── Controls ──
  var bridge = window.AIWidgetBridge;

  btnPrev.addEventListener('click', function() {
    if (bridge) bridge.mediaControl('prev');
  });

  btnNext.addEventListener('click', function() {
    if (bridge) bridge.mediaControl('next');
  });

  btnPlay.addEventListener('click', function() {
    if (bridge) {
      bridge.mediaControl(isPlaying ? 'pause' : 'play');
    }
    // Optimistic toggle
    isPlaying = !isPlaying;
    setPlayIcon(isPlaying);
    if (isPlaying) {
      spectrum.className = 'spectrum-playing';
      startProgressTimer();
    } else {
      spectrum.className = 'spectrum-paused';
      stopProgressTimer();
    }
  });

  // ── Init ──
  renderIcons();

  if (dataMode === 'preview') {
    // Preview mode: use mock data immediately
    renderSession(MOCK);
  } else {
    // Live mode: try bridge first, then fallback to mock
    if (bridge && bridge.getMediaSession) {
      bridge.getMediaSession().then(function(session) {
        if (session && (session.song_name || session.artist)) {
          renderSession({
            song_name: session.song_name,
            artist: session.artist,
            cover_url: session.albumArtUrl || '',
            lyrics_snippet: session.lyrics_snippet || '',
            current_time: session.position || 0,
            total_time: session.duration || 0,
            is_playing: session.isPlaying !== undefined ? session.isPlaying : true
          });
        } else {
          // No active session — show mock for dev, empty for car
          if (bridge.isCarEnvironment && bridge.isCarEnvironment()) {
            showEmpty();
          } else {
            renderSession(MOCK);
          }
        }
      }).catch(function() {
        renderSession(MOCK);
      });

      // Subscribe to live updates
      if (bridge.onMediaSessionChange) {
        unsubMedia = bridge.onMediaSessionChange(function(session) {
          if (session && (session.song_name || session.artist)) {
            renderSession({
              song_name: session.song_name,
              artist: session.artist,
              cover_url: session.albumArtUrl || '',
              lyrics_snippet: session.lyrics_snippet || '',
              current_time: session.position || 0,
              total_time: session.duration || 0,
              is_playing: session.isPlaying !== undefined ? session.isPlaying : true
            });
          } else {
            showEmpty();
          }
        });
      }
    } else {
      // No bridge available — show mock
      renderSession(MOCK);
    }
  }

})();
