'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Prompt bilingual để đọc bảng thành phần dinh dưỡng từ ảnh.
 * Yêu cầu Gemini trả về JSON chuẩn hóa, quy đổi về per 100g.
 */
const NUTRITION_PROMPT = `
Bạn là chuyên gia dinh dưỡng. Hãy đọc bảng thành phần dinh dưỡng (Nutrition Facts / Thành phần dinh dưỡng) trong ảnh này.

Yêu cầu:
1. Trả về JSON với các trường sau (không thêm markdown, chỉ JSON thuần)
2. Tất cả giá trị dinh dưỡng phải quy đổi về chuẩn per 100g (nếu là đồ ăn rắn) hoặc per 100ml (nếu là thức uống/chất lỏng)
3. Sodium đơn vị là mg
4. Nếu không tìm thấy thông tin → trả về null cho trường đó
5. Trường "confidence": "high" nếu ảnh rõ nét; "medium" nếu một số chữ mờ; "low" nếu khó đọc

JSON format:
{
  "productName": "tên sản phẩm hoặc null",
  "servingSize": "mô tả serving size gốc (vd: 30g, 1 gói, 250ml) hoặc null",
  "unit": "100g" hoặc "100ml" (dựa vào loại sản phẩm),
  "calories": số_kcal_per_100_donvi,
  "protein": số_g_per_100_donvi,
  "carbs": số_g_per_100_donvi,
  "fat": số_g_per_100_donvi,
  "fiber": số_g_per_100_donvi_hoặc_null,
  "sugar": số_g_per_100_donvi_hoặc_null,
  "sodium": số_mg_per_100_donvi_hoặc_null,
  "confidence": "high" | "medium" | "low",
  "rawText": "toàn bộ text đọc được từ bảng dinh dưỡng"
}

You are a nutrition expert. Read the Nutrition Facts label in this image and return a JSON object exactly as specified above. Convert from per serving to per 100g or 100ml if necessary.
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };

    const result = await model.generateContent([NUTRITION_PROMPT, imagePart]);
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
        calories: Number(parsed.calories),
        protein: Number(parsed.protein),
        carbs: Number(parsed.carbs),
        fat: Number(parsed.fat),
        fiber: parsed.fiber != null ? Number(parsed.fiber) : null,
        sugar: parsed.sugar != null ? Number(parsed.sugar) : null,
        sodium: parsed.sodium != null ? Number(parsed.sodium) : null,
        confidence: parsed.confidence || 'low',
        rawText: parsed.rawText || '',
    };
};

module.exports = { extractNutritionFromImage };
