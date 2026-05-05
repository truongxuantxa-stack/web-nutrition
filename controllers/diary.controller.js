'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/diary.controller.js
// Xử lý nhật ký ăn uống: xem ngày, thêm món, xóa món
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food } = require('../models');
const { calculateAllMetrics } = require('../services/nutrition.service');
const {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getSuggestions,
    getCalorieProgress,
    getMacroProgress,
} = require('../services/suggestion.service');
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
        const entries = await DiaryEntry.findAll({
            where: { userId: user.id, date },
            include: [{ model: Food, as: 'food' }],
            order: [['createdAt', 'ASC']],
        });

        // Nhóm theo bữa + tính tổng dinh dưỡng
        const mealGroups = groupEntriesByMeal(entries);
        const consumed   = sumNutritionFromEntries(entries);

        // Gợi ý món ăn dựa trên calo còn thiếu
        const suggestions = metrics.targetCalories
            ? await getSuggestions(metrics.targetCalories, consumed)
            : [];

        // Tiến độ calo và macro
        const calorieProgress = getCalorieProgress(consumed.calories, metrics.targetCalories);
        const macroProgress   = getMacroProgress(consumed, metrics.macros);

        // Tính tổng calo theo từng bữa để hiển thị
        const mealCalories = {};
        Object.keys(mealGroups).forEach(meal => {
            mealCalories[meal] = Math.round(
                sumNutritionFromEntries(mealGroups[meal]).calories
            );
        });

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
            },
            suggestions,
            calorieProgress,
            macroProgress,
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

        // Tạo entry với snapshot dinh dưỡng tại thời điểm này
        const entry = await DiaryEntry.create({
            userId           : user.id,
            foodId           : food.id,
            amount           : amountNum,
            mealType,
            date             : entryDate,
            caloriesSnapshot : Math.round(food.calories * amountNum * 10) / 10,
            proteinSnapshot  : Math.round(food.protein  * amountNum * 10) / 10,
            carbsSnapshot    : Math.round(food.carbs    * amountNum * 10) / 10,
            fatSnapshot      : Math.round(food.fat      * amountNum * 10) / 10,
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
        const limit    = parseInt(req.query.limit) || 10;

        const whereClause = {};
        if (q) {
            whereClause.name = { [Op.like]: `%${q}%` };
        }
        if (category) {
            whereClause.category = category;
        }

        const foods = await Food.findAll({
            where: whereClause,
            limit: Math.min(limit, 50),
            order: [['name', 'ASC']],
            attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'unit', 'category'],
        });

        return res.json({ success: true, foods });
    } catch (err) {
        console.error('searchFood error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi tìm kiếm.' });
    }
};
