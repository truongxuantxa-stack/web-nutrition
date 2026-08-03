File geminiVision.service.js này là service dùng để gọi Gemini Vision đọc ảnh. Nó có 2 nhiệm vụ chính:

1. Đọc bảng thành phần dinh dưỡng từ ảnh
   → extractNutritionFromImage()

2. Đọc mã vạch từ ảnh sản phẩm
   → extractBarcodeFromImage()

Nói dễ hiểu: file này là “mắt AI” của hệ thống. Frontend gửi ảnh lên, service này đưa ảnh cho Gemini nhìn, sau đó ép Gemini trả về JSON để backend xử lý tiếp.

1. Luồng tổng quát của service
Ảnh base64 từ frontend
        |
        v
Đóng gói ảnh thành imagePart
        |
        v
Chọn prompt phù hợp:
- NUTRITION_PROMPT nếu đọc bảng dinh dưỡng
- BARCODE_PROMPT nếu đọc mã vạch
        |
        v
Gọi executeWithKeyRotation()
        |
        v
Gemini trả về text
        |
        v
Làm sạch markdown nếu có
        |
        v
JSON.parse()
        |
        v
Validate dữ liệu
        |
        v
Trả object sạch cho controller / scanner.service

Trong đó, executeWithKeyRotation() là hàm gọi Gemini chung, còn extractNutritionFromImage() và extractBarcodeFromImage() là 2 hàm nghiệp vụ cụ thể.

2. Bước 1: Import thư viện Gemini

Đầu file có:

const { GoogleGenerativeAI } = require('@google/generative-ai');

Dòng này lấy thư viện Gemini của Google để backend có thể gọi AI.

Sau đó service lấy API key từ biến môi trường:

const apiKeys = process.env.GOOGLE_API_KEY 
    ? process.env.GOOGLE_API_KEY.split(',').map(k => k.trim()).filter(k => k) 
    : [];

Ý nghĩa:

Nếu trong .env có GOOGLE_API_KEY thì lấy ra.
Nếu có nhiều key, phân tách bằng dấu phẩy.
Xóa khoảng trắng thừa.
Bỏ key rỗng.
Nếu không có key thì apiKeys = [].

Ví dụ trong .env có:

GOOGLE_API_KEY=key1,key2,key3

thì apiKeys sẽ thành:

['key1', 'key2', 'key3']

Service này có hỗ trợ nhiều API key để khi một key bị quota thì chuyển sang key khác.

3. Bước 2: Tạo Gemini client theo key hiện tại

Có hàm:

const getGenAI = () => {
    const key = apiKeys.length > 0 ? apiKeys[currentKeyIndex] : '';
    return new GoogleGenerativeAI(key);
};

Ý nghĩa:

Lấy API key hiện tại trong mảng apiKeys.
Tạo object GoogleGenerativeAI bằng key đó.

Biến:

let currentKeyIndex = 0;

dùng để nhớ đang dùng key thứ mấy.

Ví dụ:

currentKeyIndex = 0 → dùng key1
currentKeyIndex = 1 → dùng key2
currentKeyIndex = 2 → dùng key3

Nếu key 1 bị hết quota, hệ thống tăng currentKeyIndex để chuyển sang key tiếp theo.

4. Bước 3: Cấu hình model và timeout

File định nghĩa:

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 30_000;

Nghĩa là:

Model dùng: gemini-2.5-flash
Thời gian chờ tối đa: 30 giây

Nếu gọi Gemini quá 30 giây chưa trả kết quả, hệ thống tự báo lỗi timeout. Việc này giúp backend không bị treo mãi như cái máy in kẹt giấy.

5. Bước 4: Nhận diện lỗi quota

Có hàm:

const isQuotaError = (err) => {
    const msg = err.message || '';
    return msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exhausted');
};

Hàm này kiểm tra lỗi có phải do:

429
quota
exhausted

hay không.

Nếu đúng, hệ thống hiểu là API key hiện tại có thể đã hết lượt gọi, cần thử key khác.

6. Bước 5: Hàm lõi executeWithKeyRotation()

Đây là hàm trung tâm:

executeWithKeyRotation(prompt, imagePart, contextName)

Nó nhận vào:

prompt      → yêu cầu gửi cho Gemini
imagePart   → ảnh cần đọc
contextName → tên ngữ cảnh để log lỗi

Ví dụ khi đọc dinh dưỡng:

executeWithKeyRotation(NUTRITION_PROMPT, imagePart, 'GeminiVision_Nutrition')

Khi đọc mã vạch:

executeWithKeyRotation(BARCODE_PROMPT, imagePart, 'GeminiVision_Barcode')
6.1. Luồng bên trong executeWithKeyRotation()
Bắt đầu với attempts = 0
        |
        v
Lấy Gemini client theo API key hiện tại
        |
        v
Tạo model Gemini
        |
        v
Gọi model.generateContent([prompt, imagePart])
        |
        v
Chạy song song với timeout 30 giây
        |
        v
Nếu thành công → return result
        |
        v
Nếu lỗi quota → chuyển sang key khác
        |
        v
Nếu lỗi khác → thử fallback model
        |
        v
Nếu vẫn lỗi → throw error

Trong code có đoạn:

const apiCall = model.generateContent([prompt, imagePart]);
const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${contextName} timeout sau ${GEMINI_TIMEOUT_MS / 1000}s`)), GEMINI_TIMEOUT_MS)
);
result = await Promise.race([apiCall, timeout]);

Nghĩa là hệ thống cho 2 việc chạy song song:

apiCall → gọi Gemini
timeout → đếm 30 giây

Việc nào xong trước thì lấy việc đó. Nếu Gemini trả lời trước 30 giây thì dùng kết quả. Nếu quá 30 giây thì báo timeout.

6.2. Cơ chế đổi API key

Nếu lỗi là quota và có nhiều key:

currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
attempts++;

Ví dụ có 3 key:

key1 lỗi quota → chuyển key2
key2 lỗi quota → chuyển key3
key3 lỗi quota → quay lại key1 nhưng attempts đã đủ, dừng

Ý nghĩa là service cố gắng tận dụng nhiều API key để giảm lỗi do hết quota. Nếu thử hết vẫn lỗi thì ném lỗi cuối cùng ra ngoài.

7. Bước 6: Prompt đọc bảng dinh dưỡng

File có biến:

const NUTRITION_PROMPT = `...`;

Prompt này yêu cầu Gemini đóng vai chuyên gia dinh dưỡng và đọc bảng Nutrition Facts trong ảnh. Nó bắt Gemini trả về JSON thuần, không markdown. Đồng thời yêu cầu quy đổi toàn bộ dữ liệu về:

per 100g
hoặc
per 100ml

Các trường Gemini phải trả về gồm:

productName
servingSize
unit
calories
protein
carbs
fat
fiber
sugar
sodium
vitaminA
vitaminC
calcium
iron
confidence
rawText

Prompt cũng yêu cầu:

Nếu chỉ có kJ thì đổi sang kcal bằng cách chia 4.184.
Nếu Vitamin A là IU thì đổi sang µg bằng cách nhân 0.3.
Nếu Vitamin D là IU thì đổi sang µg bằng cách nhân 0.025.
Nếu không thấy chỉ số nào thì trả null, không được bịa.

Đây là phần rất quan trọng vì AI rất dễ “đoán mò” nếu prompt không chặn rõ.

8. Bước 7: Hàm extractNutritionFromImage()

Đây là hàm đọc bảng dinh dưỡng từ ảnh:

const extractNutritionFromImage = async (base64Image, mimeType = 'image/jpeg') => {
    ...
};

Đầu vào:

base64Image → ảnh dạng base64
mimeType    → loại ảnh, mặc định là image/jpeg

Đầu ra là object dinh dưỡng đã chuẩn hóa.

8.1. Đóng gói ảnh thành imagePart

Trong hàm có:

const imagePart = {
    inlineData: {
        data: base64Image,
        mimeType,
    },
};

Gemini không nhận ảnh kiểu file bình thường trong hàm này, mà nhận ảnh dạng:

inlineData.data = base64Image
inlineData.mimeType = image/jpeg

Nghĩa là backend gói ảnh thành một object để gửi kèm prompt.

8.2. Gọi Gemini đọc bảng dinh dưỡng

Sau đó gọi:

const result = await executeWithKeyRotation(
    NUTRITION_PROMPT,
    imagePart,
    'GeminiVision_Nutrition'
);

Tức là:

Dùng prompt đọc dinh dưỡng
Gửi kèm ảnh
Gắn tên ngữ cảnh là GeminiVision_Nutrition

Gemini sẽ trả về kết quả, rồi code lấy text:

const responseText = result.response.text();

Lưu ý: Gemini trả về text, không phải object JavaScript ngay. Vì vậy backend phải xử lý tiếp.

8.3. Làm sạch kết quả Gemini

Có đoạn:

const cleanedText = responseText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

Vì đôi khi AI trả về kiểu:

```json
{
  "calories": 250
}

Nhưng backend cần JSON thuần:

```json id="uvq6sk"
{
  "calories": 250
}

Nên code xóa phần json và đi, rồi dùng .trim() để xóa khoảng trắng thừa.

8.4. Parse JSON

Sau khi làm sạch, code dùng:

parsed = JSON.parse(cleanedText);

Nghĩa là đổi chuỗi JSON thành object JavaScript.

Nếu Gemini trả về sai định dạng, ví dụ thiếu dấu ngoặc hoặc thêm chữ linh tinh, JSON.parse() sẽ lỗi. Khi đó service ném lỗi:

throw new Error(`Gemini trả về định dạng không hợp lệ: ${responseText.substring(0, 200)}`);

Tức là lỗi sẽ nói rõ Gemini trả về không đúng JSON.

8.5. Kiểm tra các trường bắt buộc

Sau khi parse, hàm kiểm tra:

const requiredFields = ['calories', 'protein', 'carbs', 'fat'];

Rồi duyệt từng field:

for (const field of requiredFields) {
    if (parsed[field] == null || typeof parsed[field] !== 'number') {
        throw new Error(`Không đọc được "${field}" từ bảng dinh dưỡng. Vui lòng chụp rõ hơn.`);
    }
}

Nghĩa là 4 trường này bắt buộc phải có và phải là số:

calories
protein
carbs
fat

Nếu thiếu một trong 4 trường này, hệ thống không chấp nhận kết quả AI.

Lý do: đây là 4 chỉ số nền để tính dinh dưỡng chính. Thiếu chúng thì dữ liệu không đủ đáng tin để lưu hoặc đưa vào nhật ký ăn uống.

8.6. Chuẩn hóa object trả về

Cuối hàm, service trả về:

return {
    productName: parsed.productName || null,
    servingSize: parsed.servingSize || null,
    unit: parsed.unit || '100g',
    calories: Number(parsed.calories),
    protein: Number(parsed.protein),
    carbs: Number(parsed.carbs),
    fat: Number(parsed.fat),
    fiber: parsed.fiber != null ? Number(parsed.fiber) : null,
    sugar: parsed.sugar != null ? Number(parsed.sugar) : null,
    sodium: parsed.sodium != null ? Number(parsed.sodium) : null,
    vitaminA: parsed.vitaminA != null ? Number(parsed.vitaminA) : null,
    vitaminC: parsed.vitaminC != null ? Number(parsed.vitaminC) : null,
    calcium: parsed.calcium != null ? Number(parsed.calcium) : null,
    iron: parsed.iron != null ? Number(parsed.iron) : null,
    confidence: parsed.confidence || 'low',
    rawText: parsed.rawText || '',
};

Ý nghĩa:

Có tên sản phẩm thì lấy, không có thì null.
Có servingSize thì lấy, không có thì null.
Không có unit thì mặc định 100g.
Các chỉ số số học được ép sang Number.
Chỉ số nào không có thì để null.
Không có confidence thì mặc định low.
Không có rawText thì để chuỗi rỗng.

Đây là bước biến kết quả AI thành dữ liệu sạch để service khác dùng tiếp.

9. Bước 8: Prompt đọc mã vạch

Ngoài đọc dinh dưỡng, file còn có:

const BARCODE_PROMPT = `...`;

Prompt này yêu cầu Gemini nhìn ảnh và tìm số barcode như:

EAN-13
EAN-8
UPC-A
UPC-E
Code 128

Gemini chỉ được trả về JSON:

{
  "barcode": "the_number_string",
  "format": "EAN_13"
}

Nếu không thấy barcode:

{
  "barcode": null,
  "format": null
}

Prompt cũng yêu cầu barcode chỉ chứa chữ số, không dấu cách, không dấu gạch ngang.

10. Bước 9: Hàm extractBarcodeFromImage()

Hàm này dùng để đọc mã vạch từ ảnh:

const extractBarcodeFromImage = async (base64Image, mimeType = 'image/jpeg') => {
    ...
};

Đây là fallback khi client-side barcode detection thất bại. Nghĩa là nếu frontend hoặc thư viện quét barcode không đọc được, backend có thể nhờ Gemini nhìn ảnh và đọc số barcode.

10.1. Luồng của extractBarcodeFromImage()
Nhận ảnh base64
        |
        v
Gói thành imagePart
        |
        v
Gọi executeWithKeyRotation(BARCODE_PROMPT, imagePart)
        |
        v
Lấy responseText từ Gemini
        |
        v
Xóa markdown nếu có
        |
        v
JSON.parse()
        |
        v
Kiểm tra barcode có toàn chữ số không
        |
        v
Nếu hợp lệ → trả barcode và format
Nếu không hợp lệ → trả null

Code kiểm tra barcode:

if (parsed.barcode && /^\d+$/.test(parsed.barcode)) {
    return { barcode: parsed.barcode, format: parsed.format || null };
}

Trong đó:

/^\d+$/

nghĩa là chuỗi phải toàn chữ số từ đầu đến cuối.

Ví dụ hợp lệ:

8934567890123

Không hợp lệ:

893-456-789
abc893
893 456

Nếu không hợp lệ, hàm trả:

return { barcode: null, format: null };

Nếu có lỗi, hàm không ném lỗi ra ngoài mà chỉ log warning rồi trả null:

catch (err) {
    console.warn('[GeminiVision] extractBarcodeFromImage failed:', err.message);
    return { barcode: null, format: null };
}

Lý do hợp lý: đọc barcode từ ảnh chỉ là phương án dự phòng. Nếu thất bại, hệ thống vẫn có thể chuyển sang đọc bảng dinh dưỡng hoặc yêu cầu người dùng nhập/chụp lại.

11. Bước 10: Export hàm ra ngoài

Cuối file:

module.exports = {
    extractNutritionFromImage,
    extractBarcodeFromImage
};

Nghĩa là file khác có thể import 2 hàm này để dùng.

Ví dụ controller có thể viết:

const {
    extractNutritionFromImage,
    extractBarcodeFromImage
} = require('../../services/geminiVision.service');

Sau đó controller gọi:

const nutritionData = await extractNutritionFromImage(base64Image, mimeType);

hoặc:

const barcodeResult = await extractBarcodeFromImage(base64Image, mimeType);
12. Tóm tắt 2 luồng chính
Luồng A: Đọc bảng dinh dưỡng
Frontend gửi ảnh bảng dinh dưỡng dạng base64
        |
        v
extractNutritionFromImage(base64Image, mimeType)
        |
        v
Tạo imagePart
        |
        v
Gọi executeWithKeyRotation() với NUTRITION_PROMPT
        |
        v
Gemini đọc ảnh và trả text JSON
        |
        v
Xóa markdown nếu có
        |
        v
JSON.parse()
        |
        v
Kiểm tra calories/protein/carbs/fat
        |
        v
Ép số bằng Number()
        |
        v
Trả nutritionData đã chuẩn hóa

Kết quả ví dụ:

{
  productName: 'Sữa tươi ít đường',
  servingSize: '180ml',
  unit: '100ml',
  calories: 70,
  protein: 3.2,
  carbs: 8.5,
  fat: 2.5,
  fiber: null,
  sugar: 6.5,
  sodium: 45,
  vitaminA: 75,
  vitaminC: null,
  calcium: 120,
  iron: null,
  confidence: 'high',
  rawText: '...'
}
Luồng B: Đọc barcode từ ảnh
Frontend gửi ảnh sản phẩm
        |
        v
extractBarcodeFromImage(base64Image, mimeType)
        |
        v
Tạo imagePart
        |
        v
Gọi executeWithKeyRotation() với BARCODE_PROMPT
        |
        v
Gemini tìm số barcode
        |
        v
JSON.parse()
        |
        v
Regex kiểm tra barcode chỉ có chữ số
        |
        v
Trả { barcode, format } hoặc { barcode: null, format: null }

Kết quả ví dụ:

{
  barcode: '8934567890123',
  format: 'EAN_13'
}
13. Vai trò của service này trong Hybrid Nutrition Scanner

Trong hệ thống quét dinh dưỡng kết hợp, file này nằm ở tầng AI Vision:

Barcode scan bình thường thất bại
hoặc
Barcode không có dữ liệu trong database/OpenFoodFacts
        |
        v
Gemini Vision đọc ảnh
        |
        +--> extractBarcodeFromImage()
        |       Đọc số barcode từ ảnh nếu nhìn thấy
        |
        +--> extractNutritionFromImage()
                Đọc bảng thành phần dinh dưỡng

Sau khi extractNutritionFromImage() trả về nutritionData, dữ liệu này thường được đưa tiếp sang scanner.service.js, cụ thể là hàm:

processAiVisionResult(userId, barcode, nutritionData)

Lúc đó scanner.service.js mới kiểm tra vật lý, lưu sản phẩm, lưu đóng góp và tạo Food cho người dùng.
