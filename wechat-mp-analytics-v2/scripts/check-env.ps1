# PowerShell 环境检查脚本
# 检查运行 wechat-mp-analytics-v2 所需的环境

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " wechat-mp-analytics-v2 环境检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# 1. 检查 Node.js 版本
Write-Host "1. 检查 Node.js 版本..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    if ($nodeVersion -match 'v(\d+)\.') {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -ge 18) {
            Write-Host "   ✅ Node.js 版本：$nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Node.js 版本过低 (需要 v18+, 当前：$nodeVersion)" -ForegroundColor Red
            $allPassed = $false
        }
    } else {
        Write-Host "   ❌ 无法解析 Node.js 版本" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ 未安装 Node.js" -ForegroundColor Red
    Write-Host "      请安装 Node.js v18+: https://nodejs.org/" -ForegroundColor Yellow
    $allPassed = $false
}
Write-Host ""

# 2. 检查 npm 版本
Write-Host "2. 检查 npm 版本..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    if ($npmVersion -match '(\d+)\.') {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -ge 9) {
            Write-Host "   ✅ npm 版本：$npmVersion" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  npm 版本建议升级 (推荐 v9+, 当前：$npmVersion)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ⚠️  npm 未安装或无法访问" -ForegroundColor Yellow
}
Write-Host ""

# 3. 检查 Chrome 浏览器
Write-Host "3. 检查 Chrome 浏览器..." -ForegroundColor Yellow
$chromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chromeFound = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromeFound = $true
        Write-Host "   ✅ Chrome 已安装：$path" -ForegroundColor Green
        
        # 检查 Chrome 版本
        try {
            $chromeVersion = & $path --version
            Write-Host "      版本：$chromeVersion" -ForegroundColor Gray
        } catch {
            # 忽略版本检查错误
        }
        break
    }
}

if (-not $chromeFound) {
    Write-Host "   ❌ 未找到 Chrome 浏览器" -ForegroundColor Red
    Write-Host "      请安装 Chrome: https://www.google.com/chrome/" -ForegroundColor Yellow
    $allPassed = $false
}
Write-Host ""

# 4. 检查调试端口
Write-Host "4. 检查 Chrome 调试端口..." -ForegroundColor Yellow
$ports = @(9222, 9229, 9333)
$portFound = $false

foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect("127.0.0.1", $port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne(2000)
        
        if ($wait) {
            $tcpClient.EndConnect($asyncResult)
            Write-Host "   ✅ 调试端口 $port 已开放" -ForegroundColor Green
            $portFound = $true
        }
        $tcpClient.Close()
    } catch {
        # 端口未开放
    }
}

if (-not $portFound) {
    Write-Host "   ⚠️ 未发现开放的调试端口" -ForegroundColor Yellow
    Write-Host "      启动 Chrome 时请添加参数：--remote-debugging-port=9222" -ForegroundColor Gray
}
Write-Host ""

# 5. 检查依赖包
Write-Host "5. 检查 Node.js 依赖包..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules 目录存在" -ForegroundColor Green
    
    # 检查关键依赖
    $requiredPackages = @("puppeteer-core", "node-fetch", "ws")
    foreach ($pkg in $requiredPackages) {
        $pkgPath = "node_modules\$pkg"
        if (Test-Path $pkgPath) {
            Write-Host "      ✅ $pkg 已安装" -ForegroundColor Green
        } else {
            Write-Host "      ⚠️  $pkg 未安装" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠️  node_modules 目录不存在" -ForegroundColor Yellow
    Write-Host "      运行 'npm install' 安装依赖" -ForegroundColor Gray
}
Write-Host ""

# 6. 检查文件结构
Write-Host "6. 检查文件结构..." -ForegroundColor Yellow
$requiredFiles = @(
    "SKILL.md",
    "package.json",
    "references/mp-selectors.js",
    "references/site-patterns/mp-weixin-com.md",
    "references/ERROR_HANDLING.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file 缺失" -ForegroundColor Red
        $allPassed = $false
    }
}
Write-Host ""

# 7. 检查测试文件
Write-Host "7. 检查测试文件..." -ForegroundColor Yellow
$testFiles = @(
    "tests/unit/test-selectors.test.js",
    "tests/integration/test-cdp.test.js",
    "tests/fixtures/sample-data.json"
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $file 缺失" -ForegroundColor Yellow
    }
}
Write-Host ""

# 总结
Write-Host "========================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ✅ 环境检查通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "可以运行以下命令开始使用：" -ForegroundColor White
    Write-Host "   npm install          # 安装依赖" -ForegroundColor Gray
    Write-Host "   npm test             # 运行测试" -ForegroundColor Gray
    Write-Host "   npm run check-env    # 再次检查环境" -ForegroundColor Gray
} else {
    Write-Host " ❌ 环境检查失败，请修复上述问题" -ForegroundColor Red
    Write-Host ""
    Write-Host "修复后重新运行：powershell -ExecutionPolicy Bypass -File scripts/check-env.ps1" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $($allPassed ? 0 : 1)
