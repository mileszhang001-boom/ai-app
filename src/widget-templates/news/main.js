/**
 * 每日简报 — card.pen spec (node OMxV7)
 * Hero card + list cards, category color mapping, fullscreen overlay
 */

(function() {
  'use strict';

  var params = window.__WIDGET_PARAMS__ || {
    category: 'general',
    categories: null,
    max_items: 8
  };

  // 数据分层：preview 用 mock 数据 + 角标，live 用真实 API
  var dataMode = window.__WIDGET_DATA_MODE__ || 'live';

  // Multi-category support: categories array takes priority
  var activeCategories = params.categories || (params.category ? [params.category] : ['general']);

  var newsListEl = document.getElementById('newsList');
  var currentDateEl = document.getElementById('currentDate');
  var detailOverlay = document.getElementById('newsDetail');

  // ── Category color mapping ──
  var CATEGORY_COLORS = {
    '科技': '#4A9EFF',
    '汽车': '#F59E0B',
    '财经': '#34D399',
    '体育': '#FB7185',
    '生活': '#A78BFA',
    '国内': '#64748B',
    '综合': '#64748B'
  };

  var CATEGORY_CSS_CLASS = {
    '科技': 'cat-tech',
    '汽车': 'cat-auto',
    '财经': 'cat-finance',
    '体育': 'cat-sports',
    '生活': 'cat-life',
    '国内': 'cat-china',
    '综合': 'cat-general'
  };

  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || '#64748B';
  }

  function getCategoryClass(category) {
    return CATEGORY_CSS_CLASS[category] || 'cat-general';
  }

  // ── Mock data（丰富内容 — 长摘要 + 子标题）──
  var mockNews = [
    { id: 1, title: 'AI在汽车领域取得新突破，智能驾驶进入新阶段',
      summary: 'AI技术持续推动自动驾驶发展，多家车企宣布新一代智驾方案，有望在年内实现城市NOA全面开放。全球范围内，自动驾驶技术正从高速公路场景向城市复杂路况延伸，激光雷达成本持续下降，算法训练数据量级提升至PB级别。\n在技术路线上，端到端大模型方案逐渐成为行业共识。特斯拉FSD V12、华为ADS 3.0均采用此方案，通过海量驾驶数据训练，让系统像人类一样理解复杂交通场景。\n业内预计，2026年下半年将有超过10款搭载城市NOA的新车上市，L3级别自动驾驶正在从概念走向现实。',
      subheading: '端到端大模型成行业共识',
      category: '科技', time: '2小时前', url: '', source: '36氪' },
    { id: 2, title: '小米汽车YU7开启预订，首日订单突破10万',
      summary: '小米汽车旗下第二款车型YU7正式开启预订，首日订单量突破10万台，远超市场预期。新车搭载自研超级电机V8s、800V碳化硅高压平台和全新智驾系统，综合续航突破750公里，零百加速仅需2.78秒。\n在产品定位上，YU7瞄准中大型SUV市场，与Model Y、问界M7形成直接竞争。雷军在发布会上强调"人车家全生态"战略，车机系统与小米手机、智能家居深度打通，支持车内语音控制全屋设备。\n供应链方面，小米已在北京亦庄二期工厂投产，年产能提升至30万台，预计交付周期控制在6周以内。',
      subheading: '人车家全生态战略深化',
      category: '汽车', time: '3小时前', url: '', source: '汽车之家' },
    { id: 3, title: '央行宣布降准0.5个百分点，释放长期资金约1万亿',
      summary: '中国人民银行决定下调金融机构存款准备金率0.5个百分点，预计将释放长期资金约1万亿元。此次降准旨在加大对实体经济的支持力度，降低社会融资成本，促进经济平稳增长。市场分析人士认为，这一举措释放了积极的货币政策信号。\n从市场反应来看，A股三大指数午后集体拉升，沪指涨逾1.5%，银行板块领涨。债券市场同步走强，10年期国债收益率下行5个基点。人民币汇率保持稳定，在岸美元兑人民币维持在7.10附近。\n专家指出，本次降准是今年第二次，累计释放超2万亿长期资金，下一步可能配合降息操作，进一步引导LPR下行。',
      subheading: '市场走势与政策预期分析',
      category: '财经', time: '4小时前', url: '', source: '第一财经' },
    { id: 4, title: 'CBA季后赛：北京首钢逆转广东，晋级四强',
      summary: 'CBA季后赛半决赛上演经典对决，北京首钢在客场落后15分的情况下实现惊天逆转，最终以98-95击败广东宏远，总比分3-2淘汰对手晋级四强。',
      subheading: '关键时刻防守轮转成胜负手',
      category: '体育', time: '5小时前', url: '', source: '虎扑' },
    { id: 5, title: '固态电池量产进程加速，续航有望突破1000公里',
      summary: '宁德时代宣布其半固态电池将在Q4量产上车，能量密度达到400Wh/kg。分析人士指出，固态电池的量产将从根本上解决电动车续航和安全焦虑。',
      category: '汽车', time: '6小时前', url: '', source: '澎湃新闻' },
    { id: 6, title: '开源大模型社区活跃度创新高',
      summary: 'GitHub上AI相关项目星标数突破500万，贡献者数量同比增长120%。以Llama、Qwen、DeepSeek为代表的开源模型生态日趋成熟。',
      category: '科技', time: '7小时前', url: '', source: '36氪' },
    { id: 7, title: '充电基础设施建设提速，超充站年内翻倍',
      summary: '全国公共充电桩保有量达到380万台，超充桩占比提升至18%。多地推出"充电15分钟补能400公里"的超快充服务。',
      category: '汽车', time: '8小时前', url: '', source: '第一财经' },
    { id: 8, title: '端侧AI芯片性能翻倍，功耗降低30%',
      summary: '新一代手机和车载AI芯片算力翻倍，端侧推理使得AI功能无需联网即可运行，既保护隐私又降低延迟。',
      category: '科技', time: '10小时前', url: '', source: 'IT之家' }
  ];

  // 分类 → hero 装饰 emoji
  var CATEGORY_EMOJI = {
    '科技': '🤖', '汽车': '🚗', '财经': '📈', '体育': '⚽',
    '生活': '🌿', '国内': '🏛️', '综合': '📰'
  };

  // 分类 → 图片说明文字
  var CATEGORY_CAPTION = {
    '科技': '行业技术发展趋势示意图',
    '汽车': '新车型产品配置对比',
    '财经': '市场走势与政策影响分析',
    '体育': '赛事精彩瞬间回放',
    '生活': '生活方式趋势洞察',
    '国内': '政策动态与社会热点',
    '综合': '热门资讯一览'
  };

  var cachedNews = null;
  var lastFetchTime = 0;
  var CACHE_DURATION = 30 * 60 * 1000;

  // ── Fetch news (multi-category, JSBridge compatible) ──
  async function fetchNews() {
    var limit = params.max_items || 4;

    // preview 模式：直接用 mock 数据，不调 API
    if (dataMode === 'preview') {
      cachedNews = mockNews.slice(0, limit);
      return cachedNews;
    }

    var now = Date.now();
    if (cachedNews && (now - lastFetchTime) < CACHE_DURATION) {
      return cachedNews;
    }

    try {
      var newsData = null;
      var catParam = activeCategories.join(',');
      var apiUrl = '/api/news?categories=' + encodeURIComponent(catParam) + '&limit=' + limit;

      if (window.AIWidgetBridge && window.AIWidgetBridge.isCarEnvironment && window.AIWidgetBridge.isCarEnvironment()) {
        var response = await window.AIWidgetBridge.fetchData(apiUrl);
        newsData = JSON.parse(response.data);
      } else {
        try {
          var resp = await fetch(apiUrl);
          if (resp.ok) {
            newsData = await resp.json();
          }
        } catch (e) {
          // API unavailable, fall through to mock
        }
      }

      if (newsData && newsData.news && newsData.news.length > 0) {
        cachedNews = newsData.news.slice(0, limit).map(function(item) {
          return {
            id: item.id,
            title: item.title,
            summary: item.summary || '',
            subheading: item.subheading || '',
            category: item.tag || item.category || '综合',
            time: item.time || '刚刚',
            url: item.url || '',
            source: item.source || '',
            image_url: item.image_url || item.imageUrl || ''
          };
        });
      } else {
        cachedNews = mockNews.slice(0, limit);
      }

      lastFetchTime = now;
      return cachedNews;
    } catch (error) {
      return mockNews.slice(0, params.max_items || 4);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Render news list ──
  function renderNews(news) {
    newsListEl.innerHTML = '';
    if (!news || news.length === 0) {
      newsListEl.innerHTML = '<div style="color:#64748B;font-size:32px;text-align:center;padding-top:200px;">暂无新闻</div>';
      return;
    }

    // v2.0: 纵向滚动新闻流，有图/无图双布局
    news.forEach(function(item, idx) {
      var cardEl = document.createElement('div');
      var catColor = getCategoryColor(item.category);
      var summaryText = item.summary || '';
      var summaryPreview = summaryText.length > 80 ? summaryText.substring(0, 80) + '…' : summaryText;

      if (item.image_url) {
        // 有图模式：左图右文
        cardEl.className = 'news-card news-card-with-image';
        cardEl.innerHTML =
          '<div class="news-card-thumb" style="background-image:url(' + item.image_url + ');background-size:cover;background-position:center;"></div>' +
          '<div class="news-card-text">' +
            '<span class="news-category ' + getCategoryClass(item.category) + '">' + escapeHtml(item.category) + '</span>' +
            '<div class="news-title">' + escapeHtml(item.title) + '</div>' +
            '<span class="news-source">' + escapeHtml(item.source || '') + (item.time ? ' \u00B7 ' + escapeHtml(item.time) : '') + '</span>' +
          '</div>';
      } else {
        // 无图模式：纯文字，标题加大 + 摘要预览
        cardEl.className = 'news-card news-card-text-only';
        cardEl.innerHTML =
          '<div class="news-card-text">' +
            '<span class="news-category ' + getCategoryClass(item.category) + '">' + escapeHtml(item.category) + '</span>' +
            '<div class="news-title news-title-lg">' + escapeHtml(item.title) + '</div>' +
            (summaryPreview ? '<div class="news-summary-preview">' + escapeHtml(summaryPreview) + '</div>' : '') +
            '<span class="news-source">' + escapeHtml(item.source || '') + (item.time ? ' \u00B7 ' + escapeHtml(item.time) : '') + '</span>' +
          '</div>';
      }

      (function(newsItem) {
        cardEl.addEventListener('click', function() { showDetail(newsItem); });
      })(item);

      newsListEl.appendChild(cardEl);
    });
  }

  // ── Show article detail (fullscreen overlay preferred) ──
  function showDetail(item) {
    var catColor = getCategoryColor(item.category);
    var emoji = CATEGORY_EMOJI[item.category] || '📰';
    var caption = CATEGORY_CAPTION[item.category] || '热门资讯一览';
    var summaryText = item.summary || '暂无详细内容。';
    var readMinutes = Math.ceil(summaryText.length / 300);
    var paragraphs = summaryText.split('\n').filter(function(s) { return s.trim(); });

    if (!window.createFullscreenOverlay) {
      // Fallback: inline overlay
      if (!detailOverlay) return;
      detailOverlay.innerHTML =
        '<div class="detail-card">' +
          '<div class="detail-category" style="color:' + catColor + '">' + escapeHtml(item.category) + '</div>' +
          '<div class="detail-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="detail-summary">' + escapeHtml(summaryText) + '</div>' +
          '<div class="detail-meta">' + escapeHtml(item.time) + (item.source ? ' \u00B7 ' + escapeHtml(item.source) : '') + '</div>' +
          '<div class="detail-close">点击关闭</div>' +
        '</div>';
      detailOverlay.classList.add('visible');
      detailOverlay.addEventListener('click', function handler() {
        detailOverlay.classList.remove('visible');
        detailOverlay.removeEventListener('click', handler);
      });
      return;
    }

    var overlay = window.createFullscreenOverlay({
      background: '#0A0E14',
      content: function(container) {
        // Top nav
        var nav = document.createElement('div');
        nav.style.cssText = 'display:flex;align-items:center;height:80px;padding:0 48px;gap:16px;';
        var backBtn = document.createElement('span');
        backBtn.textContent = '\u2039';
        backBtn.style.cssText = 'font-size:48px;color:#F5F5F0;cursor:pointer;-webkit-tap-highlight-color:transparent;';
        backBtn.addEventListener('click', function() { overlay.hide(); });
        nav.appendChild(backBtn);
        container.appendChild(nav);

        // Hero image area (real image or decorative fallback)
        var heroImg = document.createElement('div');
        heroImg.style.cssText = 'width:100%;height:380px;overflow:hidden;position:relative;';
        if (item.image_url) {
          heroImg.style.backgroundImage = 'url(' + item.image_url + ')';
          heroImg.style.backgroundSize = 'cover';
          heroImg.style.backgroundPosition = 'center';
        } else {
          heroImg.style.background = 'linear-gradient(135deg,#1a2a4a 0%,#0F172A 50%,#1E293B 100%)';
          heroImg.style.display = 'flex';
          heroImg.style.alignItems = 'center';
          heroImg.style.justifyContent = 'center';
          heroImg.innerHTML = '<span style="font-size:96px;opacity:0.2;">' + emoji + '</span>';
        }
        // Bottom fade
        var fade = document.createElement('div');
        fade.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to top,#0A0E14,transparent);';
        heroImg.appendChild(fade);
        container.appendChild(heroImg);

        // Article body
        var body = document.createElement('div');
        body.style.cssText = 'padding:0 48px 80px;display:flex;flex-direction:column;gap:20px;';

        // Category tag pills
        var tags = document.createElement('div');
        tags.style.cssText = 'display:flex;gap:12px;';
        var tag = document.createElement('span');
        tag.style.cssText = 'padding:6px 16px;border-radius:18px;background:' + catColor + '20;color:' + catColor + ';font-size:22px;font-weight:600;font-family:MiSans_VF,-apple-system,sans-serif;';
        tag.textContent = item.category;
        tags.appendChild(tag);
        body.appendChild(tags);

        // Title
        var title = document.createElement('div');
        title.style.cssText = 'font-size:36px;font-weight:700;color:#F5F5F0;line-height:1.35;font-family:MiSans_VF,-apple-system,sans-serif;';
        title.textContent = item.title;
        body.appendChild(title);

        // Source + time + read time
        var meta = document.createElement('div');
        meta.style.cssText = 'display:flex;gap:12px;align-items:center;font-size:22px;font-family:MiSans_VF,-apple-system,sans-serif;';
        if (item.source) {
          var src = document.createElement('span');
          src.style.color = catColor;
          src.textContent = item.source;
          meta.appendChild(src);
          var dot1 = document.createElement('span');
          dot1.style.color = 'rgba(255,255,255,0.25)';
          dot1.textContent = '\u00B7';
          meta.appendChild(dot1);
        }
        var time = document.createElement('span');
        time.style.color = 'rgba(255,255,255,0.4)';
        time.textContent = item.time;
        meta.appendChild(time);
        var dot2 = document.createElement('span');
        dot2.style.color = 'rgba(255,255,255,0.25)';
        dot2.textContent = '\u00B7';
        meta.appendChild(dot2);
        var readTime = document.createElement('span');
        readTime.style.color = 'rgba(255,255,255,0.4)';
        readTime.textContent = '阅读 ' + readMinutes + ' 分钟';
        meta.appendChild(readTime);
        body.appendChild(meta);

        // Divider
        var divider = document.createElement('div');
        divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);';
        body.appendChild(divider);

        // Paragraphs 1-2 (before inline image)
        var firstParagraphs = paragraphs.slice(0, 2);
        firstParagraphs.forEach(function(p) {
          var para = document.createElement('div');
          para.style.cssText = 'font-size:28px;color:rgba(245,245,240,0.8);line-height:1.7;font-family:MiSans_VF,-apple-system,sans-serif;';
          para.textContent = p.trim();
          body.appendChild(para);
        });

        // Inline image (real image or decorative fallback + caption)
        var inlineImgWrap = document.createElement('div');
        inlineImgWrap.style.cssText = 'margin:12px 0;';
        var inlineImgStyle = item.image_url
          ? 'width:100%;height:280px;border-radius:16px;overflow:hidden;background-image:url(' + item.image_url + ');background-size:cover;background-position:center;'
          : 'width:100%;height:280px;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#1a2a4a,#0F172A);display:flex;align-items:center;justify-content:center;';
        var inlineImgContent = item.image_url ? '' : '<span style="font-size:80px;opacity:0.2;">' + emoji + '</span>';
        inlineImgWrap.innerHTML =
          '<div style="' + inlineImgStyle + '">' + inlineImgContent + '</div>' +
          '<div style="font-size:22px;color:#64748B;text-align:center;margin-top:8px;">' +
            '\u25B2 ' + caption +
          '</div>';
        body.appendChild(inlineImgWrap);

        // Subheading
        if (item.subheading) {
          var subheading = document.createElement('div');
          subheading.style.cssText = 'font-size:32px;font-weight:700;color:#F5F5F0;line-height:1.4;margin-top:8px;font-family:MiSans_VF,-apple-system,sans-serif;';
          subheading.textContent = item.subheading;
          body.appendChild(subheading);
        }

        // Remaining paragraphs (3+)
        var remainingParagraphs = paragraphs.slice(2);
        remainingParagraphs.forEach(function(p) {
          var para = document.createElement('div');
          para.style.cssText = 'font-size:28px;color:rgba(245,245,240,0.8);line-height:1.7;font-family:MiSans_VF,-apple-system,sans-serif;';
          para.textContent = p.trim();
          body.appendChild(para);
        });

        // Bottom source attribution
        var bottomDivider = document.createElement('div');
        bottomDivider.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);margin-top:16px;';
        body.appendChild(bottomDivider);

        var attribution = document.createElement('div');
        attribution.style.cssText = 'display:flex;justify-content:space-between;align-items:center;font-size:22px;color:rgba(255,255,255,0.3);font-family:MiSans_VF,-apple-system,sans-serif;margin-top:4px;';
        attribution.innerHTML =
          '<span>' + (item.source ? '来源：' + escapeHtml(item.source) : '') + '</span>' +
          '<span>' + escapeHtml(item.time) + '</span>';
        body.appendChild(attribution);

        container.appendChild(body);
      }
    });

    overlay.show();
  }

  // ── Render skeleton while loading ──
  function renderSkeleton() {
    newsListEl.innerHTML =
      '<div class="skeleton-hero"></div>' +
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>' +
      '<div class="skeleton-card"></div>';
  }

  // ── Update date: "M月D日" format ──
  function updateDate() {
    var now = new Date();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    currentDateEl.textContent = month + '月' + day + '日';
  }

  // ── Init ──
  async function init() {
    updateDate();

    // preview 模式：显示"示例内容"角标
    if (dataMode === 'preview') {
      var badge = document.createElement('div');
      badge.className = 'demo-badge';
      badge.textContent = '示例内容';
      document.querySelector('.widget-news').appendChild(badge);
    }

    // Mock 优先：立即渲染 mock 数据
    var limit = params.max_items || 4;
    renderNews(mockNews.slice(0, limit));

    // live 模式：后台尝试 API 数据替换 + 定期刷新
    if (dataMode === 'live') {
      fetchNews().then(function(news) {
        if (news && news !== mockNews) renderNews(news);
      }).catch(function() {});

      setInterval(async function() {
        cachedNews = null;
        var freshNews = await fetchNews();
        renderNews(freshNews);
      }, 30 * 60 * 1000);
    }

    // Theme bridge
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
