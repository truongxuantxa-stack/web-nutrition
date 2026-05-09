'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/suggestion.service.js
// Thuật toán gợi ý món ăn dựa trên calo còn thiếu và cân bằng macro
// ═══════════════════════════════════════════════════════════════════════════════

const { Food } = require('../models');
const { calculateMacros } = require('./nutrition.service');
const { Op } = require('sequelize');

/**
 * Tính tổng dinh dưỡng từ danh sách DiaryEntry trong ngày.
 *
 * @param {Array} entries - Mảng DiaryEntry (có include Food hoặc có snapshot)
 * @returns {{ calories: number, protein: number, carbs: number, fat: number }}
 */
const sumNutritionFromEntries = (entries) => {
    return entries.reduce((acc, entry) => {
        // Ưu tiên snapshot (bảo toàn dữ liệu lịch sử)
        const cal  = entry.caloriesSnapshot ?? (entry.food ? entry.food.calories * entry.amount : 0);
        const prot = entry.proteinSnapshot  ?? (entry.food ? entry.food.protein  * entry.amount : 0);
        const carb = entry.carbsSnapshot    ?? (entry.food ? entry.food.carbs    * entry.amount : 0);
        const fat  = entry.fatSnapshot      ?? (entry.food ? entry.food.fat      * entry.amount : 0);

        acc.calories += cal;
        acc.protein  += prot;
        acc.carbs    += carb;
        acc.fat      += fat;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
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
 * Gợi ý món ăn dựa trên calo còn thiếu và cân bằng macro.
 *
 * Thuật toán:
 * 1. Tính remainingCalories = targetCalories - totalConsumed
 * 2. Nếu remainingCalories <= 0 → không gợi ý (đã đủ calo)
 * 3. Tính tỷ lệ macro còn thiếu
 * 4. Lọc các món ăn có calories ≤ remainingCalories * 1.2 (có thể vượt nhẹ)
 * 5. Chấm điểm từng món dựa trên macro balance
 * 6. Trả về top 5 món điểm cao nhất
 *
 * @param {number} targetCalories   - Calo mục tiêu/ngày
 * @param {Object} consumed         - { calories, protein, carbs, fat } đã tiêu thụ
 * @param {string} [category]       - Lọc theo danh mục (optional)
 * @returns {Promise<Array>}        - Top 5 món ăn gợi ý
 */
const getSuggestions = async (targetCalories, consumed, category = null) => {
    const remainingCalories = targetCalories - consumed.calories;

    // Nếu đã đủ hoặc vượt calo → không gợi ý
    if (remainingCalories <= 50) {
        return [];
    }

    // Tính macro còn thiếu (gram)
    const totalMacros    = calculateMacros(targetCalories);
    const remainProtein  = Math.max(0, totalMacros.protein - consumed.protein);
    const remainCarbs    = Math.max(0, totalMacros.carbs   - consumed.carbs);
    const remainFat      = Math.max(0, totalMacros.fat     - consumed.fat);
    const remainTotal    = remainProtein + remainCarbs + remainFat || 1; // tránh chia 0

    try {
        // Lấy danh sách món ăn phù hợp (chỉ các món được phép gợi ý)
        const whereClause = {
            isSuggestable: true,
            calories: {
                [Op.gt]: 0,
                [Op.lte]: remainingCalories * 1.3, // Cho phép vượt nhẹ 30%
            },
        };
        if (category) {
            whereClause.category = category;
        }

        const foods = await Food.findAll({
            where: whereClause,
            limit: 100, // Lấy tối đa 100 món để tính điểm
        });

        if (foods.length === 0) return [];

        // Chấm điểm từng món dựa trên mức độ phù hợp macro
        const scoredFoods = foods.map(food => {
            // Điểm calo: càng gần remainingCalories càng tốt (0-40 điểm)
            const calRatio = food.calories / remainingCalories;
            const calScore = calRatio <= 1
                ? 40 * (1 - Math.abs(calRatio - 0.4))   // Gần 40% calo còn lại là tốt nhất
                : 40 * Math.max(0, 1 - (calRatio - 1));  // Vượt quá thì trừ điểm

            // Điểm protein (0-25 điểm): Ưu tiên nếu còn thiếu protein nhiều
            const proteinWeight = remainProtein / remainTotal;
            const proteinScore  = proteinWeight > 0
                ? 25 * Math.min(1, (food.protein / (remainProtein + 0.1)))
                : 0;

            // Điểm carbs (0-20 điểm)
            const carbsWeight = remainCarbs / remainTotal;
            const carbsScore  = carbsWeight > 0
                ? 20 * Math.min(1, (food.carbs / (remainCarbs + 0.1)))
                : 0;

            // Điểm fat (0-15 điểm)
            const fatWeight = remainFat / remainTotal;
            const fatScore  = fatWeight > 0
                ? 15 * Math.min(1, (food.fat / (remainFat + 0.1)))
                : 0;

            const totalScore = calScore + proteinScore + carbsScore + fatScore;

            return {
                food,
                score: Math.round(totalScore * 10) / 10,
                remainingAfter: Math.round(remainingCalories - food.calories),
            };
        });

        // Sắp xếp theo điểm giảm dần → lấy top 5
        scoredFoods.sort((a, b) => b.score - a.score);
        return scoredFoods.slice(0, 5);
    } catch (err) {
        console.error('Suggestion service error:', err);
        return [];
    }
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
 * @param {Object} consumed - { calories, protein, carbs, fat }
 * @param {Object} metrics  - { targetCalories, macros: { protein, carbs, fat } }
 * @returns {Array} Mảng các cảnh báo { type: string, icon: string, message: string }
 */
const getHealthInsights = (consumed, metrics, mealGroups = {}) => {
    const insights = [];
    if (!metrics.targetCalories) return insights;

    const calPct = (consumed.calories / metrics.targetCalories) * 100;

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
        const pPct = (consumed.protein / (metrics.macros.protein || 1)) * 100;
        const cPct = (consumed.carbs / (metrics.macros.carbs || 1)) * 100;
        const fPct = (consumed.fat / (metrics.macros.fat || 1)) * 100;

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
    getSuggestions,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
};
