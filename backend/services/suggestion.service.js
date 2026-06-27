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
        // [FIX #6] Guard: Bỏ qua entry có amount không hợp lệ (0, âm, null/undefined)
        // Để tránh những entry ghi nhầm làm ô nhiễm tổng dinh dưỡng trong ngày.
        if (!entry.amount || entry.amount <= 0) return acc;

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
// [FIX #2] Thêm tham số allowOverflow: khi true, trả về % thực tế (có thể > 100)
// giúp UI hiển thị progress bar overflow màu đỏ khi vượt mục tiêu (thay vì bị cắp cứng ở 100%).
const getCalorieProgress = (consumed, target, allowOverflow = false) => {
    if (!target || target <= 0) return 0;
    const pct = Math.round((consumed / target) * 100);
    return allowOverflow ? pct : Math.min(100, pct);
};

/**
 * Tính phần trăm macro đã đạt so với mục tiêu.
 * @param {Object} consumed  - { protein, carbs, fat }
 * @param {Object} targets   - { protein, carbs, fat }
 * @returns {Object} { protein: %, carbs: %, fat: % }
 */
// [FIX #5] Thêm allowOverflow — tương tự getCalorieProgress.
// UI cần biết khi nào macro bị vượt để hiển thị cảnh báo trực quan (thanh tiến trình đỏ).
const getMacroProgress = (consumed, targets, allowOverflow = false) => {
    const pct = (c, t) => {
        if (t <= 0) return 0;
        const p = Math.round((c / t) * 100);
        return allowOverflow ? p : Math.min(100, p);
    };
    return {
        protein: pct(consumed.protein, targets.protein),
        carbs:   pct(consumed.carbs,   targets.carbs),
        fat:     pct(consumed.fat,     targets.fat),
    };
};

/** [FIX #7] Hằng số cho ngưỡng calo tối thiểu kiểm tra tỷ lệ fat — thay magic number 500.
 * Lý do: Khi mới ăn bữa sáng nhỏ (<500kcal), cảnh báo "thiếu chất béo" là không có nghĩa vì ngày còn dài. */
const MIN_CALORIES_FOR_FAT_CHECK = 500;

/**
 * [FIX #4] Helper trích xuất RDI theo giới tính — dùng chung cho getHealthInsights
 * và calculateDailyHealthScore, tránh duplicate logic vi phạm nguyên tắc DRY.
 * Khi chuẩn RDI thay đổi (WHO/AHA cập nhật), chỉ cần sửa ở đây.
 * @param {string} gender - 'male' | 'female'
 * @returns {Object} { isMale, sugarLimit, sodiumLimit, fiberRDI, calciumRDI, ironRDI, vitaminCRDI }
 */
const getRDIByGender = (gender) => {
    const isMale = gender !== 'female';
    return {
        isMale,
        sugarLimit:  isMale ? 36 : 25,    // AHA
        sodiumLimit: 2300,                  // WHO/AHA
        fiberRDI:    isMale ? 30 : 25,    // AHA (25-30g) — thay IOM 38g cho thực tế hơn
        calciumRDI:  1000,
        ironRDI:     isMale ? 8 : 18,
        vitaminCRDI: isMale ? 90 : 75,
        vitaminARDI: isMale ? 900 : 700,  // µg RAE (WHO/NIH)
    };
};

// ─── Bộ quy tắc y khoa cho Health Insights ──────────────────────────────────────────────────────────────
// AHA Sugar threshold: 36g (Nam) / 25g (Nữ)
// Phân loại severity: danger > warning > water > suggestion
// Context-Awareness: shouldWarnDeficiency = (calPct >= 100 || currentHour >= 20)

/**
 * Phân loại mức Calo theo tháp ưu tiên y khoa.
 * @param {number} calPct - % Calo so với mục tiêu
 * @returns {'critical' | 'low' | 'adequate'}
 */
const getCalorieLevel = (calPct) => {
    if (calPct < 50) return 'critical';  // Tầng Sinh Tồn — mute micros
    if (calPct < 70) return 'low';       // Tầng Đa Lượng — chỉ xét macros
    return 'adequate';                   // Tầng Vi Lượng — xét đầy đủ
};

/**
 * Đánh giá dinh dưỡng theo bộ quy tắc y khoa 4 cấp độ với Context-Awareness.
 *
 * @param {Object} consumed      - { calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron }
 * @param {Object} metrics       - { targetCalories, macros: { protein, carbs, fat } }
 * @param {Object} mealGroups    - { sang: [], trua: [], toi: [], phu: [] }
 * @param {number} waterTotal    - Lượng nước đã uống (ml)
 * @param {number} waterGoal     - [FIX #8] waterGoal mặc định 2000ml — chỉ là fallback. Luôn truyền goal cá nhân của user để cảnh báo chính xác.
 * @param {string} gender        - 'male' | 'female' (cho ngưỡng AHA đường)
 * @param {boolean} isHistorical - cờ đánh dấu dữ liệu quá khứ (ví dụ: báo cáo PDF) để không bị ảnh hưởng bởi giờ hiện tại
 * @param {number} clientHour    - [FIX #3] clientHour: Giờ từ phía client — tránh sai múi giờ server vs user.
 * @returns {Array} Mảng { severity, icon, title, message }
 *   severity: 'danger' | 'warning' | 'suggestion' | 'water'
 */
const getHealthInsights = (consumed, metrics, mealGroups = {}, waterTotal = 0, waterGoal = 2000, gender = 'male', isHistorical = false, clientHour = null) => {
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

    const calPct = (consumed.calories / targetCal) * 100;
    // [FIX #3] Dùng clientHour nếu được truyền từ client, tránh sai múi giờ server vs user.
    // Ví dụ: server UTC 13:30 nhưng user VN đang là 20:30 → cảnh báo tối sẽ không kích hoạt nếu dùng giờ server.
    const currentHour = (clientHour !== null && Number.isInteger(clientHour)) ? clientHour : new Date().getHours();

    const hasSang = mealGroups?.sang?.length > 0;
    const hasTrua = mealGroups?.trua?.length > 0;
    const hasToi  = mealGroups?.toi?.length > 0;
    const isDayComplete = isHistorical || currentHour >= 20 || (hasSang && hasTrua && hasToi);

    // Gate cảnh báo THIẾU: kích hoạt khi đủ bữa, qua 20h, hoặc dữ liệu lịch sử
    const shouldWarnDeficiency = isDayComplete && consumed.calories > 0;

    // ── RDI chuẩn ────────────────────────────────────────────────────────────
    const { isMale, sugarLimit, sodiumLimit, fiberRDI, calciumRDI, ironRDI, vitaminCRDI, vitaminARDI } = getRDIByGender(gender);

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
                message: 'Nguy cơ tăng đường huyết và buồn ngủ sau ăn. Hãy ưu tiên ăn thêm rau xanh vào các bữa tiếp theo để làm chậm hấp thu đường, và tăng cường vận động để tiêu hao năng lượng.',
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
        
        // ── Tầng 1: Sinh Tồn (Calo) ──
        if (calPct < 50) {
            dangerInsights.push({
                severity: 'danger', icon: '🚨',
                title: `Lượng ăn quá thấp — chỉ đạt ${Math.round(calPct)}% mục tiêu`,
                message: 'Nguy cơ suy nhược và mất cơ bắp! Hãy ưu tiên ăn các thực phẩm giàu năng lượng (cơm, khoai, thịt) ngay bây giờ, tạm thời chưa cần lo về rau xanh hay vi chất.',
            });
        } else if (calPct < 70) {
            warningInsights.push({
                severity: 'warning', icon: '⚠️',
                title: `Calo vẫn đang thiếu — mới đạt ${Math.round(calPct)}% mục tiêu`,
                message: 'Cơ thể cần thêm năng lượng. Bổ sung 1 bữa phụ giàu protein và carb lành mạnh.',
            });
        }

        const calorieLevel = getCalorieLevel(calPct);

        // ── Tầng 2: Đa Lượng (Macros) — chỉ xét nếu không critical ──
        if (calorieLevel !== 'critical') {
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
                if (fatCalRatio < 20 && consumed.calories > MIN_CALORIES_FOR_FAT_CHECK) {
                    warningInsights.push({
                        severity: 'warning',
                        icon: '🫒',
                        title: 'Lượng chất béo đang quá thấp',
                        message: 'Cơ thể cần chất béo để tổng hợp hormone và hấp thụ Vitamin A,D,E,K. Đừng sợ chất béo tốt (dầu olive, bơ, hạt)!',
                    });
                }
            }
        } // end if !== 'critical'

        // ── Tầng 3: Vi Lượng (Micros) — chỉ xét nếu adequate ──
        if (calorieLevel === 'adequate') {
            const microDangerInsights = [];
            const microWarningInsights = [];
            const microSuggestionInsights = [];

            // Chất xơ — phân cấp theo % RDI
            if (consumed.fiber != null) {
            const fiberPct = consumed.fiber / fiberRDI;
            const fiberDisplay = `${Math.round(consumed.fiber * 10) / 10}g/${fiberRDI}g`;
            
                if (fiberPct < 0.30) {
                    microDangerInsights.push({
                        severity: 'danger', icon: '🥦',
                        title: `Báo động: Chất xơ cực thấp (${fiberDisplay})`,
                        message: 'Chỉ đạt dưới 30% nhu cầu! Nguy cơ táo bón và mất cân bằng vi khuẩn đường ruột. Bổ sung rau xanh ngay.',
                    });
                } else if (fiberPct < 0.80) {
                    microWarningInsights.push({
                        severity: 'warning', icon: '🥦',
                        title: `Hệ tiêu hóa đang thiếu chất xơ (${fiberDisplay})`,
                        message: 'Hãy bổ sung ngay 1 đĩa rau xanh hoặc trái cây! Chất xơ nuôi vi khuẩn có lợi trong ruột.',
                    });
                } else if (fiberPct < 1.0) {
                    microSuggestionInsights.push({
                        severity: 'suggestion', icon: '🥦',
                        title: `Chất xơ gần đạt mục tiêu (${fiberDisplay})`,
                        message: 'Chỉ cần thêm 1 phần rau hoặc trái cây nữa là đủ! Cố lên!',
                    });
                }
            }

            // Canxi — phân cấp theo % RDI
            if (consumed.calcium != null) {
                const calciumPct = consumed.calcium / calciumRDI;
                const calciumDisplay = `${Math.round(consumed.calcium)}mg/${calciumRDI}mg`;

                if (calciumPct < 0.30) {
                    microDangerInsights.push({
                        severity: 'danger', icon: '🥛',
                        title: isHistorical
                            ? `Thiếu hụt Canxi trầm trọng (${calciumDisplay})`
                            : `Thiếu hụt Canxi trầm trọng hôm nay (${calciumDisplay})`,
                        message: 'Mới đạt dưới 30% nhu cầu! Xương và răng đang bị thiếu nguyên liệu. Uống sữa, ăn phô mai hoặc rau cải xanh ngay.',
                    });
                } else if (calciumPct < 0.70) {
                    microWarningInsights.push({
                        severity: 'warning', icon: '🥛',
                        title: isHistorical
                            ? `Canxi ở mức thấp (${calciumDisplay})`
                            : `Canxi hôm nay ở mức thấp (${calciumDisplay})`,
                        message: 'Cân nhắc uống 1 ly sữa ít béo hoặc ăn thêm rau cải xanh, hạnh nhân.',
                    });
                } else if (calciumPct < 1.0) {
                    microSuggestionInsights.push({
                        severity: 'suggestion', icon: '🥛',
                        title: isHistorical
                            ? `Canxi gần đạt mục tiêu (${calciumDisplay})`
                            : `Canxi hôm nay gần đạt mục tiêu (${calciumDisplay})`,
                        message: isHistorical
                            ? 'Chỉ cần thêm 1 ly sữa hoặc 1 phần phô mai nữa.'
                            : 'Chỉ cần thêm 1 ly sữa hoặc 1 phần phô mai nữa vào ngày mai.',
                    });
                }
            }

            // Sắt — phân cấp theo % RDI
            if (consumed.iron != null) {
                const ironPct = consumed.iron / ironRDI;
                const ironDisplay = `${Math.round(consumed.iron * 10) / 10}mg/${ironRDI}mg`;

                if (ironPct < 0.30) {
                    microDangerInsights.push({
                        severity: 'danger', icon: '🫀',
                        title: isHistorical
                            ? `Thiếu hụt Sắt trầm trọng (${ironDisplay})`
                            : `Thiếu hụt Sắt trầm trọng hôm nay (${ironDisplay})`,
                        message: 'Nguy cơ thiếu máu, mệt mỏi và suy giảm miễn dịch. Bổ sung thịt đỏ, gan, hoặc rau chân vịt kết hợp Vitamin C.',
                    });
                } else if (ironPct < 0.70) {
                    microWarningInsights.push({
                        severity: 'warning', icon: '🫀',
                        title: isHistorical
                            ? `Lượng Sắt ở mức thấp (${ironDisplay})`
                            : `Lượng Sắt hôm nay ở mức thấp (${ironDisplay})`,
                        message: 'Sắt cần cho máu và năng lượng. Bổ sung thịt đỏ, gan, hoặc rau chân vịt kết hợp Vitamin C để tăng hấp thụ.',
                    });
                } else if (ironPct < 1.0) {
                    microSuggestionInsights.push({
                        severity: 'suggestion', icon: '🫀',
                        title: isHistorical
                            ? `Sắt gần đạt mục tiêu (${ironDisplay})`
                            : `Sắt hôm nay gần đạt mục tiêu (${ironDisplay})`,
                        message: 'Chỉ cần thêm 1 phần thịt đỏ hoặc rau lá xanh đậm nữa.',
                    });
                }
            }

            // Vitamin C — phân cấp theo % RDI
            if (consumed.vitaminC != null) {
                const vitCPct = consumed.vitaminC / vitaminCRDI;
                const vitCDisplay = `${Math.round(consumed.vitaminC)}mg/${vitaminCRDI}mg`;

                if (vitCPct < 0.30) {
                    microDangerInsights.push({
                        severity: 'danger', icon: '🍊',
                        title: isHistorical
                            ? `Thiếu hụt Vitamin C trầm trọng (${vitCDisplay})`
                            : `Thiếu hụt Vitamin C trầm trọng hôm nay (${vitCDisplay})`,
                        message: 'Hệ miễn dịch đang yếu! Ăn cam, ổi, ớt chuông hoặc kiwi là đủ nhu cầu ngay.',
                    });
                } else if (vitCPct < 0.70) {
                    microWarningInsights.push({
                        severity: 'warning', icon: '🍊',
                        title: isHistorical
                            ? `Vitamin C ở mức thấp (${vitCDisplay})`
                            : `Vitamin C hôm nay ở mức thấp (${vitCDisplay})`,
                        message: 'Vitamin C tăng đề kháng và giúp hấp thụ Sắt. Ăn cam, ổi, ớt chuông hoặc kiwi.',
                    });
                } else if (vitCPct < 1.0) {
                    microSuggestionInsights.push({
                        severity: 'suggestion', icon: '🍊',
                        title: isHistorical
                            ? `Vitamin C gần đạt mục tiêu (${vitCDisplay})`
                            : `Vitamin C hôm nay gần đạt mục tiêu (${vitCDisplay})`,
                        message: 'Chỉ cần thêm 1 quả cam hoặc nửa quả ổi nữa thôi!',
                    });
                }
            }

            // Vitamin A — MỚI: Trước đây hệ thống không kiểm tra Vitamin A
            if (consumed.vitaminA != null) {
                const vitAPct = consumed.vitaminA / vitaminARDI;
                const vitADisplay = `${Math.round(consumed.vitaminA)}µg/${vitaminARDI}µg`;

                if (vitAPct < 0.30) {
                    microDangerInsights.push({
                        severity: 'danger', icon: '🥕',
                        title: isHistorical
                            ? `Thiếu hụt Vitamin A trầm trọng (${vitADisplay})`
                            : `Thiếu hụt Vitamin A trầm trọng hôm nay (${vitADisplay})`,
                        message: 'Vitamin A cần cho thị lực, da và hệ miễn dịch. Ăn cà rốt, khoai lang, rau lá xanh đậm hoặc gan.',
                    });
                } else if (vitAPct < 0.70) {
                    microWarningInsights.push({
                        severity: 'warning', icon: '🥕',
                        title: isHistorical
                            ? `Vitamin A ở mức thấp (${vitADisplay})`
                            : `Vitamin A hôm nay ở mức thấp (${vitADisplay})`,
                        message: 'Bổ sung cà rốt, bí đỏ, rau lá xanh đậm hoặc trứng để tăng Vitamin A.',
                    });
                } else if (vitAPct < 1.0) {
                    microSuggestionInsights.push({
                        severity: 'suggestion', icon: '🥕',
                        title: isHistorical
                            ? `Vitamin A gần đạt mục tiêu (${vitADisplay})`
                            : `Vitamin A hôm nay gần đạt mục tiêu (${vitADisplay})`,
                        message: 'Chỉ cần thêm 1 phần rau xanh hoặc cà rốt nữa!',
                    });
                }
            }
            
            // Grouped Micro Warnings logic
            if (microDangerInsights.length >= 3) {
                const microNames = microDangerInsights.map(i => i.title.match(/Canxi|Sắt|Chất xơ|Vitamin C|Vitamin A/)?.[0]).filter(Boolean);
                dangerInsights.push({
                    severity: 'danger', icon: '📉',
                    title: `Thiếu hụt Đa Vi Chất trầm trọng (${microNames.join(', ')})`,
                    message: 'Chế độ ăn hôm nay rất nghèo vi chất. Bổ sung ngay rau xanh đa dạng, trái cây và thực phẩm giàu dinh dưỡng.',
                });
            } else {
                dangerInsights.push(...microDangerInsights);
            }
            warningInsights.push(...microWarningInsights);
            suggestionInsights.push(...microSuggestionInsights);
        } // end if === 'adequate'
    }

    // ════════════════════════════════════════════════════════════════════════════
    // NHÓM NƯỚC — kích hoạt MỌI LÚC (uống đủ nước luôn cần thiết)
    // ════════════════════════════════════════════════════════════════════════════
    if (waterGoal > 0) {
        let expectedWaterRatio = 1;
        if (!isHistorical && currentHour < 20) {
            if (currentHour <= 8) {
                expectedWaterRatio = 0.1;
            } else {
                expectedWaterRatio = (currentHour - 8) / (20 - 8);
            }
        }
        
        const expectedWater = waterGoal * expectedWaterRatio;
        if (waterTotal < expectedWater) {
            const waterPct = Math.round((waterTotal / waterGoal) * 100);
            waterInsights.push({
                severity: 'water',
                icon: '💧',
                title: `Cơ thể bạn đang thiếu nước mới đạt (${waterPct}% mục tiêu)`,
                message: 'Thiếu nước làm chậm trao đổi chất và giảm năng lượng. Hãy uống ngay 1-2 ly nước nhé!',
            });
        }
    }

    // ── Sắp xếp theo ưu tiên: danger → warning → water → suggestion ──────────
    const result = [...dangerInsights, ...warningInsights, ...waterInsights, ...suggestionInsights];
    
    // Đính kèm calorieLevel như metadata ẩn vào mảng trả về, không phá vỡ logic iterator
    if (shouldWarnDeficiency) {
        result._calorieLevel = getCalorieLevel((consumed.calories / targetCal) * 100);
    } else {
        result._calorieLevel = 'adequate'; 
    }
    
    return result;
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
 * @param {Object} mealGroups  - Các bữa ăn trong ngày
 * @param {number} clientHour  - Giờ hiện tại từ client
 * @param {boolean} isHistorical - Có phải dữ liệu ngày cũ không
 * @returns {{ score: number|null, label: string, emoji: string, bonuses: Array }}
 */
const calculateDailyHealthScore = (consumed, metrics, waterTotal, waterGoal, insights, gender = 'male', mealGroups = {}, clientHour = null, isHistorical = false) => {
    // ── Empty State: chưa ăn gì → không tính điểm ────────────────────────────
    if (!consumed || consumed.calories === 0) {
        return { score: null, label: 'Chưa có dữ liệu', emoji: '🍽️', bonuses: [] };
    }

    const currentHour = (clientHour !== null && Number.isInteger(clientHour)) ? clientHour : new Date().getHours();
    
    const hasSang = mealGroups?.sang?.length > 0;
    const hasTrua = mealGroups?.trua?.length > 0;
    const hasToi  = mealGroups?.toi?.length > 0;
    const isDayComplete = isHistorical || currentHour >= 20 || (hasSang && hasTrua && hasToi);

    // Nếu chưa hết ngày và chưa đủ 3 bữa thì treo điểm ở trạng thái Pending
    if (!isDayComplete) {
        return { score: null, label: 'Đang thu thập...', emoji: '⏳', bonuses: [] };
    }

    // [FIX #4] Dùng getRDIByGender() thay vì tính lại inline — trước đây duplicate logic từ getHealthInsights.
    const { sugarLimit, fiberRDI, calciumRDI, ironRDI, vitaminCRDI, vitaminARDI } = getRDIByGender(gender);
    const targetCal = metrics.targetCalories || 0;
    const calPct    = targetCal > 0 ? (consumed.calories / targetCal) * 100 : 0;

    // ── Trừ điểm theo vi phạm ─────────────────────────────────────────────────
    const PENALTY = { danger: 15, warning: 6, water: 4, suggestion: 2 };
    const GROUPED_MICRO_PENALTY = 25;
    let score = 100;
    
    for (const insight of insights) {
        if (insight.icon === '📉') {
            score -= GROUPED_MICRO_PENALTY;
        } else {
            score -= (PENALTY[insight.severity] || 0);
        }
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

    // ── Sliding Calorie Multiplier ──
    const calorieLevel = insights._calorieLevel || 'adequate';
    let calorieMultiplier = 1.0;

    if (calPct < 30)       calorieMultiplier = 0.3;   // Nguy hiểm thực sự
    else if (calPct < 50)  calorieMultiplier = 0.5;   // Ăn quá ít
    else if (calPct < 70)  calorieMultiplier = 0.7;   // Dưới mức tối ưu
    else if (calPct > 130) calorieMultiplier = 0.6;   // Ăn quá nhiều
    else if (calPct > 110) calorieMultiplier = 0.85;  // Vượt nhẹ

    // ── Sugar Toxicity Multiplier ──
    let sugarMultiplier = 1.0;
    if (consumed.sugar != null && consumed.sugar > (sugarLimit * 2)) {
        sugarMultiplier = 0.7;  // Đường > 200% AHA
    }

    // ── Áp dụng multipliers ──
    score = Math.round(score * calorieMultiplier * sugarMultiplier);

    // ── [MỚI] Hard Cap — Điểm liệt Ngày (chỉ áp dụng khi adequate) ───────────
    let hardCapApplied = null;
    const scoreBeforeCaps = score;

    // Tính avgMicroRatio: Trung bình % đạt RDI của 4 vi chất (chỉ tính vi chất có dữ liệu)
    const microEntries = [];
    if (consumed.vitaminA != null) microEntries.push(Math.min(consumed.vitaminA / vitaminARDI, 1.0));
    if (consumed.vitaminC != null) microEntries.push(Math.min(consumed.vitaminC / vitaminCRDI, 1.0));
    if (consumed.calcium  != null) microEntries.push(Math.min(consumed.calcium  / calciumRDI,  1.0));
    if (consumed.iron     != null) microEntries.push(Math.min(consumed.iron     / ironRDI,     1.0));

    const avgMicroRatio = microEntries.length > 0
        ? microEntries.reduce((a, b) => a + b, 0) / microEntries.length
        : null; 
    const fiberRatio = consumed.fiber != null ? consumed.fiber / fiberRDI : null;

    if (calorieLevel === 'adequate') {
        // Hard Cap 50: Vi chất ngày quá kém
        if (avgMicroRatio !== null && avgMicroRatio < 0.20) {
            if (score > 50) {
                score = 50;
                hardCapApplied = 'micro_50';
            }
        }

        // Hard Cap 60: Thiếu chất xơ nghiêm trọng
        if (fiberRatio !== null && fiberRatio < 0.30) {
            if (hardCapApplied !== 'micro_50' && score > 60) {
                score = 60;
                hardCapApplied = 'fiber_60';
            }
        }
    }

    score = Math.max(0, Math.min(100, score));

    // ── Phân loại điểm ───────────────────────────────────────────────────────
    let label, emoji;
    if      (score >= 90) { label = 'Tuyệt vời';       emoji = '🏆'; }
    else if (score >= 75) { label = 'Rất tốt';          emoji = '💪'; }
    else if (score >= 60) { label = 'Khá ổn';           emoji = '👍'; }
    else if (score >= 40) { label = 'Cần cải thiện';    emoji = '⚡'; }
    else                  { label = 'Đáng lo ngại';     emoji = '⚠️'; }

    return {
        score, label, emoji, bonuses,
        hardCapApplied,
        scoreBeforeCaps,
        calorieLevel,
        calorieMultiplier,
        sugarMultiplier,
        avgMicroRatio: avgMicroRatio !== null ? parseFloat(avgMicroRatio.toFixed(2)) : null,
        fiberRatio: fiberRatio !== null ? parseFloat(fiberRatio.toFixed(2)) : null,
    };
};




module.exports = {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
    calculateDailyHealthScore,
};
