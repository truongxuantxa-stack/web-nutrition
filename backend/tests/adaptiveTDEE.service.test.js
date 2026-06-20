const { calculateWeeklyAdaptiveTDEE } = require('../services/adaptiveTDEE.service');

describe('adaptiveTDEE.service - calculateWeeklyAdaptiveTDEE', () => {

    describe('Group 1: Happy Path - Kịch bản cơ bản', () => {
        test('Tăng cân 0.5kg/tuần (surplus)', () => {
            // avgIntake = 2500, weightDelta = 0.5
            // Expected: 2500 - (0.5 * 1100) = 1950
            expect(calculateWeeklyAdaptiveTDEE(2500, 0.5)).toBeCloseTo(1950);
        });

        test('Giảm cân 0.5kg/tuần (deficit)', () => {
            // avgIntake = 1800, weightDelta = -0.5
            // Expected: 1800 - (-0.5 * 1100) = 2350
            expect(calculateWeeklyAdaptiveTDEE(1800, -0.5)).toBeCloseTo(2350);
        });

        test('Giữ cân (maintenance)', () => {
            // avgIntake = 2200, weightDelta = 0
            // Expected: 2200
            expect(calculateWeeklyAdaptiveTDEE(2200, 0)).toBeCloseTo(2200);
        });
    });

    describe('Group 2: Edge Cases - Biên và giá trị đặc biệt', () => {
        test('avgIntake = 0 (không ăn gì)', () => {
            // avgIntake = 0, weightDelta = -1.0
            // Expected: 0 - (-1.0 * 1100) = 1100
            expect(calculateWeeklyAdaptiveTDEE(0, -1.0)).toBeCloseTo(1100);
        });

        test('weightDelta rất lớn (+3kg/tuần)', () => {
            // avgIntake = 3000, weightDelta = 3.0
            // Expected: 3000 - (3.0 * 1100) = -300
            expect(calculateWeeklyAdaptiveTDEE(3000, 3.0)).toBeCloseTo(-300);
        });

        test('Số thập phân nhỏ (vi delta)', () => {
            // avgIntake = 2000, weightDelta = 0.01
            // Expected: 2000 - (0.01 * 1100) = 1989
            expect(calculateWeeklyAdaptiveTDEE(2000, 0.01)).toBeCloseTo(1989);
        });
    });

    describe('Group 3: Real-world Scenarios - Kịch bản thực tế', () => {
        test('Giảm cân nhanh -1kg/tuần', () => {
            // avgIntake = 1500, weightDelta = -1.0
            // Expected: 1500 - (-1.0 * 1100) = 2600
            expect(calculateWeeklyAdaptiveTDEE(1500, -1.0)).toBeCloseTo(2600);
        });

        test('Tăng cân nhẹ bulk +0.25kg/tuần', () => {
            // avgIntake = 2800, weightDelta = 0.25
            // Expected: 2800 - (0.25 * 1100) = 2525
            expect(calculateWeeklyAdaptiveTDEE(2800, 0.25)).toBeCloseTo(2525);
        });

        test('Cân nặng dao động nhẹ +0.1kg', () => {
            // avgIntake = 2100, weightDelta = 0.1
            // Expected: 2100 - (0.1 * 1100) = 1990
            expect(calculateWeeklyAdaptiveTDEE(2100, 0.1)).toBeCloseTo(1990);
        });
    });

    describe('Group 4: Tính chất toán học (Mathematical Properties)', () => {
        test('Tính đối xứng: f(I, +d) + f(I, -d) = 2I', () => {
            const I = 2000;
            const d = 0.5;
            const resPlus = calculateWeeklyAdaptiveTDEE(I, d);
            const resMinus = calculateWeeklyAdaptiveTDEE(I, -d);
            expect(resPlus + resMinus).toBeCloseTo(2 * I);
        });

        test('Tăng avgIntake -> TDEE tăng tương ứng: f(I+X, d) - f(I, d) = X', () => {
            const I = 2000;
            const d = 0.3;
            const X = 500;
            const resBase = calculateWeeklyAdaptiveTDEE(I, d);
            const resIncreased = calculateWeeklyAdaptiveTDEE(I + X, d);
            expect(resIncreased - resBase).toBeCloseTo(X);
        });
    });
});
