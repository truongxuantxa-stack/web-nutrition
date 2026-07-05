'use strict';

const {
    lookupByBarcode,
    processAiVisionResult,
    reportProduct,
    formatProduct,
} = require('../../services/scanner.service');
const { extractNutritionFromImage, extractBarcodeFromImage } = require('../../services/geminiVision.service');
const { validateNutritionPhysics } = require('../../services/physicsValidation.service');
const { ScannedProduct } = require('../../models');
const { uploadProductImage } = require('../../services/cloudinary.service');

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
        const { barcode, name, calories, protein, carbs, fat, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, base64Image, unit, imageUrl: reqImageUrl } = req.body;

        // Validate input cơ bản
        const numFields = { calories, protein, carbs, fat };
        for (const [key, val] of Object.entries(numFields)) {
            if (val == null || isNaN(Number(val))) {
                return res.status(400).json({ success: false, message: `Trường "${key}" không hợp lệ.` });
            }
        }

        let imageUrl = reqImageUrl || null;
        if (base64Image) {
            try {
                // Thêm prefix nếu chưa có
                const imageData = base64Image.startsWith('data:image') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
                imageUrl = (await uploadProductImage(imageData, name)).url;
            } catch (err) {
                console.error('[Scanner] Cloudinary upload failed:', err);
                // Bỏ qua lỗi upload ảnh, vẫn cho phép lưu dữ liệu
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
            vitaminA: vitaminA != null ? Number(vitaminA) : null,
            vitaminC: vitaminC != null ? Number(vitaminC) : null,
            calcium: calcium != null ? Number(calcium) : null,
            iron: iron != null ? Number(iron) : null,
            imageUrl,
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

        let contributionCount = req.user.contributionCount;
        if (barcode) {
            req.user.contributionCount += 1;
            await req.user.save();
            contributionCount = req.user.contributionCount;
        }

        return res.json({
            success: true,
            data: {
                scannedProduct: result.scannedProduct,
                food: result.food,
                physicsResult: result.physicsResult,
                contributionCount,
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

/**
 * POST /api/v1/scanner/decode-barcode-image
 * Body: { image: "base64...", mimeType?: "image/jpeg" }
 * Response: { barcode: "8934563...", format: "EAN_13" }
 * Fallback khi client-side barcode detection thất bại.
 */
const decodeBarcodeImage = async (req, res) => {
    try {
        const { image, mimeType } = req.body;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh hợp lệ.' });
        }

        const result = await extractBarcodeFromImage(image, mimeType || 'image/jpeg');

        if (!result.barcode) {
            return res.json({
                success: true,
                data: { found: false, barcode: null, format: null },
            });
        }

        return res.json({
            success: true,
            data: { found: true, barcode: result.barcode, format: result.format },
        });
    } catch (err) {
        console.error('[Scanner] decodeBarcodeImage error:', err.message);
        return res.status(500).json({ success: false, message: 'Lỗi khi đọc mã vạch từ ảnh.' });
    }
};

/**
 * POST /api/v1/scanner/upload-product-image
 * Body: { scannedProductId, image }
 * Response: { imageUrl, contributionCount }
 */
const uploadProductImageCtrl = async (req, res) => {
    try {
        const { scannedProductId, image } = req.body;
        if (!scannedProductId || !image) {
            return res.status(400).json({ success: false, message: 'Thiếu scannedProductId hoặc ảnh.' });
        }

        const product = await ScannedProduct.findByPk(scannedProductId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
        }

        const uploadResult = await uploadProductImage(image, product.name || 'product');
        
        product.imageUrl = uploadResult.url;
        await product.save();

        // Cập nhật cả Food nếu có cùng barcode
        if (product.barcode) {
            const { Food } = require('../../models');
            const food = await Food.findOne({ where: { barcode: product.barcode } });
            if (food) {
                food.imageUrl = uploadResult.url;
                await food.save();
            }
        }

        // Gamification
        req.user.contributionCount += 1;
        await req.user.save();

        return res.json({
            success: true,
            data: {
                imageUrl: uploadResult.url,
                contributionCount: req.user.contributionCount
            }
        });

    } catch (err) {
        console.error('[Scanner] uploadProductImage error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh mặt trước.' });
    }
};

module.exports = { barcodeLookup, aiVision, confirmContribution, reportProduct: reportProductCtrl, decodeBarcodeImage, uploadProductImage: uploadProductImageCtrl };
