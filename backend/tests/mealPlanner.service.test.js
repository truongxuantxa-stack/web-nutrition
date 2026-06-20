const {
    solveLinearSystem3x3,
    calculateWeights,
    validateSolution,
    allocateMealTargets
} = require('../services/mealPlanner.service');

describe('solveLinearSystem3x3', () => {
    // 1. Hệ cơ bản — nghiệm dương
    test('Hệ cơ bản — nghiệm dương', () => {
        const A = [[2, 1, 0], [1, 3, 1], [0, 1, 2]];
        const b = [5, 10, 7];
        const result = solveLinearSystem3x3(A, b);
        expect(result[0]).toBeCloseTo(1.5);
        expect(result[1]).toBeCloseTo(2);
        expect(result[2]).toBeCloseTo(2.5);
    });

    // 2. Ma trận đơn vị (Identity)
    test('Ma trận đơn vị (Identity)', () => {
        const A = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const b = [3, 5, 7];
        const result = solveLinearSystem3x3(A, b);
        expect(result[0]).toBeCloseTo(3);
        expect(result[1]).toBeCloseTo(5);
        expect(result[2]).toBeCloseTo(7);
    });

    // 3. Nghiệm chứa số thập phân
    test('Nghiệm chứa số thập phân', () => {
        const A = [[2, 1, 1], [1, 3, 2], [1, 0, 0]];
        const b = [4, 5, 6];
        const result = solveLinearSystem3x3(A, b);
        expect(result[0]).toBeCloseTo(6);
        expect(result[1]).toBeCloseTo(15);
        expect(result[2]).toBeCloseTo(-23);
    });

    // 4. Cần Partial Pivoting
    test('Cần Partial Pivoting', () => {
        const A = [[0, 1, 1], [1, 0, 1], [1, 1, 0]];
        const b = [3, 3, 4];
        const result = solveLinearSystem3x3(A, b);
        expect(result[0]).toBeCloseTo(2);
        expect(result[1]).toBeCloseTo(2);
        expect(result[2]).toBeCloseTo(1);
    });

    // 5. Ma trận suy biến (Singular)
    test('Ma trận suy biến (Singular)', () => {
        const A = [[1, 2, 3], [2, 4, 6], [0, 1, 1]];
        const b = [6, 12, 2];
        const result = solveLinearSystem3x3(A, b);
        expect(result).toBeNull();
    });

    // 6. Tất cả hệ số = 0
    test('Tất cả hệ số = 0', () => {
        const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        const b = [0, 0, 0];
        const result = solveLinearSystem3x3(A, b);
        expect(result).toBeNull();
    });

    // 7. Nghiệm chứa số âm
    test('Nghiệm chứa số âm', () => {
        const A = [[1, 1, 1], [2, 1, 1], [1, 2, 1]];
        const b = [3, 4, 2];
        const result = solveLinearSystem3x3(A, b);
        expect(result[0]).toBeCloseTo(1);
        expect(result[1]).toBeCloseTo(-1);
        expect(result[2]).toBeCloseTo(3);
    });

    // 8. Không mutate input
    test('Không mutate input', () => {
        const A = [[2, 1, 0], [1, 3, 1], [0, 1, 2]];
        const b = [5, 10, 7];
        const AClone = [[2, 1, 0], [1, 3, 1], [0, 1, 2]];
        const bClone = [5, 10, 7];
        solveLinearSystem3x3(A, b);
        expect(A).toEqual(AClone);
        expect(b).toEqual(bClone);
    });
});

describe('calculateWeights', () => {
    const carbFood = { id: 1, name: 'Gạo lứt', category: 'carb', protein: 7, carbs: 70, fat: 2 };
    const proteinFood = { id: 2, name: 'Ức gà', category: 'protein', protein: 23, carbs: 0, fat: 1 };
    const fatFood = { id: 3, name: 'Dầu oliu', category: 'fat', protein: 0, carbs: 0, fat: 100 };
    const fiberFood = { id: 4, name: 'Bông cải xanh', category: 'fiber', protein: 3, carbs: 7, fat: 0 };

    test('4 nguyên liệu (bữa chính)', () => {
        const target = { protein: 30, carbs: 50, fat: 10 };
        const foods = [carbFood, proteinFood, fatFood, fiberFood];
        const result = calculateWeights(foods, target);
        
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4);
        
        const fiberRes = result.find(r => r.food.category === 'fiber');
        expect(fiberRes).toBeDefined();
        expect(fiberRes.grams).toBe(200);

        // Verify other macros approximately (depends on the exact math logic)
        const carbRes = result.find(r => r.food.category === 'carb');
        const proteinRes = result.find(r => r.food.category === 'protein');
        const fatRes = result.find(r => r.food.category === 'fat');
        
        expect(carbRes).toBeDefined();
        expect(proteinRes).toBeDefined();
        expect(fatRes).toBeDefined();
        
        // Cụ thể: 200g bông cải xanh -> 6g pro, 14g carb, 0g fat
        // Cần còn lại: 24g pro, 36g carb, 10g fat
        // carb cần 36/70 * 100g = 51.4g
        // protein cần (24 - 51.4*7/100) / 23 * 100g = (24 - 3.6) / 23 * 100 = 88.7g
        // fat cần (10 - 51.4*2/100 - 88.7*1/100) / 100 * 100g = (10 - 1.0 - 0.9) = 8.1g
        
        expect(carbRes.grams).toBeGreaterThan(0);
        expect(proteinRes.grams).toBeGreaterThan(0);
        expect(fatRes.grams).toBeGreaterThan(0);
    });

    test('3 nguyên liệu (bữa phụ)', () => {
        const target = { protein: 30, carbs: 50, fat: 10 };
        const foods = [carbFood, proteinFood, fatFood];
        const result = calculateWeights(foods, target);
        expect(result.length).toBe(3);
    });

    test('Ma trận suy biến -> null', () => {
        const carb1 = { id: 1, name: 'Carb1', category: 'carb', protein: 10, carbs: 50, fat: 0 };
        const carb2 = { id: 2, name: 'Carb2', category: 'carb', protein: 20, carbs: 100, fat: 0 };
        const protein1 = { id: 3, name: 'Pro', category: 'protein', protein: 20, carbs: 0, fat: 0 };
        const foods = [carb1, carb2, protein1];
        const target = { protein: 30, carbs: 50, fat: 10 };
        const result = calculateWeights(foods, target);
        expect(result).toBeNull();
    });

    test('Input 2 nguyên liệu -> throw Error', () => {
        const foods = [carbFood, proteinFood];
        const target = { protein: 30, carbs: 50, fat: 10 };
        expect(() => calculateWeights(foods, target)).toThrow("Thuật toán yêu cầu chính xác 3 hoặc 4 nguyên liệu.");
    });

    test('Input null/undefined -> throw', () => {
        const target = { protein: 30, carbs: 50, fat: 10 };
        expect(() => calculateWeights(null, target)).toThrow("Thuật toán yêu cầu chính xác 3 hoặc 4 nguyên liệu.");
    });

    test('4 nguyên liệu nhưng thiếu fiber -> throw', () => {
        const foods = [carbFood, proteinFood, fatFood, { ...carbFood, id: 5 }];
        const target = { protein: 30, carbs: 50, fat: 10 };
        expect(() => calculateWeights(foods, target)).toThrow("Không tìm thấy nguồn Rau/Fiber trong danh sách nguyên liệu 4 món.");
    });
});

describe('validateSolution', () => {
    test('Tất cả hợp lệ (50-300g)', () => {
        const results = [
            { food: { name: 'Gạo', category: 'carb' }, grams: 100 },
            { food: { name: 'Gà', category: 'protein' }, grams: 150 },
            { food: { name: 'Bông cải', category: 'fiber' }, grams: 200 }
        ];
        const validation = validateSolution(results);
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);
    });

    test('Có item grams < 0 (NEGATIVE_WEIGHT)', () => {
        const results = [
            { food: { name: 'Gạo', category: 'carb' }, grams: 100 },
            { food: { name: 'Gà', category: 'protein' }, grams: -50 }
        ];
        const validation = validateSolution(results);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.some(e => e.type === 'NEGATIVE_WEIGHT')).toBe(true);
        expect(validation.errors.find(e => e.type === 'NEGATIVE_WEIGHT').severity).toBe('error');
    });

    test('Có item grams < 10 nhưng role = fat', () => {
        const results = [
            { food: { name: 'Dầu oliu', category: 'fat' }, grams: 5 }
        ];
        const validation = validateSolution(results);
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);
    });

    test('Có item grams > 500 nhưng role = fiber', () => {
        const results = [
            { food: { name: 'Bông cải xanh', category: 'fiber' }, grams: 600 }
        ];
        const validation = validateSolution(results);
        expect(validation.isValid).toBe(true);
        expect(validation.errors.length).toBe(0);
    });
});

describe('allocateMealTargets', () => {
    test('Chia đều 3 bữa (33/33/34%)', () => {
        const config = [
            { key: 'sang', percent: 33 },
            { key: 'trua', percent: 33 },
            { key: 'toi', percent: 34 }
        ];
        const result = allocateMealTargets(2000, { protein: 150, carbs: 200, fat: 66 }, config);
        
        expect(result.sang.calories).toBe(Math.round(2000 * 0.33));
        expect(result.trua.protein).toBe(Math.round(150 * 0.33));
        expect(result.toi.fat).toBe(Math.round(66 * 0.34));
    });

    test('Chia 4 bữa (25/30/30/15%)', () => {
        const config = [
            { key: 'sang', percent: 25 },
            { key: 'trua', percent: 30 },
            { key: 'toi', percent: 30 },
            { key: 'phu', percent: 15 }
        ];
        const result = allocateMealTargets(2000, { protein: 150, carbs: 200, fat: 66 }, config);
        
        expect(result.sang.calories).toBe(500); // 2000 * 0.25
        expect(result.trua.protein).toBe(45);   // 150 * 0.3
        expect(result.toi.carbs).toBe(60);      // 200 * 0.3
        expect(result.phu.fat).toBe(10);        // 66 * 0.15 = 9.9 -> 10
    });

    test('Input null/thiếu -> null', () => {
        expect(allocateMealTargets(null, { protein: 150, carbs: 200, fat: 66 }, [])).toBeNull();
        expect(allocateMealTargets(2000, null, [])).toBeNull();
        expect(allocateMealTargets(2000, { protein: 150, carbs: 200, fat: 66 }, null)).toBeNull();
    });
});
