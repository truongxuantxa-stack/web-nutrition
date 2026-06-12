'use strict';

const {
    lookupByBarcode,
    processAiVisionResult,
    reportProduct,
    formatProduct,
} = require('../../services/scanner.service');
const { extractNutritionFromImage } = require('../../services/geminiVision.service');
const { validateNutritionPhysics } = require('../../services/physicsValidation.service');
const { ScannedProduct } = require('../../models');

/**
 * POST /api/v1/scanner/barcode-lookup
 * Body: { barcode: "8934563..." }
 * Response: { found, source, product, confidence }
 */
const barcodeLookup = async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode || typeof barcode !== 'string') {
            return res.status(400).json({ success: false, message: 'Barcode không hợp lệ.' });
        }

        const result = await lookupByBarcode(barcode.trim());
        return res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Scanner] barcodeLookup error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi tra cứu barcode.' });
    }
};

/**
 * POST /api/v1/scanner/ai-vision
 * Body: { image: "base64...", barcode?: "8934563..." }
 * Response: { nutrition, aiConfidence, rawText, physicsResult }
 */
const aiVision = async (req, res) => {
    try {
        const { image, barcode, mimeType } = req.body;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh hợp lệ.' });
        }

        // Gọi Gemini Vision — base64 bị discard ngay sau đây (Zero-Storage)
        const nutrition = await extractNutritionFromImage(image, mimeType || 'image/jpeg');

        // Physics validation để hiển thị ngay cho user trên frontend (không block ở đây)
        const physicsResult = validateNutritionPhysics(nutrition);

        return res.json({
            success: true,
            data: {
                nutrition,
                aiConfidence: nutrition.confidence,
                rawText: nutrition.rawText,
                physicsResult,
                barcode: barcode || null,
            },
        });
    } catch (err) {
        console.error('[Scanner] aiVision error:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi khi xử lý ảnh.' });
    }
};

/**
 * POST /api/v1/scanner/confirm-contribution
 * Body: { barcode?, name, calories, protein, carbs, fat, fiber?, sugar?, sodium?, imageUrl? }
 * Response: { scannedProduct, food, physicsResult, contributionMessage }
 */
const confirmContribution = async (req, res) => {
    try {
        const userId = req.user.id;
        const { barcode, name, calories, protein, carbs, fat, fiber, sugar, sodium, unit } = req.body;

        // Validate input cơ bản
        const numFields = { calories, protein, carbs, fat };
        for (const [key, val] of Object.entries(numFields)) {
            if (val == null || isNaN(Number(val))) {
                return res.status(400).json({ success: false, message: `Trường "${key}" không hợp lệ.` });
            }
        }

        const nutritionData = {
            productName: name,
            calories: Number(calories),
            protein: Number(protein),
            carbs: Number(carbs),
            fat: Number(fat),
            fiber: fiber != null ? Number(fiber) : null,
            sugar: sugar != null ? Number(sugar) : null,
            sodium: sodium != null ? Number(sodium) : null,
            unit,
        };

        const result = await processAiVisionResult(userId, barcode || null, nutritionData);

        if (!result.physicsResult.valid) {
            return res.status(422).json({
                success: false,
                message: 'Dữ liệu dinh dưỡng không hợp lệ.',
                errors: result.physicsResult.errors,
            });
        }

        return res.json({
            success: true,
            data: {
                scannedProduct: result.scannedProduct,
                food: result.food,
                physicsResult: result.physicsResult,
                contributionMessage: barcode
                    ? 'Đã chia sẻ cho cộng đồng 🎉'
                    : 'Món ăn đã được lưu vào nhật ký!',
            },
        });
    } catch (err) {
        console.error('[Scanner] confirmContribution error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lưu đóng góp.', error: err.message, stack: err.stack });
    }
};

/**
 * POST /api/v1/scanner/report
 * Body: { scannedProductId, reason }
 * Response: { message }
 */
const reportProductCtrl = async (req, res) => {
    try {
        const userId = req.user.id;
        const { scannedProductId, reason } = req.body;

        if (!scannedProductId) {
            return res.status(400).json({ success: false, message: 'scannedProductId là bắt buộc.' });
        }

        await reportProduct(userId, Number(scannedProductId), reason || 'Không rõ lý do');
        return res.json({
            success: true,
            message: 'Cảm ơn phản hồi! Dữ liệu đang được xem xét lại.',
        });
    } catch (err) {
        console.error('[Scanner] reportProduct error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi khi báo cáo.' });
    }
};

module.exports = { barcodeLookup, aiVision, confirmContribution, reportProduct: reportProductCtrl };
