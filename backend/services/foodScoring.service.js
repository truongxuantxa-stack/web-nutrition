/**
 * Food Scoring Service — Nutrient Density per 100 Kcal
 */

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
            dataCompleteness: 'skipped',
        };
    }

    const ratio100Kcal = 100 / food.calories;
    let missingData = false;
    let score = 50; // Sửa điểm cơ sở thành 50 thay vì 100
    
    // Helper to evaluate nutrient
    const evaluateNutrient = (value, type) => {
        if (value === null || value === undefined) {
            missingData = true;
            return { available: false };
        }
        
        const density = value * ratio100Kcal;
        let level = '';
        let label = '';
        let penaltyOrBonus = 0;
        let threshold = 0;
        
        if (type === 'sodium') {
            threshold = 100; // mg
            const isNaturalSodium = food.foodType === 'raw' && ['rau_cu', 'trai_cay', 'thit_ca', 'protein', 'fiber', 'carb', 'fat'].includes(food.category);
            
            if (isNaturalSodium) {
                level = 'safe'; label = '🟢 Natri tự nhiên';
            } else if (density <= 100) { level = 'safe'; label = '🟢 Ít muối'; }
            else if (density <= 150) { level = 'warning'; label = '🟡 Hơi mặn'; penaltyOrBonus = -10; }
            else { level = 'danger'; label = '🔴 Rất mặn'; penaltyOrBonus = -25; }
        } else if (type === 'sugar') {
            threshold = 2.5; // g
            const isNaturalSugar = ['trai_cay', 'rau_cu', 'fiber', 'carb'].includes(food.category);
            
            if (isNaturalSugar) {
                level = 'safe'; label = '🟢 Đường tự nhiên';
            } else if (density <= 2.5) { level = 'safe'; label = '🟢 Ít đường'; }
            else if (density <= 5) { level = 'warning'; label = '🟡 Khá nhiều đường'; penaltyOrBonus = -10; }
            else { level = 'danger'; label = '🔴 Quá nhiều đường'; penaltyOrBonus = -25; }
        } else if (type === 'protein') {
            threshold = 5; // g (for excellent)
            if (density >= 5) { level = 'excellent'; label = '🌟 Giàu đạm'; penaltyOrBonus = 25; }
            else if (density >= 3) { level = 'good'; label = '🟢 Đủ đạm'; penaltyOrBonus = 15; }
            else { level = 'low'; label = 'Ít đạm'; }
        } else if (type === 'fiber') {
            threshold = 1.25; // g (for excellent)
            if (density >= 1.25) { level = 'excellent'; label = '🌟 Giàu xơ'; penaltyOrBonus = 25; }
            else if (density >= 0.5) { level = 'good'; label = '🟢 Có xơ'; penaltyOrBonus = 15; }
            else { level = 'low'; label = 'Ít xơ'; }
        }

        score += penaltyOrBonus;

        return {
            available: true,
            density: parseFloat(density.toFixed(2)),
            threshold,
            ratio: threshold > 0 ? parseFloat((density / threshold).toFixed(2)) : 0,
            level,
            label,
        };
    };

    const sodiumRes = evaluateNutrient(food.sodium, 'sodium');
    const sugarRes = evaluateNutrient(food.sugar, 'sugar');
    const proteinRes = evaluateNutrient(food.protein, 'protein');
    const fiberRes = evaluateNutrient(food.fiber, 'fiber');

    // Khống chế điểm [0, 100]
    score = Math.max(0, Math.min(100, score));

    // Determine quality level
    let qualityLevel = 'poor';
    let qualityLabel = '🔴 Cần hạn chế';
    if (score >= 80) { qualityLevel = 'excellent'; qualityLabel = '🌟 Lành mạnh'; }
    else if (score >= 60) { qualityLevel = 'good'; qualityLabel = '🟢 Khá tốt'; }
    else if (score >= 40) { qualityLevel = 'moderate'; qualityLabel = '🟡 Trung bình'; }

    // Determine badge icon based on worst nutrient
    let badgeIcon = '🟢';
    let badgeTooltip = 'Tốt';
    let worstLabel = '';
    
    if (sodiumRes.level === 'danger' || sugarRes.level === 'danger') {
        badgeIcon = '🔴';
        if (sodiumRes.level === 'danger' && sugarRes.level === 'danger') {
            worstLabel = `${sodiumRes.label}, ${sugarRes.label}`;
        } else if (sodiumRes.level === 'danger') {
            worstLabel = sodiumRes.label;
        } else {
            worstLabel = sugarRes.label;
        }
    } else if (sodiumRes.level === 'warning' || sugarRes.level === 'warning') {
        if (badgeIcon === '🟢') badgeIcon = '🟡';
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

    if (badgeIcon === '🔴' || badgeIcon === '🟡') {
        badgeTooltip = worstLabel;
    } else if (badgeIcon === '🌟') {
        badgeTooltip = worstLabel;
    }

    return {
        skipped: false,
        skipReason: null,
        dataCompleteness: missingData ? 'partial' : 'full',
        sodium: sodiumRes,
        sugar: sugarRes,
        protein: proteinRes,
        fiber: fiberRes,
        qualityScore: score,
        qualityLevel,
        qualityLabel,
        badgeIcon,
        badgeTooltip
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
                totalCaloriesPerServing: 0,
                foodObj: entry.food
            });
        }
        
        const f = foodMap.get(fId);
        f.count += 1;
        // Chúng ta tính calo trung bình trên mỗi serving (không phải tổng calo đã ăn)
        // Dùng data chuẩn từ món ăn (food.calories), không phải entry.calories
        f.totalCaloriesPerServing += entry.food.calories || 0; 
    });

    const scoredFoods = [];
    const habitThreshold = range === 'week' ? 2 : 4;
    
    let redFlagCount = 0;
    let yellowCount = 0;
    let greenCount = 0;
    let sumQualityScore = 0;
    let countScored = 0;

    for (const [fId, data] of foodMap.entries()) {
        const avgCalories = data.totalCaloriesPerServing / data.count;
        const scoring = scoreFoodItem(data.foodObj);
        
        scoredFoods.push({
            foodId: data.foodId,
            name: data.name,
            count: data.count,
            avgCaloriesPerServing: Math.round(avgCalories),
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
