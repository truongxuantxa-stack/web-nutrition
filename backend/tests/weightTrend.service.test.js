const {
    calculateEMASeries,
    calculateRibbonBounds
} = require('../services/weightTrend.service');

const EMA_ALPHA = 0.15;
const MIN_RIBBON_DEV = 0.3;
const MAX_RIBBON_DEV = 1.5;

describe('weightTrend.service', () => {

    describe('calculateEMASeries', () => {
        test('Mảng rỗng -> []', () => {
            expect(calculateEMASeries([])).toEqual([]);
        });

        test('Null input -> []', () => {
            expect(calculateEMASeries(null)).toEqual([]);
        });

        test('1 điểm duy nhất', () => {
            const logs = [{ date: '2026-01-01', weight: 70 }];
            const result = calculateEMASeries(logs);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                date: '2026-01-01',
                raw: 70,
                ema: 70,
                isReset: false
            });
        });

        test('3 điểm liên tiếp — EMA smoothing', () => {
            const logs = [
                { date: '2026-01-01', weight: 70 },
                { date: '2026-01-02', weight: 72 },
                { date: '2026-01-03', weight: 71 }
            ];
            const result = calculateEMASeries(logs);
            
            expect(result).toHaveLength(3);
            
            // Expected EMA calculations:
            // ema[0] = 70
            // ema[1] = 72 * 0.15 + 70 * 0.85 = 10.8 + 59.5 = 70.3
            // ema[2] = 71 * 0.15 + 70.3 * 0.85 = 10.65 + 59.755 = 70.405
            
            expect(result[0].ema).toBe(70);
            expect(result[1].ema).toBeCloseTo(70.3);
            expect(result[2].ema).toBeCloseTo(70.405);
            expect(result[0].isReset).toBe(false);
            expect(result[1].isReset).toBe(false);
            expect(result[2].isReset).toBe(false);
        });

        test('Gap >= 14 ngày -> Reset EMA', () => {
            const logs = [
                { date: '2026-01-01', weight: 70 },
                { date: '2026-01-20', weight: 75 } // gap = 19 days
            ];
            const result = calculateEMASeries(logs);
            
            expect(result).toHaveLength(2);
            expect(result[1].isReset).toBe(true);
            expect(result[1].ema).toBe(75); // Reset to raw weight
        });

        test('Gap = 13 ngày -> Không reset', () => {
            const logs = [
                { date: '2026-01-01', weight: 70 },
                { date: '2026-01-14', weight: 75 } // gap = 13 days
            ];
            const result = calculateEMASeries(logs);
            
            expect(result).toHaveLength(2);
            expect(result[1].isReset).toBe(false);
            expect(result[1].ema).toBeCloseTo(75 * 0.15 + 70 * 0.85); // 70.75
        });

        test('Gap đúng 14 ngày -> Reset (biên)', () => {
            const logs = [
                { date: '2026-01-01', weight: 70 },
                { date: '2026-01-15', weight: 75 } // gap = 14 days
            ];
            const result = calculateEMASeries(logs);
            
            expect(result).toHaveLength(2);
            expect(result[1].isReset).toBe(true);
            expect(result[1].ema).toBe(75);
        });

        test('Chuỗi dài 7 điểm — xu hướng giảm', () => {
            const logs = [
                { date: '2026-01-01', weight: 80 },
                { date: '2026-01-02', weight: 79.5 },
                { date: '2026-01-03', weight: 79 },
                { date: '2026-01-04', weight: 78.5 },
                { date: '2026-01-05', weight: 78 },
                { date: '2026-01-06', weight: 77.5 },
                { date: '2026-01-07', weight: 77 }
            ];
            const result = calculateEMASeries(logs);
            
            expect(result).toHaveLength(7);
            
            // Tất cả isReset phải là false
            const anyReset = result.some(item => item.isReset);
            expect(anyReset).toBe(false);

            // Xu hướng giảm: EMA cuối cùng phải nhỏ hơn EMA ban đầu (80)
            const firstEma = result[0].ema;
            const lastEma = result[6].ema;
            expect(lastEma).toBeLessThan(firstEma);
            expect(lastEma).toBeLessThan(79); // Should definitely be lower after a week
        });

        test('Output shape', () => {
            const logs = [{ date: '2026-01-01', weight: 70 }];
            const result = calculateEMASeries(logs);
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('raw');
            expect(result[0]).toHaveProperty('ema');
            expect(result[0]).toHaveProperty('isReset');
        });
    });

    describe('calculateRibbonBounds', () => {
        test('Mảng rỗng', () => {
            expect(calculateRibbonBounds([])).toEqual([]);
        });

        test('1 điểm — stddev fallback MIN', () => {
            const emaSeries = [{ date: '2026-01-01', raw: 70, ema: 70 }];
            const result = calculateRibbonBounds(emaSeries);
            
            expect(result).toHaveLength(1);
            expect(result[0].upper).toBeCloseTo(70 + MIN_RIBBON_DEV);
            expect(result[0].lower).toBeCloseTo(70 - MIN_RIBBON_DEV);
        });

        test('Dữ liệu ổn định (ít dao động) -> clamp MIN_RIBBON_DEV', () => {
            // Dao động rất nhỏ, stddev sẽ nhỏ hơn 0.3
            const emaSeries = [
                { date: '2026-01-01', raw: 70.0, ema: 70.0 },
                { date: '2026-01-02', raw: 70.1, ema: 70.015 },
                { date: '2026-01-03', raw: 69.9, ema: 69.998 }
            ];
            const result = calculateRibbonBounds(emaSeries);
            
            expect(result).toHaveLength(3);
            // Element cuối cùng
            const lastBound = result[2];
            const ema = emaSeries[2].ema;
            expect(lastBound.upper).toBeCloseTo(ema + MIN_RIBBON_DEV);
            expect(lastBound.lower).toBeCloseTo(ema - MIN_RIBBON_DEV);
        });

        test('Dữ liệu dao động mạnh -> clamp MAX_RIBBON_DEV', () => {
            // Dao động rất lớn (biên độ 10kg), stddev sẽ lớn hơn 1.5
            const emaSeries = [
                { date: '2026-01-01', raw: 65, ema: 65 },
                { date: '2026-01-02', raw: 75, ema: 66.5 },
                { date: '2026-01-03', raw: 65, ema: 66.275 },
                { date: '2026-01-04', raw: 75, ema: 67.584 }
            ];
            const result = calculateRibbonBounds(emaSeries);
            
            expect(result).toHaveLength(4);
            const lastBound = result[3];
            const ema = emaSeries[3].ema;
            expect(lastBound.upper).toBeCloseTo(ema + MAX_RIBBON_DEV);
            expect(lastBound.lower).toBeCloseTo(ema - MAX_RIBBON_DEV);
        });

        test('Output shape', () => {
            const emaSeries = [{ date: '2026-01-01', raw: 70, ema: 70 }];
            const result = calculateRibbonBounds(emaSeries);
            expect(result[0]).toHaveProperty('date');
            expect(result[0]).toHaveProperty('upper');
            expect(result[0]).toHaveProperty('lower');
        });

        test('upper > lower luôn đúng', () => {
            const emaSeries = [
                { date: '2026-01-01', raw: 60, ema: 60 },
                { date: '2026-01-02', raw: 90, ema: 64.5 },
                { date: '2026-01-03', raw: 40, ema: 60.825 }
            ];
            const result = calculateRibbonBounds(emaSeries);
            
            for (const bound of result) {
                expect(bound.upper).toBeGreaterThan(bound.lower);
            }
        });
    });
});
