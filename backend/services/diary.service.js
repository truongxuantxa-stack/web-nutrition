'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/diary.service.js
// Business logic cho nhật ký ăn uống và quản lý thực phẩm cá nhân.
// Bóc tách từ controllers/diary.controller.js (legacy EJS).
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food } = require('../models');
const { Op }               = require('sequelize');
const { toLocalDateString, toDateString } = require('../utils/date.helper');
const openfoodfactsService = require('./openfoodfacts.service');

// ─── Helper tính snapshot dinh dưỡng ─────────────────────────────────────────
const calcSnapshot = (food, amountNum) => {
    const isRaw  = food.foodType === 'raw';
    const factor = isRaw ? amountNum / 100 : amountNum;
    return {
        caloriesSnapshot : Math.round(food.calories * factor * 10) / 10,
        proteinSnapshot  : Math.round(food.protein  * factor * 10) / 10,
        carbsSnapshot    : Math.round(food.carbs    * factor * 10) / 10,
        fatSnapshot      : Math.round(food.fat      * factor * 10) / 10,
        fiberSnapshot    : food.fiber  != null ? Math.round(food.fiber  * factor * 10) / 10 : null,
        sugarSnapshot    : food.sugar  != null ? Math.round(food.sugar  * factor * 10) / 10 : null,
        sodiumSnapshot   : food.sodium != null ? Math.round(food.sodium * factor * 10) / 10 : null,
        vitaminASnapshot : food.vitaminA != null ? Math.round(food.vitaminA * factor * 10) / 10 : null,
        vitaminCSnapshot : food.vitaminC != null ? Math.round(food.vitaminC * factor * 10) / 10 : null,
        calciumSnapshot  : food.calcium  != null ? Math.round(food.calcium  * factor * 10) / 10 : null,
        ironSnapshot     : food.iron     != null ? Math.round(food.iron     * factor * 10) / 10 : null,
    };
};

/**
 * Validate và tạo DiaryEntry mới với snapshot dinh dưỡng.
 * @param {number} userId
 * @param {{ foodId, amount, mealType, date, note }} payload
 * @returns {{ entry: object }}
 * @throws {{ status: number, message: string }}
 */
const addDiaryEntry = async (userId, { foodId, amount, mealType, date, note }) => {
    if (!foodId || !amount || !mealType) {
        throw { status: 400, message: 'Vui lòng điền đầy đủ thông tin món ăn.' };
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        throw { status: 400, message: 'Số lượng phải là số dương.' };
    }

    const food = await Food.findByPk(parseInt(foodId));
    if (!food) {
        throw { status: 404, message: 'Không tìm thấy món ăn.' };
    }

    // [G1 FIX] Không cho phép ghi nhật ký cho ngày tương lai
    const entryDate = toDateString(date);
    const today     = toLocalDateString(new Date());
    if (entryDate > today) {
        throw { status: 400, message: 'Không thể ghi nhật ký cho ngày tương lai.' };
    }

    const snapshot = calcSnapshot(food, amountNum);
    const entry = await DiaryEntry.create({
        userId,
        foodId   : food.id,
        amount   : amountNum,
        mealType,
        date     : entryDate,
        note     : note ? note.trim() : null,
        ...snapshot,
    });

    return {
        entry: {
            id              : entry.id,
            foodName        : food.name,
            amount          : amountNum,
            unit            : food.unit,
            mealType,
            ...snapshot,
            note            : entry.note,
        },
    };
};

/**
 * Tìm và xóa DiaryEntry (chỉ entry của chính user).
 * @param {number} userId
 * @param {number} entryId
 * @throws {{ status: number, message: string }}
 */
const deleteDiaryEntry = async (userId, entryId) => {
    const entry = await DiaryEntry.findOne({ where: { id: entryId, userId } });
    if (!entry) {
        throw { status: 404, message: 'Không tìm thấy mục nhật ký.' };
    }
    await entry.destroy();
};

/**
 * Tìm kiếm món ăn (system food + custom food của user).
 * @param {number} userId
 * @param {{ q, category, foodType, limit }} params
 * @returns {{ foods: Food[] }}
 */
const searchFood = async (userId, { q, category, foodType, limit }) => {
    const limitNum = parseInt(limit) || 100;

    const whereClause = {
        [Op.or]: [
            { isCustom: false },
            { userId },
        ],
    };
    if (q && q.trim()) whereClause.name = { [Op.like]: `%${q.trim()}%` };
    if (category)       whereClause.category = category;
    if (foodType)       whereClause.foodType  = foodType;

    const foods = await Food.findAll({
        where     : whereClause,
        limit     : Math.min(limitNum, 100),
        order     : [['isCustom', 'DESC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'vitaminA', 'vitaminC', 'calcium', 'iron', 'unit', 'category', 'foodType', 'isCustom', 'imageUrl', 'dataSource'],
    });

    const hasOffResults = foods.some(f => f.dataSource === 'openfoodfacts');

    // Chỉ gọi API khi kết quả local < 5 VÀ chưa có kết quả nào từ OpenFoodFacts trong list này
    if (foods.length < 5 && !hasOffResults && q && q.trim()) {
        try {
            const offProducts = await openfoodfactsService.searchOpenFoodFacts(q.trim(), limitNum);
            if (offProducts.length > 0) {
                const savedFoods = await openfoodfactsService.saveToLocalDB(offProducts);
                
                const localIds = new Set(foods.map(f => f.id));
                const newFoods = savedFoods
                    .filter(f => !localIds.has(f.id))
                    .map(f => ({
                        id: f.id, name: f.name, calories: f.calories,
                        protein: f.protein, carbs: f.carbs, fat: f.fat,
                        fiber: f.fiber, sugar: f.sugar, sodium: f.sodium,
                        vitaminA: f.vitaminA, vitaminC: f.vitaminC,
                        calcium: f.calcium, iron: f.iron,
                        unit: f.unit, category: f.category, foodType: f.foodType,
                        isCustom: f.isCustom, imageUrl: f.imageUrl, dataSource: f.dataSource,
                    }));
                
                foods.push(...newFoods);
            }
        } catch (err) {
            console.warn('[HybridSearch] Fallback to Local DB only.');
        }
    }

    return { foods };
};

// ─── Validate macro fields dùng chung cho create + update ────────────────────
const validateMacros = (foodData) => {
    const { calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron } = foodData;
    const calNum  = parseFloat(calories);
    const proNum  = parseFloat(protein);
    const carbNum = parseFloat(carbs);
    const fatNum  = parseFloat(fat);

    if (isNaN(calNum)  || calNum  < 0) throw { status: 400, message: 'Calories không hợp lệ.' };
    if (isNaN(proNum)  || proNum  < 0) throw { status: 400, message: 'Protein không hợp lệ.' };
    if (isNaN(carbNum) || carbNum < 0) throw { status: 400, message: 'Carbs không hợp lệ.' };
    if (isNaN(fatNum)  || fatNum  < 0) throw { status: 400, message: 'Fat không hợp lệ.' };
    if (calNum  > 9999) throw { status: 400, message: 'Calories tối đa 9999 kcal.' };
    if (proNum  > 999)  throw { status: 400, message: 'Protein tối đa 999g.' };
    if (carbNum > 999)  throw { status: 400, message: 'Carbs tối đa 999g.' };
    if (fatNum  > 999)  throw { status: 400, message: 'Fat tối đa 999g.' };
    // [QA-FIX] Business logic: tổng macro không vượt 999g
    if (proNum + carbNum + fatNum > 999) {
        throw {
            status : 400,
            message: `Tổng Protein + Carbs + Fat = ${(proNum + carbNum + fatNum).toFixed(1)}g — vượt giới hạn thực tế (999g).`,
        };
    }

    const fiberNum  = (fiber  !== '' && fiber  != null) ? parseFloat(fiber)  : null;
    const sugarNum  = (sugar  !== '' && sugar  != null) ? parseFloat(sugar)  : null;
    const sodiumNum = (sodium !== '' && sodium != null) ? parseFloat(sodium) : null;
    const vitaminANum = (vitaminA !== '' && vitaminA != null) ? parseFloat(vitaminA) : null;
    const vitaminCNum = (vitaminC !== '' && vitaminC != null) ? parseFloat(vitaminC) : null;
    const calciumNum  = (calcium  !== '' && calcium  != null) ? parseFloat(calcium)  : null;
    const ironNum     = (iron     !== '' && iron     != null) ? parseFloat(iron)     : null;

    if (fiberNum  != null && (isNaN(fiberNum)  || fiberNum  < 0)) throw { status: 400, message: 'Chất xơ không hợp lệ.' };
    if (sugarNum  != null && (isNaN(sugarNum)  || sugarNum  < 0)) throw { status: 400, message: 'Đường không hợp lệ.' };
    if (sodiumNum != null && (isNaN(sodiumNum) || sodiumNum < 0)) throw { status: 400, message: 'Natri không hợp lệ.' };
    if (vitaminANum != null && (isNaN(vitaminANum) || vitaminANum < 0)) throw { status: 400, message: 'Vitamin A không hợp lệ.' };
    if (vitaminCNum != null && (isNaN(vitaminCNum) || vitaminCNum < 0)) throw { status: 400, message: 'Vitamin C không hợp lệ.' };
    if (calciumNum  != null && (isNaN(calciumNum)  || calciumNum  < 0)) throw { status: 400, message: 'Canxi không hợp lệ.' };
    if (ironNum     != null && (isNaN(ironNum)     || ironNum     < 0)) throw { status: 400, message: 'Sắt không hợp lệ.' };

    return { calNum, proNum, carbNum, fatNum, fiberNum, sugarNum, sodiumNum, vitaminANum, vitaminCNum, calciumNum, ironNum };
};

/**
 * Validate và tạo Custom Food mới.
 * @param {number} userId
 * @param {object} foodData
 * @returns {{ food: object }}
 * @throws {{ status: number, message: string }}
 */
const createCustomFood = async (userId, foodData) => {
    const { name, unit, category, foodType } = foodData;
    if (!name || name.trim() === '') {
        throw { status: 400, message: 'Tên món ăn không được để trống.' };
    }
    const { calNum, proNum, carbNum, fatNum, fiberNum, sugarNum, sodiumNum, vitaminANum, vitaminCNum, calciumNum, ironNum } = validateMacros(foodData);

    const food = await Food.create({
        userId,
        isCustom     : true,
        name         : name.trim(),
        calories     : calNum,
        protein      : proNum,
        carbs        : carbNum,
        fat          : fatNum,
        fiber        : fiberNum,
        sugar        : sugarNum,
        sodium       : sodiumNum,
        vitaminA     : vitaminANum,
        vitaminC     : vitaminCNum,
        calcium      : calciumNum,
        iron         : ironNum,
        unit         : unit && unit.trim() ? unit.trim() : '1 suất',
        category     : category || 'khac',
        foodType     : foodType || 'dish',
        isSuggestable: false,
    });

    return {
        food: {
            id      : food.id,
            name    : food.name,
            calories: food.calories,
            protein : food.protein,
            carbs   : food.carbs,
            fat     : food.fat,
            fiber   : food.fiber,
            sugar   : food.sugar,
            sodium  : food.sodium,
            vitaminA: food.vitaminA,
            vitaminC: food.vitaminC,
            calcium : food.calcium,
            iron    : food.iron,
            unit    : food.unit,
            category: food.category,
            foodType: food.foodType,
            isCustom: food.isCustom,
        },
    };
};

/**
 * Validate và cập nhật Custom Food của user.
 * @param {number} userId
 * @param {number} foodId
 * @param {object} foodData
 * @returns {{ food: object }}
 * @throws {{ status: number, message: string }}
 */
const updateCustomFood = async (userId, foodId, foodData) => {
    const existingFood = await Food.findOne({ where: { id: foodId, userId, isCustom: true } });
    if (!existingFood) {
        throw { status: 404, message: 'Không tìm thấy món ăn hoặc bạn không có quyền sửa.' };
    }

    const { name, unit, category, foodType } = foodData;
    if (!name || name.trim() === '') {
        throw { status: 400, message: 'Tên món ăn không được để trống.' };
    }
    const { calNum, proNum, carbNum, fatNum, fiberNum, sugarNum, sodiumNum, vitaminANum, vitaminCNum, calciumNum, ironNum } = validateMacros(foodData);

    const updatedName = name.trim();
    await existingFood.update({
        name    : updatedName,
        calories: calNum,
        protein : proNum,
        carbs   : carbNum,
        fat     : fatNum,
        fiber   : fiberNum,
        sugar   : sugarNum,
        sodium  : sodiumNum,
        vitaminA: vitaminANum,
        vitaminC: vitaminCNum,
        calcium : calciumNum,
        iron    : ironNum,
        unit    : unit && unit.trim() ? unit.trim() : existingFood.unit,
        category: category || existingFood.category,
        foodType: foodType || existingFood.foodType,
    });

    // [QA-FIX] Dùng updatedName thay vì existingFood.name (giá trị cũ trước update)
    return {
        food: {
            id      : existingFood.id,
            name    : updatedName,
            calories: calNum,
            protein : proNum,
            carbs   : carbNum,
            fat     : fatNum,
            fiber   : fiberNum,
            sugar   : sugarNum,
            sodium  : sodiumNum,
            vitaminA: vitaminANum,
            vitaminC: vitaminCNum,
            calcium : calciumNum,
            iron    : ironNum,
            unit    : unit && unit.trim() ? unit.trim() : existingFood.unit,
            category: category || existingFood.category,
            foodType: foodType || existingFood.foodType,
        },
    };
};

/**
 * Soft delete Custom Food của user.
 * DiaryEntry vẫn giữ snapshot → lịch sử không bị mất.
 * @param {number} userId
 * @param {number} foodId
 * @returns {{ foodName: string }}
 * @throws {{ status: number, message: string }}
 */
const deleteCustomFood = async (userId, foodId) => {
    const food = await Food.findOne({ where: { id: foodId, userId, isCustom: true } });
    if (!food) {
        throw { status: 404, message: 'Không tìm thấy món ăn hoặc bạn không có quyền xóa.' };
    }
    const foodName = food.name;
    // Soft delete: Sequelize paranoid=true sẽ set deletedAt
    await food.destroy();
    return { foodName };
};

module.exports = {
    addDiaryEntry,
    deleteDiaryEntry,
    searchFood,
    createCustomFood,
    updateCustomFood,
    deleteCustomFood,
};
