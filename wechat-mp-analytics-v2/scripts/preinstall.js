#!/usr/bin/env node
/**
 * 预安装脚本
 * 在 npm install 前执行环境检查
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log(' wechat-mp-analytics-v2 预安装检查');
console.log('========================================\n');

// 检查 Node.js 版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
    console.error('❌ Node.js 版本过低');
    console.error(`   当前版本：${nodeVersion}`);
    console.error('   需要版本：v18.0.0 或更高');
    console.error('   请升级 Node.js: https://nodejs.org/\n');
    process.exit(1);
}

console.log(`✅ Node.js 版本：${nodeVersion}`);

// 检查 package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json 不存在');
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
console.log(`✅ 包名：${packageJson.name}`);
console.log(`✅ 版本：${packageJson.version}\n`);

// 检查必要文件
const requiredFiles = [
    'SKILL.md',
    'references/mp-selectors.js',
    'references/ERROR_HANDLING.md'
];

let allFilesExist = true;
for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.error(`❌ ${file} 缺失`);
        allFilesExist = false;
    }
}

if (!allFilesExist) {
    console.error('\n❌ 必要文件缺失，请检查文件结构');
    process.exit(1);
}

console.log('\n========================================');
console.log('✅ 预安装检查通过，开始安装依赖...\n');
