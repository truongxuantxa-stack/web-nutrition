'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/diary.controller.js
// Xử lý nhật ký ăn uống: xem ngày, thêm món, xóa món
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food } = require('../models');
const {
    calculateAllMetrics,
    calculateWaterGoal,
} = require('../services/nutrition.service');
const {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
} = require('../services/suggestion.service');
const { getTotalBurnedByDate }    = require('./exercise.controller');
const { getWaterByDate }          = require('./water.controller');
const { Op } = require('sequelize');

// ─── Helper: Format ngày YYYY-MM-DD theo local timezone ──────────────────────
const toLocalDateString = (d) => {
    // Dùng local timezone, tránh lệch ngày khi dùng toISOString() (UTC)
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toDateString = (date) => {
    if (!date) return toLocalDateString(new Date());
    // Nếu đã là YYYY-MM-DD string hợp lệ → dùng thẳng, không parse
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return toLocalDateString(new Date());
    return toLocalDateString(d);
};

// ─── GET /nhat-ky?date=YYYY-MM-DD ────────────────────────────────────────────

exports.getDiary = async (req, res) => {
    try {
        const user    = req.user;
        const date    = toDateString(req.query.date);
        const metrics = calculateAllMetrics(user);

        // Lấy tất cả entries trong ngày, kèm thông tin Food
        // [QA-FIX] Thêm paranoid: false để load được cả món đã bị Soft Delete
        // Nếu không có, entry.food = null → EJS crash khi gọi entry.food.name
        const entries = await DiaryEntry.findAll({
            where: { userId: user.id, date },
            include: [{ model: Food, as: 'food', paranoid: false }],
            order: [['createdAt', 'ASC']],
        });

        // Nhóm theo bữa + tính tổng dinh dưỡng
        const mealGroups  = groupEntriesByMeal(entries);
        const consumed    = sumNutritionFromEntries(entries);

        // Hardcore Tracking: KHÔNG cộng calo đốt từ luyện tập vào TDEE
        const totalBurned     = await getTotalBurnedByDate(user.id, date);

        // ── Tiến độ & Health Insights ─
        const calorieProgress = getCalorieProgress(consumed.calories, metrics.targetCalories || 0);
        const macroProgress   = getMacroProgress(consumed, metrics.macros || {});
        const healthInsights  = getHealthInsights(consumed, metrics, mealGroups);

        // Tính tổng calo theo từng bữa để hiển thị
        // [QA-FIX] Khởi tạo đủ 4 key với default = 0, tránh undefined khi bữa chưa có món
        const mealCalories = { sang: 0, trua: 0, toi: 0, phu: 0 };
        Object.keys(mealGroups).forEach(meal => {
            mealCalories[meal] = Math.round(
                sumNutritionFromEntries(mealGroups[meal]).calories
            );
        });

        // ── Dữ liệu nước uống hôm nay ────────────────────────────────────────
        const { total: waterTotal, logs: waterLogs } = await getWaterByDate(user.id, date);
        // Mục tiêu nước: user.waterGoal (ghi đè) ưu tiên hơn tính từ cân nặng
        const waterGoal = user.waterGoal || calculateWaterGoal(user.weight);

        res.render('diary/index', {
            title    : 'Nhật Ký Ăn Uống',
            activePage: 'diary',
            user,
            date,
            metrics,
            entries,
            mealGroups,
            mealCalories,
            consumed : {
                calories: Math.round(consumed.calories),
                protein : Math.round(consumed.protein),
                carbs   : Math.round(consumed.carbs),
                fat     : Math.round(consumed.fat),
                fiber   : consumed.fiber  != null ? Math.round(consumed.fiber  * 10) / 10 : null,
                sugar   : consumed.sugar  != null ? Math.round(consumed.sugar  * 10) / 10 : null,
                sodium  : consumed.sodium != null ? Math.round(consumed.sodium * 10) / 10 : null,
            },
            totalBurned,
            calorieProgress,
            macroProgress,
            healthInsights,
            // ─ Water data ─
            waterTotal,
            waterLogs,
            waterGoal,
            error  : null,
            success: null,
        });
    } catch (err) {
        console.error('getDiary error:', err);
        res.status(500).render('404', { title: 'Lỗi hệ thống' });
    }
};

// ─── POST /nhat-ky/them ──────────────────────────────────────────────────────

exports.addEntry = async (req, res) => {
    const { foodId, amount, mealType, date, note } = req.body;
    const user = req.user;

    try {
        // Validate đầu vào
        if (!foodId || !amount || !mealType) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin món ăn.',
            });
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải là số dương.',
            });
        }

        // Lấy thông tin món ăn
        const food = await Food.findByPk(parseInt(foodId));
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy món ăn.',
            });
        }

        const entryDate = toDateString(date);

        // [G1 FIX] Không cho phép ghi nhật ký cho ngày tương lai
        const today = toLocalDateString(new Date());
        if (entryDate > today) {
            return res.status(400).json({
                success: false,
                message: 'Không thể ghi nhật ký cho ngày tương lai.',
            });
        }

        const isRaw = food.foodType === 'raw';
        const factor = isRaw ? amountNum / 100 : amountNum;

        // Tạo entry với snapshot dinh dưỡng tại thời điểm này
        const entry = await DiaryEntry.create({
            userId           : user.id,
            foodId           : food.id,
            amount           : amountNum,
            mealType,
            date             : entryDate,
            caloriesSnapshot : Math.round(food.calories * factor * 10) / 10,
            proteinSnapshot  : Math.round(food.protein  * factor * 10) / 10,
            carbsSnapshot    : Math.round(food.carbs    * factor * 10) / 10,
            fatSnapshot      : Math.round(food.fat      * factor * 10) / 10,
            fiberSnapshot    : food.fiber  != null ? Math.round(food.fiber  * factor * 10) / 10 : null,
            sugarSnapshot    : food.sugar  != null ? Math.round(food.sugar  * factor * 10) / 10 : null,
            sodiumSnapshot   : food.sodium != null ? Math.round(food.sodium * factor * 10) / 10 : null,
            note             : note ? note.trim() : null,
        });

        return res.json({
            success: true,
            message: `Đã thêm ${food.name} vào nhật ký!`,
            entry: {
                id              : entry.id,
                foodName        : food.name,
                amount          : amountNum,
                unit            : food.unit,
                mealType,
                caloriesSnapshot: entry.caloriesSnapshot,
                proteinSnapshot : entry.proteinSnapshot,
                carbsSnapshot   : entry.carbsSnapshot,
                fatSnapshot     : entry.fatSnapshot,
                fiberSnapshot   : entry.fiberSnapshot,
                sugarSnapshot   : entry.sugarSnapshot,
                sodiumSnapshot  : entry.sodiumSnapshot,
                note            : entry.note,
            },
        });
    } catch (err) {
        console.error('addEntry error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: err.errors[0].message,
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        });
    }
};

// ─── DELETE /nhat-ky/xoa/:id ──────────────────────────────────────────────────

exports.deleteEntry = async (req, res) => {
    try {
        const entry = await DiaryEntry.findOne({
            where: {
                id    : req.params.id,
                userId: req.user.id, // Chỉ cho phép xóa entry của chính mình
            },
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục nhật ký.',
            });
        }

        await entry.destroy();

        return res.json({
            success: true,
            message: 'Đã xóa mục nhật ký.',
        });
    } catch (err) {
        console.error('deleteEntry error:', err);
        return res.status(500).json({
            success: false,
            message: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        });
    }
};

// ─── GET /nhat-ky/tim-mon?q=... ──────────────────────────────────────────────
// API tìm kiếm món ăn (AJAX) để dùng trong modal thêm món

exports.searchFood = async (req, res) => {
    try {
        const q        = req.query.q ? req.query.q.trim() : '';
        const category = req.query.category || null;
        const foodType = req.query.foodType || null;
        const limit    = parseInt(req.query.limit) || 100;

        const whereClause = {
            // Hiển thị: food hệ thống (isCustom=false) + custom food của chính user
            [Op.or]: [
                { isCustom: false },
                { userId: req.user.id },
            ],
        };
        if (q) {
            whereClause.name = { [Op.like]: `%${q}%` };
        }
        if (category) {
            whereClause.category = category;
        }
        if (foodType) {
            whereClause.foodType = foodType;
        }

        const foods = await Food.findAll({
            where: whereClause,
            limit: Math.min(limit, 100),
            order: [
                ['isCustom', 'DESC'], // Custom food của user hiển lên trước
                ['name', 'ASC'],
            ],
            attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'unit', 'category', 'foodType', 'isCustom'],
        });

        return res.json({ success: true, foods });
    } catch (err) {
        console.error('searchFood error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi tìm kiếm.' });
    }
};

// ─── POST /nhat-ky/tao-mon ───────────────────────────────────────────────────────────────

exports.createCustomFood = async (req, res) => {
    try {
        const {
            name, calories, protein, carbs, fat,
            fiber, sugar, sodium,
            unit, category, foodType,
        } = req.body;

        // Validate bắt buộc
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên món ăn không được để trống.' });
        }
        const calNum  = parseFloat(calories);
        const proNum  = parseFloat(protein);
        const carbNum = parseFloat(carbs);
        const fatNum  = parseFloat(fat);

        // [QA-FIX] Kiểm tra NaN, số âm và giá trị tối đa thực tế
        if (isNaN(calNum)  || calNum  < 0) return res.status(400).json({ success: false, message: 'Calories không hợp lệ.' });
        if (isNaN(proNum)  || proNum  < 0) return res.status(400).json({ success: false, message: 'Protein không hợp lệ.' });
        if (isNaN(carbNum) || carbNum < 0) return res.status(400).json({ success: false, message: 'Carbs không hợp lệ.' });
        if (isNaN(fatNum)  || fatNum  < 0) return res.status(400).json({ success: false, message: 'Fat không hợp lệ.' });
        if (calNum  > 9999) return res.status(400).json({ success: false, message: 'Calories tối đa 9999 kcal.' });
        if (proNum  > 999)  return res.status(400).json({ success: false, message: 'Protein tối đa 999g.' });
        if (carbNum > 999)  return res.status(400).json({ success: false, message: 'Carbs tối đa 999g.' });
        if (fatNum  > 999)  return res.status(400).json({ success: false, message: 'Fat tối đa 999g.' });

        // [QA-FIX] Business logic: tổng Protein + Carbs + Fat không được vượt 999g (thực tế)
        if (proNum + carbNum + fatNum > 999) {
            return res.status(400).json({
                success: false,
                message: `Tổng Protein + Carbs + Fat = ${(proNum + carbNum + fatNum).toFixed(1)}g — vượt giới hạn thực tế (999g).`,
            });
        }

        // Vi chất (tuỳ chọn)
        const fiberNum  = (fiber  !== '' && fiber  != null) ? parseFloat(fiber)  : null;
        const sugarNum  = (sugar  !== '' && sugar  != null) ? parseFloat(sugar)  : null;
        const sodiumNum = (sodium !== '' && sodium != null) ? parseFloat(sodium) : null;

        // [QA-FIX] Validate vi chất (nếu có nhập) — không cho số âm
        if (fiberNum  != null && (isNaN(fiberNum)  || fiberNum  < 0)) return res.status(400).json({ success: false, message: 'Chất xơ không hợp lệ.' });
        if (sugarNum  != null && (isNaN(sugarNum)  || sugarNum  < 0)) return res.status(400).json({ success: false, message: 'Đường không hợp lệ.' });
        if (sodiumNum != null && (isNaN(sodiumNum) || sodiumNum < 0)) return res.status(400).json({ success: false, message: 'Natri không hợp lệ.' });

        const food = await Food.create({
            userId      : req.user.id,
            isCustom    : true,
            name        : name.trim(),
            calories    : calNum,
            protein     : proNum,
            carbs       : carbNum,
            fat         : fatNum,
            fiber       : fiberNum,
            sugar       : sugarNum,
            sodium      : sodiumNum,
            unit        : unit && unit.trim() ? unit.trim() : '1 suất',
            category    : category || 'khac',
            foodType    : foodType || 'dish',
            isSuggestable: false, // Custom food không bao giờ được gợi ý tự động
        });

        return res.json({
            success : true,
            message : `Đã tạo món “${food.name}” thành công!`,
            food    : {
                id       : food.id,
                name     : food.name,
                calories : food.calories,
                protein  : food.protein,
                carbs    : food.carbs,
                fat      : food.fat,
                fiber    : food.fiber,
                sugar    : food.sugar,
                sodium   : food.sodium,
                unit     : food.unit,
                category : food.category,
                foodType : food.foodType,
                isCustom : food.isCustom,
            },
        });
    } catch (err) {
        console.error('createCustomFood error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: err.errors[0].message });
        }
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
    }
};

// ─── GET /nhat-ky/mon-cua-toi ────────────────────────────────────────────────────────────

exports.getMyCustomFoods = async (req, res) => {
    try {
        const foods = await Food.findAll({
            where: { userId: req.user.id, isCustom: true },
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'unit', 'category', 'foodType', 'isCustom', 'createdAt'],
        });

        // Render trang quản lý hoặc trả JSON (trước mắt là trang render)
        res.render('diary/my-foods', {
            title    : 'Món Ăn Của Tôi',
            activePage: 'diary',
            user     : req.user,
            foods,
        });
    } catch (err) {
        console.error('getMyCustomFoods error:', err);
        res.status(500).render('404', { title: 'Lỗi hệ thống' });
    }
};

// ─── PUT /nhat-ky/sua-mon/:id ──────────────────────────────────────────────────────────────

exports.updateCustomFood = async (req, res) => {
    try {
        const food = await Food.findOne({
            where: { id: req.params.id, userId: req.user.id, isCustom: true },
        });
        if (!food) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn hoặc bạn không có quyền sửa.' });
        }

        const {
            name, calories, protein, carbs, fat,
            fiber, sugar, sodium,
            unit, category, foodType,
        } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên món ăn không được để trống.' });
        }

        // [QA-FIX] Dùng explicit validation thay vì parseFloat() || 0
        // parseFloat("-5") || 0 = -5 (số âm lọt qua), parseFloat("0") || 0 = 0 (OK)
        const calNum  = parseFloat(calories);
        const proNum  = parseFloat(protein);
        const carbNum = parseFloat(carbs);
        const fatNum  = parseFloat(fat);
        if (isNaN(calNum)  || calNum  < 0) return res.status(400).json({ success: false, message: 'Calories không hợp lệ.' });
        if (isNaN(proNum)  || proNum  < 0) return res.status(400).json({ success: false, message: 'Protein không hợp lệ.' });
        if (isNaN(carbNum) || carbNum < 0) return res.status(400).json({ success: false, message: 'Carbs không hợp lệ.' });
        if (isNaN(fatNum)  || fatNum  < 0) return res.status(400).json({ success: false, message: 'Fat không hợp lệ.' });
        if (calNum  > 9999) return res.status(400).json({ success: false, message: 'Calories tối đa 9999 kcal.' });
        if (proNum  > 999)  return res.status(400).json({ success: false, message: 'Protein tối đa 999g.' });
        if (carbNum > 999)  return res.status(400).json({ success: false, message: 'Carbs tối đa 999g.' });
        if (fatNum  > 999)  return res.status(400).json({ success: false, message: 'Fat tối đa 999g.' });

        // [QA-FIX] Business logic: tổng macro không vượt 999g
        if (proNum + carbNum + fatNum > 999) {
            return res.status(400).json({
                success: false,
                message: `Tổng Protein + Carbs + Fat = ${(proNum + carbNum + fatNum).toFixed(1)}g — vượt giới hạn thực tế (999g).`,
            });
        }

        const fiberNum  = (fiber  !== '' && fiber  != null) ? parseFloat(fiber)  : null;
        const sugarNum  = (sugar  !== '' && sugar  != null) ? parseFloat(sugar)  : null;
        const sodiumNum = (sodium !== '' && sodium != null) ? parseFloat(sodium) : null;
        if (fiberNum  != null && (isNaN(fiberNum)  || fiberNum  < 0)) return res.status(400).json({ success: false, message: 'Chất xơ không hợp lệ.' });
        if (sugarNum  != null && (isNaN(sugarNum)  || sugarNum  < 0)) return res.status(400).json({ success: false, message: 'Đường không hợp lệ.' });
        if (sodiumNum != null && (isNaN(sodiumNum) || sodiumNum < 0)) return res.status(400).json({ success: false, message: 'Natri không hợp lệ.' });

        const updatedName = name.trim();
        await food.update({
            name        : updatedName,
            calories    : calNum,
            protein     : proNum,
            carbs       : carbNum,
            fat         : fatNum,
            fiber       : fiberNum,
            sugar       : sugarNum,
            sodium      : sodiumNum,
            unit        : unit && unit.trim() ? unit.trim() : food.unit,
            category    : category || food.category,
            foodType    : foodType || food.foodType,
        });

        // [QA-FIX] Dùng updatedName thay vì food.name (giá trị cũ trước khi update)
        return res.json({
            success: true,
            message: `Đã cập nhật món “${updatedName}” thành công!`,
            food   : {
                id: food.id, name: updatedName, calories: calNum,
                protein: proNum, carbs: carbNum, fat: fatNum,
                fiber: fiberNum, sugar: sugarNum, sodium: sodiumNum,
                unit: unit && unit.trim() ? unit.trim() : food.unit,
                category: category || food.category,
                foodType: foodType || food.foodType,
            },
        });
    } catch (err) {
        console.error('updateCustomFood error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra.' });
    }
};

// ─── DELETE /nhat-ky/xoa-mon/:id (SOFT DELETE) ─────────────────────────────────────────

exports.deleteCustomFood = async (req, res) => {
    try {
        const food = await Food.findOne({
            where: { id: req.params.id, userId: req.user.id, isCustom: true },
        });
        if (!food) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn hoặc bạn không có quyền xóa.' });
        }

        // Soft delete: Sequelize paranoid=true sẽ set deletedAt, không DELETE thật
        // DiaryEntry vẫn giữ snapshot → lịch sử không bị mất
        await food.destroy();

        return res.json({
            success: true,
            message: `Đã xóa món “${food.name}”. Lịch sử nhật ký cũ vẫn được bảo tồn.`,
        });
    } catch (err) {
        console.error('deleteCustomFood error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra.' });
    }
};
