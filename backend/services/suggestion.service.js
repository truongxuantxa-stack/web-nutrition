'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/suggestion.service.js
// Thuật toán gợi ý món ăn dựa trên calo còn thiếu và cân bằng macro
// ═══════════════════════════════════════════════════════════════════════════════



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

// ─── Bộ quy tắc y khoa cho Health Insights ───────────────────────────────────
// AHA Sugar threshold: 36g (Nam) / 25g (Nữ)
// Phân loại severity: danger > warning > water > suggestion
// Context-Awareness: shouldWarnDeficiency = (calPct >= 100 || currentHour >= 20)

/**
 * Đánh giá dinh dưỡng theo bộ quy tắc y khoa 4 cấp độ với Context-Awareness.
 *
 * @param {Object} consumed      - { calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron }
 * @param {Object} metrics       - { targetCalories, macros: { protein, carbs, fat } }
 * @param {Object} mealGroups    - { sang: [], trua: [], toi: [], phu: [] }
 * @param {number} waterTotal    - Lượng nước đã uống (ml)
 * @param {number} waterGoal     - Mục tiêu nước (ml)
 * @param {string} gender        - 'male' | 'female' (cho ngưỡng AHA đường)
 * @param {boolean} isHistorical - cờ đánh dấu dữ liệu quá khứ (ví dụ: báo cáo PDF) để không bị ảnh hưởng bởi giờ hiện tại
 * @returns {Array} Mảng { severity, icon, title, message }
 *   severity: 'danger' | 'warning' | 'suggestion' | 'water'
 */
const getHealthInsights = (consumed, metrics, mealGroups = {}, waterTotal = 0, waterGoal = 2000, gender = 'male', isHistorical = false) => {
    const dangerInsights     = [];
    const warningInsights    = [];
    const waterInsights      = [];
    const suggestionInsights = [];

    const targetCal = metrics.targetCalories;
    const macros    = metrics.macros || {};
    if (!targetCal) return [];

    // Empty state: Nếu chưa nhập đồ ăn và cũng chưa nhập nước -> Không hiển thị tư vấn
    if ((!consumed || consumed.calories === 0) && waterTotal === 0) {
        return [];
    }

    const calPct      = (consumed.calories / targetCal) * 100;
    const currentHour = new Date().getHours();

    // Gate cảnh báo THIẾU: kích hoạt luôn nếu là dữ liệu quá khứ (isHistorical), hoặc khi đã đạt 100% calo HOẶC sau 20:00
    // LƯU Ý: Chỉ cảnh báo thiếu chất khi người dùng ĐÃ bắt đầu ghi nhận đồ ăn (calories > 0)
    const shouldWarnDeficiency = (isHistorical || calPct >= 100 || currentHour >= 20) && consumed.calories > 0;

    // ── RDI chuẩn ────────────────────────────────────────────────────────────
    const isMale      = gender !== 'female';
    const sugarLimit  = isMale ? 36 : 25;    // AHA
    const sodiumLimit = 2300;                  // WHO/AHA
    const fiberRDI    = isMale ? 38 : 25;
    const calciumRDI  = 1000;
    const ironRDI     = isMale ? 8 : 18;
    const vitaminCRDI = isMale ? 90 : 75;

    // ════════════════════════════════════════════════════════════════════════════
    // NHÓM THỪA — kích hoạt MỌI LÚC (ăn mặn lúc sáng vẫn cần cảnh báo)
    // ════════════════════════════════════════════════════════════════════════════

    // Calo vượt mục tiêu
    if (calPct > 110) {
        dangerInsights.push({
            severity: 'danger',
            icon: '🔥',
            title: `Vượt ${Math.round(calPct - 100)}% mục tiêu calo!`,
            message: 'Năng lượng dư thừa sẽ được tích trữ thành mỡ. Hãy tăng vận động hoặc giảm bữa phụ.',
        });
    } else if (calPct > 100) {
        warningInsights.push({
            severity: 'warning',
            icon: '⚡',
            title: isHistorical ? 'Đã đạt mục tiêu calo trung bình' : 'Đã đạt mục tiêu calo hôm nay',
            message: 'Bạn nên dừng ăn thêm hoặc chọn rau/nước thay vì thực phẩm giàu năng lượng.',
        });
    }

    // Natri (Muối) — nguy hiểm tim mạch
    if (consumed.sodium != null && consumed.sodium > sodiumLimit) {
        dangerInsights.push({
            severity: 'danger',
            icon: '🧂',
            title: isHistorical ? `Lượng muối rất cao (${Math.round(consumed.sodium)}mg)` : `Lượng muối hôm nay rất cao (${Math.round(consumed.sodium)}mg)`,
            message: 'Nguy cơ tích nước và tăng huyết áp. Hãy uống thêm nước lọc để hỗ trợ đào thải nhé!',
        });
    }

    // Đường (Sugar) — chuẩn AHA
    if (consumed.sugar != null && consumed.sugar > sugarLimit) {
        dangerInsights.push({
            severity: 'danger',
            icon: '🍬',
            title: `Đã vượt lượng đường khuyến nghị (${Math.round(consumed.sugar)}g/${sugarLimit}g)`,
            message: 'Đường dư thừa làm tăng insulin, tích mỡ bụng và gây mệt mỏi. Hạn chế đồ ngọt vào cuối ngày.',
        });
    }

    // Carb vượt 120% mục tiêu
    if (macros.carbs > 0) {
        const carbPct = (consumed.carbs / macros.carbs) * 100;
        if (carbPct > 120) {
            dangerInsights.push({
                severity: 'danger',
                icon: '🍚',
                title: `Tinh bột vượt mức ${Math.round(carbPct - 100)}% so với mục tiêu`,
                message: 'Nguy cơ tăng đường huyết và buồn ngủ sau ăn. Hãy bù đắp bằng rau xanh và vận động nhẹ.',
            });
        }
    }

    // Fat vượt 150% mục tiêu
    if (macros.fat > 0) {
        const fatPct = (consumed.fat / macros.fat) * 100;
        if (fatPct > 150) {
            warningInsights.push({
                severity: 'warning',
                icon: '🥑',
                title: 'Tỷ lệ chất béo đang khá cao',
                message: 'Bạn nên chọn các món luộc, hấp thay vì chiên xào cho bữa tiếp theo.',
            });
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // NHÓM THIẾU — chỉ cảnh báo khi shouldWarnDeficiency = true
    // ════════════════════════════════════════════════════════════════════════════
    if (shouldWarnDeficiency) {

        // Protein < 80% mục tiêu
        if (macros.protein > 0 && (consumed.protein / macros.protein) * 100 < 80) {
            warningInsights.push({
                severity: 'warning',
                icon: '🥩',
                title: isHistorical ? 'Bạn đang nạp hơi ít Protein' : 'Hôm nay bạn đang nạp hơi ít Protein',
                message: 'Thiếu đạm có thể gây mất cơ bắp, đặc biệt khi đang giảm cân. Ưu tiên thịt nạc, trứng, đậu.',
            });
        }

        // Fat < 20% tổng calo đã nạp
        if (consumed.calories > 0) {
            const fatCalRatio = (consumed.fat * 9 / consumed.calories) * 100;
            if (fatCalRatio < 20 && consumed.calories > 500) {
                warningInsights.push({
                    severity: 'warning',
                    icon: '🫒',
                    title: 'Lượng chất béo đang quá thấp',
                    message: 'Cơ thể cần chất béo để tổng hợp hormone và hấp thụ Vitamin A,D,E,K. Đừng sợ chất béo tốt (dầu olive, bơ, hạt)!',
                });
            }
        }

        // Chất xơ < 25g (ngưỡng tối thiểu WHO)
        if (consumed.fiber != null && consumed.fiber < 25) {
            warningInsights.push({
                severity: 'warning',
                icon: '🥦',
                title: `Hệ tiêu hóa đang thiếu chất xơ (${Math.round(consumed.fiber * 10) / 10}g/${fiberRDI}g)`,
                message: 'Hãy bổ sung ngay 1 đĩa rau xanh hoặc trái cây! Chất xơ nuôi vi khuẩn có lợi trong ruột.',
            });
        }

        // Vi chất — Canxi
        if (consumed.calcium != null && consumed.calcium < calciumRDI * 0.8) {
            suggestionInsights.push({
                severity: 'suggestion',
                icon: '🥛',
                title: isHistorical ? 'Canxi chưa đạt 80% mức khuyến nghị' : 'Canxi hôm nay chưa đạt 80% mức khuyến nghị',
                message: isHistorical ? 'Cân nhắc uống 1 ly sữa ít béo hoặc ăn thêm rau cải xanh, hạnh nhân.' : 'Cân nhắc uống 1 ly sữa ít béo hoặc ăn thêm rau cải xanh, hạnh nhân vào ngày mai.',
            });
        }

        // Vi chất — Sắt
        if (consumed.iron != null && consumed.iron < ironRDI * 0.8) {
            suggestionInsights.push({
                severity: 'suggestion',
                icon: '🫀',
                title: isHistorical ? 'Lượng Sắt còn thiếu' : 'Lượng Sắt hôm nay còn thiếu',
                message: 'Sắt cần cho máu và năng lượng. Bổ sung thịt đỏ, gan, hoặc rau chân vịt kết hợp Vitamin C để tăng hấp thụ.',
            });
        }

        // Vi chất — Vitamin C
        if (consumed.vitaminC != null && consumed.vitaminC < vitaminCRDI * 0.8) {
            suggestionInsights.push({
                severity: 'suggestion',
                icon: '🍊',
                title: isHistorical ? 'Vitamin C chưa đủ' : 'Vitamin C hôm nay chưa đủ',
                message: 'Vitamin C tăng đề kháng và giúp hấp thụ Sắt. Ăn cam, ổi, ớt chuông hoặc kiwi là đủ nhu cầu ngay.',
            });
        }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // NHÓM NƯỚC — kích hoạt MỌI LÚC (uống đủ nước luôn cần thiết)
    // ════════════════════════════════════════════════════════════════════════════
    if (waterGoal > 0 && waterTotal < waterGoal) {
        const waterPct = Math.round((waterTotal / waterGoal) * 100);
        waterInsights.push({
            severity: 'water',
            icon: '💧',
            title: `Cơ thể bạn đang thiếu nước mới đạt (${waterPct}% mục tiêu)`,
            message: 'Thiếu nước làm chậm trao đổi chất và giảm năng lượng. Hãy uống ngay 1-2 ly nước nhé!',
        });
    }

    // ── Sắp xếp theo ưu tiên: danger → warning → water → suggestion ──────────
    return [...dangerInsights, ...warningInsights, ...waterInsights, ...suggestionInsights];
};


/**
 * Tính Điểm Sức Khỏe Hôm Nay (0-100).
 * Trả về { score: null } nếu chưa có dữ liệu ăn (Empty State).
 *
 * @param {Object} consumed    - { calories, protein, fiber }
 * @param {Object} metrics     - { targetCalories, macros }
 * @param {number} waterTotal  - ml nước đã uống
 * @param {number} waterGoal   - ml nước mục tiêu
 * @param {Array}  insights    - mảng insights đã tính từ getHealthInsights
 * @param {string} gender      - 'male' | 'female'
 * @returns {{ score: number|null, label: string, emoji: string, bonuses: Array }}
 */
const calculateDailyHealthScore = (consumed, metrics, waterTotal, waterGoal, insights, gender = 'male') => {
    // ── Empty State: chưa ăn gì → không tính điểm ────────────────────────────
    if (!consumed || consumed.calories === 0) {
        return { score: null, label: 'Chưa có dữ liệu', emoji: '🍽️', bonuses: [] };
    }

    const isMale   = gender !== 'female';
    const fiberRDI = isMale ? 38 : 25;
    const targetCal = metrics.targetCalories || 0;
    const calPct    = targetCal > 0 ? (consumed.calories / targetCal) * 100 : 0;

    // ── Trừ điểm theo vi phạm ─────────────────────────────────────────────────
    const PENALTY = { danger: 15, warning: 8, water: 5, suggestion: 3 };
    let score = 100;
    for (const insight of insights) {
        score -= (PENALTY[insight.severity] || 0);
    }

    // ── Cộng điểm thưởng (bonus) ──────────────────────────────────────────────
    const bonuses = [];

    if (calPct >= 90 && calPct <= 110) {
        score += 5;
        bonuses.push({ key: 'calo', label: 'Calo trong khoảng lý tưởng', points: 5 });
    }
    if (metrics.macros?.protein > 0 && consumed.protein >= metrics.macros.protein) {
        score += 3;
        bonuses.push({ key: 'protein', label: 'Đạt mục tiêu Protein', points: 3 });
    }
    if (waterGoal > 0 && waterTotal >= waterGoal) {
        score += 5;
        bonuses.push({ key: 'water', label: 'Uống đủ nước mục tiêu', points: 5 });
    }
    if (consumed.fiber != null && consumed.fiber >= fiberRDI) {
        score += 2;
        bonuses.push({ key: 'fiber', label: 'Đạt mục tiêu Chất xơ', points: 2 });
    }

    score = Math.max(0, Math.min(100, score));

    // ── Phân loại điểm ───────────────────────────────────────────────────────
    let label, emoji;
    if      (score >= 90) { label = 'Tuyệt vời';       emoji = '🏆'; }
    else if (score >= 75) { label = 'Rất tốt';          emoji = '💪'; }
    else if (score >= 60) { label = 'Khá ổn';           emoji = '👍'; }
    else if (score >= 40) { label = 'Cần cải thiện';    emoji = '⚡'; }
    else                  { label = 'Đáng lo ngại';     emoji = '⚠️'; }

    return { score, label, emoji, bonuses };
};




module.exports = {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
    calculateDailyHealthScore,
};
