'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/nutrition.service.js
// Các hàm tính toán dinh dưỡng cốt lõi của hệ thống
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tính tuổi từ ngày sinh.
 * @param {string|Date} birthDate - Ngày sinh (YYYY-MM-DD hoặc Date object)
 * @returns {number} Tuổi (năm)
 */
const calculateAge = (birthDate) => {
    // Thêm 'T00:00:00' để parse theo local timezone, tránh lệch ngày ở UTC+7
    // VD: new Date('2000-01-15') → UTC midnight, có thể bị lùi 1 ngày trước 7h sáng VN
    const dateStr = typeof birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
        ? birthDate + 'T00:00:00'
        : birthDate;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

/**
 * Tính chỉ số BMI.
 * @param {number} weight - Cân nặng (kg)
 * @param {number} height - Chiều cao (cm)
 * @returns {number} BMI (làm tròn 1 chữ số thập phân)
 */
const calculateBMI = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    const heightM = height / 100;
    return Math.round((weight / (heightM * heightM)) * 10) / 10;
};

/**
 * Phân loại BMI theo WHO.
 * @param {number} bmi
 * @returns {{ label: string, color: string }}
 */
const classifyBMI = (bmi) => {
    if (bmi === null) return { label: 'Chưa xác định', color: 'gray' };
    if (bmi < 18.5) return { label: 'Thiếu cân', color: 'blue' };
    if (bmi < 25)   return { label: 'Bình thường', color: 'green' };
    if (bmi < 30)   return { label: 'Thừa cân', color: 'yellow' };
    return             { label: 'Béo phì', color: 'red' };
};

/**
 * Tính BMR (Basal Metabolic Rate) theo công thức Mifflin-St Jeor.
 * - Nam:  10 * weight + 6.25 * height - 5 * age + 5
 * - Nữ:   10 * weight + 6.25 * height - 5 * age - 161
 *
 * @param {Object} user - Đối tượng user từ Sequelize
 * @param {number} user.weight     - Cân nặng (kg)
 * @param {number} user.height     - Chiều cao (cm)
 * @param {string} user.gender     - 'male' | 'female'
 * @param {string} user.birthDate  - Ngày sinh (YYYY-MM-DD)
 * @returns {number|null} BMR (kcal/ngày), null nếu thiếu dữ liệu
 */
const calculateBMR = (user) => {
    const { weight, height, gender, birthDate } = user;

    if (!weight || !height || !gender || !birthDate) return null;

    const age = calculateAge(birthDate);
    const base = 10 * weight + 6.25 * height - 5 * age;

    return gender === 'male' ? Math.round(base + 5) : Math.round(base - 161);
};

/**
 * Hệ số hoạt động thể chất (PAL - Physical Activity Level).
 */
const ACTIVITY_FACTORS = {
    sedentary:   1.2,    // Ít vận động, ngồi nhiều
    light:       1.375,  // Nhẹ: 1-3 ngày/tuần
    moderate:    1.55,   // Vừa phải: 3-5 ngày/tuần
    active:      1.725,  // Nhiều: 6-7 ngày/tuần
    very_active: 1.9,    // Rất nhiều / vận động viên
};

/**
 * Label tiếng Việt cho activityLevel.
 */
const ACTIVITY_LABELS = {
    sedentary:   'Ít vận động',
    light:       'Vận động nhẹ (1-3 ngày/tuần)',
    moderate:    'Vận động vừa (3-5 ngày/tuần)',
    active:      'Vận động nhiều (6-7 ngày/tuần)',
    very_active: 'Vận động rất nhiều',
};

/**
 * Tính TDEE (Total Daily Energy Expenditure).
 * TDEE = BMR × Activity Factor
 *
 * @param {number} bmr           - Chỉ số BMR
 * @param {string} activityLevel - Mức độ hoạt động
 * @returns {number|null} TDEE (kcal/ngày), null nếu thiếu dữ liệu
 */
const calculateTDEE = (bmr, activityLevel) => {
    if (!bmr || !activityLevel) return null;
    const factor = ACTIVITY_FACTORS[activityLevel];
    if (!factor) return null;
    return Math.round(bmr * factor);
};

/**
 * Điều chỉnh TDEE theo mục tiêu sức khỏe.
 * - Giảm cân:    TDEE - 500 kcal (tạo thâm hụt calo)
 * - Duy trì:     TDEE (giữ nguyên)
 * - Tăng cân:    TDEE + 300 kcal (tăng nhẹ để tăng cơ)
 *
 * @param {number} tdee - TDEE cơ bản
 * @param {string} goal - 'lose_weight' | 'maintain_weight' | 'gain_weight'
 * @returns {number|null} Mục tiêu calo/ngày đã điều chỉnh
 */
const adjustCaloriesForGoal = (tdee, goal) => {
    if (!tdee) return null;
    switch (goal) {
        case 'lose_weight':     return Math.max(1200, tdee - 500); // Tối thiểu 1200 kcal
        case 'maintain_weight': return tdee;
        case 'gain_weight':     return tdee + 300;
        default:                return tdee;
    }
};

/**
 * Tính phân bổ Macros dựa trên tổng calo mục tiêu.
 * Tỷ lệ mặc định: Protein 30%, Carbs 40%, Fat 30%
 *
 * Công thức chuyển đổi:
 * - 1g Protein = 4 kcal
 * - 1g Carbs   = 4 kcal
 * - 1g Fat     = 9 kcal
 *
 * @param {number} targetCalories - Tổng calo mục tiêu/ngày
 * @returns {{ protein: number, carbs: number, fat: number }} Grams mỗi macro
 */
const calculateMacros = (targetCalories) => {
    if (!targetCalories) return { protein: 0, carbs: 0, fat: 0 };
    return {
        protein: Math.round((targetCalories * 0.30) / 4),  // 30% calo → grams
        carbs:   Math.round((targetCalories * 0.40) / 4),  // 40% calo → grams
        fat:     Math.round((targetCalories * 0.30) / 9),  // 30% calo → grams
    };
};

/**
 * Phân bổ target dinh dưỡng theo từng bữa ăn trong ngày.
 * Trọng số mặc định: Sáng 25%, Trưa 40%, Tối 30%, Phụ 5%.
 *
 * @param {number} targetCalories - Tổng calo mục tiêu/ngày
 * @returns {Object} { sang, trua, toi, phu } — mỗi key là { calories, protein, carbs, fat }
 */
const getMealTargets = (targetCalories) => {
    if (!targetCalories) {
        const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return { sang: zero, trua: zero, toi: zero, phu: zero };
    }
    const weights = { sang: 0.25, trua: 0.40, toi: 0.30, phu: 0.05 };
    const result  = {};
    Object.entries(weights).forEach(([meal, w]) => {
        const cal = Math.round(targetCalories * w);
        const macros = calculateMacros(cal);
        result[meal] = { calories: cal, ...macros };
    });
    return result;
};

/**
 * Scale macros tỉ lệ thuận theo effectiveTarget (sau khi cộng calo đốt từ luyện tập).
 * @param {Object} macros         - { protein, carbs, fat } gốc từ calculateMacros(targetCalories)
 * @param {number} targetCalories - Mục tiêu calo gốc (TDEE-based)
 * @param {number} effectiveTarget- Mục tiêu calo thực tế (TDEE + burned)
 * @returns {{ protein, carbs, fat }}
 */
const calculateEffectiveMacros = (macros, targetCalories, effectiveTarget) => {
    if (!macros || !targetCalories || targetCalories === 0) return macros;
    if (effectiveTarget === targetCalories) return macros;
    const ratio = effectiveTarget / targetCalories;
    return {
        protein: Math.round(macros.protein * ratio),
        carbs:   Math.round(macros.carbs   * ratio),
        fat:     Math.round(macros.fat     * ratio),
    };
};

/**
 * Phân bổ target dinh dưỡng động theo từng bữa — Phương án B.
 *
 * Logic:
 * - Bữa đã có món ăn: dùng phần % cố định của effectiveTarget làm tham chiếu.
 * - Bữa chưa có món:  chia đều "ngân sách còn lại" (remaining) theo trọng số tương đối.
 *
 * @param {number} effectiveTarget  - Mục tiêu calo thực tế (TDEE + burned)
 * @param {Object} mealConsumedMap  - { sang, trua, toi, phu } — { calories, protein, carbs, fat }
 * @returns {Object} { sang, trua, toi, phu } — mỗi key là { calories, protein, carbs, fat }
 */
const getDynamicMealTargets = (effectiveTarget, mealConsumedMap) => {
    const WEIGHTS = { sang: 0.25, trua: 0.40, toi: 0.30, phu: 0.05 };
    const MEALS   = ['sang', 'trua', 'toi', 'phu'];

    if (!effectiveTarget) {
        const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return { sang: zero, trua: zero, toi: zero, phu: zero };
    }

    // Tổng calo đã nạp toàn ngày
    const totalConsumed = MEALS.reduce(
        (s, m) => s + (mealConsumedMap[m]?.calories || 0), 0
    );
    const remaining = Math.max(effectiveTarget - totalConsumed, 0);

    // Xác định bữa "đã có món" vs "chưa có món"
    const hasFood       = (m) => (mealConsumedMap[m]?.calories || 0) > 0;
    const futureMeals   = MEALS.filter(m => !hasFood(m));
    const unusedWeight  = futureMeals.reduce((s, m) => s + WEIGHTS[m], 0);

    const targets = {};
    MEALS.forEach(m => {
        let cal;
        if (hasFood(m)) {
            // Bữa đã ăn → dùng phần % cố định của effectiveTarget làm tham chiếu lịch sử
            cal = Math.round(effectiveTarget * WEIGHTS[m]);
        } else if (unusedWeight > 0) {
            // Bữa chưa ăn → chia ngân sách còn lại theo trọng số tương đối
            cal = Math.round((WEIGHTS[m] / unusedWeight) * remaining);
        } else {
            cal = 0;
        }
        const macros = calculateMacros(cal);
        targets[m]   = { calories: cal, ...macros };
    });
    return targets;
};

/**
 * Hàm tổng hợp: Tính toán tất cả chỉ số dinh dưỡng cho một user.
 *
 * @param {Object} user - Đối tượng user Sequelize
 * @returns {Object} Tổng hợp các chỉ số
 */
const calculateAllMetrics = (user) => {
    const bmi       = calculateBMI(user.weight, user.height);
    const bmiClass  = classifyBMI(bmi);
    const bmr       = calculateBMR(user);
    const tdee      = calculateTDEE(bmr, user.activityLevel);
    const targetCal = adjustCaloriesForGoal(tdee, user.goal);
    const macros    = calculateMacros(targetCal);
    const age       = user.birthDate ? calculateAge(user.birthDate) : null;

    return {
        age,
        bmi,
        bmiClass,
        bmr,
        tdee,
        targetCalories: targetCal,
        macros,
        activityLabel: ACTIVITY_LABELS[user.activityLevel] || null,
        goalAdjustment: (() => {
            switch (user.goal) {
                case 'lose_weight':     return -500;
                case 'maintain_weight': return 0;
                case 'gain_weight':     return +300;
                default:                return 0;
            }
        })(),
    };
};

module.exports = {
    calculateAge,
    calculateBMI,
    classifyBMI,
    calculateBMR,
    calculateTDEE,
    adjustCaloriesForGoal,
    calculateMacros,
    getMealTargets,
    getDynamicMealTargets,
    calculateEffectiveMacros,
    calculateAllMetrics,
    ACTIVITY_FACTORS,
    ACTIVITY_LABELS,
};
