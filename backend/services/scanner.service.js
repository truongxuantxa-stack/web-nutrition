'use strict';

const { ScannedProduct, ProductContribution, Food } = require('../models');
const { lookupByBarcode: lookupOFF } = require('./openfoodfacts.service');
const { validateNutritionPhysics } = require('./physicsValidation.service');
const { Op } = require('sequelize');

/**
 * Chuẩn hóa barcode về dạng EAN-13 (13 chữ số, pad leading zeros).
 * @param {string} rawBarcode
 * @returns {string}
 */
const normalizeBarcode = (rawBarcode) => {
    const digits = String(rawBarcode).replace(/\D/g, '');
    return digits.padStart(13, '0');
};

/**
 * 4-Layer Lookup Pipeline — tra cứu sản phẩm theo barcode.
 * Layer 1: Local DB (verified, confidence >= 0.7)
 * Layer 2: Local DB (unverified)
 * Layer 3: OpenFoodFacts API
 * Layer 4: Trả null → frontend chuyển sang AI Vision
 *
 * @param {string} barcode
 * @returns {Promise<{ found: boolean, source: string|null, product: object|null, confidence: number }>}
 */
const lookupByBarcode = async (barcode) => {
    const normalizedBarcode = normalizeBarcode(barcode);

    // Layer 1: Local DB — verified
    const verifiedProduct = await ScannedProduct.findOne({
        where: {
            barcode: normalizedBarcode,
            status: 'verified',
            confidenceScore: { [Op.gte]: 0.7 },
        },
    });
    if (verifiedProduct) {
        return {
            found: true,
            source: 'local_verified',
            product: formatProduct(verifiedProduct),
            confidence: verifiedProduct.confidenceScore,
        };
    }

    // Layer 2: Local DB — unverified hoặc disputed
    const unverifiedProduct = await ScannedProduct.findOne({
        where: { barcode: normalizedBarcode },
    });
    if (unverifiedProduct) {
        return {
            found: true,
            source: 'local_unverified',
            product: formatProduct(unverifiedProduct),
            confidence: unverifiedProduct.confidenceScore,
        };
    }

    // Layer 3: OpenFoodFacts API
    try {
        const offProduct = await lookupOFF(normalizedBarcode);
        if (offProduct) {
            // Cache vào Local DB để lần sau nhanh hơn
            const [savedProduct] = await ScannedProduct.findOrCreate({
                where: { barcode: normalizedBarcode },
                defaults: {
                    barcode: normalizedBarcode,
                    name: offProduct.name,
                    calories: offProduct.calories,
                    protein: offProduct.protein,
                    carbs: offProduct.carbs,
                    fat: offProduct.fat,
                    fiber: offProduct.fiber,
                    sugar: offProduct.sugar,
                    sodium: offProduct.sodium,
                    vitaminA: offProduct.vitaminA,
                    vitaminC: offProduct.vitaminC,
                    calcium: offProduct.calcium,
                    iron: offProduct.iron,
                    imageUrl: offProduct.imageUrl,
                    quantity: offProduct.quantity || null,
                    servingSize: offProduct.servingSize || null,
                    confidenceScore: 1.0, // OFF là trusted source
                    contributionCount: 1,
                    status: 'verified',
                    dataSource: 'openfoodfacts',
                },
            });

            return {
                found: true,
                source: 'openfoodfacts',
                product: formatProduct(savedProduct),
                confidence: 1.0,
            };
        }
    } catch (err) {
        console.warn('[Scanner] OFF lookup failed:', err.message);
    }

    // Layer 4: Not found → frontend chuyển sang AI Vision
    return { found: false, source: null, product: null, confidence: 0 };
};

/**
 * Format ScannedProduct instance thành plain object để trả về API.
 * @param {ScannedProduct} product
 * @returns {object}
 */
const formatProduct = (product) => ({
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    calories: product.calories,
    protein: product.protein,
    carbs: product.carbs,
    fat: product.fat,
    fiber: product.fiber,
    sugar: product.sugar,
    sodium: product.sodium,
    vitaminA: product.vitaminA,
    vitaminC: product.vitaminC,
    calcium: product.calcium,
    iron: product.iron,
    imageUrl: product.imageUrl,
    confidenceScore: product.confidenceScore,
    contributionCount: product.contributionCount,
    status: product.status,
    dataSource: product.dataSource,
    unit: product.unit || '100g',
    quantity: product.quantity || null,     // Thể tích/kl thực (vd: "330ml") — từ OFF hoặc null
    servingSize: product.servingSize || null, // Serving size gốc (vd: "1 lon 330ml") — từ OFF hoặc null
});

/**
 * Xử lý kết quả AI Vision — validate, lưu đóng góp, tính lại trust score.
 * @param {number} userId
 * @param {string} barcode - Có thể null nếu chụp không có barcode
 * @param {object} nutritionData - Dữ liệu từ Gemini Vision (đã quy đổi per 100g)
 * @returns {Promise<{ scannedProduct: object, food: object, physicsResult: object }>}
 */
const processAiVisionResult = async (userId, barcode, nutritionData) => {
    try {
        const { productName, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, imageUrl, unit } = nutritionData;
        const resolvedUnit = unit && unit.toLowerCase().includes('ml') ? '100ml' : '100g';

        // Bước 1: Physics Validation (truyền unit để ngưỡng maxMass được tính đúng cho cả g lẫn ml)
        const physicsResult = validateNutritionPhysics({ calories, protein, carbs, fat, fiber, sugar, sodium }, resolvedUnit);
        if (!physicsResult.valid) {
            return { physicsResult, scannedProduct: null, food: null };
        }

        let scannedProduct = null;

        if (barcode) {
            const normalizedBarcode = normalizeBarcode(barcode);

            // Bước 2: Tạo hoặc cập nhật ScannedProduct
            const [sp, created] = await ScannedProduct.findOrCreate({
                where: { barcode: normalizedBarcode },
                defaults: {
                    barcode: normalizedBarcode,
                    name: productName || 'Sản phẩm chưa đặt tên',
                    calories, protein, carbs, fat, fiber, sugar, sodium,
                    vitaminA, vitaminC, calcium, iron, imageUrl,
                    unit: resolvedUnit,
                    confidenceScore: 0.3,
                    contributionCount: 1,
                    status: 'unverified',
                    dataSource: 'community',
                },
            });

            scannedProduct = sp;

            // Bước 3: Tạo ProductContribution record
            await ProductContribution.create({
                scannedProductId: sp.id,
                userId,
                rawCalories: calories,
                rawProtein: protein,
                rawCarbs: carbs,
                rawFat: fat,
                rawFiber: fiber,
                rawSugar: sugar,
                rawSodium: sodium,
                rawVitaminA: vitaminA,
                rawVitaminC: vitaminC,
                rawCalcium: calcium,
                rawIron: iron,
                rawUnit: resolvedUnit,
                source: 'ai_vision',
                isRejected: false,
            });

            // Bước 4: Tính lại confidence score (chỉ khi product đã có rồi)
            if (!created) {
                await recalculateConfidence(sp.id);
                await sp.reload();
            }
        }

        // Bước 5: Tạo Food record tạm cho user thêm vào diary
        const food = await Food.create({
            userId,
            isCustom: true,
            name: productName || 'Sản phẩm quét AI',
            calories,
            protein,
            carbs,
            fat,
            fiber: fiber || null,
            sugar: sugar || null,
            sodium: sodium || null,
            vitaminA: vitaminA || null,
            vitaminC: vitaminC || null,
            calcium: calcium || null,
            iron: iron || null,
            imageUrl: imageUrl || null,
            unit: resolvedUnit,
            category: resolvedUnit === '100ml' ? 'do_uong' : 'khac',
            foodType: 'raw',
            dataSource: 'community',
            barcode: barcode ? normalizeBarcode(barcode) : null,
        });

        return {
            physicsResult,
            scannedProduct: scannedProduct ? formatProduct(scannedProduct) : null,
            food: {
                id: food.id,
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                unit: food.unit,
            },
        };
    } catch (err) {
        console.error('[Scanner] processAiVisionResult error:', err.message);
        throw err;
    }
};

/**
 * Tính lại Trust Score dựa trên tất cả contributions hợp lệ.
 * - 1 contribution → confidence = 0.3
 * - 2 contributions tương đồng (<15% sai lệch) → confidence = 0.5
 * - >= 3 contributions tương đồng → confidence = 0.8
 * - dataSource = 'openfoodfacts' → confidence = 1.0
 *
 * @param {number} scannedProductId
 */
const recalculateConfidence = async (scannedProductId) => {
    const product = await ScannedProduct.findByPk(scannedProductId);
    if (!product) return;

    // OFF luôn có confidence = 1.0
    if (product.dataSource === 'openfoodfacts') {
        await product.update({ confidenceScore: 1.0, status: 'verified' });
        return;
    }

    const contributions = await ProductContribution.findAll({
        where: { scannedProductId, isRejected: false },
    });

    const count = contributions.length;
    if (count === 0) return;

    // Tính trung bình calo của tất cả contributions
    const avgCalories = contributions.reduce((sum, c) => sum + c.rawCalories, 0) / count;

    // Filter 1 lần — dùng chung cho similarCount VÀ aggregation
    const validContributions = contributions.filter(c => {
        if (avgCalories === 0) return true;
        const dev = Math.abs(c.rawCalories - avgCalories) / avgCalories;
        return dev < 0.15;
    });
    const similarCount = validContributions.length;

    let newScore;
    let newStatus;

    if (count >= 3 && similarCount >= 3) {
        newScore = 0.8;
        newStatus = 'verified';
    } else if (count >= 2 && similarCount >= 2) {
        newScore = 0.5;
        newStatus = 'unverified';
    } else {
        newScore = 0.3;
        newStatus = 'unverified';
    }

    // Tính aggregated nutrition từ validContributions
    const aggregate = (field) => {
        const vals = validContributions.map(c => c[field]).filter(v => v != null);
        return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    };

    await product.update({
        // Dùng ?? (nullish) thay || để không bỏ qua giá trị 0 hợp lệ (vd: nước lọc 0 calo)
        calories: aggregate('rawCalories') ?? product.calories,
        protein: aggregate('rawProtein') ?? product.protein,
        carbs: aggregate('rawCarbs') ?? product.carbs,
        fat: aggregate('rawFat') ?? product.fat,
        fiber: aggregate('rawFiber'),
        sugar: aggregate('rawSugar'),
        sodium: aggregate('rawSodium'),
        vitaminA: aggregate('rawVitaminA'),
        vitaminC: aggregate('rawVitaminC'),
        calcium: aggregate('rawCalcium'),
        iron: aggregate('rawIron'),
        confidenceScore: newScore,
        contributionCount: count,
        status: newStatus,
    });
};

/**
 * Báo lỗi dữ liệu — hạ status xuống 'disputed'.
 * @param {number} userId
 * @param {number} scannedProductId
 * @param {string} reason
 */
const reportProduct = async (userId, scannedProductId, reason) => {
    const product = await ScannedProduct.findByPk(scannedProductId);
    if (!product) {
        throw new Error('Không tìm thấy sản phẩm.');
    }
    // Hạ confidenceScore về 0.3 để nhất quán với status disputed
    await product.update({
        status: 'disputed',
        confidenceScore: Math.min(product.confidenceScore, 0.3),
    });
    console.info(`[Scanner] Product ${scannedProductId} reported by user ${userId}: ${reason}`);
};

module.exports = {
    lookupByBarcode,
    normalizeBarcode,
    processAiVisionResult,
    recalculateConfidence,
    reportProduct,
    formatProduct,
};
