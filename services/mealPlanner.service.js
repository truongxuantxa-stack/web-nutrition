'use strict';

const { Op } = require('sequelize');
const { Food } = require('../models');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * services/mealPlanner.service.js
 * Các thuật toán tính toán bữa ăn theo phương pháp "Hardcore Tracking" 
 * dựa trên giải hệ phương trình tuyến tính 3x3.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ============================================================================
// MODULE 1: MEAL TARGET ALLOCATION
// ============================================================================

/**
 * Tính toán Target Macro cho từng bữa dựa trên TDEE, tổng Macros và cấu hình %
 * @param {number} dailyTargetCal - Tổng calo mục tiêu trong ngày
 * @param {Object} dailyMacros - { protein, carbs, fat } gam tổng trong ngày
 * @param {Array} userMealConfig - Mảng cấu hình các bữa ăn (ví dụ: [{ key: 'sang', percent: 25 }, ...])
 * @returns {Object} Target C-P-F cho từng bữa
 */
const allocateMealTargets = (dailyTargetCal, dailyMacros, userMealConfig) => {
    if (!dailyTargetCal || !dailyMacros || !userMealConfig || !Array.isArray(userMealConfig)) {
        return null;
    }

    const mealTargets = {};
    for (const meal of userMealConfig) {
        mealTargets[meal.key] = {
            calories: Math.round(dailyTargetCal * meal.percent / 100),
            protein: Math.round(dailyMacros.protein * meal.percent / 100),
            carbs: Math.round(dailyMacros.carbs * meal.percent / 100),
            fat: Math.round(dailyMacros.fat * meal.percent / 100)
        };
    }

    return mealTargets;
};

// ============================================================================
// MODULE 2: TEMPLATE MATCHING
// ============================================================================

/**
 * Chọn ngẫu nhiên một nguyên liệu thô theo role từ DB.
 * Có thể loại trừ các món không mong muốn.
 * @param {string} role - category của Food (carb, protein, fat, fiber)
 * @param {Array} excludeIds - Danh sách id không muốn chọn
 * @returns {Object} Food model (JSON)
 */
const pickRandomFoodByRole = async (role, excludeIds = [], allowedTags = []) => {
    const whereClause = {
        category: role,
        foodType: 'raw'
    };
    if (excludeIds && excludeIds.length > 0) {
        whereClause.id = { [Op.notIn]: excludeIds };
    }

    const candidates = await Food.findAll({ where: whereClause });
    if (!candidates || candidates.length === 0) return null;

    // Lọc theo tags nếu template có yêu cầu
    let filtered = candidates;
    if (allowedTags && allowedTags.length > 0) {
        filtered = candidates.filter(f => {
            const foodTags = f.tags || [];
            return allowedTags.some(tag => foodTags.includes(tag));
        });
        // Fallback: nếu không có food nào khớp tag -> dùng toàn bộ pool
        if (filtered.length === 0) filtered = candidates;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex].toJSON();
};

/**
 * Xây dựng tổ hợp nguyên liệu dựa trên template (Mảng 4 slot).
 * @param {Object} template - MealTemplate { slots: [{role: 'carb'}, ...] }
 * @param {Object} preferences - { carb: foodId, protein: foodId, exclude: [id1, id2] } (Để pin món hoặc loại trừ)
 * @returns {Array} Mảng 4 Food object
 */
const pickIngredientsForTemplate = async (template, preferences = {}) => {
    const result = [];
    const excludeIds = preferences.exclude || [];

    for (const slot of template.slots) {
        const role = slot.role;
        const allowedTags = slot.allowedTags || [];
        let pickedFood = null;

        // Nếu user đã ghim cứng 1 món cho slot này
        if (preferences[role]) {
            pickedFood = await Food.findByPk(preferences[role]);
            if (pickedFood) pickedFood = pickedFood.toJSON();
        }

        // Nếu không có ghim hoặc tìm không thấy -> random
        if (!pickedFood) {
            pickedFood = await pickRandomFoodByRole(role, excludeIds, allowedTags);
        }

        if (!pickedFood) {
            throw new Error(`Không thể tìm thấy nguyên liệu phù hợp cho nhóm: ${role}`);
        }
        
        result.push(pickedFood);
    }
    return result;
};

// ============================================================================
// MODULE 3: WEIGHT CALCULATOR & SMART SWAP (Core Math)
// ============================================================================

/**
 * Giải hệ phương trình tuyến tính 3x3 bằng thuật toán khử Gauss (Gaussian Elimination)
 * @param {Array<Array<number>>} A - Ma trận hệ số 3x3
 * @param {Array<number>} b - Vector hằng số 3x1
 * @returns {Array<number>|null} Nghiệm [w1, w2, w3] hoặc null nếu ma trận suy biến
 */
const solveLinearSystem3x3 = (A, b) => {
    // Clone ma trận để không làm thay đổi mảng gốc
    const M = A.map((row, i) => [...row, b[i]]);

    // Forward elimination (Biến đổi về ma trận tam giác trên)
    for (let col = 0; col < 3; col++) {
        // Tìm phần tử lớn nhất trong cột (Partial pivoting)
        let maxRow = col;
        for (let row = col + 1; row < 3; row++) {
            if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) {
                maxRow = row;
            }
        }

        // Hoán vị dòng
        [M[col], M[maxRow]] = [M[maxRow], M[col]];

        // Nếu phần tử chéo bằng 0 -> ma trận suy biến, không có nghiệm duy nhất
        if (Math.abs(M[col][col]) < 1e-10) {
            return null;
        }

        // Khử các phần tử dưới đường chéo chính
        for (let row = col + 1; row < 3; row++) {
            const factor = M[row][col] / M[col][col];
            for (let j = col; j <= 3; j++) {
                M[row][j] -= factor * M[col][j];
            }
        }
    }

    // Back substitution (Giải ngược từ dưới lên)
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
        x[i] = M[i][3];
        for (let j = i + 1; j < 3; j++) {
            x[i] -= M[i][j] * x[j];
        }
        x[i] /= M[i][i];
    }

    return x;
};

/**
 * Tính toán trọng lượng (gram) cho các nguyên liệu bằng cách giải hệ phương trình
 * @param {Array} foods - Mảng 4 nguyên liệu thô (có protein, carbs, fat trên 100g)
 * @param {Object} target - { protein, carbs, fat } mục tiêu của bữa ăn
 * @returns {Array|null} Mảng kết quả gồm { food, grams }
 */
const calculateWeights = (foods, target) => {
    if (!foods || foods.length !== 4) {
        throw new Error("Thuật toán yêu cầu chính xác 4 nguyên liệu (Carb, Protein, Fat, Fiber)");
    }

    // 1. Phân loại nguyên liệu (Tìm rau / Fiber)
    const fiberFood = foods.find(f => f.category === 'fiber' || f.role === 'fiber');
    const FIBER_DEFAULT_GRAMS = 200; // Cố định 200g rau
    const fiberWeight = FIBER_DEFAULT_GRAMS / 100;

    if (!fiberFood) {
        throw new Error("Không tìm thấy nguồn Rau/Fiber trong danh sách nguyên liệu.");
    }

    // 2. Trừ lượng Macro của Rau ra khỏi mục tiêu bữa ăn
    const adjustedTarget = {
        protein: target.protein - (fiberFood.protein * fiberWeight),
        carbs: target.carbs - (fiberFood.carbs * fiberWeight),
        fat: target.fat - (fiberFood.fat * fiberWeight)
    };

    // 3. Lấy 3 nguyên liệu còn lại để giải phương trình
    const remaining = foods.filter(f => f.id !== fiberFood.id);
    if (remaining.length !== 3) {
        throw new Error("Dữ liệu nguyên liệu còn lại không đúng 3 loại (Carb, Protein, Fat)");
    }

    // 4. Thiết lập hệ phương trình A * W = T
    // A: Ma trận chứa thông tin protein, carbs, fat của 3 nguyên liệu (trên 100g)
    const A = [
        [remaining[0].protein, remaining[1].protein, remaining[2].protein],
        [remaining[0].carbs, remaining[1].carbs, remaining[2].carbs],
        [remaining[0].fat, remaining[1].fat, remaining[2].fat]
    ];
    
    // T: Vector mục tiêu đã điều chỉnh
    const T = [adjustedTarget.protein, adjustedTarget.carbs, adjustedTarget.fat];

    // Giải phương trình
    const W = solveLinearSystem3x3(A, T);
    
    // Nếu ma trận suy biến (các nguyên liệu có tỷ lệ macro y hệt nhau) -> không giải được
    if (!W) {
        return null; 
    }

    // 5. Build mảng kết quả
    const results = remaining.map((f, i) => ({
        food: f,
        grams: Math.round(W[i] * 100)
    }));

    // Bổ sung rau vào kết quả
    results.push({
        food: fiberFood,
        grams: FIBER_DEFAULT_GRAMS
    });

    return results;
};

// ============================================================================
// MODULE 4: EDGE CASES & FALLBACKS
// ============================================================================

/**
 * Xác thực và phân tích kết quả tính toán để phát hiện các ca bất khả thi
 * @param {Array} results - Mảng kết quả [{ food, grams }]
 * @returns {Object} { isValid: boolean, errors: Array }
 */
const validateSolution = (results) => {
    const errors = [];
    const MIN_GRAMS = 10;
    const MAX_GRAMS = 500;

    for (const item of results) {
        const { food, grams } = item;
        const role = food.category || food.role;

        // Bắt lỗi âm: Phương trình tính ra khối lượng < 0
        if (grams < 0) {
            errors.push({
                type: 'NEGATIVE_WEIGHT',
                severity: 'error',
                food: food.name,
                message: `"${food.name}" bị tính ra giá trị âm (${grams}g). Tổ hợp nguyên liệu này không thể đáp ứng được mục tiêu (bị vượt macro).`,
                suggestion: role === 'protein' 
                    ? 'Có thể loại thịt/cá này chứa quá nhiều mỡ. Hãy đổi sang nguồn đạm nạc hơn (Ức gà, Cá ngừ, Thăn bò).' 
                    : 'Hãy thử đổi sang một loại nguyên liệu khác tương đương.'
            });
        } 
        // Bắt lỗi quá nhỏ (nhưng bỏ qua dầu ăn / fat bổ sung)
        else if (grams < MIN_GRAMS && role !== 'fat') {
            errors.push({
                type: 'TOO_SMALL',
                severity: 'warning',
                food: food.name,
                message: `Lượng "${food.name}" chỉ cần ${grams}g — quá ít để chế biến thành món ăn.`
            });
        } 
        // Bắt lỗi quá lớn (bỏ qua rau)
        else if (grams > MAX_GRAMS && role !== 'fiber') {
            errors.push({
                type: 'TOO_LARGE',
                severity: 'warning',
                food: food.name,
                message: `"${food.name}" cần tới ${grams}g — khối lượng này khá lớn, có thể gây khó khăn khi ăn hết.`
            });
        }
    }

    return {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors
    };
};

// ============================================================================
// ORCHESTRATOR: KẾT NỐI CHUỖI M1 -> M2 -> M3 -> M4
// ============================================================================

/**
 * Hàm sinh tổ hợp bữa ăn hoàn chỉnh, có cơ chế Retry nếu vi phạm Edge Cases
 * @param {Object} template - Khuôn mẫu MealTemplate
 * @param {Object} target - { protein, carbs, fat } gam mục tiêu của bữa
 * @param {Object} preferences - Tùy chọn (exclude, pin đồ ăn)
 * @returns {Object} { success, data, errors/warnings }
 */
const generateMealPlan = async (template, target, preferences = {}) => {
    const MAX_RETRIES = 5;
    let bestResult = null;
    let fewestErrorsCount = 999;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Bước 1: Pick ngẫu nhiên
            const foods = await pickIngredientsForTemplate(template, preferences);
            
            // Bước 2: Chạy Core Math
            const weights = calculateWeights(foods, target);
            if (!weights) continue; // Ma trận suy biến -> thử lại
            
            // Bước 3: Phân tích kết quả
            const validation = validateSolution(weights);
            
            // Nếu Pass hoàn toàn -> Trả về ngay lập tức
            if (validation.isValid) {
                return {
                    success: true,
                    data: weights,
                    warnings: validation.errors // Những warning nhẹ (quá nhiều/ít)
                };
            }

            // Nếu Failed: Lưu lại kết quả ít lỗi nhất để làm Fallback
            const errorCount = validation.errors.filter(e => e.severity === 'error').length;
            if (errorCount < fewestErrorsCount) {
                fewestErrorsCount = errorCount;
                bestResult = {
                    success: false,
                    data: weights,
                    errors: validation.errors
                };
            }
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
        }
    }

    // Thất bại toàn tập sau MAX_RETRIES -> Trả về bestResult (kèm lỗi để UX render cảnh báo)
    if (bestResult) {
         return bestResult;
    }
    
    return {
        success: false,
        errors: [{ type: 'FATAL', severity: 'error', message: 'Hệ thống không thể tạo tổ hợp nguyên liệu phù hợp với Macro này.' }]
    };
};

module.exports = {
    allocateMealTargets,
    pickIngredientsForTemplate,
    solveLinearSystem3x3,
    calculateWeights,
    validateSolution,
    generateMealPlan
};
