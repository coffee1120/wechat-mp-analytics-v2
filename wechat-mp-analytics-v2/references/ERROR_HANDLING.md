# 错误处理与重试机制规范

**版本**: v2.1  
**创建时间**: 2026-04-03  
**适用技能**: wechat-mp-analytics-v2

---

## 📊 错误码定义

### 错误码分类

| 错误码 | 类别 | 含义 | 严重程度 |
|--------|------|------|---------|
| **E001** | 连接错误 | CDP 连接失败 | 🔴 高 |
| **E002** | 认证错误 | 登录态过期 | 🟡 中 |
| **E003** | 数据错误 | 选择器失效/数据为空 | 🟡 中 |
| **E004** | 网络错误 | 请求超时/失败 | 🟡 中 |
| **E005** | 格式错误 | 数据格式异常 | 🟢 低 |
| **E006** | 权限错误 | 无投流资格/页面 404 | 🟡 中 |
| **E007** | 资源错误 | 浏览器/内存不足 | 🔴 高 |

---

## 🔄 重试机制

### 重试策略总览

```javascript
// 伪代码示例
async function fetchWithRetry(operation, options = {}) {
    const {
        maxRetries = 3,           // 最大重试次数
        initialDelay = 1000,      // 初始延迟 (ms)
        maxDelay = 10000,         // 最大延迟 (ms)
        backoffMultiplier = 2,    // 退避倍数
        retryableErrors = ['E001', 'E004', 'E007']  // 可重试错误码
    } = options;
    
    let lastError = null;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[重试] 第 ${attempt}/${maxRetries} 次尝试`);
            return await operation();
        } catch (error) {
            lastError = error;
            
            // 检查是否为可重试错误
            if (!retryableErrors.includes(error.code)) {
                console.error(`[错误] 不可重试的错误：${error.code}`);
                throw error;
            }
            
            // 最后一次尝试失败
            if (attempt === maxRetries) {
                console.error(`[错误] 达到最大重试次数：${error.code}`);
                throw error;
            }
            
            // 指数退避等待
            console.log(`[等待] ${delay}ms 后重试...`);
            await sleep(delay);
            delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
    }
    
    throw lastError;
}
```

---

### 各类错误处理流程

#### E001: CDP 连接失败 🔴

**触发条件**:
- Chrome 未运行
- 调试端口未开放
- WebSocket 连接失败

**处理流程**:
```
1. 检查 Chrome 进程
   └─ 未运行 → 引导用户启动 Chrome
   └─ 已运行 → 继续

2. 检查调试端口 (9222, 9229, 9333)
   └─ 端口开放 → 尝试连接
   └─ 端口关闭 → 引导用户重启 Chrome（带调试参数）

3. 重试机制
   └─ 最多重试 3 次
   └─ 指数退避：1s → 2s → 4s

4. 降级方案
   └─ 3 次失败 → 告知用户手动操作
   └─ 提供详细配置指南
```

**错误处理代码**:
```javascript
async function checkCDPConnection() {
    const ports = [9222, 9229, 9333];
    
    for (const port of ports) {
        try {
            const connected = await testPort(port);
            if (connected) {
                console.log(`✅ CDP 端口 ${port} 可用`);
                return port;
            }
        } catch (error) {
            console.log(`⚠️ 端口 ${port} 不可用`);
        }
    }
    
    // 所有端口失败
    throw {
        code: 'E001',
        message: 'CDP 连接失败，未发现可用调试端口',
        suggestion: '请用以下方式启动 Chrome：\n"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222'
    };
}
```

---

#### E002: 登录态过期 🟡

**触发条件**:
- 页面跳转到登录页
- Cookie 失效
- Token 过期

**处理流程**:
```
1. 检测登录状态
   └─ 截图当前页面
   └─ 检查是否包含登录页特征

2. 告知用户
   └─ 发送截图
   └─ 提示"请微信扫码登录"

3. 等待用户确认
   └─ 等待用户说"已登录"
   └─ 刷新页面继续

4. 重试机制
   └─ 最多等待 5 分钟
   └─ 超时则终止任务
```

**错误处理代码**:
```javascript
async function checkLoginStatus(page) {
    const screenshot = await page.screenshot();
    const title = await page.title();
    
    // 检测登录页特征
    const isLoginPage = title.includes('登录') || 
                       title.includes('Login') ||
                       await page.$('#login-form') !== null;
    
    if (isLoginPage) {
        throw {
            code: 'E002',
            message: '登录态已过期，需要重新扫码登录',
            screenshot: screenshot,
            action: 'WAIT_FOR_USER',
            suggestion: '请微信扫码登录公众号后台，完成后告诉我"已登录"'
        };
    }
    
    return true;
}
```

---

#### E003: 选择器失效/数据为空 🟡

**触发条件**:
- 页面结构改版
- 选择器不匹配
- 数据未加载完成

**处理流程**:
```
1. 验证数据
   └─ 检查提取的数据是否为空
   └─ 检查数据格式是否正确

2. 截图确认
   └─ 截取当前页面
   └─ 分析 DOM 结构

3. 重试机制
   └─ 等待 3 秒重新加载
   └─ 最多重试 3 次

4. 降级方案
   └─ 3 次失败 → 使用备用选择器
   └─ 仍失败 → 截图报错 + 更新经验
```

**错误处理代码**:
```javascript
async function extractDataWithValidation(page, selectors) {
    const maxRetries = 3;
    
    for (let i = 0; i < maxRetries; i++) {
        // 等待数据加载
        await sleep(3000);
        
        // 执行提取
        const data = await page.evaluate(selectors);
        
        // 验证数据
        if (data && data.totalUsers && data.totalUsers.trim() !== '') {
            console.log('✅ 数据提取成功');
            return data;
        }
        
        console.log(`⚠️ 第 ${i+1} 次提取数据为空，重试...`);
        
        // 刷新页面
        await page.reload({ waitUntil: 'networkidle' });
    }
    
    // 所有重试失败
    const screenshot = await page.screenshot();
    throw {
        code: 'E003',
        message: '数据选择器失效，提取到的数据为空',
        screenshot: screenshot,
        suggestion: '页面可能已改版，需要更新选择器。已截图确认。'
    };
}
```

---

#### E004: 网络超时/失败 🟡

**触发条件**:
- 网络请求超时
- 服务器响应错误
- DNS 解析失败

**处理流程**:
```
1. 捕获网络错误
   └─ 记录错误详情
   └─ 检查错误类型

2. 重试机制
   └─ 最多重试 3 次
   └─ 指数退避：1s → 2s → 4s
   └─ 添加随机抖动（±20%）

3. 降级方案
   └─ 切换备用接口
   └─ 使用缓存数据（如有）
   └─ 告知用户稍后重试
```

**错误处理代码**:
```javascript
async function fetchWithRetry(url, options = {}) {
    const {
        maxRetries = 3,
        timeout = 10000,
        retryableStatuses = [408, 429, 500, 502, 503, 504]
    } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, { 
                timeout: timeout,
                ...options 
            });
            
            // 检查状态码
            if (response.ok) {
                return response;
            }
            
            // 检查是否可重试
            if (!retryableStatuses.includes(response.status)) {
                throw {
                    code: 'E004',
                    message: `HTTP 错误：${response.status}`,
                    status: response.status
                };
            }
            
            console.log(`⚠️ HTTP ${response.status}，准备重试...`);
            
        } catch (error) {
            // 网络错误
            if (attempt === maxRetries) {
                throw {
                    code: 'E004',
                    message: `网络请求失败：${error.message}`,
                    originalError: error
                };
            }
            
            // 指数退避 + 随机抖动
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            const jitter = delay * 0.2 * (Math.random() - 0.5);
            await sleep(delay + jitter);
        }
    }
}
```

---

#### E005: 数据格式异常 🟢

**触发条件**:
- JSON 解析失败
- 数据类型不匹配
- 必填字段缺失

**处理流程**:
```
1. 验证数据格式
   └─ JSON Schema 验证
   └─ 必填字段检查

2. 尝试修复
   └─ 类型转换（字符串→数字）
   └─ 默认值填充

3. 记录告警
   └─ 记录原始数据
   └─ 记录修复过程
```

**错误处理代码**:
```javascript
function validateAndFixData(data, schema) {
    const errors = [];
    const fixed = { ...data };
    
    // 必填字段检查
    for (const field of schema.required) {
        if (!(field in data)) {
            errors.push(`缺少必填字段：${field}`);
            
            // 尝试使用默认值
            if (schema.defaults && field in schema.defaults) {
                fixed[field] = schema.defaults[field];
                console.log(`⚠️ 字段 ${field} 缺失，使用默认值：${schema.defaults[field]}`);
            }
        }
    }
    
    // 类型检查与转换
    for (const [field, type] of Object.entries(schema.types)) {
        if (field in fixed && typeof fixed[field] !== type) {
            try {
                // 尝试类型转换
                if (type === 'number' && typeof fixed[field] === 'string') {
                    fixed[field] = parseFloat(fixed[field].replace(/,/g, ''));
                    console.log(`⚠️ 字段 ${field} 类型转换：string → number`);
                }
            } catch (e) {
                errors.push(`字段 ${field} 类型转换失败`);
            }
        }
    }
    
    if (errors.length > 0) {
        console.warn('⚠️ 数据验证警告:', errors);
    }
    
    return { data: fixed, errors };
}
```

---

#### E006: 权限错误/页面 404 🟡

**触发条件**:
- 无投流资格
- 页面不存在
- 账号权限不足

**处理流程**:
```
1. 检测错误页面
   └─ 检查 404/403 特征
   └─ 截图确认

2. 分析原因
   └─ 新号无资格？
   └─ Token 过期？
   └─ URL 错误？

3. 处理方案
   └─ 无资格 → 告知用户
   └─ Token 过期 → 刷新 Token
   └─ URL 错误 → 修正 URL
```

**错误处理代码**:
```javascript
async function handlePermissionError(page, url) {
    const statusCode = await page.evaluate(() => document.title);
    const content = await page.content();
    
    // 检测 404
    if (statusCode.includes('404') || content.includes('页面不存在')) {
        throw {
            code: 'E006',
            message: '页面不存在 (404)',
            url: url,
            suggestion: '请检查 URL 是否正确，或账号是否有访问权限'
        };
    }
    
    // 检测 403
    if (statusCode.includes('403') || content.includes('无权限')) {
        throw {
            code: 'E006',
            message: '无访问权限 (403)',
            url: url,
            suggestion: '该账号可能无投流资格，请确认账号权限'
        };
    }
    
    return true;
}
```

---

#### E007: 资源错误 🔴

**触发条件**:
- 浏览器内存不足
- Tab 数量超限
- 系统资源耗尽

**处理流程**:
```
1. 监控资源使用
   └─ 内存使用率
   └─ Tab 数量
   └─ CPU 使用率

2. 资源清理
   └─ 关闭无用 Tab
   └─ 释放内存
   └─ 垃圾回收

3. 降级方案
   └─ 串行执行（替代并行）
   └─ 分批处理
   └─ 告知用户稍后重试
```

**错误处理代码**:
```javascript
async function checkResourceUsage() {
    const tabs = await browser.targets();
    const tabCount = tabs.length;
    
    // Tab 数量限制
    if (tabCount > 10) {
        console.warn(`⚠️ Tab 数量过多 (${tabCount})，清理中...`);
        
        // 关闭非关键 Tab
        for (const tab of tabs) {
            const url = (await tab.page()).url();
            if (!url.includes('mp.weixin.qq.com')) {
                await tab.close();
            }
        }
    }
    
    // 内存检查（通过系统命令）
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 1.5 * 1024 * 1024 * 1024) { // 1.5GB
        console.warn('⚠️ 内存使用过高，触发垃圾回收...');
        global.gc(); // 需 --expose-gc 参数
    }
}
```

---

## 📋 错误处理检查清单

### 任务执行前

- [ ] 检查 CDP 连接可用性
- [ ] 检查 Chrome 运行状态
- [ ] 检查调试端口开放
- [ ] 检查资源使用（Tab 数量、内存）

### 任务执行中

- [ ] 每步操作捕获异常
- [ ] 关键步骤截图留证
- [ ] 记录错误码和详情
- [ ] 执行重试逻辑

### 任务执行后

- [ ] 验证数据完整性
- [ ] 记录执行日志
- [ ] 更新站点经验（如有新错误）
- [ ] 关闭无用 Tab 释放资源

---

## 📊 错误统计与监控

### 错误率计算

```javascript
// 错误率统计
const errorStats = {
    total: 100,        // 总任务数
    success: 95,       // 成功数
    errors: {          // 错误分布
        'E001': 2,
        'E002': 2,
        'E003': 1
    },
    errorRate: 5 / 100 // 错误率 5%
};
```

### 告警阈值

| 指标 | 阈值 | 告警级别 |
|------|------|---------|
| 错误率 | >10% | 🟡 警告 |
| 错误率 | >20% | 🔴 严重 |
| E001 连续发生 | >3 次 | 🔴 严重 |
| 平均执行时间 | >10 分钟 | 🟡 警告 |

---

## 🔧 调试工具

### 错误复现脚本

```powershell
# 测试 CDP 连接错误
.\scripts\test-errors.ps1 -error E001

# 测试重试机制
.\scripts\test-retry.ps1 -maxRetries 3

# 查看错误日志
Get-Content "logs\error-2026-04-03.log" -Tail 50
```

### 日志分析

```javascript
// 错误日志格式
{
    "timestamp": "2026-04-03T11:30:00Z",
    "code": "E001",
    "message": "CDP 连接失败",
    "context": {
        "url": "https://mp.weixin.qq.com/",
        "attempt": 3,
        "ports": [9222, 9229, 9333]
    },
    "stack": "...",
    "resolution": "引导用户重启 Chrome"
}
```

---

*创建时间：2026-04-03*  
*版本：v2.1*  
*适用技能：wechat-mp-analytics-v2*
