# 微信公众号后台专用选择器库

> 最后更新：2026-03-29
> 适用版本：mp.weixin.qq.com 2026-03 UI

---

## 首页数据提取

### 核心指标

```javascript
// 提取首页核心数据（v2026-03）
function extractHomeData() {
    const data = {
        totalUsers: '',
        originalCount: '',
        yesterdayRead: '',
        yesterdayShare: '',
        yesterdayFollow: '',
        dataTimeRange: ''
    };
    
    // 方法 1: data-testid（优先）
    const testIds = {
        totalUsers: '[data-testid="total-users"]',
        originalCount: '[data-testid="original-count"]',
        yesterdayRead: '[data-testid="yesterday-read"]',
        yesterdayShare: '[data-testid="yesterday-share"]',
        yesterdayFollow: '[data-testid="yesterday-follow"]'
    };
    
    for (const [key, selector] of Object.entries(testIds)) {
        const el = document.querySelector(selector);
        if (el) {
            data[key] = el.textContent.trim();
        }
    }
    
    // 方法 2: 文本匹配（降级方案）
    if (!data.totalUsers) {
        const labels = document.querySelectorAll('.label, .stat-label');
        labels.forEach(label => {
            const text = label.textContent.trim();
            const valueEl = label.nextElementSibling || label.parentElement.querySelector('.value, .stat-value');
            
            if (text.includes('总用户数') && valueEl) {
                data.totalUsers = valueEl.textContent.trim();
            }
            if (text.includes('昨日阅读') && valueEl) {
                data.yesterdayRead = valueEl.textContent.trim();
            }
            if (text.includes('昨日分享') && valueEl) {
                data.yesterdayShare = valueEl.textContent.trim();
            }
            if (text.includes('昨日新增关注') && valueEl) {
                data.yesterdayFollow = valueEl.textContent.trim();
            }
        });
    }
    
    // 数据统计时间
    const timeEl = document.querySelector('.stat-time, [class*="time"]');
    if (timeEl) {
        data.dataTimeRange = timeEl.textContent.trim();
    }
    
    return data;
}
```

### 文章列表提取

```javascript
// 提取近期发表文章（v2026-03）
function extractArticleList(maxCount = 10) {
    const articles = [];
    
    // 文章卡片选择器
    const articleCards = document.querySelectorAll('.article-item, .publish-item, [class*="article"]');
    
    articleCards.forEach((card, index) => {
        if (articles.length >= maxCount) return;
        
        const article = {
            title: '',
            publishDate: '',
            publishTime: '',
            readCount: '0',
            shareCount: '0',
            likeCount: '0',
            commentCount: '0',
            status: ''
        };
        
        // 标题
        const titleEl = card.querySelector('.title, a[href*="appmsg"], [class*="title"]');
        if (titleEl) {
            article.title = titleEl.textContent.trim();
        }
        
        // 发布日期（如：星期五、03 月 17 日）
        const dateEl = card.querySelector('.date, .publish-date, [class*="date"]');
        if (dateEl) {
            const dateText = dateEl.textContent.trim();
            // 分离日期和时间
            const parts = dateText.split(' ');
            article.publishDate = parts[0] || dateText;
            article.publishTime = parts[1] || '';
        }
        
        // 状态（已发表、已修改等）
        const statusEl = card.querySelector('.status, [class*="status"]');
        if (statusEl) {
            article.status = statusEl.textContent.trim();
        }
        
        // 统计数据（阅读、分享、点赞、收藏）
        const statElements = card.querySelectorAll('.stat, [class*="stat"]');
        if (statElements.length >= 4) {
            article.readCount = statElements[0]?.textContent.trim() || '0';
            article.shareCount = statElements[1]?.textContent.trim() || '0';
            article.likeCount = statElements[2]?.textContent.trim() || '0';
            article.commentCount = statElements[3]?.textContent.trim() || '0';
        }
        
        // 只添加有标题的文章
        if (article.title) {
            articles.push(article);
        }
    });
    
    return articles;
}
```

---

## 投流额度提取

### 内容助推页面

```javascript
// 提取投流额度信息（v2026-03）
function extractBoostQuota() {
    const quota = {
        availableExposure: '',
        availableIncentiveCount: '',
        expiringSoonCount: '',
        expiringSoonDetails: []
    };
    
    // 可用曝光
    const exposureEl = document.querySelector('[data-testid="available-exposure"], .exposure-count');
    if (exposureEl) {
        quota.availableExposure = exposureEl.textContent.trim();
    }
    
    // 可用激励数量
    const incentiveEl = document.querySelector('[data-testid="available-incentive"], .incentive-count');
    if (incentiveEl) {
        quota.availableIncentiveCount = incentiveEl.textContent.trim();
    }
    
    // 即将过期提示
    const expiringEl = document.querySelector('[data-testid="expiring-soon"], .expiring-tip');
    if (expiringEl) {
        const text = expiringEl.textContent.trim();
        const match = text.match(/(\d+) 个激励即将过期/);
        if (match) {
            quota.expiringSoonCount = match[1];
        }
    }
    
    return quota;
}

// 提取全部激励详情（需先点击"全部激励"）
function extractAllIncentives() {
    const incentives = [];
    
    // 激励列表（模态框或下拉层）
    const incentiveCards = document.querySelectorAll('.incentive-card, .incentive-item');
    
    incentiveCards.forEach(card => {
        const incentive = {
            source: '',
            exposure: '',
            expireDate: '',
            status: '',
            priority: 'normal'
        };
        
        // 激励来源（如：被分享 10 次达成）
        const sourceEl = card.querySelector('.source, .incentive-source');
        if (sourceEl) {
            incentive.source = sourceEl.textContent.trim();
        }
        
        // 曝光额度
        const exposureEl = card.querySelector('.exposure, .exposure-amount');
        if (exposureEl) {
            incentive.exposure = exposureEl.textContent.trim();
        }
        
        // 到期时间
        const expireEl = card.querySelector('.expire-date, .deadline');
        if (expireEl) {
            incentive.expireDate = expireEl.textContent.trim();
            // 标记即将过期的
            if (expireEl.textContent.includes('即将过期') || 
                expireEl.textContent.includes('今天') ||
                expireEl.textContent.includes('明天')) {
                incentive.priority = 'high';
            }
        }
        
        // 状态（已使用/未使用）
        const statusEl = card.querySelector('.status, .incentive-status');
        if (statusEl) {
            incentive.status = statusEl.textContent.trim();
        }
        
        incentives.push(incentive);
    });
    
    return incentives;
}
```

### 历史助推记录

```javascript
// 提取我的助推记录
function extractBoostHistory() {
    const history = [];
    
    // 助推记录行
    const rows = document.querySelectorAll('.boost-record, table tr');
    
    rows.forEach(row => {
        const record = {
            title: '',
            status: '',
            startTime: '',
            quota: '',
            exposure: '',
            roi: ''
        };
        
        const cells = row.querySelectorAll('td, .record-cell');
        if (cells.length >= 5) {
            record.title = cells[0]?.textContent.trim() || '';
            record.status = cells[1]?.textContent.trim() || '';
            record.startTime = cells[2]?.textContent.trim() || '';
            record.quota = cells[3]?.textContent.trim() || '';
            record.exposure = cells[4]?.textContent.trim() || '';
            
            // 计算 ROI
            const quotaNum = parseFloat(record.quota) || 0;
            const exposureNum = parseFloat(record.exposure) || 0;
            if (quotaNum > 0) {
                record.roi = (exposureNum / quotaNum).toFixed(2);
            }
        }
        
        // 只添加有效记录
        if (record.title) {
            history.push(record);
        }
    });
    
    return history;
}
```

---

## 页面结构探索

### DOM 快速探索

```javascript
// 快速了解页面结构（调试用）
function explorePageStructure() {
    const info = {
        title: document.title,
        url: window.location.href,
        bodyLength: document.body.innerHTML.length,
        mainClasses: [],
        mainIds: [],
        links: []
    };
    
    // 提取主要 class
    const elements = document.querySelectorAll('[class]');
    const classSet = new Set();
    elements.forEach(el => {
        el.classList.forEach(cls => {
            if (cls.length > 3) classSet.add(cls); // 过滤短 class
        });
    });
    info.mainClasses = Array.from(classSet).slice(0, 20);
    
    // 提取主要 id
    const idElements = document.querySelectorAll('[id]');
    idElements.forEach(el => {
        if (el.id.length > 3) {
            info.mainIds.push(el.id);
        }
    });
    
    // 提取链接
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        if (link.href.includes('mp.weixin.qq.com')) {
            info.links.push({
                text: link.textContent.trim().substring(0, 20),
                href: link.href
            });
        }
    });
    
    return JSON.stringify(info, null, 2);
}
```

### Shadow DOM / Iframe 穿透

```javascript
// 递归提取 Shadow DOM 内容
function extractShadowDOM(root = document) {
    let content = '';
    
    // 提取当前层级文本
    content += root.body?.innerText || root.innerText || '';
    
    // 递归 Shadow Root
    const shadowHosts = root.querySelectorAll('*');
    shadowHosts.forEach(host => {
        if (host.shadowRoot) {
            content += '\n[Shadow DOM]\n';
            content += extractShadowDOM(host.shadowRoot);
        }
    });
    
    // 递归 Iframe
    const iframes = root.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
                content += '\n[Iframe]\n';
                content += extractShadowDOM(iframeDoc);
            }
        } catch (e) {
            // 跨域 iframe 无法访问
        }
    });
    
    return content;
}
```

---

## 使用示例

### 完整数据抓取

```javascript
// 一键提取所有数据
function extractAllData() {
    return JSON.stringify({
        homeData: extractHomeData(),
        articles: extractArticleList(10),
        boostQuota: extractBoostQuota(),
        timestamp: new Date().toISOString()
    }, null, 2);
}

// 调用方式（CDP /eval）:
// curl -X POST "http://localhost:3456/eval?target=ID" \
//   -d 'extractAllData()'
```

---

## 维护说明

### 选择器更新流程

1. **发现失效**: 数据提取为空或异常
2. **截图确认**: 查看页面实际结构
3. **DOM 探索**: 用 `explorePageStructure()` 分析
4. **更新选择器**: 修改对应函数
5. **验证测试**: 重新执行提取
6. **更新文档**: 标注更新日期

### 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v2026-03 | 2026-03-29 | 初始版本，适配最新 UI |

---

**注意**: 
- 公众号后台可能不定期改版
- 选择器失效时优先用文本匹配降级方案
- 定期验证所有提取函数的有效性
