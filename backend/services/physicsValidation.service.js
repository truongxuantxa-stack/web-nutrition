'use strict';

/**
 * Physics Validation Service
 * Kiểm tra dữ liệu dinh dưỡng theo các quy tắc vật lý.
 * Phân loại 2 mức: errors (block hoàn toàn) và warnings (cảnh báo nhưng vẫn cho qua).
 */

/**
 * Validate dữ liệu dinh dưỡng theo các quy tắc vật lý.
 * LƯU Ý: Tất cả giá trị đầu vào phải tính theo đơn vị per-100g (nguyên liệu thô).
 * @param {{ calories: number, protein: number, carbs: number, fat: number, fiber?: number, sugar?: number, sodium?: number }} data
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
const validateNutritionPhysics = (data) => {
    const errors = [];   // Block hoàn toàn — dữ liệu phi lý
    const warnings = []; // Cảnh báo — có thể do nhãn kiểu Mỹ (Net Carb) hoặc đặc thù sản phẩm
    const { calories, protein, carbs, fat, fiber, sugar, sodium } = data;

    // Rule 1 [BLOCK]: Không cho phép số âm (bao gồm cả sodium)
    if (protein < 0 || carbs < 0 || fat < 0 || calories < 0 || (sodium != null && sodium < 0)) {
        errors.push('Giá trị dinh dưỡng không thể âm.');
    }

    // Rule 2 [BLOCK]: Tổng macro <= 100g (tính per 100g)
    if (protein + carbs + fat > 100) {
        errors.push(`Tổng P+C+F = ${(protein + carbs + fat).toFixed(1)}g > 100g/100g — phi lý.`);
    }

    // Rule 3 [BLOCK]: Calo tối đa 900 kcal/100g (thuần mỡ/dầu)
    if (calories > 900) {
        errors.push(`${calories} kcal/100g vượt giới hạn vật lý (max 900 kcal).`);
    }

    // Rule 4 [BLOCK]: Atwater check ±15%
    // Công thức Atwater: Protein*4 + Carbs*4 + Fat*9 = Calo ước tính
    const estimatedCal = (protein * 4) + (carbs * 4) + (fat * 9);
    if (calories > 0) {
        if (estimatedCal === 0) {
            // Macro đều = 0 nhưng calories > 0 → phi lý hoàn toàn
            errors.push(`Atwater mismatch: Calo ghi ${calories} nhưng tổng macro = 0g — dữ liệu phi lý.`);
        } else {
            const deviation = Math.abs(calories - estimatedCal) / calories;
            if (deviation > 0.15) {
                errors.push(`Atwater mismatch: Calo ghi ${calories}, ước tính ${estimatedCal.toFixed(0)} (sai lệch ${(deviation * 100).toFixed(0)}%).`);
            }
        }
    }

    // Rule 5 [WARN]: Fiber <= Carb, Sugar <= Carb
    // Lưu ý: Nhãn kiểu Mỹ (Nutrition Facts) tính Net Carb, Fiber có thể nằm ngoài Total Carb.
    // → Chỉ CẢNH BÁO thay vì block, để tránh reject nhầm sản phẩm nhập khẩu.
    if (fiber != null && fiber > carbs) {
        warnings.push('Chất xơ > Carb — Có thể do nhãn dùng Net Carb (kiểu Mỹ). Vui lòng kiểm tra lại.');
    }
    if (sugar != null && sugar > carbs) {
        warnings.push('Đường > Carb — Có thể do nhãn dùng Net Carb (kiểu Mỹ). Vui lòng kiểm tra lại.');
    }

    return { valid: errors.length === 0, errors, warnings };
};

module.exports = { validateNutritionPhysics };
