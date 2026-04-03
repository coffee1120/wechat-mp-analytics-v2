---
name: wechat-mp-analytics-v2
description: 微信公众号数据抓取与投流管理（增强版）。集成 CDP 浏览器控制、经验沉淀、并行分治能力。当用户要求拉取公众号数据、更新数据看板、查看投流额度、竞品分析时使用此 skill。
metadata:
  author: Moss
  version: "2.1.0"
  base: wechat-mp-analytics + web-access patterns
  updated: 2026-04-03
---

# 微信公众号数据抓取与投流管理（增强版）

## 前置检查

### CDP 模式可用性检查

在开始操作前，先检查 Chrome CDP 连接：

```powershell
# Windows PowerShell
$chromePorts = 9222, 9229, 9333
foreach ($port in $chromePorts) {
    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $tcp.ConnectAsync("127.0.0.1", $port).Wait(2000)
        Write-Host "发现 Chrome 调试端口：$port"
        return $port
    } catch {
        # 端口未开放
    } finally {
        $tcp.Dispose()
    }
}
Write-Host "未发现 Chrome 调试端口，请用以下方式启动 Chrome："
Write-Host "  `"C:\Program Files\Google\Chrome\Application\chrome.exe`" --remote-debugging-port=9222"
```

**配置步骤：**
1. Chrome 地址栏打开 `chrome://inspect/#remote-debugging`
2. 勾选 **"Allow remote debugging for this browser instance"**
3. 如需重启 Chrome，关闭后重新用上述命令启动

---

## 浏览哲学

**像人一样思考，高效完成公众号数据抓取任务。**

### 四步循环

**① 定义成功标准**
- 用户要什么数据？（昨日数据/投流额度/竞品分析）
- 什么算完成？（数据已抓取 + 已归档 + 已更新看板）

**② 选择起点**
- 公众号后台 → 直接 CDP（需登录态）
- 已知 URL → 直接导航
- 未知入口 → 搜索后导航

**③ 过程校验**
- 每一步都是证据（不只是成功/失败）
- 登录墙挡住目标内容？→ 告知用户扫码
- 页面元素缺失？→ 检查选择器或等待加载
- 数据异常？→ 截图确认或重试

**④ 完成判断**
- 对照成功标准确认完成
- 不为了"完整"而过度操作
- 关闭自创 Tab，保持环境整洁

---

## 工具选择策略

| 场景 | 工具 | 说明 |
|------|------|------|
| 公众号后台数据 | **CDP 浏览器** | 需登录态，动态页面 |
| 投流额度页面 | **CDP 浏览器** | 需登录态，动态加载 |
| 竞品公众号文章 | **CDP 浏览器** | 公开内容但反爬 |
| 行业新闻搜索 | **WebSearch + CDP** | 先搜索发现，后 CDP 读取 |
| 公开文章链接 | **WebFetch/Jina** | 无需登录，节省 token |

**Jina 预处理**（节省 token）：
```
r.jina.ai/https://mp.weixin.qq.com/s/xxx
```
适合：公开文章快速读取
不适合：后台数据、需登录内容

---

## CDP 浏览器操作

### 启动 CDP Proxy

创建代理脚本 `~/.openclaw/skills/wechat-mp-analytics-v2/scripts/cdp-proxy.ps1`：

```powershell
# CDP Proxy - PowerShell 简化版
# 通过 HTTP API 操控用户 Chrome

$PORT = 3456
$chromePort = 9222

# 启动 HTTP 监听
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$PORT/")
$listener.Start()

Write-Host "CDP Proxy 运行在 http://localhost:$PORT"

# Chrome WebSocket 连接（简化：直接调用 browser 工具）
# 完整实现参考 web-access 的 cdp-proxy.mjs

while ($true) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    
    $path = $req.Url.AbsolutePath
    
    if ($path -eq "/health") {
        $json = @{ status = "ok"; connected = $true } | ConvertTo-Json
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    elseif ($path -eq "/new") {
        $url = $req.QueryString["url"]
        # 调用 browser.open() - 这里简化，实际需集成
        $json = @{ targetId = "mock"; url = $url } | ConvertTo-Json
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
        $res.ContentLength64 = $buffer.Length
        $res.OutputStream.Write($buffer, 0, $buffer.Length)
    }
    # ... 其他 API 端点
    
    $res.OutputStream.Close()
}
```

### Proxy API 端点

```bash
# 健康检查
curl http://localhost:3456/health

# 列出所有 Tab
curl http://localhost:3456/targets

# 创建新后台 Tab
curl "http://localhost:3456/new?url=https://mp.weixin.qq.com/"

# 页面截图
curl "http://localhost:3456/screenshot?target=ID&file=/tmp/shot.png"

# 执行 JS 提取数据
curl -X POST "http://localhost:3456/eval?target=ID" -d 'document.title'

# 点击元素
curl -X POST "http://localhost:3456/click?target=ID" -d '.menu-item'

# 关闭 Tab
curl "http://localhost:3456/close?target=ID"
```

### 公众号后台专用选择器

```javascript
// 数据提取 JS 片段（存入 references/mp-selectors.js）

// 提取首页核心数据
function extractHomeData() {
    return {
        totalUsers: document.querySelector('[data-testid="total-users"]')?.textContent || '',
        yesterdayRead: document.querySelector('[data-testid="yesterday-read"]')?.textContent || '',
        yesterdayShare: document.querySelector('[data-testid="yesterday-share"]')?.textContent || '',
        yesterdayFollow: document.querySelector('[data-testid="yesterday-follow"]')?.textContent || ''
    };
}

// 提取文章列表
function extractArticleList() {
    const articles = [];
    document.querySelectorAll('.article-item').forEach(el => {
        articles.push({
            title: el.querySelector('.title')?.textContent || '',
            date: el.querySelector('.date')?.textContent || '',
            read: el.querySelector('.read-count')?.textContent || '',
            share: el.querySelector('.share-count')?.textContent || ''
        });
    });
    return articles;
}

// 提取投流额度
function extractBoostQuota() {
    return {
        availableExposure: document.querySelector('[data-testid="available-exposure"]')?.textContent || '',
        availableIncentive: document.querySelector('[data-testid="available-incentive"]')?.textContent || '',
        expiringSoon: document.querySelector('[data-testid="expiring-soon"]')?.textContent || ''
    };
}
```

---

## 经验沉淀机制

### 站点经验文件结构

创建 `references/site-patterns/mp-weixin-com.md`：

```markdown
---
domain: mp.weixin.qq.com
aliases: [微信公众号后台，公众号后台]
updated: 2026-03-29
---

## 平台特征

- **登录方式**: 微信扫码（无法绕过）
- **会话保持**: 约 2 小时，超时需重新扫码
- **反爬级别**: 中等（CDP 模式可绕过）
- **页面加载**: 动态渲染，需等待 JS 执行
- **数据更新**: 实时，但昨日数据在次日 0 点后更新

## 有效模式

### URL 模式
- 首页：`https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token={token}`
- 内容助推：`https://mp.weixin.qq.com/cgi-bin/mptrafficboost?action=dashboard&token={token}`
- 数据分析：`https://mp.weixin.qq.com/cgi-bin/rpt?token={token}`

### Token 获取
- token 在登录后的 URL 参数中
- token 有效期约 2 小时
- 失效后需重新登录获取

### 数据选择器（2026-03 验证）
- 总用户数：`[data-testid="total-users"]`
- 昨日阅读：`[data-testid="yesterday-read"]`
- 昨日分享：`[data-testid="yesterday-share"]`
- 文章列表：`.article-item`

## 已知陷阱

### 1. 登录态过期
**现象**: 页面跳转到登录页
**解决**: 告知用户扫码，不要尝试自动登录

### 2. 数据延迟
**现象**: 昨日数据与实际不符
**原因**: 平台在次日 2:00-6:00 间更新
**解决**: 提示用户数据可能不完整，建议 8:00 后查询

### 3. 选择器失效
**现象**: 提取到的数据为空
**原因**: 公众号后台改版
**解决**: 截图确认页面结构，更新选择器

### 4. 投流页面 404
**现象**: 访问内容助推页面报错
**原因**: 新号无投流资格或 token 过期
**解决**: 检查账号资格，刷新 token

## 操作策略

### 最佳实践
1. 先检查登录态（截图首页）
2. 直接导航到目标页面（不点击菜单）
3. 等待 3 秒让数据加载完成
4. 执行 JS 提取数据
5. 关闭自创 Tab

### 避免操作
- ❌ 频繁刷新（可能触发风控）
- ❌ 并发打开超过 5 个 Tab（可能被限流）
- ❌ 尝试自动扫码（安全风险）
```

### 经验更新流程

每次操作后，如果发现新信息：

1. **读取现有经验**: `read references/site-patterns/mp-weixin-com.md`
2. **验证新发现**: 确认操作有效
3. **更新经验文件**: 添加日期标注
4. **标记重要性**: 关键信息置顶

---

## 并行分治策略

### 适合分治的场景

| 场景 | 分治方式 | 收益 |
|------|----------|------|
| 同时查 N 个竞品公众号 | N 个子 Agent 并行 | 速度提升 N 倍 |
| 抓取 10+ 行业网站 | 分组并行（每组 3-5 个） | Token 优化 |
| 多篇文章数据分析 | 单 Agent 串行（数据量小） | 不分治 |

### 子 Agent Prompt 模板

```markdown
你是一个公众号数据分析助手。

**任务目标**:
获取竞品公众号「{公众号名称}」的最新文章数据，包括：
- 近 7 天发布文章数量
- 每篇文章的阅读量、点赞数、分享数
- 找出阅读量最高的文章

**要求**:
1. 必须加载 wechat-mp-analytics-v2 skill 并遵循指引
2. 使用 CDP 浏览器访问（需登录态）
3. 只返回结构化数据，不返回过程描述
4. 任务结束后关闭自创 Tab

**输出格式**:
```json
{
  "account": "公众号名称",
  "articles": [
    {"title": "...", "date": "...", "read": "...", "like": "..."}
  ],
  "topArticle": {"title": "...", "read": "..."}
}
```
```

### 分治判断标准

**启动分治前检查**:
```
1. 任务是否包含多个独立目标？→ 是 → 考虑分治
2. 每个子任务是否需要 CDP 浏览器？→ 是 → 分治收益高
3. 子任务数量是否 > 3？→ 是 → 必须分治
4. 主 Agent 上下文是否紧张？→ 是 → 分治保护上下文
```

---

## 数据抓取流程

### 标准流程（单任务）

```
1. 检查 CDP 可用性
   └─ 失败 → 引导用户配置 Chrome
   └─ 成功 → 继续

2. 启动/确认 CDP Proxy 运行

3. 创建后台 Tab 打开公众号后台
   └─ browser.navigate("https://mp.weixin.qq.com/")

4. 等待用户扫码登录（如未登录）
   └─ 截图确认登录状态

5. 导航到目标页面
   └─ 首页：/cgi-bin/home
   └─ 投流：/cgi-bin/mptrafficboost?action=dashboard

6. 等待数据加载（delay 3 秒）

7. 截图 + 执行 JS 提取数据

8. 数据写入
   └─ Obsidian: D:\obsidian\工作\30-数据看板\
   └─ HEARTBEAT.md 更新

9. 关闭自创 Tab

10. 更新站点经验（如有新发现）
```

### 并行流程（多任务）

```
1. 主 Agent 接收任务（查 N 个竞品）

2. 分治判断 → 适合分治

3. 为每个竞品创建子 Agent
   └─ sessions_spawn(runtime="subagent", mode="run")
   └─ Prompt: 目标导向，不指定步骤

4. 子 Agent 并行执行
   └─ 各自创建后台 Tab
   └─ 互不干扰

5. 主 Agent 收集汇总结果

6. 统一写入数据看板

7. 所有子 Agent 关闭 Tab
```

---

## 数据写入规则

### Obsidian 路径

```
D:\obsidian\工作\30-数据看板\
├── 昨日数据\
│   └── YYYY-MM-DD.md
├── 文章数据\
│   └── {文章标题}.md
├── 投流记录\
│   └── YYYY-MM-投流记录.md
└── 数据看板.md
```

### 数据看板更新板块

```markdown
## 💰 投流额度管理

### 可用额度（{日期} 更新）

| 项目 | 数值 | 说明 |
|------|------|------|
| 可用曝光 | {X} 次 | 总可用曝光次数 |
| 可用激励 | {X} 个 | 未使用的激励数量 |
| 即将过期 | {X} 个 | ⚠️ 需优先使用 |

### 历史助推记录

| 文章 | 状态 | 开始时间 | 额度 | 曝光 | ROI |
|------|------|----------|------|------|-----|
| ... | ... | ... | ... | ... | ... |

### 激励详情

| 来源 | 额度 | 到期时间 | 状态 | 优先级 |
|------|------|----------|------|--------|
| 被分享 10 次 | 300 | {日期} | 未使用 | 🔴 高 |
```

---

## 反爬对抗策略

### 公众号后台反爬特征

| 特征 | 应对策略 |
|------|----------|
| 登录墙 | CDP 模式 + 用户扫码 |
| Token 验证 | 从登录态 Cookie 自动获取 |
| 请求频率限制 | 单次任务不超过 10 次请求 |
| 动态选择器 | 经验沉淀 + 定期更新 |

### 降级策略

```
CDP 失败 → 截图报错 → 告知用户手动导出
WebFetch 失败 → 切换 CDP
搜索失败 → 直接导航官网
```

---

## 常见问题处理

### Q1: CDP 连接失败

```powershell
# 检查 Chrome 是否运行
Get-Process chrome -ErrorAction SilentlyContinue

# 检查调试端口
netstat -ano | findstr 9222

# 重启 Chrome（带调试参数）
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  -ArgumentList "--remote-debugging-port=9222"
```

### Q2: 登录态过期

1. 截图登录页
2. 告知用户："请微信扫码登录公众号后台"
3. 等待用户确认"已登录"
4. 刷新页面继续

### Q3: 数据选择器失效

1. 截图当前页面
2. 分析新 DOM 结构
3. 更新 `references/mp-selectors.js`
4. 更新站点经验文件

### Q4: 子 Agent 卡住

```powershell
# 检查子 Agent 状态
sessions_list

# 超时处理（>5 分钟无进展）
subagents action=kill target={sessionId}

# 降级为串行执行
```

---

## 触发时机

| 时机 | 触发方式 |
|------|----------|
| 用户主动请求 | "拉取公众号数据" |
| 查看投流额度 | "查看投流额度" |
| 竞品分析 | "分析竞品 XXX" |
| 定时任务 | 每周五 17:30 |
| 文章发布后 | 发布后次日 |

---

## 相关文档

- 数据看板：`D:\obsidian\工作\30-数据看板\数据看板.md`
- HEARTBEAT: `C:\Users\EDY\.openclaw\workspace\HEARTBEAT.md`
- 站点经验：`references/site-patterns/mp-weixin-com.md`
- 选择器库：`references/mp-selectors.js`

---

**创建时间**: 2026-03-29
**版本**: 2.0 (集成 CDP + 经验沉淀 + 并行分治)
**基础**: wechat-mp-analytics + web-access patterns
