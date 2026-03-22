/**
 * 每日新闻 · Liquid Glass Edition
 * 毛玻璃新闻卡片 + 自动轮播高亮 + 点击详情浮层
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    category: 'general',
    max_items: 3
  };

  var newsListEl = document.getElementById('newsList');
  var currentDateEl = document.getElementById('currentDate');
  var dotsEl = document.getElementById('carouselDots');
  var detailOverlay = document.getElementById('newsDetail');

  var mockNews = [
    { id: 1, title: 'AI在汽车领域取得新突破，智能驾驶进入新阶段', summary: 'AI技术持续推动自动驾驶发展，多家车企宣布新一代智驾方案。', category: '科技', time: '1小时前', url: '', source: '科技日报' },
    { id: 2, title: '小米汽车Q2交付量创新高', summary: '小米汽车第二季度累计交付超过预期目标，产能持续爬坡。', category: '汽车', time: '2小时前', url: '', source: '汽车之家' },
    { id: 3, title: 'A股三大指数集体上涨，新能源板块领涨', summary: '受利好政策推动，新能源板块全线走强，机构看好后市表现。', category: '财经', time: '3小时前', url: '', source: '第一财经' },
    { id: 4, title: '全球首款固态电池量产车亮相', summary: '固态电池技术实现量产突破，续航里程和安全性大幅提升。', category: '科技', time: '4小时前', url: '', source: '新浪科技' },
    { id: 5, title: '春季自驾出行指南：10个最值得去的目的地', summary: '精选国内十大春季自驾路线，附详细攻略和注意事项。', category: '生活', time: '5小时前', url: '', source: '旅行家' }
  ];

  var cachedNews = null;
  var lastFetchTime = 0;
  var CACHE_DURATION = 30 * 60 * 1000;
  var currentHighlight = 0;
  var highlightTimer = null;

  async function fetchNews() {
    var now = Date.now();
    if (cachedNews && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedNews;
    }

    try {
      var newsData = null;

      if (window.AIWidgetBridge && window.AIWidgetBridge.isCarEnvironment && window.AIWidgetBridge.isCarEnvironment()) {
        var response = await window.AIWidgetBridge.fetchData('/api/news?category=' + encodeURIComponent(params.category) + '&limit=' + params.max_items);
        newsData = JSON.parse(response.data);
      } else {
        try {
          var apiUrl = '/api/news?category=' + encodeURIComponent(params.category) + '&limit=' + params.max_items;
          var resp = await fetch(apiUrl);
          if (resp.ok) {
            newsData = await resp.json();
          }
        } catch (e) {
          // API unavailable, fall through to mock
        }
      }

      if (newsData && newsData.news && newsData.news.length > 0) {
        cachedNews = newsData.news.slice(0, params.max_items).map(function(item) {
          return {
            id: item.id,
            title: item.title,
            summary: item.summary || '',
            category: item.tag || item.category || '综合',
            time: item.time || '刚刚',
            url: item.url || '',
            source: item.source || ''
          };
        });
      } else {
        cachedNews = mockNews.slice(0, params.max_items);
      }

      lastFetchTime = now;
      return cachedNews;
    } catch (error) {
      return mockNews.slice(0, params.max_items);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderNews(news) {
    newsListEl.innerHTML = '';
    if (!news || news.length === 0) {
      newsListEl.innerHTML = '<div class="news-item"><div class="news-item-title">暂无新闻</div></div>';
      return;
    }

    news.forEach(function(item, index) {
      var el = document.createElement('div');
      el.className = 'news-item';
      if (index === 0) el.classList.add('highlighted');

      var headerHtml = '<div class="news-item-header">' +
        '<span class="news-item-category">' + escapeHtml(item.category) + '</span>' +
        '<span class="news-item-title">' + escapeHtml(item.title) + '</span>' +
        '</div>';

      var summaryHtml = item.summary
        ? '<div class="news-item-summary">' + escapeHtml(item.summary) + '</div>'
        : '';

      var timeHtml = '<div class="news-item-time">' + escapeHtml(item.time) + '</div>';

      el.innerHTML = headerHtml + summaryHtml + timeHtml;

      // 点击显示详情浮层
      el.addEventListener('click', function() {
        showDetail(item);
      });

      newsListEl.appendChild(el);
    });

    // 渲染轮播指示器
    renderDots(news.length);

    // 启动轮播高亮
    startCarousel(news.length);
  }

  function showDetail(item) {
    if (!detailOverlay) return;

    var sourceText = item.source ? ' · ' + escapeHtml(item.source) : '';

    detailOverlay.innerHTML =
      '<div class="detail-card">' +
        '<div class="detail-category">' + escapeHtml(item.category) + '</div>' +
        '<div class="detail-title">' + escapeHtml(item.title) + '</div>' +
        '<div class="detail-summary">' + escapeHtml(item.summary || '暂无摘要') + '</div>' +
        '<div class="detail-meta">' + escapeHtml(item.time) + sourceText + '</div>' +
        '<div class="detail-close">点击关闭</div>' +
      '</div>';

    detailOverlay.classList.add('visible');

    // 点击关闭
    detailOverlay.addEventListener('click', function handler() {
      detailOverlay.classList.remove('visible');
      detailOverlay.removeEventListener('click', handler);
    });
  }

  function renderDots(count) {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('div');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dotsEl.appendChild(dot);
    }
  }

  function startCarousel(count) {
    if (highlightTimer) clearInterval(highlightTimer);
    if (count <= 1) return;

    currentHighlight = 0;

    highlightTimer = setInterval(function() {
      var items = newsListEl.querySelectorAll('.news-item');
      var dots = dotsEl ? dotsEl.querySelectorAll('.carousel-dot') : [];

      // 移除上一个高亮
      if (items[currentHighlight]) {
        items[currentHighlight].classList.remove('highlighted');
      }
      if (dots[currentHighlight]) {
        dots[currentHighlight].classList.remove('active');
      }

      // 下一个
      currentHighlight = (currentHighlight + 1) % count;

      if (items[currentHighlight]) {
        items[currentHighlight].classList.add('highlighted');
      }
      if (dots[currentHighlight]) {
        dots[currentHighlight].classList.add('active');
      }
    }, 5000);
  }

  function updateDate() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    currentDateEl.textContent = '今日·' + month + '月' + day + '日';
  }

  function applyTheme() {
    if (window.AIWidgetBridge) {
      window.AIWidgetBridge.getTheme().then(function(theme) {
        document.documentElement.setAttribute('data-theme', theme.mode);
      }).catch(function() {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
    }
  }

  async function init() {
    applyTheme();
    if (params.style_preset) {
      document.documentElement.setAttribute('data-style', params.style_preset);
    }

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

    updateDate();

    var news = await fetchNews();
    renderNews(news);

    // 每30分钟刷新
    setInterval(async function() {
      cachedNews = null;
      var freshNews = await fetchNews();
      renderNews(freshNews);
    }, 30 * 60 * 1000);

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
