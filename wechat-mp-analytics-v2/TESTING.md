# 测试与依赖管理文档

**版本**: v2.1  
**创建时间**: 2026-04-03  
**适用技能**: wechat-mp-analytics-v2

---

## 📦 依赖管理

### 系统依赖

| 依赖 | 最低版本 | 推荐版本 | 检查命令 |
|------|---------|---------|---------|
| **Node.js** | v18.0.0 | v20.x | `node --version` |
| **npm** | v9.0.0 | v10.x | `npm --version` |
| **Chrome** | v100 | v120+ | `chrome --version` |
| **PowerShell** | v5.1 | v7.x | `$PSVersionTable.PSVersion` |

### Node.js 依赖

**生产依赖**:
```json
{
  "puppeteer-core": "^21.0.0",  // CDP 浏览器控制
  "node-fetch": "^3.3.0",        // HTTP 请求
  "ws": "^8.14.0"                // WebSocket 支持
}
```

**开发依赖**:
```json
{
  "jest": "^29.7.0",             // 测试框架
  "eslint": "^8.50.0",           // 代码检查
  "jest-puppeteer": "^9.0.0"     // Puppeteer 测试支持
}
```

---

## 🧪 测试套件

### 测试文件结构

```
tests/
├── unit/                      # 单元测试
│   └── test-selectors.test.js # 选择器测试
├── integration/               # 集成测试
│   └── test-cdp.test.js       # CDP 连接测试
├── fixtures/                  # 测试数据
│   └── sample-data.json       # 样本数据
└── README.md                  # 测试文档
```

### 运行测试

**安装依赖**:
```bash
npm install
```

**运行所有测试**:
```bash
npm test
```

**运行单元测试**:
```bash
npm run test:unit
```

**运行集成测试**:
```bash
npm run test:integration
```

**生成覆盖率报告**:
```bash
npm run test:coverage
```

### 测试覆盖率目标

| 指标 | 目标 | 当前 |
|------|------|------|
| **语句覆盖率** | 50% | - |
| **分支覆盖率** | 50% | - |
| **函数覆盖率** | 50% | - |
| **行覆盖率** | 50% | - |

---

## 🔧 环境检查

### 自动检查脚本

**PowerShell**:
```powershell
cd D:\obsidian\工作\60-系统\skills\wechat-mp-analytics-v2
powershell -ExecutionPolicy Bypass -File scripts/check-env.ps1
```

**预期输出**:
```
========================================
 wechat-mp-analytics-v2 环境检查
========================================

1. 检查 Node.js 版本...
   ✅ Node.js 版本：v20.11.0

2. 检查 npm 版本...
   ✅ npm 版本：10.2.4

3. 检查 Chrome 浏览器...
   ✅ Chrome 已安装：C:\Program Files\Google\Chrome\Application\chrome.exe
      版本：Chrome 120.0.6099.130

4. 检查 Chrome 调试端口...
   ✅ 调试端口 9222 已开放

5. 检查 Node.js 依赖包...
   ✅ node_modules 目录存在
      ✅ puppeteer-core 已安装
      ✅ node-fetch 已安装
      ✅ ws 已安装

6. 检查文件结构...
   ✅ SKILL.md
   ✅ package.json
   ✅ references/mp-selectors.js
   ✅ references/site-patterns/mp-weixin-com.md
   ✅ references/ERROR_HANDLING.md

7. 检查测试文件...
   ✅ tests/unit/test-selectors.test.js
   ✅ tests/integration/test-cdp.test.js
   ✅ tests/fixtures/sample-data.json

========================================
 ✅ 环境检查通过！
========================================
```

### 手动检查清单

- [ ] Node.js v18+ 已安装
- [ ] npm v9+ 已安装
- [ ] Chrome 浏览器已安装
- [ ] Chrome 调试端口已开放（9222）
- [ ] node_modules 目录存在
- [ ] 所有必要文件存在
- [ ] 测试文件存在

---

## 📝 测试用例说明

### 单元测试 - test-selectors.test.js

**测试内容**:
1. `extractHomeData()` - 首页数据提取
   - ✅ 正确提取核心数据
   - ✅ 处理缺失的元素

2. `extractArticleList()` - 文章列表提取
   - ✅ 正确提取文章列表
   - ✅ 处理空列表

3. `extractBoostQuota()` - 投流额度提取
   - ✅ 正确提取额度数据
   - ✅ 处理缺失的数据

4. `validateData()` - 数据验证
   - ✅ 验证数据完整性
   - ✅ 检测缺失字段
   - ✅ 处理空数据
   - ✅ 处理非对象数据

5. `parseNumber()` - 数字格式化
   - ✅ 移除千位分隔符
   - ✅ 处理非数字字符串
   - ✅ 处理空字符串

### 集成测试 - test-cdp.test.js

**测试内容**:
1. **端口检测** - 检测开放的调试端口
2. **健康检查** - CDP Proxy 响应测试
3. **错误处理** - 连接超时和无效端口处理
4. **数据提取** - 完整页面数据提取流程
5. **登录态检测** - 登录页识别
6. **重试机制** - 指数退避策略验证

---

## 🐛 故障排查

### 常见问题

#### Q1: npm install 失败

**错误**:
```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path package.json
```

**解决**:
```bash
# 确认当前目录
cd D:\obsidian\工作\60-系统\skills\wechat-mp-analytics-v2

# 检查 package.json 是否存在
ls package.json

# 重新安装
npm install
```

---

#### Q2: 测试失败 - Cannot find module

**错误**:
```
Cannot find module '../references/mp-selectors.js'
```

**解决**:
```bash
# 检查文件是否存在
ls references/mp-selectors.js

# 检查路径是否正确
# 确保从 tests/ 目录能访问 references/
```

---

#### Q3: Chrome 调试端口未开放

**错误**:
```
⚠️ 未发现开放的调试端口
```

**解决**:
```powershell
# 关闭所有 Chrome 进程
taskkill /F /IM chrome.exe

# 重启 Chrome（带调试参数）
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

---

#### Q4: 测试超时

**错误**:
```
Error: Timeout - Async callback was not invoked within 10000ms
```

**解决**:
```javascript
// 增加超时时间
jest.setTimeout(30000);

// 或检查异步代码是否正确
test('async test', async () => {
    await someAsyncOperation();
    expect(result).toBe(expected);
});
```

---

## 📊 持续集成

### CI/CD 配置示例（GitHub Actions）

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run tests
      run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

---

## 🎯 最佳实践

### 编写测试

1. **命名规范**
   ```javascript
   describe('功能模块', () => {
       test('应该正确处理正常情况', () => {});
       test('应该正确处理边界情况', () => {});
       test('应该正确处理错误情况', () => {});
   });
   ```

2. **测试数据**
   - 使用 fixtures/ 目录存放测试数据
   - 测试数据应该覆盖正常、边界、错误情况

3. **断言选择**
   ```javascript
   // 好的断言
   expect(result).toEqual({ key: 'value' });
   expect(result.length).toBeGreaterThan(0);
   
   // 避免的断言
   expect(JSON.stringify(result)).toBe('...');
   ```

### 依赖管理

1. **版本锁定**
   - 使用 package-lock.json 锁定版本
   - 定期更新依赖（npm update）

2. **依赖审查**
   - 定期运行 `npm audit`
   - 及时修复安全漏洞

3. **可选依赖**
   - 将非必需依赖放入 optionalDependencies
   - 在代码中优雅处理缺失情况

---

*创建时间：2026-04-03*  
*版本：v2.1*  
*维护人：Moss*
