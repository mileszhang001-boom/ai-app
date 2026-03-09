/**
 * 每日新闻 · 科技蓝
 *
 * 4条新闻，单屏显示，支持上下滑动
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    category: 'general',
    max_items: 4
  };

  var newsListEl = document.getElementById('newsList');
  var currentDateEl = document.getElementById('currentDate');

  var mockNews = [
    { id: 1, title: 'AI在汽车领域取得新突破，智能驾驶进入新阶段', category: '科技', time: '1小时前' },
    { id: 2, title: '小米汽车Q2交付量创新高', category: '汽车', time: '2小时前' },
    { id: 3, title: 'A股三大指数集体上涨，新能源板块领涨', category: '财经', time: '3小时前' },
    { id: 4, title: '全球首款固态电池量产车亮相', category: '科技', time: '4小时前' },
    { id: 5, title: '春季自驾出行指南：10个最值得去的目的地', category: '生活', time: '5小时前' },
    { id: 6, title: '国产大模型在多项基准测试中超越GPT-4', category: '科技', time: '6小时前' }
  ];

  var cachedNews = null;
  var lastFetchTime = 0;
  var CACHE_DURATION = 30 * 60 * 1000;

  async function fetchNews() {
    var now = Date.now();
    if (cachedNews && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedNews;
    }

    try {
      var newsData = null;

      // 1. 车机环境：通过 JSBridge 获取
      if (window.AIWidgetBridge && window.AIWidgetBridge.isCarEnvironment && window.AIWidgetBridge.isCarEnvironment()) {
        var response = await window.AIWidgetBridge.fetchData('/api/news?category=' + encodeURIComponent(params.category) + '&limit=' + params.max_items);
        newsData = JSON.parse(response.data);
      }
      // 2. 浏览器/预览环境：直接 fetch API
      else {
        try {
          var apiUrl = '/api/news?category=' + encodeURIComponent(params.category) + '&limit=' + params.max_items;
          var resp = await fetch(apiUrl);
          if (resp.ok) {
            newsData = await resp.json();
          }
        } catch (e) {
          // API 不可用，继续到 mock 降级
        }
      }

      // 3. 解析 API 响应
      if (newsData && newsData.news && newsData.news.length > 0) {
        cachedNews = newsData.news.slice(0, params.max_items).map(function(item) {
          return {
            id: item.id,
            title: item.title,
            category: item.tag || item.category || '综合',
            time: item.time || '刚刚'
          };
        });
      }
      // 4. 降级到 mock 数据
      else {
        cachedNews = mockNews.slice(0, params.max_items);
      }

      lastFetchTime = now;
      return cachedNews;
    } catch (error) {
      return mockNews.slice(0, params.max_items);
    }
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
      el.style.animationDelay = (index * 0.08) + 's';

      // 第一行：标签 + 标题
      var headerHtml = '<div class="news-item-header">' +
        '<span class="news-item-category">' + escapeHtml(item.category) + '</span>' +
        '<span class="news-item-title">' + escapeHtml(item.title) + '</span>' +
        '</div>';

      // 第二行：时间
      var timeHtml = '<div class="news-item-time">' + escapeHtml(item.time) + '</div>';

      el.innerHTML = headerHtml + timeHtml;
      newsListEl.appendChild(el);
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    updateDate();

    var news = await fetchNews();
    renderNews(news);

    // 每30分钟刷新一次
    setInterval(async function() {
      var freshNews = await fetchNews();
      renderNews(freshNews);
    }, 30 * 60 * 1000);

    // 监听主题变化
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
