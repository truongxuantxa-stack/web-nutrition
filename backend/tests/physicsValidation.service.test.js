const { validateNutritionPhysics } = require('../services/physicsValidation.service');

describe('physicsValidation.service', () => {
    describe('Happy Path', () => {
        test('Dữ liệu hợp lệ hoàn toàn (ức gà)', () => {
            const data = { calories: 165, protein: 31, carbs: 0, fat: 3.6 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.warnings.length).toBe(0);
        });

        test('Dữ liệu hợp lệ có fiber/sugar (táo)', () => {
            const data = { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
            expect(result.warnings.length).toBe(0);
        });
    });

    describe('Rule 1: Không cho phép số âm', () => {
        test('Protein âm', () => {
            const data = { calories: 100, protein: -5, carbs: 10, fat: 10 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Giá trị dinh dưỡng không thể âm.');
        });

        test('Sodium âm', () => {
            const data = { calories: 170, protein: 10, carbs: 10, fat: 10, sodium: -100 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Giá trị dinh dưỡng không thể âm.');
        });
    });

    describe('Rule 2: Tổng macro <= 100g', () => {
        test('P+C+F = 101g (>100g)', () => {
            const data = { calories: 500, protein: 50, carbs: 40, fat: 11 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('100g/100g — phi lý'))).toBe(true);
        });

        test('P+C+F = 100g (biên)', () => {
            const data = { calories: 600, protein: 30, carbs: 30, fat: 40 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    });

    describe('Rule 3: Calo tối đa 900 kcal/100g', () => {
        test('901 kcal/100g (>900)', () => {
            // protein 0, carbs 0, fat 100 -> Atwater = 900. Deviation (901-900)/901 = 0.001 < 15% (passed Atwater check but fails Rule 3)
            const data = { calories: 901, protein: 0, carbs: 0, fat: 100 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('vượt giới hạn vật lý (max 900 kcal)'))).toBe(true);
        });

        test('900 kcal/100g (biên)', () => {
            const data = { calories: 900, protein: 0, carbs: 0, fat: 100 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    });

    describe('Rule 4: Atwater check ±15%', () => {
        test('Sai lệch > 15%', () => {
            // Atwater = 10*4 + 10*4 + 10*9 = 170. Calories = 300 -> deviation = 130/300 = 43%
            const data = { calories: 300, protein: 10, carbs: 10, fat: 10 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Atwater mismatch'))).toBe(true);
        });

        test('Sai lệch đúng 15% (biên)', () => {
            // Atwater = 170. Calories = 200 -> deviation = 30/200 = 0.15. This is <= 0.15, so valid.
            const data = { calories: 200, protein: 10, carbs: 10, fat: 10 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('Macro = 0 nhưng cal > 0', () => {
            const data = { calories: 100, protein: 0, carbs: 0, fat: 0 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('tổng macro = 0g — dữ liệu phi lý'))).toBe(true);
        });

        test('Cal = 0 -> skip Atwater', () => {
            const data = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    });

    describe('Rule 5: Fiber <= Carb, Sugar <= Carb', () => {
        test('Fiber > Carb (Net Carb)', () => {
            // Atwater = 10*4 + 10*4 + 2*9 = 98. Calories = 100 -> deviation = 2/100 = 2% < 15%. Valid.
            const data = { calories: 100, protein: 10, carbs: 10, fat: 2, fiber: 15 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.warnings.some(w => w.includes('Chất xơ > Carb'))).toBe(true);
        });

        test('Sugar > Carb (Net Carb)', () => {
            const data = { calories: 100, protein: 10, carbs: 10, fat: 2, sugar: 20 };
            const result = validateNutritionPhysics(data);
            expect(result.valid).toBe(true);
            expect(result.warnings.some(w => w.includes('Đường > Carb'))).toBe(true);
        });
    });

    describe('Unit 100ml — chất lỏng', () => {
        test('Sữa tươi 100ml — hợp lệ (macro rất nhỏ, tổng ~11g)', () => {
            // Sữa bò: P=3.5, C=4.8, F=3.2 → tổng 11.5g << 150. Atwater ≈ 3.5*4+4.8*4+3.2*9 = 62 kcal
            const data = { calories: 61, protein: 3.5, carbs: 4.8, fat: 3.2 };
            const result = validateNutritionPhysics(data, '100ml');
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('Mật ong 100ml — hợp lệ (tổng ~130g carbs, maxMass=150)', () => {
            // Mật ong: density ~1.4 g/ml → 100ml ≈ 140g. Carbs ~81g/100g → ~113g/100ml
            // Dùng giá trị thực tế per 100ml: C=113, P=0.3, F=0 → tổng 113.3g < 150 → pass
            // Atwater: 0.3*4 + 113*4 + 0*9 = 453.2. Calories ~324 kcal/100ml
            // Lưu ý: trường hợp này Atwater sẽ fail (sai lệch lớn) nên dùng giá trị khớp hơn
            const data = { calories: 440, protein: 0.3, carbs: 113, fat: 0 };
            const result = validateNutritionPhysics(data, '100ml');
            // Rule 2: 113.3 < 150 → pass. Rule 3: 440 < 900 → pass.
            expect(result.errors.some(e => e.includes('phi lý'))).toBe(false);
        });

        test('Chất lỏng 100ml — bị chặn khi tổng macro vượt 150g (phi lý)', () => {
            // Tổng P+C+F = 160g trên 100ml — không thể tồn tại trong tự nhiên
            const data = { calories: 800, protein: 10, carbs: 130, fat: 20 };
            const result = validateNutritionPhysics(data, '100ml');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('150g/100ml — phi lý'))).toBe(true);
        });

        test('Chất lỏng 100ml — error message hiển thị đúng đơn vị ml', () => {
            // Calo = 1000 > 900 → Rule 3 triggered
            const data = { calories: 1000, protein: 0, carbs: 0, fat: 100 };
            const result = validateNutritionPhysics(data, '100ml');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('kcal/100ml vượt giới hạn vật lý'))).toBe(true);
        });
    });
});
