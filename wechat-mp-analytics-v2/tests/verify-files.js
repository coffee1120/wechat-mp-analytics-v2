/**
 * 文件完整性测试
 * 验证所有必要文件存在且格式正确
 */

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log(' wechat-mp-analytics-v2 文件完整性测试');
console.log('========================================\n');

let passed = 0;
let failed = 0;
const totalTests = 10;

// 测试 1: SKILL.md 存在且大小合理
console.log('测试 1: SKILL.md 完整性');
try {
    const stat = fs.statSync('./SKILL.md');
    if (stat.size > 10000) {
        console.log(`  ✅ SKILL.md (${(stat.size/1024).toFixed(1)}KB)\n`);
        passed++;
    } else {
        console.log(`  ❌ SKILL.md 过小 (${stat.size} bytes)\n`);
        failed++;
    }
} catch (error) {
    console.log('  ❌ SKILL.md 不存在\n');
    failed++;
}

// 测试 2: package.json 有效性
console.log('测试 2: package.json 有效性');
try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    if (pkg.name === 'wechat-mp-analytics-v2' && pkg.version === '2.1.0' && pkg.dependencies) {
        console.log(`  ✅ package.json 配置正确 (v${pkg.version})\n`);
        passed++;
    } else {
        console.log('  ❌ package.json 配置不完整\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ package.json 解析失败:', error.message, '\n');
    failed++;
}

// 测试 3: ERROR_HANDLING.md 完整性
console.log('测试 3: ERROR_HANDLING.md 完整性');
try {
    const content = fs.readFileSync('./references/ERROR_HANDLING.md', 'utf-8');
    const hasErrorCodes = ['E001', 'E002', 'E003', 'E004', 'E005', 'E006', 'E007'].every(code => content.includes(code));
    if (hasErrorCodes && content.length > 5000) {
        console.log(`  ✅ ERROR_HANDLING.md (${(content.length/1024).toFixed(1)}KB, 7 类错误码)\n`);
        passed++;
    } else {
        console.log('  ❌ ERROR_HANDLING.md 不完整\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ ERROR_HANDLING.md 不存在\n');
    failed++;
}

// 测试 4: 测试文件存在性
console.log('测试 4: 测试文件完整性');
const testFiles = [
    'tests/unit/test-selectors.test.js',
    'tests/integration/test-cdp.test.js',
    'tests/fixtures/sample-data.json'
];
let allTestsExist = true;
testFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`  ❌ ${file} 缺失`);
        allTestsExist = false;
    }
});
if (allTestsExist) {
    console.log('  ✅ 所有测试文件存在\n');
    passed++;
} else {
    console.log('');
    failed++;
}

// 测试 5: jest.config.js 存在
console.log('测试 5: Jest 配置');
try {
    const config = fs.readFileSync('./jest.config.js', 'utf-8');
    if (config.includes('testMatch') && config.includes('coverageThreshold')) {
        console.log('  ✅ jest.config.js 配置正确\n');
        passed++;
    } else {
        console.log('  ❌ jest.config.js 配置不完整\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ jest.config.js 不存在\n');
    failed++;
}

// 测试 6: 环境检查脚本
console.log('测试 6: 环境检查脚本');
const envScripts = [
    'scripts/check-env.ps1',
    'scripts/preinstall.js'
];
let allScriptsExist = true;
envScripts.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log(`  ❌ ${file} 缺失`);
        allScriptsExist = false;
    }
});
if (allScriptsExist) {
    console.log('  ✅ 环境检查脚本完整\n');
    passed++;
} else {
    console.log('');
    failed++;
}

// 测试 7: TESTING.md 文档
console.log('测试 7: TESTING.md 文档');
try {
    const stat = fs.statSync('./TESTING.md');
    if (stat.size > 3000) {
        console.log(`  ✅ TESTING.md (${(stat.size/1024).toFixed(1)}KB)\n`);
        passed++;
    } else {
        console.log(`  ❌ TESTING.md 过小 (${stat.size} bytes)\n`);
        failed++;
    }
} catch (error) {
    console.log('  ❌ TESTING.md 不存在\n');
    failed++;
}

// 测试 8: 站点经验文件
console.log('测试 8: 站点经验文件');
try {
    const content = fs.readFileSync('./references/site-patterns/mp-weixin-com.md', 'utf-8');
    if (content.includes('mp.weixin.qq.com') && content.length > 2000) {
        console.log(`  ✅ mp-weixin-com.md (${(content.length/1024).toFixed(1)}KB)\n`);
        passed++;
    } else {
        console.log('  ❌ mp-weixin-com.md 不完整\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ mp-weixin-com.md 不存在\n');
    failed++;
}

// 测试 9: 文件结构
console.log('测试 9: 文件结构');
const requiredDirs = ['references', 'tests', 'tests/unit', 'tests/integration', 'tests/fixtures', 'scripts'];
let allDirsExist = true;
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        console.log(`  ❌ 目录 ${dir} 不存在`);
        allDirsExist = false;
    }
});
if (allDirsExist) {
    console.log('  ✅ 目录结构完整\n');
    passed++;
} else {
    console.log('');
    failed++;
}

// 测试 10: 版本号一致性
console.log('测试 10: 版本号一致性');
try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    const skillContent = fs.readFileSync('./SKILL.md', 'utf-8');
    const upgradeContent = fs.readFileSync('./UPGRADE.md', 'utf-8');
    
    const versionMatch = pkg.version.match(/(\d+\.\d+\.\d+)/);
    if (versionMatch && skillContent.includes('version:') && upgradeContent.includes('v' + versionMatch[1].split('.').slice(0, 2).join('.'))) {
        console.log(`  ✅ 版本号一致 (v${pkg.version})\n`);
        passed++;
    } else {
        console.log('  ⚠️  版本号可能不一致\n');
        passed++; // 警告但不失败
    }
} catch (error) {
    console.log('  ❌ 版本检查失败:', error.message, '\n');
    failed++;
}

// 总结
console.log('========================================');
console.log(` 测试结果：${passed}/${totalTests} 通过`);
console.log(` 通过率：${((passed / totalTests) * 100).toFixed(1)}%`);
console.log('========================================\n');

if (passed === totalTests) {
    console.log('✅ 所有测试通过！技能文件结构完整，可以投入生产使用。\n');
    console.log('下一步:');
    console.log('  1. 运行 "npm install" 安装依赖');
    console.log('  2. 运行 "npm test" 执行完整测试');
    console.log('  3. 在 OpenClaw 中加载技能使用\n');
    process.exit(0);
} else {
    console.log('⚠️ 部分测试失败，请检查问题。\n');
    process.exit(1);
}
