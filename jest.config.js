module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 忽略的目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/fixtures/'
  ],
  
  // 代码覆盖率配置
  collectCoverageFrom: [
    'references/**/*.js',
    '!references/**/README.md'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 测试失败后继续运行
  bail: false,
  
  // 显示测试执行时间
  collectCoverage: false,
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage',
  
  // 覆盖率报告格式
  coverageReporters: ['text', 'lcov', 'html']
};
