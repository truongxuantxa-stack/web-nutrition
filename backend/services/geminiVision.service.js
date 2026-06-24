'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lấy danh sách API keys từ biến môi trường, phân tách bằng dấu phẩy
const apiKeys = process.env.GOOGLE_API_KEY 
    ? process.env.GOOGLE_API_KEY.split(',').map(k => k.trim()).filter(k => k) 
    : [];
let currentKeyIndex = 0;

if (apiKeys.length === 0) {
    console.warn('[GeminiVision] Không tìm thấy GOOGLE_API_KEY trong biến môi trường!');
}

const getGenAI = () => {
    const key = apiKeys.length > 0 ? apiKeys[currentKeyIndex] : '';
    return new GoogleGenerativeAI(key);
};

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 30_000; // Tăng lên 30s làm đệm an toàn

const isQuotaError = (err) => {
    const msg = err.message || '';
    // 429: Too Many Requests / Quota Exceeded
    return msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exhausted');
};

const executeWithKeyRotation = async (prompt, imagePart, contextName = 'GeminiVision') => {
    let attempts = 0;
    const maxAttempts = Math.max(1, apiKeys.length);
    let lastError;

    while (attempts < maxAttempts) {
        const genAI = getGenAI();
        try {
            let result;
            try {
                const model = genAI.getGenerativeModel({ 
                    model: GEMINI_MODEL,
                    generationConfig: {
                        thinkingConfig: { thinkingBudget: 0 }
                    }
                });

                const apiCall = model.generateContent([prompt, imagePart]);
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`${contextName} timeout sau ${GEMINI_TIMEOUT_MS / 1000}s`)), GEMINI_TIMEOUT_MS)
                );
                result = await Promise.race([apiCall, timeout]);
                return result;
            } catch (err) {
                if (isQuotaError(err)) {
                    throw err; // Quota error, bubble up để trigger key rotation
                }
                
                console.warn(`[${contextName}] Lỗi với ${GEMINI_MODEL}: ${err.message}. Đang thử dùng model dự phòng (gemini-2.5-flash)...`);
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                const apiCallFallback = fallbackModel.generateContent([prompt, imagePart]);
                const timeoutFallback = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`${contextName} fallback timeout sau ${GEMINI_TIMEOUT_MS / 1000}s`)), GEMINI_TIMEOUT_MS)
                );
                result = await Promise.race([apiCallFallback, timeoutFallback]);
                return result;
            }
        } catch (err) {
            lastError = err;
            if (isQuotaError(err) && apiKeys.length > 1) {
                console.warn(`[${contextName}] API Key ở index ${currentKeyIndex} gặp lỗi Quota/429. ${attempts + 1 < apiKeys.length ? 'Chuyển sang key tiếp theo...' : 'Đã thử hết tất cả các key.'}`);
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                attempts++;
            } else {
                // Lỗi khác (không phải quota) hoặc chỉ có 1 key, ném lỗi luôn
                break;
            }
        }
    }
    
    throw lastError;
};

/**
 * Prompt bilingual để đọc bảng thành phần dinh dưỡng từ ảnh.
 * Yêu cầu Gemini trả về JSON chuẩn hóa, quy đổi về per 100g.
 */
const NUTRITION_PROMPT = `
Bạn là chuyên gia dinh dưỡng. Hãy đọc bảng thành phần dinh dưỡng (Nutrition Facts) trong ảnh này.

Yêu cầu:
1. Trả về JSON thuần (không markdown).
2. Quy đổi TẤT CẢ chỉ số về chuẩn "per 100g" hoặc "per 100ml" (tìm cột "per 100g/ml" nếu có). KHÔNG lấy cột "per serve".
3. CHÚ Ý ĐẶC BIỆT: Các vi chất (Vitamins, Canxi, Sắt) thường nằm ở nửa dưới bảng. Hãy quét kỹ từng dòng để không bỏ sót Vitamin A, Vitamin C, Calcium/Canxi, Iron/Sắt.
4. NẾU Vitamin A tính bằng IU, BẮT BUỘC phải quy đổi sang µg (mcg) bằng cách nhân với 0.3 (VD: 250 IU = 75 µg). NẾU Vitamin D tính bằng IU, quy đổi sang µg bằng cách nhân 0.025. Tuy nhiên form hiện tại chỉ cần Vitamin A.
5. Sodium đơn vị là mg.
6. Nếu không thấy dòng đó trên bảng → null. Tuyệt đối không bịa số liệu.

JSON format:
{
  "productName": "tên sản phẩm hoặc null",
  "servingSize": "mô tả serving size gốc (vd: 30g, 1 gói) hoặc null",
  "unit": "100g" hoặc "100ml",
  "calories": số_kcal_per_100 (Bắt buộc Kcal. Nếu chỉ có kJ, chia cho 4.184),
  "protein": số_g_per_100,
  "carbs": số_g_per_100,
  "fat": số_g_per_100,
  "fiber": số_g_per_100_hoặc_null,
  "sugar": số_g_per_100_hoặc_null,
  "sodium": số_mg_per_100_hoặc_null,
  "vitaminA": số_mcg_per_100_hoặc_null (đã quy đổi sang µg),
  "vitaminC": số_mg_per_100_hoặc_null,
  "calcium": số_mg_per_100_hoặc_null,
  "iron": số_mg_per_100_hoặc_null,
  "confidence": "high" | "medium" | "low",
  "rawText": "toàn bộ text đọc được"
}
`;

/**
 * Gọi Gemini Vision API để trích xuất thông tin dinh dưỡng từ ảnh.
 * Zero-Storage policy: base64Image bị discard ngay sau khi API trả kết quả.
 *
 * @param {string} base64Image - Ảnh đã nén dạng base64 (không có prefix data:image/...)
 * @param {string} [mimeType='image/jpeg'] - MIME type của ảnh
 * @returns {Promise<object>} Dữ liệu dinh dưỡng đã chuẩn hóa
 */
const extractNutritionFromImage = async (base64Image, mimeType = 'image/jpeg') => {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };

        const result = await executeWithKeyRotation(NUTRITION_PROMPT, imagePart, 'GeminiVision_Nutrition');
        const responseText = result.response.text();

        // base64Image bị discard tại đây (Zero-Storage policy)
        // JavaScript GC sẽ thu hồi bộ nhớ sau khi function return

        // Parse JSON — loại bỏ markdown code block nếu Gemini bọc vào
        const cleanedText = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedText);
        } catch {
            throw new Error(`Gemini trả về định dạng không hợp lệ: ${responseText.substring(0, 200)}`);
        }

        // Validate các trường bắt buộc
        const requiredFields = ['calories', 'protein', 'carbs', 'fat'];
        for (const field of requiredFields) {
            if (parsed[field] == null || typeof parsed[field] !== 'number') {
                throw new Error(`Không đọc được "${field}" từ bảng dinh dưỡng. Vui lòng chụp rõ hơn.`);
            }
        }

        return {
            productName: parsed.productName || null,
            servingSize: parsed.servingSize || null,
            unit: parsed.unit || '100g', // '100g' hoặc '100ml' — Gemini tự phán đoán từ ảnh
            calories: Number(parsed.calories),
            protein: Number(parsed.protein),
            carbs: Number(parsed.carbs),
            fat: Number(parsed.fat),
            fiber: parsed.fiber != null ? Number(parsed.fiber) : null,
            sugar: parsed.sugar != null ? Number(parsed.sugar) : null,
            sodium: parsed.sodium != null ? Number(parsed.sodium) : null,
            vitaminA: parsed.vitaminA != null ? Number(parsed.vitaminA) : null,
            vitaminC: parsed.vitaminC != null ? Number(parsed.vitaminC) : null,
            calcium:  parsed.calcium  != null ? Number(parsed.calcium)  : null,
            iron:     parsed.iron     != null ? Number(parsed.iron)     : null,
            confidence: parsed.confidence || 'low',
            rawText: parsed.rawText || '',
        };
    } catch (err) {
        // Re-throw với message rõ ràng để controller hiển thị cho user
        throw new Error(`[GeminiVision] ${err.message}`);
    }
};

/**
 * Prompt để đọc MÃ VẠCH (barcode number) từ ảnh sản phẩm.
 * Gemini chỉ cần trả về dãy số barcode.
 */
const BARCODE_PROMPT = `
Look at this image. Find any barcode (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, or similar).
Read the NUMBER printed below/above the barcode lines.

Rules:
1. Return ONLY a JSON object, no markdown.
2. If you find a barcode number, return: {"barcode": "the_number_string", "format": "EAN_13"}
3. If no barcode is visible, return: {"barcode": null, "format": null}
4. The barcode field must contain ONLY digits (no spaces, no dashes).
5. Common formats: EAN-13 (13 digits), EAN-8 (8 digits), UPC-A (12 digits).
`;

/**
 * Gọi Gemini Vision API để đọc số barcode từ ảnh sản phẩm.
 * Fallback khi client-side barcode detection thất bại.
 *
 * @param {string} base64Image - Ảnh dạng base64
 * @param {string} [mimeType='image/jpeg']
 * @returns {Promise<{ barcode: string|null, format: string|null }>}
 */
const extractBarcodeFromImage = async (base64Image, mimeType = 'image/jpeg') => {
    try {
        const imagePart = {
            inlineData: { data: base64Image, mimeType },
        };

        const result = await executeWithKeyRotation(BARCODE_PROMPT, imagePart, 'GeminiVision_Barcode');
        const responseText = result.response.text();

        const cleanedText = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

        const parsed = JSON.parse(cleanedText);

        // Validate: barcode phải là chuỗi chỉ chứa chữ số
        if (parsed.barcode && /^\d+$/.test(parsed.barcode)) {
            return { barcode: parsed.barcode, format: parsed.format || null };
        }

        return { barcode: null, format: null };
    } catch (err) {
        console.warn('[GeminiVision] extractBarcodeFromImage failed:', err.message);
        return { barcode: null, format: null };
    }
};

module.exports = { extractNutritionFromImage, extractBarcodeFromImage };
