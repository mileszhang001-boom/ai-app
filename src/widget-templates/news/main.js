/**
 * 每日简报 · Liquid Glass
 * Dark navy mesh gradient + hero news + 3 glass cards
 * Data: preview → MOCK, live → /api/news?categories=
 */

(function () {
  'use strict';

  // ── Category → color mapping ──
  var CATEGORY_COLORS = {
    tech:          '#60A5FA',
    auto:          '#F59E0B',
    finance:       '#34D399',
    sports:        '#FB7185',
    entertainment: '#A78BFA',
    health:        '#F472B6'
  };

  // Chinese category labels → key
  var CATEGORY_MAP = {
    '科技': 'tech',
    '汽车': 'auto',
    '财经': 'finance',
    '体育': 'sports',
    '娱乐': 'entertainment',
    '健康': 'health'
  };

  // ── Time helper for dynamic relative time ──
  function timeAgo(hoursAgo) {
    if (hoursAgo < 1) return '刚刚';
    if (hoursAgo < 24) return Math.floor(hoursAgo) + '小时前';
    return Math.floor(hoursAgo / 24) + '天前';
  }

  // ── MOCK data for preview mode ──
  var MOCK = {
    hero: {
      category: 'tech',
      tag: '科技',
      tag_color: '#60A5FA',
      title: 'GPT-5 发布：多模态推理能力大幅提升',
      summary: 'OpenAI 正式推出 GPT-5，在数学推理、代码生成和多模态理解方面实现重大突破，支持实时视频对话。',
      source: '36氪',
      time: timeAgo(2),
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4OTYiIGhlaWdodD0iMjIwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMEYxNzJBIi8+PHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiMxRTNBOEEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMwRjE3MkEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iODk2IiBoZWlnaHQ9IjIyMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjQ0OCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMTUpIiBmb250LXNpemU9IjQyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+QUkgwrcgTmV3IEVyYTwvdGV4dD48L3N2Zz4='
    },
    items: [
      {
        category: 'auto',
        tag: '汽车',
        tag_color: '#F59E0B',
        title: '小米 YU7 正式发布：29.9万起，续航800km',
        source: '汽车之家',
        time: timeAgo(3),
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRjU5RTBCNDAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGNTlFMEIxNSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIiByeD0iMTIiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSI4MCIgeT0iNjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzYiPvCfmpc8L3RleHQ+PC9zdmc+'
      },
      {
        category: 'finance',
        tag: '财经',
        tag_color: '#34D399',
        title: 'A股三大指数集体收涨，科技板块领涨',
        source: '第一财经',
        time: timeAgo(5),
        image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMzREMzk5NDAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzNEQzOTkxNSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIiByeD0iMTIiIGZpbGw9InVybCgjZykiLz48dGV4dCB4PSI4MCIgeT0iNjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMzYiPvCfk4g8L3RleHQ+PC9zdmc+'
      },
      {
        category: 'sports',
        tag: '体育',
        tag_color: '#FB7185',
        title: 'NBA 季后赛：勇士 vs 湖人 G7 今夜打响',
        source: '虎扑',
        time: timeAgo(6),
        image: ''
      }
    ]
  };

  // ── DOM references ──
  var $root       = document.getElementById('widget-root');
  var $dateLabel  = document.getElementById('dateLabel');
  var $heroNews   = document.getElementById('hero-news');
  var $heroImage  = document.getElementById('heroImage');
  var $heroTag    = document.getElementById('heroTag');
  var $heroTitle  = document.getElementById('heroTitle');
  var $heroSummary = document.getElementById('heroSummary');
  var $heroMeta   = document.getElementById('heroMeta');

  // ── Params from host (render-widget injects __WIDGET_PARAMS__) ──
  var params = window.__WIDGET_PARAMS__ || {};
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';

  // ── Date formatting: "M月D日" ──
  function formatDate(date) {
    var d = date || new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    return month + '月' + day + '日';
  }

  // ── Resolve tag color from category string ──
  function resolveTagColor(category) {
    // If it's already a key
    if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
    // If it's a Chinese label
    var key = CATEGORY_MAP[category];
    if (key && CATEGORY_COLORS[key]) return CATEGORY_COLORS[key];
    // Default
    return '#60A5FA';
  }

  // ── Render hero card ──
  function renderHero(hero) {
    if (!hero) return;

    // Image
    if (hero.image) {
      $heroImage.style.backgroundImage = 'url(' + hero.image + ')';
    } else {
      // Gradient placeholder based on category color
      var color = hero.tag_color || resolveTagColor(hero.category);
      $heroImage.style.background = 'linear-gradient(135deg, ' + color + '30 0%, #0c204080 100%)';
    }

    // Tag
    var tagColor = hero.tag_color || resolveTagColor(hero.category);
    $heroTag.textContent = hero.tag || hero.category || '资讯';
    $heroTag.style.color = tagColor;

    // Title & summary
    $heroTitle.textContent = hero.title || '--';
    $heroSummary.textContent = hero.summary || '';

    // Meta
    var meta = (hero.source || '--') + ' · ' + (hero.time || '--');
    $heroMeta.textContent = meta;

    // Click handler
    $heroNews.onclick = function () {
      showNewsDetail(hero);
    };
  }

  // ── Render a news card (index 0–2 maps to card 2–4) ──
  function renderCard(index, item) {
    var cardIndex = index + 2; // card2, card3, card4
    var $card = document.getElementById('newsCard' + cardIndex);
    if (!$card) return;

    var hasImage = item.image && item.image.length > 0;
    var tagColor = item.tag_color || resolveTagColor(item.category);

    // Rebuild card DOM to support image layout
    $card.innerHTML = '';
    if (hasImage) {
      $card.classList.add('has-image');
    } else {
      $card.classList.remove('has-image');
    }

    // Text side
    var textDiv = document.createElement('div');
    textDiv.className = 'news-card-text';

    var tagEl = document.createElement('span');
    tagEl.className = 'news-tag';
    tagEl.textContent = item.tag || item.category || '资讯';
    tagEl.style.color = tagColor;

    var titleEl = document.createElement('div');
    titleEl.className = 'news-title';
    titleEl.textContent = item.title || '--';

    var metaEl = document.createElement('div');
    metaEl.className = 'news-meta';
    metaEl.textContent = (item.source || '--') + ' · ' + (item.time || '--') + ' ›';

    textDiv.appendChild(tagEl);
    textDiv.appendChild(titleEl);
    textDiv.appendChild(metaEl);
    $card.appendChild(textDiv);

    // Image side (if present)
    if (hasImage) {
      var thumbDiv = document.createElement('div');
      thumbDiv.className = 'news-card-thumb';
      var img = document.createElement('img');
      img.src = item.image;
      img.alt = '';
      thumbDiv.appendChild(img);
      $card.appendChild(thumbDiv);
    }

    // Click handler
    $card.onclick = function () {
      showNewsDetail(item);
    };
  }

  // ── Show news detail in fullscreen overlay ──
  function showNewsDetail(newsItem) {
    if (!window.createFullscreenOverlay) {
      console.warn('[News] overlay.js not loaded');
      return;
    }

    var tagColor = newsItem.tag_color || resolveTagColor(newsItem.category);

    var overlay = window.createFullscreenOverlay({
      background: '#08162c',
      content: function (container) {
        // Back button
        var backBtn = document.createElement('div');
        backBtn.style.cssText = 'padding:48px 48px 24px;font-size:32px;color:#64748B;cursor:pointer;-webkit-tap-highlight-color:transparent;';
        backBtn.textContent = '‹ 返回';
        backBtn.onclick = function () { overlay.hide(); };
        container.appendChild(backBtn);

        // Tag
        var tag = document.createElement('div');
        tag.style.cssText = 'padding:0 48px;font-size:28px;font-weight:600;color:' + tagColor + ';margin-bottom:16px;';
        tag.textContent = newsItem.tag || newsItem.category || '资讯';
        container.appendChild(tag);

        // Title
        var title = document.createElement('div');
        title.style.cssText = 'padding:0 48px;font-size:42px;font-weight:600;color:#F5F5F0;line-height:1.5;margin-bottom:20px;';
        title.textContent = newsItem.title || '--';
        container.appendChild(title);

        // Meta
        var meta = document.createElement('div');
        meta.style.cssText = 'padding:0 48px;font-size:26px;color:#64748B;margin-bottom:32px;';
        meta.textContent = (newsItem.source || '--') + ' · ' + (newsItem.time || '--');
        container.appendChild(meta);

        // Divider
        var divider = document.createElement('div');
        divider.style.cssText = 'margin:0 48px;height:1px;background:rgba(255,255,255,0.06);margin-bottom:32px;';
        container.appendChild(divider);

        // Summary / body
        var body = document.createElement('div');
        body.style.cssText = 'padding:0 48px;font-size:30px;color:rgba(245,245,240,0.8);line-height:1.8;';
        body.textContent = newsItem.summary || newsItem.title || '暂无详情';
        container.appendChild(body);
      }
    });

    overlay.show();
  }

  // ── Apply display style ──
  function applyDisplayStyle(style) {
    if (style === 'list') {
      $root.classList.add('display-list');
    } else {
      $root.classList.remove('display-list');
    }
  }

  // ── Render all from data ──
  function render(data) {
    // Date
    $dateLabel.textContent = formatDate(new Date());

    // Display style
    applyDisplayStyle(data.display_style || params.display_style || 'card');

    // Hero
    renderHero(data.hero);

    // News cards
    var items = data.items || [];
    for (var i = 0; i < 3; i++) {
      if (items[i]) {
        renderCard(i, items[i]);
      }
    }
  }

  // ── Data fetch ──
  function fetchData() {
    // Preview mode always uses MOCK
    if (dataMode === 'preview') {
      render(mergeParams(MOCK));
      return;
    }

    // Live mode: try API, fallback to MOCK
    var topics = params.topics || params.categories || 'tech,auto,finance,sports';
    fetch('/api/news?categories=' + encodeURIComponent(topics))
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var apiData = json.data || json;
        render(mergeParams(normalizeApiData(apiData)));
      })
      .catch(function (err) {
        console.warn('[News] API fetch failed, using MOCK:', err);
        render(mergeParams(MOCK));
      });
  }

  // ── Normalize API response into hero + items structure ──
  function normalizeApiData(data) {
    // If already in hero/items format, return as-is
    if (data.hero && data.items) return data;

    // If API returns flat array of news items
    if (Array.isArray(data)) {
      var result = { hero: null, items: [] };
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var normalized = {
          category: item.category || 'tech',
          tag: item.tag || item.category_label || '资讯',
          tag_color: item.tag_color || resolveTagColor(item.category),
          title: item.title || '',
          summary: item.summary || item.description || '',
          source: item.source || '',
          time: item.time || item.published_at || '',
          image: item.image || item.cover || ''
        };
        if (i === 0) {
          result.hero = normalized;
        } else {
          result.items.push(normalized);
        }
      }
      return result;
    }

    // If API returns { articles: [...] } or { news: [...] }
    var articles = data.articles || data.news || [];
    if (articles.length > 0) {
      return normalizeApiData(articles);
    }

    return data;
  }

  // ── Merge host params onto data ──
  function mergeParams(data) {
    var merged = {};
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) merged[keys[i]] = data[keys[i]];
    if (params.display_style) merged.display_style = params.display_style;
    return merged;
  }

  // ── Init ──
  function init() {
    if (params.visual_style) { document.documentElement.setAttribute('data-visual-style', params.visual_style); }
    fetchData();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
