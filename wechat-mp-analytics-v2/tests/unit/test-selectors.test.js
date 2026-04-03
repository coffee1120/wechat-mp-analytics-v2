/**
 * 选择器测试 - 单元测试
 * 测试 mp-selectors.js 中的数据提取函数
 */

const {
    extractHomeData,
    extractArticleList,
    extractBoostQuota,
    validateData
} = require('../references/mp-selectors.js');

describe('mp-selectors 数据提取', () => {
    
    // 模拟 DOM 环境
    const mockDOM = {
        querySelector: (selector) => {
            const mockElements = {
                '[data-testid="total-users"]': { textContent: '1,234' },
                '[data-testid="yesterday-read"]': { textContent: '385' },
                '[data-testid="yesterday-share"]': { textContent: '5' },
                '[data-testid="yesterday-follow"]': { textContent: '2' },
                '[data-testid="available-exposure"]': { textContent: '10,000' },
                '[data-testid="available-incentive"]': { textContent: '300' },
                '[data-testid="expiring-soon"]': { textContent: '50' }
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
                    },
                    {
                        querySelector: (s) => ({
                            '.title': { textContent: '文章标题 2' },
                            '.date': { textContent: '2026-04-02' },
                            '.read-count': { textContent: '567' },
                            '.share-count': { textContent: '23' }
                        }[s] || null)
                    }
                ];
            }
            return [];
        }
    };

    describe('extractHomeData', () => {
        test('应该正确提取首页核心数据', () => {
            global.document = mockDOM;
            const result = extractHomeData();
            
            expect(result).toEqual({
                totalUsers: '1,234',
                yesterdayRead: '385',
                yesterdayShare: '5',
                yesterdayFollow: '2'
            });
        });

        test('应该处理缺失的元素', () => {
            global.document = {
                querySelector: () => null
            };
            const result = extractHomeData();
            
            expect(result).toEqual({
                totalUsers: '',
                yesterdayRead: '',
                yesterdayShare: '',
                yesterdayFollow: ''
            });
        });
    });

    describe('extractArticleList', () => {
        test('应该正确提取文章列表', () => {
            global.document = mockDOM;
            const result = extractArticleList();
            
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                title: '文章标题 1',
                date: '2026-04-01',
                read: '1,234',
                share: '50'
            });
        });

        test('应该处理空列表', () => {
            global.document = {
                querySelectorAll: () => []
            };
            const result = extractArticleList();
            
            expect(result).toEqual([]);
        });
    });

    describe('extractBoostQuota', () => {
        test('应该正确提取投流额度数据', () => {
            global.document = mockDOM;
            const result = extractBoostQuota();
            
            expect(result).toEqual({
                availableExposure: '10,000',
                availableIncentive: '300',
                expiringSoon: '50'
            });
        });

        test('应该处理缺失的额度数据', () => {
            global.document = {
                querySelector: () => null
            };
            const result = extractBoostQuota();
            
            expect(result).toEqual({
                availableExposure: '',
                availableIncentive: '',
                expiringSoon: ''
            });
        });
    });
});

describe('数据验证', () => {
    test('应该验证数据完整性', () => {
        const validData = {
            totalUsers: '1000',
            yesterdayRead: '385',
            yesterdayShare: '5',
            yesterdayFollow: '2'
        };
        
        const result = validateData(validData);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('应该检测缺失的必填字段', () => {
        const invalidData = {
            totalUsers: '1000'
            // 缺少其他必填字段
        };
        
        const result = validateData(invalidData);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('应该处理空数据', () => {
        const result = validateData(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('数据为空');
    });

    test('应该处理非对象数据', () => {
        const result = validateData('invalid');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('数据类型错误');
    });
});

describe('数字格式化', () => {
    test('应该移除千位分隔符', () => {
        const result = require('../references/mp-selectors.js').parseNumber('1,234');
        expect(result).toBe(1234);
    });

    test('应该处理非数字字符串', () => {
        const result = require('../references/mp-selectors.js').parseNumber('N/A');
        expect(result).toBeNaN();
    });

    test('应该处理空字符串', () => {
        const result = require('../references/mp-selectors.js').parseNumber('');
        expect(result).toBeNaN();
    });
});
