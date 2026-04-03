/**
 * 简化测试脚本 - 不依赖 Jest
 * 直接测试选择器函数
 */

console.log('========================================');
console.log(' wechat-mp-analytics-v2 测试运行');
console.log('========================================\n');

let passed = 0;
let failed = 0;

// 模拟 DOM 环境
const mockDOM = {
    querySelector: (selector) => {
        const mockElements = {
            '[data-testid="total-users"]': { textContent: '1,234' },
            '[data-testid="yesterday-read"]': { textContent: '385' },
            '[data-testid="yesterday-share"]': { textContent: '5' },
            '[data-testid="yesterday-follow"]': { textContent: '2' }
        };
        return mockElements[selector] || null;
    },
    querySelectorAll: (selector) => {
        if (selector === '.article-item') {
            return [
                {
                    querySelector: (s) => ({
                        '.title': { textContent: '文章标题 1' },
                        '.date': { textContent: '2026-04-01' },
                        '.read-count': { textContent: '1,234' },
                        '.share-count': { textContent: '50' }
                    }[s] || null)
                }
            ];
        }
        return [];
    }
};

// 测试 extractHomeData
console.log('测试 1: extractHomeData');
try {
    global.document = mockDOM;
    const { extractHomeData } = require('./references/mp-selectors.js');
    const result = extractHomeData();
    
    if (result.totalUsers === '1,234' && result.yesterdayRead === '385') {
        console.log('  ✅ 正确提取数据\n');
        passed++;
    } else {
        console.log('  ❌ 数据提取错误\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ 执行错误:', error.message, '\n');
    failed++;
}

// 测试 validateData
console.log('测试 2: validateData');
try {
    const { validateData } = require('./references/mp-selectors.js');
    const validData = {
        totalUsers: '1000',
        yesterdayRead: '385',
        yesterdayShare: '5',
        yesterdayFollow: '2'
    };
    
    const result = validateData(validData);
    if (result.valid === true) {
        console.log('  ✅ 数据验证通过\n');
        passed++;
    } else {
        console.log('  ❌ 数据验证失败\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ 执行错误:', error.message, '\n');
    failed++;
}

// 测试 parseNumber
console.log('测试 3: parseNumber');
try {
    const { parseNumber } = require('./references/mp-selectors.js');
    const result = parseNumber('1,234');
    
    if (result === 1234) {
        console.log('  ✅ 数字格式化正确\n');
        passed++;
    } else {
        console.log('  ❌ 数字格式化错误\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ 执行错误:', error.message, '\n');
    failed++;
}

// 测试错误处理文档存在
console.log('测试 4: ERROR_HANDLING.md 存在性');
try {
    const fs = require('fs');
    const content = fs.readFileSync('./references/ERROR_HANDLING.md', 'utf-8');
    
    if (content.includes('E001') && content.includes('E007')) {
        console.log('  ✅ 错误处理文档完整\n');
        passed++;
    } else {
        console.log('  ❌ 错误处理文档不完整\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ 文件读取错误:', error.message, '\n');
    failed++;
}

// 测试 package.json
console.log('测试 5: package.json 配置');
try {
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    
    if (pkg.name === 'wechat-mp-analytics-v2' && pkg.version === '2.1.0') {
        console.log('  ✅ package.json 配置正确\n');
        passed++;
    } else {
        console.log('  ❌ package.json 配置错误\n');
        failed++;
    }
} catch (error) {
    console.log('  ❌ 文件读取错误:', error.message, '\n');
    failed++;
}

// 总结
console.log('========================================');
console.log(` 测试结果：${passed} 通过，${failed} 失败`);
console.log(` 通过率：${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('========================================\n');

if (failed === 0) {
    console.log('✅ 所有测试通过！技能可以投入生产使用。\n');
    process.exit(0);
} else {
    console.log('⚠️ 部分测试失败，请检查问题。\n');
    process.exit(1);
}
