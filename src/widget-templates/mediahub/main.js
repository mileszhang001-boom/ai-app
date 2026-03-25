/**
 * MediaHub Card — 三方媒体中心
 * 支持 1-2 个三方 App 的播放聚合
 * 单 App → 满屏 896×1464
 * 双 App → 上下各 732px
 */

// ─── SVG Icons ──────────────────────────────────────────────────
var ICONS = {
  prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  rew30: '<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="600" fill="currentColor">30</text></svg>',
  fwd30: '<svg viewBox="0 0 24 24"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="7" font-weight="600" fill="currentColor">30</text></svg>',
  // App logos as clean SVG
  qq_music: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#1DB954"/><path d="M20 14l14 10-14 10V14z" fill="#fff"/></svg>',
  cosmos: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="24" fill="#3CC8DC"/><circle cx="24" cy="24" r="8" fill="none" stroke="#fff" stroke-width="2.5"/><circle cx="24" cy="24" r="3" fill="#fff"/></svg>',
  bilibili: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#FB7299"/><path d="M16 18h16v12a2 2 0 01-2 2H18a2 2 0 01-2-2V18zm4-4l3 4h2l3-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="23" r="1.5" fill="#fff"/><circle cx="27" cy="23" r="1.5" fill="#fff"/></svg>',
  ximalaya: '<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="14" fill="#F5222D"/><path d="M15 30l5-8 4 5 4-9 5 12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ─── App Brand Config (对齐 Pencil 设计稿) ──────────────────────
var APP_BRANDS = {
  qq_music:  { name: 'QQ音乐',   color: '#1DB954', label: '正在播放', type: 'music',     iconSvg: ICONS.qq_music,  gradient: ['#0C1A12', '#06100C'] },
  cosmos:    { name: '小宇宙',    color: '#3CC8DC', label: '正在收听', type: 'podcast',   iconSvg: ICONS.cosmos,    gradient: ['#081A1C', '#06101A'] },
  bilibili:  { name: '哔哩哔哩',  color: '#FB7299', label: '正在播放', type: 'video',     iconSvg: ICONS.bilibili,  gradient: ['#1A0C12', '#10060C'] },
  ximalaya:  { name: '喜马拉雅',  color: '#F5222D', label: '正在收听', type: 'audiobook', iconSvg: ICONS.ximalaya,  gradient: ['#1A0C0C', '#100606'] },
};

// ─── Mock Data (对齐 Pencil 设计) ────────────────────────────────
var MOCK_DATA = {
  qq_music: {
    now_playing: {
      title: '晴天', artist: '周杰伦 · 叶惠美',
      cover_url: 'https://picsum.photos/seed/qq-album/280/280',
      current_time: 102, total_time: 275, is_playing: true
    },
    playlist: [
      { title: '起风了', artist: '买辣椒也用券', cover_url: 'https://picsum.photos/seed/qifengle/52/52', duration: '5:12' },
      { title: '夜曲', artist: '周杰伦', cover_url: 'https://picsum.photos/seed/yequ/52/52', duration: '4:01' },
      { title: '光辉岁月', artist: 'Beyond', cover_url: 'https://picsum.photos/seed/beyond/52/52', duration: '4:25' },
      { title: '稻香', artist: '周杰伦', cover_url: 'https://picsum.photos/seed/daoxiang/52/52', duration: '3:43' },
      { title: '平凡之路', artist: '朴树', cover_url: 'https://picsum.photos/seed/pfzl/52/52', duration: '4:46' },
      { title: '海阔天空', artist: 'Beyond', cover_url: 'https://picsum.photos/seed/hktk/52/52', duration: '5:25' },
      { title: '告白气球', artist: '周杰伦', cover_url: 'https://picsum.photos/seed/gbqq/52/52', duration: '3:36' },
    ]
  },
  cosmos: {
    now_playing: {
      title: 'Vol.328 当我们谈论AI时', artist: '文化有限 · 科技',
      cover_url: 'https://picsum.photos/seed/cosmos-pod/280/280',
      current_time: 1800, total_time: 3480, is_playing: true
    },
    playlist: [
      { title: 'E86 失眠的一百万种理由', artist: '随机波动', cover_url: 'https://picsum.photos/seed/cosmos1/52/52', duration: '45min' },
      { title: '聊聊远程办公这三年', artist: '日谈公园', cover_url: 'https://picsum.photos/seed/cosmos2/52/52', duration: '58min' },
      { title: '故事FM · 我在南极的200天', artist: '故事FM', cover_url: 'https://picsum.photos/seed/cosmos3/52/52', duration: '45min' },
      { title: '谐星聊天会 · 内卷人生', artist: '谐星聊天会', cover_url: 'https://picsum.photos/seed/cosmos4/52/52', duration: '62min' },
      { title: '不合时宜 · 城市漫步', artist: '不合时宜', cover_url: 'https://picsum.photos/seed/cosmos5/52/52', duration: '38min' },
      { title: '忽左忽右 · 芯片战争', artist: '忽左忽右', cover_url: 'https://picsum.photos/seed/cosmos6/52/52', duration: '72min' },
      { title: '声东击西 · 数字游民', artist: '声东击西', cover_url: 'https://picsum.photos/seed/cosmos7/52/52', duration: '51min' },
    ]
  },
  bilibili: {
    now_playing: {
      title: '【4K】绝美风景合集', artist: '摄影师小明 · 2.3万播放',
      cover_url: 'https://picsum.photos/seed/bili-4k/280/280',
      current_time: 204, total_time: 537, is_playing: true
    },
    playlist: [
      { title: '日落黄昏的海边', artist: '旅行小王 · 8.1万播放', cover_url: 'https://picsum.photos/seed/bili1/52/52', duration: '8:30' },
      { title: '城市夜景延时摄影', artist: '影视飓风 · 32万播放', cover_url: 'https://picsum.photos/seed/bili2/52/52', duration: '12:45' },
      { title: '深夜电台 · 一人食', artist: '美食作家王刚 · 15万播放', cover_url: 'https://picsum.photos/seed/bili3/52/52', duration: '10:20' },
      { title: '宇宙自然纪录片', artist: '科学科普人 · 45万播放', cover_url: 'https://picsum.photos/seed/bili4/52/52', duration: '15:30' },
      { title: '极简主义生活vlog', artist: '日常小美 · 6.7万播放', cover_url: 'https://picsum.photos/seed/bili5/52/52', duration: '7:15' },
      { title: '机械键盘测评合集', artist: '科技美学 · 28万播放', cover_url: 'https://picsum.photos/seed/bili6/52/52', duration: '18:42' },
      { title: '二次元混剪 · 燃向', artist: 'AMV工坊 · 52万播放', cover_url: 'https://picsum.photos/seed/bili7/52/52', duration: '4:55' },
    ]
  },
  ximalaya: {
    now_playing: {
      title: '三体（全集）', artist: '刘慈欣 | 播讲：张震',
      cover_url: 'https://picsum.photos/seed/xmly-santi/280/280',
      current_time: 5025, total_time: 7710, is_playing: true
    },
    playlist: [
      { title: '明朝那些事儿', artist: '当年明月 · 第3集', cover_url: 'https://picsum.photos/seed/xmly1/52/52', duration: '45:12' },
      { title: '白鹿原', artist: '陈忠实 · 第12集', cover_url: 'https://picsum.photos/seed/xmly2/52/52', duration: '38:45' },
      { title: '人间词话', artist: '王国维 · 第7集', cover_url: 'https://picsum.photos/seed/xmly3/52/52', duration: '52:18' },
      { title: '围城', artist: '钱钟书 · 第5集', cover_url: 'https://picsum.photos/seed/xmly4/52/52', duration: '41:33' },
      { title: '活着', artist: '余华 · 第2集', cover_url: 'https://picsum.photos/seed/xmly5/52/52', duration: '35:18' },
      { title: '百年孤独', artist: '马尔克斯 · 第8集', cover_url: 'https://picsum.photos/seed/xmly6/52/52', duration: '48:05' },
      { title: '红楼梦', artist: '曹雪芹 · 第15集', cover_url: 'https://picsum.photos/seed/xmly7/52/52', duration: '55:42' },
    ]
  }
};

// ─── Utility ──────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  var m = Math.floor(seconds / 60);
  var s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function makeCoverPlaceholder(brandColor, size) {
  var sz = size || 280;
  return 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="' + brandColor + '40"/>' +
    '<stop offset="100%" stop-color="' + brandColor + '10"/>' +
    '</linearGradient></defs>' +
    '<rect width="' + sz + '" height="' + sz + '" fill="url(#g)"/>' +
    '<text x="' + (sz/2) + '" y="' + (sz/2+12) + '" text-anchor="middle" fill="' + brandColor + '80" font-size="' + (sz*0.15) + '">&#9835;</text>' +
    '</svg>'
  );
}

// ─── Main Init ────────────────────────────────────────────────────
(function initMediaHub() {
  var params = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';
  var apps = params.apps || ['qq_music'];
  var mode = apps.length >= 2 ? 'dual' : 'single';

  var $card = document.getElementById('mediahub-card');
  $card.innerHTML = '';

  if (mode === 'dual') {
    var zone1 = renderAppZone(apps[0], 'dual');
    var divider = document.createElement('div');
    divider.className = 'zone-divider';
    var zone2 = renderAppZone(apps[1], 'dual');
    $card.appendChild(zone1);
    $card.appendChild(divider);
    $card.appendChild(zone2);
  } else {
    var zone = renderAppZone(apps[0], 'single');
    $card.appendChild(zone);
  }
})();

// ─── Render One App Zone ──────────────────────────────────────────
function renderAppZone(appId, mode) {
  var brand = APP_BRANDS[appId];
  if (!brand) return document.createElement('div');

  var data = MOCK_DATA[appId] || {};
  var np = data.now_playing || {};
  var playlist = data.playlist || [];
  var maxTracks = mode === 'single' ? 7 : 3;
  var isPodcast = brand.type === 'podcast' || brand.type === 'audiobook';

  var zone = document.createElement('div');
  zone.className = 'app-zone ' + mode;

  // Background gradient
  var bg = document.createElement('div');
  bg.className = 'zone-bg';
  bg.style.background = 'linear-gradient(170deg, ' + brand.gradient[0] + ', ' + brand.gradient[1] + ')';
  zone.appendChild(bg);

  // Content wrapper
  var content = document.createElement('div');
  content.className = 'zone-content';

  // ── Header: icon + name + badge ──
  var header = document.createElement('div');
  header.className = 'hub-header';

  var iconEl = document.createElement('div');
  iconEl.className = 'app-icon';
  iconEl.innerHTML = brand.iconSvg || '';

  var nameEl = document.createElement('div');
  nameEl.className = 'app-name';
  nameEl.textContent = brand.name;

  var badge = document.createElement('div');
  badge.className = 'play-badge';
  badge.style.cssText = 'background:' + brand.color + '25;color:' + brand.color + ';';
  badge.textContent = np.is_playing ? brand.label : '已暂停';

  header.appendChild(iconEl);
  header.appendChild(nameEl);
  header.appendChild(badge);
  content.appendChild(header);

  // ── Spacer ──
  var sp1 = document.createElement('div');
  sp1.className = 'spacer-lg';
  content.appendChild(sp1);

  // ── Now Playing (horizontal: art + info side-by-side) ──
  var artSize = mode === 'single' ? 280 : 140;
  var coverUrl = np.cover_url || makeCoverPlaceholder(brand.color, artSize);
  var pct = np.total_time ? (np.current_time / np.total_time * 100) : 0;

  var nowPlay = document.createElement('div');
  nowPlay.className = 'now-playing';
  nowPlay.innerHTML =
    '<img class="album-art" src="' + coverUrl + '" alt="cover">' +
    '<div class="song-info">' +
    '  <div class="song-title">' + (np.title || '未在播放') + '</div>' +
    '  <div class="song-artist">' + (np.artist || '') + '</div>' +
    '  <div class="progress-wrap">' +
    '    <div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + brand.color + '"></div></div>' +
    '    <div class="time-row"><span>' + formatTime(np.current_time) + '</span><span>' + formatTime(np.total_time) + '</span></div>' +
    '  </div>' +
    '</div>';
  content.appendChild(nowPlay);

  // ── Controls ──
  var controls = document.createElement('div');
  controls.className = 'controls';
  var playIcon = np.is_playing ? ICONS.pause : ICONS.play;
  if (isPodcast) {
    controls.innerHTML =
      '<button class="ctrl-btn" data-action="rewind">' + ICONS.rew30 + '</button>' +
      '<button class="ctrl-btn play" style="background:' + brand.color + '" data-action="play">' + playIcon + '</button>' +
      '<button class="ctrl-btn" data-action="forward">' + ICONS.fwd30 + '</button>';
  } else {
    controls.innerHTML =
      '<button class="ctrl-btn" data-action="prev">' + ICONS.prev + '</button>' +
      '<button class="ctrl-btn play" style="background:' + brand.color + '" data-action="play">' + playIcon + '</button>' +
      '<button class="ctrl-btn" data-action="next">' + ICONS.next + '</button>';
  }
  var btns = controls.querySelectorAll('.ctrl-btn');
  for (var b = 0; b < btns.length; b++) {
    btns[b].addEventListener('click', (function(btn, aid) {
      return function() {
        var action = btn.dataset.action;
        if (action === 'play') {
          var isNowPlaying = btn.querySelector('svg path[d*="6 19"]'); // pause icon check
          btn.innerHTML = isNowPlaying ? ICONS.play : ICONS.pause;
        }
        console.log('[MediaHub] ' + aid + ' → ' + action);
      };
    })(btns[b], appId));
  }
  content.appendChild(controls);

  // ── Playlist ──
  if (playlist.length > 0) {
    var dividerEl = document.createElement('div');
    dividerEl.className = 'section-divider';
    content.appendChild(dividerEl);

    var label = document.createElement('div');
    label.className = 'playlist-label';
    label.textContent = isPodcast ? '最近收听' : (brand.type === 'video' ? '推荐视频' : '最近播放');
    content.appendChild(label);

    var list = document.createElement('div');
    list.className = 'playlist';

    for (var t = 0; t < Math.min(maxTracks, playlist.length); t++) {
      var track = playlist[t];
      var row = document.createElement('div');
      row.className = 'track-row';
      var thumbUrl = track.cover_url || makeCoverPlaceholder(brand.color, 52);

      if (mode === 'dual') {
        row.innerHTML =
          '<div class="track-thumb"><img src="' + thumbUrl + '" alt=""></div>' +
          '<div class="track-info"><div class="track-name-inline">' + track.title + ' · ' + track.artist + '</div></div>';
      } else {
        row.innerHTML =
          '<div class="track-thumb"><img src="' + thumbUrl + '" alt=""></div>' +
          '<div class="track-info">' +
          '  <div class="track-name">' + track.title + '</div>' +
          '  <div class="track-artist">' + track.artist + (track.duration ? ' · ' + track.duration : '') + '</div>' +
          '</div>';
      }
      list.appendChild(row);
    }
    content.appendChild(list);
  }

  zone.appendChild(content);
  return zone;
}
