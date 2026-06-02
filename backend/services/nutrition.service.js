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
 * - Giảm cân:    TDEE - 500 kcal (tạo thâm hụt calo, nhưng KHÔNG BAO GIỜ DƯỚI BMR)
 * - Duy trì:     TDEE (giữ nguyên)
 * - Tăng cân:    TDEE + 300 kcal (tăng nhẹ để tăng cơ)
 *
 * @param {number} tdee - TDEE cơ bản
 * @param {string} goal - 'lose_weight' | 'maintain_weight' | 'gain_weight'
 * @param {number} bmr  - BMR để làm mức sàn (chốt chặn an toàn)
 * @returns {number|null} Mục tiêu calo/ngày đã điều chỉnh
 */
const adjustCaloriesForGoal = (tdee, goal, bmr) => {
    if (!tdee) return null;
    const floor = bmr ? Math.round(bmr) : 1200;
    switch (goal) {
        case 'lose_weight':     return Math.max(floor, tdee - 500); // Tối thiểu bằng BMR
        case 'maintain_weight': return tdee;
        case 'gain_weight':     return tdee + 300;
        default:                return tdee;
    }
};

/**
 * Tỷ lệ Macro mặc định của hệ thống (%).
 * Dùng làm fallback khi user chưa tự thiết lập.
 */
const MACRO_DEFAULTS = { protein: 30, carbs: 40, fat: 30 };

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
 * @param {Object} [ratios={}]    - { protein, carbs, fat } tỷ lệ % tùy chỉnh; null → dùng default
 * @returns {{ protein: number, carbs: number, fat: number }} Grams mỗi macro
 */
const calculateMacros = (targetCalories, ratios = {}) => {
    if (!targetCalories) return { protein: 0, carbs: 0, fat: 0 };
    // null (user cũ chưa thiết lập) → fallback về MACRO_DEFAULTS
    const p = (ratios.protein ?? MACRO_DEFAULTS.protein) / 100;
    const c = (ratios.carbs   ?? MACRO_DEFAULTS.carbs)   / 100;
    const f = (ratios.fat     ?? MACRO_DEFAULTS.fat)     / 100;
    return {
        protein: Math.round((targetCalories * p) / 4),
        carbs:   Math.round((targetCalories * c) / 4),
        fat:     Math.round((targetCalories * f) / 9),
    };
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
    const staticTDEE = calculateTDEE(bmr, user.activityLevel);
    
    // Tích hợp Adaptive TDEE
    const isAdaptiveActive = user.useAdaptiveTDEE && user.adaptiveTDEE !== null;
    const tdee = isAdaptiveActive ? user.adaptiveTDEE : staticTDEE;
    
    const targetCal = adjustCaloriesForGoal(tdee, user.goal, bmr);
    const age       = user.birthDate ? calculateAge(user.birthDate) : null;

    // Đọc ratios từ user (null = user cũ chưa thiết lập → calculateMacros tự fallback)
    const ratios = {
        protein: user.macroProtein,
        carbs:   user.macroCarbs,
        fat:     user.macroFat,
    };
    const macros = calculateMacros(targetCal, ratios);

    // Trả về ratios thực tế (đã resolve null → default) để UI hiển thị đúng
    const macroRatios = {
        protein: ratios.protein ?? MACRO_DEFAULTS.protein,
        carbs:   ratios.carbs   ?? MACRO_DEFAULTS.carbs,
        fat:     ratios.fat     ?? MACRO_DEFAULTS.fat,
        isCustom: ratios.protein !== null,  // flag để UI biết user đã tùy chỉnh chưa
    };

    return {
        age,
        bmi,
        bmiClass,
        bmr,
        tdee,
        staticTDEE,
        isAdaptiveActive,
        targetCalories: targetCal,
        macros,
        macroRatios,
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

/**
 * Tính mục tiêu nước uống mỗi ngày dựa trên cân nặng.
 * Công thức y khoa cơ bản: weight (kg) × 35 ml
 *
 * VD: 45kg → 1575ml | 70kg → 2450ml | 80kg → 2800ml
 *
 * @param {number} weight - Cân nặng (kg)
 * @returns {number|null} Lượng nước mục tiêu (ml), null nếu chưa có cân nặng
 */
const calculateWaterGoal = (weight) => {
    if (!weight || weight <= 0) return null;
    return Math.round(weight * 35);
};

module.exports = {
    calculateAge,
    calculateBMI,
    classifyBMI,
    calculateBMR,
    calculateTDEE,
    adjustCaloriesForGoal,
    calculateMacros,
    calculateAllMetrics,
    calculateWaterGoal,
    ACTIVITY_FACTORS,
    ACTIVITY_LABELS,
    MACRO_DEFAULTS,
};
