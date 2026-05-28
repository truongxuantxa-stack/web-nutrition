'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/suggestion.service.js
// Thuật toán gợi ý món ăn dựa trên calo còn thiếu và cân bằng macro
// ═══════════════════════════════════════════════════════════════════════════════

const { Food } = require('../models');
const { calculateMacros } = require('./nutrition.service');
const { Op } = require('sequelize');

// Các gợi ý món ăn tự động đã được gỡ bỏ để tối ưu hệ thống và đúng với triết lý "Hardcore Tracking" của dự án.

/**
 * Tính tổng dinh dưỡng từ danh sách DiaryEntry trong ngày.
 *
 * @param {Array} entries - Mảng DiaryEntry (có include Food hoặc có snapshot)
 * @returns {{ calories: number, protein: number, carbs: number, fat: number }}
 */
const sumNutritionFromEntries = (entries) => {
    return entries.reduce((acc, entry) => {
        // Ưu tiên snapshot (bảo toàn dữ liệu lịch sử)
        const isRaw = entry.food && entry.food.foodType === 'raw';
        const factor = isRaw ? entry.amount / 100 : entry.amount;

        const cal    = entry.caloriesSnapshot ?? (entry.food ? entry.food.calories * factor : 0);
        const prot   = entry.proteinSnapshot  ?? (entry.food ? entry.food.protein  * factor : 0);
        const carb   = entry.carbsSnapshot    ?? (entry.food ? entry.food.carbs    * factor : 0);
        const fat    = entry.fatSnapshot      ?? (entry.food ? entry.food.fat      * factor : 0);

        acc.calories += cal;
        acc.protein  += prot;
        acc.carbs    += carb;
        acc.fat      += fat;

        // Fiber / Sugar / Sodium: chỉ cộng nếu có dữ liệu (null = chưa có số liệu)
        const fiberVal  = entry.fiberSnapshot  ?? (entry.food?.fiber  != null ? entry.food.fiber  * factor : null);
        const sugarVal  = entry.sugarSnapshot  ?? (entry.food?.sugar  != null ? entry.food.sugar  * factor : null);
        const sodiumVal = entry.sodiumSnapshot ?? (entry.food?.sodium != null ? entry.food.sodium * factor : null);
        const vitaminAVal = entry.vitaminASnapshot ?? (entry.food?.vitaminA != null ? entry.food.vitaminA * factor : null);
        const vitaminCVal = entry.vitaminCSnapshot ?? (entry.food?.vitaminC != null ? entry.food.vitaminC * factor : null);
        const calciumVal  = entry.calciumSnapshot  ?? (entry.food?.calcium  != null ? entry.food.calcium  * factor : null);
        const ironVal     = entry.ironSnapshot     ?? (entry.food?.iron     != null ? entry.food.iron     * factor : null);

        if (fiberVal  != null) acc.fiber  = (acc.fiber  ?? 0) + fiberVal;
        if (sugarVal  != null) acc.sugar  = (acc.sugar  ?? 0) + sugarVal;
        if (sodiumVal != null) acc.sodium = (acc.sodium ?? 0) + sodiumVal;
        if (vitaminAVal != null) acc.vitaminA = (acc.vitaminA ?? 0) + vitaminAVal;
        if (vitaminCVal != null) acc.vitaminC = (acc.vitaminC ?? 0) + vitaminCVal;
        if (calciumVal  != null) acc.calcium  = (acc.calcium  ?? 0) + calciumVal;
        if (ironVal     != null) acc.iron     = (acc.iron     ?? 0) + ironVal;

        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: null, sugar: null, sodium: null, vitaminA: null, vitaminC: null, calcium: null, iron: null });
};

/**
 * Nhóm các DiaryEntry theo loại bữa ăn.
 *
 * @param {Array} entries - Mảng DiaryEntry
 * @returns {Object} { sang: [], trua: [], toi: [], phu: [] }
 */
const groupEntriesByMeal = (entries) => {
    const groups = { sang: [], trua: [], toi: [], phu: [] };
    entries.forEach(entry => {
        if (groups[entry.mealType]) {
            groups[entry.mealType].push(entry);
        }
    });
    return groups;
};



/**
 * Tính phần trăm hoàn thành mục tiêu calo trong ngày.
 * @param {number} consumed  - Calo đã tiêu thụ
 * @param {number} target    - Calo mục tiêu
 * @returns {number} Phần trăm (0-100, làm tròn)
 */
const getCalorieProgress = (consumed, target) => {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
};

/**
 * Tính phần trăm macro đã đạt so với mục tiêu.
 * @param {Object} consumed  - { protein, carbs, fat }
 * @param {Object} targets   - { protein, carbs, fat }
 * @returns {Object} { protein: %, carbs: %, fat: % }
 */
const getMacroProgress = (consumed, targets) => {
    const pct = (c, t) => (t > 0 ? Math.min(100, Math.round((c / t) * 100)) : 0);
    return {
        protein: pct(consumed.protein, targets.protein),
        carbs:   pct(consumed.carbs,   targets.carbs),
        fat:     pct(consumed.fat,     targets.fat),
    };
};

/**
 * Phân tích và đưa ra các cảnh báo về sức khỏe/dinh dưỡng dựa trên tiến độ.
 * @param {Object} consumed         - { calories, protein, carbs, fat }
 * @param {Object} metrics          - { targetCalories, macros: { protein, carbs, fat } }
 * @param {Object} mealGroups       - { sang: [], trua: [], ... }
 * @returns {Array} Mảng các cảnh báo { type, icon, message }
 */
const getHealthInsights = (consumed, metrics, mealGroups = {}) => {
    const insights = [];
    const targetCal = metrics.targetCalories;
    const macros    = metrics.macros;
    if (!targetCal) return insights;

    const calPct = (consumed.calories / targetCal) * 100;

    // 1. Cảnh báo Calo
    if (calPct > 110) {
        insights.push({
            type: 'error',
            icon: '⚠️',
            message: `Bạn đã nạp vượt ${Math.round(calPct - 100)}% mục tiêu calo. Hãy chú ý vận động để tiêu bớt năng lượng nhé!`
        });
    } else if (calPct > 100) {
        insights.push({
            type: 'warning',
            icon: '⚡',
            message: 'Đã đạt mục tiêu calo. Bạn nên hạn chế ăn thêm các món giàu năng lượng trong phần còn lại của ngày.'
        });
    }

    // 2. Cảnh báo mất cân bằng Macro (chỉ phân tích khi đã nạp > 40% calo)
    if (calPct > 40) {
        const pPct = (consumed.protein / (macros.protein || 1)) * 100;
        const cPct = (consumed.carbs   / (macros.carbs   || 1)) * 100;
        const fPct = (consumed.fat     / (macros.fat     || 1)) * 100;

        // Cảnh báo thiếu hụt tương đối (so với tiến độ calo)
        if (cPct < calPct * 0.6) {
            insights.push({
                type: 'warning',
                icon: '🍚',
                message: 'Lượng tinh bột (Carbs) đang hơi thấp. Bạn có thể cảm thấy mệt mỏi hoặc thiếu năng lượng, hãy bổ sung thêm nhé.'
            });
        }
        if (pPct < calPct * 0.6) {
            insights.push({
                type: 'warning',
                icon: '🥩',
                message: 'Tỷ lệ chất đạm đang thấp. Đạm giúp no lâu và duy trì cơ bắp, hãy ưu tiên thịt nạc hoặc đậu.'
            });
        }
        // Cảnh báo dư thừa tương đối
        if (fPct > calPct * 1.5) {
            insights.push({
                type: 'warning',
                icon: '🥑',
                message: 'Tỷ lệ chất béo đang khá cao. Bạn nên chọn các món luộc, hấp thay vì chiên xào cho bữa tiếp theo.'
            });
        }
    }

    // 2.5. Cảnh báo Vi chất (khi nạp > 60% calo)
    if (calPct > 60) {
        const fiberRDI = 25;
        const calciumRDI = 1000;
        const ironRDI = 18;
        const vitaminCRDI = 75;
        const sodiumTarget = 2300;
        const sugarTarget = 25;

        if (consumed.fiber != null && consumed.fiber < fiberRDI * 0.5) {
            insights.push({ type: 'warning', icon: '🥦', message: 'Chất xơ đang thấp, hãy bổ sung rau xanh, ngũ cốc nguyên hạt.' });
        }
        if (consumed.calcium != null && consumed.calcium < calciumRDI * 0.4) {
            insights.push({ type: 'warning', icon: '🥛', message: 'Canxi thấp, hãy uống sữa hoặc ăn rau lá xanh đậm.' });
        }
        if (consumed.iron != null && consumed.iron < ironRDI * 0.4) {
            insights.push({ type: 'warning', icon: '🥩', message: 'Sắt thấp, hãy ăn thịt đỏ, gan hoặc rau chân vịt.' });
        }
        if (consumed.vitaminC != null && consumed.vitaminC < vitaminCRDI * 0.4) {
            insights.push({ type: 'warning', icon: '🍊', message: 'Thiếu Vitamin C, hãy ăn cam, ổi hoặc ớt chuông.' });
        }
        if (consumed.sodium != null && consumed.sodium > sodiumTarget) {
            insights.push({ type: 'warning', icon: '🧂', message: 'Natri cao, hạn chế đồ mặn và thực phẩm chế biến sẵn.' });
        }
        if (consumed.sugar != null && consumed.sugar > sugarTarget) {
            insights.push({ type: 'warning', icon: '🍬', message: 'Đường cao, giảm đồ ngọt và nước có ga.' });
        }
    }

    // 3. Cảnh báo Cân bằng Bữa ăn (Áp dụng riêng cho Nguyên liệu thô)
    const mealNames = { sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ' };
    
    Object.entries(mealGroups).forEach(([mealKey, entries]) => {
        // Lọc ra các món thô trong bữa ăn hiện tại
        const rawFoods = entries.filter(e => e.food && e.food.foodType === 'raw');
        
        // Chỉ kích hoạt cảnh báo nếu bữa ăn CÓ thực phẩm thô
        if (rawFoods.length > 0) {
            const categories = new Set(rawFoods.map(e => e.food.category));
            const mealName = mealNames[mealKey];
            
            if (!categories.has('carb')) {
                insights.push({
                    type: 'warning',
                    icon: '🌽',
                    message: `${mealName} dùng thực phẩm thô nhưng đang thiếu nhóm Tinh bột/Chất xơ (Carb). Hãy bổ sung gạo lứt, khoai lang hoặc rau xanh nhé!`
                });
            }
            if (!categories.has('protein')) {
                insights.push({
                    type: 'warning',
                    icon: '🍗',
                    message: `${mealName} dùng thực phẩm thô đang thiếu nhóm Đạm (Protein). Đừng quên bổ sung thịt, cá, trứng hoặc đậu!`
                });
            }
            if (!categories.has('fat')) {
                insights.push({
                    type: 'warning',
                    icon: '🥜',
                    message: `${mealName} dùng thực phẩm thô đang thiếu nhóm Chất béo tốt (Fat). Một chút bơ, hạt dinh dưỡng hoặc dầu olive sẽ giúp bạn hấp thụ vitamin tốt hơn!`
                });
            }
        }
    });

    return insights;
};




module.exports = {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
};
