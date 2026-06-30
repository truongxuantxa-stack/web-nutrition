/**
 * Food Scoring Service — Nutrient Density per 100 Kcal
 */

// [FIX #6] Tập trung tất cả ngưỡng dinh dưỡng vào một config object duy nhất.
// Khi chuẩn dinh dưỡng thay đổi (ví dụ WHO cập nhật), chỉ cần sửa ở đây.
const NUTRIENT_THRESHOLDS = {
    sodium:  { warning: 100, danger: 150 },   // mg/100kcal
    sugar:   { warning: 2.5, danger: 5 },     // g/100kcal
    protein: { excellent: 5,    good: 3 },    // g/100kcal
    fiber:   { excellent: 1.25, good: 0.7 },  // g/100kcal (FDA DV 28g/2000kcal → excellent≈25g, good≈14g)
    vitaminA: { excellent: 45,  good: 22.5 }, // mcg RAE/100kcal (FDA DV 900mcg RAE/2000kcal)
    vitaminC: { excellent: 10,  good: 5  },   // mg/100kcal
    calcium:  { excellent: 50,  good: 25 },   // mg/100kcal
    iron:     { excellent: 1.5, good: 0.8 },  // mg/100kcal
};

const FIBER_EXEMPT_CATEGORIES = ['thit_ca', 'protein', 'fat', 'vitamin', 'fiber'];

/**
 * Tính điểm cho 1 món ăn dựa trên mật độ dinh dưỡng trên 100 kcal
 * @param {Object} food - Object thông tin món ăn từ database (chứa calories, sugar, sodium, protein, fiber)
 * @returns {Object} Kết quả chấm điểm
 */
function scoreFoodItem(food) {
    if (!food || typeof food.calories !== 'number') {
        return {
            skipped: true,
            skipReason: 'invalid_data',
            dataCompleteness: 'skipped',
            qualityScore: null,
            qualityLevel: null,
            qualityLabel: 'Lỗi dữ liệu',
            badgeIcon: '❓',
            badgeTooltip: 'Dữ liệu không hợp lệ',
            sodium: { available: false },
            sugar: { available: false },
            protein: { available: false },
            fiber: { available: false },
            vitaminA: { available: false },
            vitaminC: { available: false },
            calcium: { available: false },
            iron: { available: false },
        };
    }

    // 1. Zero Calorie Guard
    if (food.calories < 20) {
        return {
            skipped: true,
            skipReason: 'low_calorie',
            qualityScore: null,
            qualityLevel: null,
            qualityLabel: '🥤 Không tính điểm (Ít calo)',
            badgeIcon: '🥤',
            badgeTooltip: 'Ít calo — không áp dụng đánh giá mật độ',
            sodium: { available: false },
            sugar: { available: false },
            protein: { available: false },
            fiber: { available: false },
            vitaminA: { available: false },
            vitaminC: { available: false },
            calcium: { available: false },
            iron: { available: false },
            dataCompleteness: 'skipped',
        };
    }

    const ratio100Kcal = 100 / food.calories;
    let missingData = false;
    let score = 50; // Sửa điểm cơ sở thành 50 thay vì 100
    
    // [FIX #1] evaluateNutrient là hàm PURE — không còn mutate biến 'score' bên ngoài qua closure.
    // Thay vào đó trả về 'penaltyOrBonus' trong object để caller tích lũy tường minh.
    // [FIX #6] Dùng NUTRIENT_THRESHOLDS thay vì magic numbers inline.
    const evaluateNutrient = (value, type) => {
        if (value === null || value === undefined) {
            missingData = true;
            return { available: false, penaltyOrBonus: 0 };
        }
        
        const density = value * ratio100Kcal;
        let level = '';
        let label = '';
        let penaltyOrBonus = 0;
        let threshold = 0;
        
        if (type === 'sodium') {
            threshold = NUTRIENT_THRESHOLDS.sodium.warning;
            const isNaturalSodium = food.foodType === 'raw' && ['rau_cu', 'trai_cay', 'thit_ca', 'protein', 'fiber', 'carb', 'fat', 'vitamin'].includes(food.category);
            
            if (isNaturalSodium) {
                level = 'safe'; label = '🟢 Natri tự nhiên';
            } else if (density <= NUTRIENT_THRESHOLDS.sodium.warning) { level = 'safe';    label = '🟢 Ít muối'; }
            else if (density <= NUTRIENT_THRESHOLDS.sodium.danger)    { level = 'warning'; label = '🟡 Hơi mặn';       penaltyOrBonus = -10; }
            else                                                        { level = 'danger';  label = '🔴 Rất mặn';       penaltyOrBonus = -25; }
        } else if (type === 'sugar') {
            threshold = NUTRIENT_THRESHOLDS.sugar.warning;
            const isNaturalSugar = ['trai_cay', 'rau_cu', 'fiber', 'carb', 'vitamin'].includes(food.category);
            
            if (isNaturalSugar) {
                level = 'safe'; label = '🟢 Đường tự nhiên';
            } else if (density <= NUTRIENT_THRESHOLDS.sugar.warning) { level = 'safe';    label = '🟢 Ít đường'; }
            else if (density <= NUTRIENT_THRESHOLDS.sugar.danger)    { level = 'warning'; label = '🟡 Khá nhiều đường'; penaltyOrBonus = -10; }
            else                                                       { level = 'danger';  label = '🔴 Quá nhiều đường'; penaltyOrBonus = -25; }
        } else if (type === 'protein') {
            threshold = NUTRIENT_THRESHOLDS.protein.excellent;
            if (density >= NUTRIENT_THRESHOLDS.protein.excellent) { level = 'excellent'; label = '🌟 Giàu đạm'; penaltyOrBonus = 25; }
            else if (density >= NUTRIENT_THRESHOLDS.protein.good) { level = 'good';      label = '🟢 Đủ đạm';   penaltyOrBonus = 15; }
            else                                                    { level = 'low';       label = 'Ít đạm'; }
        } else if (type === 'fiber') {
            threshold = NUTRIENT_THRESHOLDS.fiber.excellent;
            if (density >= NUTRIENT_THRESHOLDS.fiber.excellent) { level = 'excellent'; label = '🌟 Giàu xơ'; penaltyOrBonus = 25; }
            else if (density >= NUTRIENT_THRESHOLDS.fiber.good) { level = 'good';      label = '🟢 Có xơ';    penaltyOrBonus = 15; }
            else                                                  { level = 'low';       label = 'Ít xơ'; }
        }

        return {
            available: true,
            density: parseFloat(density.toFixed(2)),
            threshold,
            ratio: threshold > 0 ? parseFloat((density / threshold).toFixed(2)) : 0,
            level,
            label,
            penaltyOrBonus,
        };
    };

    const evaluateMicronutrient = (value, type, nameLabel) => {
        if (value === null || value === undefined) {
            return { available: false, penaltyOrBonus: 0 };
        }
        
        const density = value * ratio100Kcal;
        let level = '';
        let label = '';
        let penaltyOrBonus = 0;
        let threshold = NUTRIENT_THRESHOLDS[type]?.excellent || 0;
        
        if (density >= NUTRIENT_THRESHOLDS[type].excellent) {
            level = 'excellent'; label = `🌟 Giàu ${nameLabel}`; penaltyOrBonus = 10;
        } else if (density >= NUTRIENT_THRESHOLDS[type].good) {
            level = 'good'; label = `🟢 Có ${nameLabel}`; penaltyOrBonus = 5;
        } else {
            level = 'low'; label = `Ít ${nameLabel}`; penaltyOrBonus = 0;
        }

        return {
            available: true,
            density: parseFloat(density.toFixed(2)),
            threshold,
            ratio: threshold > 0 ? parseFloat((density / threshold).toFixed(2)) : 0,
            level,
            label,
            penaltyOrBonus,
        };
    };

    const sodiumRes = evaluateNutrient(food.sodium, 'sodium');
    const sugarRes = evaluateNutrient(food.sugar, 'sugar');
    const proteinRes = evaluateNutrient(food.protein, 'protein');
    const fiberRes = evaluateNutrient(food.fiber, 'fiber');
    const vitaminARes = evaluateMicronutrient(food.vitaminA, 'vitaminA', 'Vitamin A');
    const vitaminCRes = evaluateMicronutrient(food.vitaminC, 'vitaminC', 'Vitamin C');
    const calciumRes = evaluateMicronutrient(food.calcium, 'calcium', 'Canxi');
    const ironRes = evaluateMicronutrient(food.iron, 'iron', 'Sắt');

    // [FIX #1] Tích lũy điểm tường minh từ penaltyOrBonus được trả về bởi evaluateNutrient.
    // Trước đây evaluateNutrient âm thầm mutate 'score' qua closure — impure và dễ gây bug ẩn.
    score += (sodiumRes.penaltyOrBonus  || 0);
    score += (sugarRes.penaltyOrBonus   || 0);
    score += (proteinRes.penaltyOrBonus || 0);
    score += (fiberRes.penaltyOrBonus   || 0);
    score += (vitaminARes.penaltyOrBonus || 0);
    score += (vitaminCRes.penaltyOrBonus || 0);
    score += (calciumRes.penaltyOrBonus || 0);
    score += (ironRes.penaltyOrBonus    || 0);

    const scoreBeforeCaps = score;

    // Xác định xem món ăn có được MIỄN TRỪ hình phạt vi chất (Empty Calories) hay không.
    // Thực phẩm dồi dào Đạm (excellent) hoặc bản chất là nhóm Thịt/Protein thì KHÔNG phải là "Calo rỗng".
    const isExemptFromMicroPenalty = 
        ['thit_ca', 'protein'].includes(food.category) || 
        proteinRes.level === 'excellent';

    // Lớp 1: Micronutrient Penalty
    const micros = [vitaminARes, vitaminCRes, calciumRes, ironRes];
    const availableMicros = micros.filter(m => m.available);
    let micronutrientStarvingCount = 0;
    let microDataSufficient = availableMicros.length > 0;
    let emptyCaloriesPenaltyApplied = false;
    let avgMicroRatio = 0;

    if (microDataSufficient) {
        let totalRatio = 0;
        availableMicros.forEach(m => {
            totalRatio += m.ratio;
            if (m.ratio < 0.10) micronutrientStarvingCount++;
        });
        avgMicroRatio = totalRatio / availableMicros.length;

        if (micronutrientStarvingCount >= 3 && !isExemptFromMicroPenalty) {
            score -= 15;
            emptyCaloriesPenaltyApplied = true;
        }
    }

    // Lớp 2: Hard Caps
    let hardCapApplied = null;
    
    // 2a: Hard Cap 50 - Vi chất quá kém
    if (microDataSufficient && avgMicroRatio < 0.20 && !isExemptFromMicroPenalty) {
        if (score > 50) {
            score = 50;
            hardCapApplied = 'micro_50';
        }
    }

    // 2b: Hard Cap 60 - Thiếu chất xơ
    const fiberRatio = fiberRes.available ? fiberRes.ratio : 0;
    if (!FIBER_EXEMPT_CATEGORIES.includes(food.category)) {
        if (hardCapApplied !== 'micro_50' && fiberRes.available && fiberRatio < 0.30) {
            if (score > 60) {
                score = 60;
                hardCapApplied = 'fiber_60';
            }
        }
    }

    // Khống chế điểm [0, 100]
    score = Math.max(0, Math.min(100, score));

    // Determine quality level
    let qualityLevel = 'poor';
    let qualityLabel = '🔴 Cần hạn chế';
    if (score >= 80) { qualityLevel = 'excellent'; qualityLabel = '🌟 Lành mạnh'; }
    else if (score >= 60) { qualityLevel = 'good'; qualityLabel = '🟢 Khá tốt'; }
    else if (score >= 40) { qualityLevel = 'moderate'; qualityLabel = '🟡 Trung bình'; }

    // [FIX #2] Derive badgeIcon mặc định từ qualityLevel — không hardcode '🟢'.
    // Trước đây: food có qualityLevel 'poor' nhưng không có sodium/sugar issue
    // vẫn hiển thị badge '🟢' (xanh) — mâu thuẫn UX nghiêm trọng.
    const defaultBadgeIcons = { excellent: '🌟', good: '🟢', moderate: '🟡', poor: '🔴' };
    let badgeIcon = defaultBadgeIcons[qualityLevel] || '🟢';
    let badgeTooltip = 'Tốt';
    let worstLabel = '';

    // Nutrient-specific override: cảnh báo cụ thể luôn ưu tiên hơn badge mặc định từ qualityLevel
    if (emptyCaloriesPenaltyApplied) {
        badgeIcon = '🔴';
        worstLabel = 'Báo động: Rỗng vi chất';
    } else if (sodiumRes.level === 'danger' || sugarRes.level === 'danger') {
        badgeIcon = '🔴';
        if (sodiumRes.level === 'danger' && sugarRes.level === 'danger') {
            worstLabel = `${sodiumRes.label}, ${sugarRes.label}`;
        } else if (sodiumRes.level === 'danger') {
            worstLabel = sodiumRes.label;
        } else {
            worstLabel = sugarRes.label;
        }
    } else if (sodiumRes.level === 'warning' || sugarRes.level === 'warning') {
        // [FIX #3] Bỏ `if (badgeIcon === '🟢')` — điều kiện này luôn đúng tại đây
        // vì block 'danger' phía trên đã xử lý badge đỏ rồi. Assign trực tiếp.
        badgeIcon = '🟡';
        if (sodiumRes.level === 'warning' && sugarRes.level === 'warning') {
            worstLabel = `${sodiumRes.label}, ${sugarRes.label}`;
        } else if (sodiumRes.level === 'warning') {
            worstLabel = sodiumRes.label;
        } else {
            worstLabel = sugarRes.label;
        }
    } else if (proteinRes.level === 'excellent' || fiberRes.level === 'excellent') {
        badgeIcon = '🌟';
        if (proteinRes.level === 'excellent' && fiberRes.level === 'excellent') {
            worstLabel = `${proteinRes.label}, ${fiberRes.label}`;
        } else if (proteinRes.level === 'excellent') {
            worstLabel = proteinRes.label;
        } else {
            worstLabel = fiberRes.label;
        }
    }

    // [FIX #4] Gộp 3 nhánh if/else-if cùng làm badgeTooltip = worstLabel thành 1 dòng.
    if (worstLabel) badgeTooltip = worstLabel;

    return {
        skipped: false,
        skipReason: null,
        dataCompleteness: missingData ? 'partial' : 'full',
        sodium: sodiumRes,
        sugar: sugarRes,
        protein: proteinRes,
        fiber: fiberRes,
        vitaminA: vitaminARes,
        vitaminC: vitaminCRes,
        calcium: calciumRes,
        iron: ironRes,
        qualityScore: score,
        qualityLevel,
        qualityLabel,
        badgeIcon,
        badgeTooltip,
        micronutrientStarvingCount,
        microDataSufficient,
        emptyCaloriesPenaltyApplied,
        hardCapApplied,
        avgMicroRatio: microDataSufficient ? parseFloat(avgMicroRatio.toFixed(2)) : 0,
        fiberRatio: parseFloat(fiberRatio.toFixed(2)),
        scoreBeforeCaps
    };
}

/**
 * Tổng hợp đánh giá thức ăn trong tuần/tháng
 * @param {Array} diaryEntries 
 * @param {String} range - 'week' | 'month'
 */
function buildWeeklyFoodReport(diaryEntries, range) {
    if (!diaryEntries || diaryEntries.length === 0) return null;

    // 1. Gộp entry theo foodId
    const foodMap = new Map();
    diaryEntries.forEach(entry => {
        if (!entry.food) return; // ignore custom macros maybe?
        
        const fId = entry.food.id;
        if (!foodMap.has(fId)) {
            foodMap.set(fId, {
                foodId: fId,
                name: entry.food.name,
                count: 0,
                // [FIX #5] Đổi tên từ 'totalCaloriesPerServing' → 'totalCaloriesPer100g'.
                // food.calories là calo trên 100g (chuẩn DB), KHÔNG phải calo per serving thực tế.
                totalCaloriesPer100g: 0,
                foodObj: entry.food
            });
        }
        
        const f = foodMap.get(fId);
        f.count += 1;
        f.totalCaloriesPer100g += entry.food.calories || 0;
    });

    const scoredFoods = [];
    const habitThreshold = range === 'week' ? 2 : 4;
    
    let redFlagCount = 0;
    let yellowCount = 0;
    let greenCount = 0;
    let sumQualityScore = 0;
    let countScored = 0;

    for (const [fId, data] of foodMap.entries()) {
        const avgCalories = data.totalCaloriesPer100g / data.count;
        const scoring = scoreFoodItem(data.foodObj);
        
        scoredFoods.push({
            foodId: data.foodId,
            name: data.name,
            count: data.count,
            avgCaloriesPer100g: Math.round(avgCalories), // [FIX #5] Tên chính xác: calo/100g
            scoring
        });
    }

    // Sort by qualityScore ASC, skipped items at the end
    scoredFoods.sort((a, b) => {
        if (a.scoring.skipped && !b.scoring.skipped) return 1;
        if (!a.scoring.skipped && b.scoring.skipped) return -1;
        if (a.scoring.skipped && b.scoring.skipped) return 0;
        return a.scoring.qualityScore - b.scoring.qualityScore; // ASC
    });

    const goodHabitsRaw = [];
    const badHabitsRaw = [];

    // Tính thống kê từ scoredFoods
    let totalEntriesCount = 0;
    
    scoredFoods.forEach(item => {
        totalEntriesCount += item.count;
        if (!item.scoring.skipped) {
            sumQualityScore += (item.scoring.qualityScore * item.count);
            countScored += item.count;
            
            if (item.scoring.qualityLevel === 'poor') {
                redFlagCount += item.count;
            } else if (item.scoring.qualityLevel === 'moderate') {
                yellowCount += item.count;
            } else if (item.scoring.qualityLevel === 'good' || item.scoring.qualityLevel === 'excellent') {
                greenCount += item.count;
            }

            // Phân loại Habits
            // Thay vì >= 60, chúng ta siết chặt: Chỉ món >= 70 mới xứng đáng là "Thói Quen Tốt"
            if (item.scoring.qualityScore >= 70 && item.count >= habitThreshold) {
                // Collect badges for display
                const badges = [];
                if (item.scoring.protein.level === 'excellent' || item.scoring.protein.level === 'good') badges.push(item.scoring.protein.label);
                if (item.scoring.fiber.level === 'excellent' || item.scoring.fiber.level === 'good') badges.push(item.scoring.fiber.label);
                if (item.scoring.sodium.level === 'safe') badges.push(item.scoring.sodium.label);
                if (item.scoring.sugar.level === 'safe') badges.push(item.scoring.sugar.label);
                
                goodHabitsRaw.push({
                    name: item.name,
                    count: item.count,
                    qualityScore: item.scoring.qualityScore,
                    badges: badges.slice(0, 2) // Chỉ lấy 2 badge nổi bật
                });
            } else if (item.scoring.qualityScore < 60 && item.count >= habitThreshold) {
                // Món < 60 bị đưa vào danh sách cảnh báo
                const badges = [];
                if (item.scoring.sodium.level === 'danger' || item.scoring.sodium.level === 'warning') {
                    badges.push(`${item.scoring.sodium.label} (${item.scoring.sodium.density}mg/100kcal)`);
                }
                if (item.scoring.sugar.level === 'danger' || item.scoring.sugar.level === 'warning') {
                    badges.push(`${item.scoring.sugar.label} (${item.scoring.sugar.density}g/100kcal)`);
                }
                
                badHabitsRaw.push({
                    name: item.name,
                    count: item.count,
                    qualityScore: item.scoring.qualityScore,
                    badges: badges.slice(0, 2) // Chỉ lấy 2 badge nổi bật
                });
            }
            // LƯU Ý: Các món từ 60 - 69 điểm (Ví dụ: Cơm Gà Hải Nam 65đ) sẽ rơi vào vùng NEUTRAL. 
            // Hệ thống không khen (vì không đủ xuất sắc) và cũng không chê (vì không vi phạm nghiêm trọng).
        }
    });

    // Sort Habits
    // goodHabits: qualityScore DESC + count DESC
    goodHabitsRaw.sort((a, b) => b.qualityScore - a.qualityScore || b.count - a.count);
    // badHabits: qualityScore ASC + count DESC
    badHabitsRaw.sort((a, b) => a.qualityScore - b.qualityScore || b.count - a.count);

    const goodHabits = goodHabitsRaw.slice(0, 5).map((h, i) => ({ rank: i + 1, ...h }));
    const badHabits = badHabitsRaw.slice(0, 5).map((h, i) => ({ rank: i + 1, ...h }));

    // Tính percentage
    const calcPct = (cnt, total) => total > 0 ? parseFloat(((cnt / total) * 100).toFixed(1)) : 0;
    
    const redFlagPercentage = calcPct(redFlagCount, countScored);
    const yellowPercentage = calcPct(yellowCount, countScored);
    const greenPercentage = calcPct(greenCount, countScored);
    
    const avgQualityScore = countScored > 0 ? Math.round(sumQualityScore / countScored) : 0;

    let weeklyVerdict = 'good';
    let weeklyVerdictLabel = '🟢 Khá tốt — Tiếp tục phát huy!';

    if (redFlagPercentage <= 15 && avgQualityScore >= 75) {
        weeklyVerdict = 'excellent';
        weeklyVerdictLabel = '🌟 Lành mạnh — Chế độ ăn rất tốt!';
    } else if (redFlagPercentage <= 30 && avgQualityScore >= 65) {
        weeklyVerdict = 'good';
        weeklyVerdictLabel = '🟢 Khá tốt — Tiếp tục phát huy!';
    } else if (redFlagPercentage <= 50 && avgQualityScore >= 50) {
        weeklyVerdict = 'concerning';
        weeklyVerdictLabel = '🟡 Trung bình — Cần bổ sung thêm đạm, xơ và giảm ăn mặn/ngọt!';
    } else {
        weeklyVerdict = 'poor';
        weeklyVerdictLabel = '🔴 Cần hạn chế — Đang tiêu thụ quá nhiều thức ăn rỗng/kém chất lượng!';
    }

    return {
        scoredFoods,
        goodHabits,
        badHabits,
        stats: {
            totalUniqueFoods: foodMap.size,
            totalEntries: totalEntriesCount,
            redFlagCount,
            redFlagPercentage,
            yellowCount,
            yellowPercentage,
            greenCount,
            greenPercentage,
            avgQualityScore,
            weeklyVerdict,
            weeklyVerdictLabel
        }
    };
}

module.exports = {
    scoreFoodItem,
    buildWeeklyFoodReport
};
