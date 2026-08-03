# Báo cáo Chi tiết: Dịch vụ AI Vision (Gemini Vision Service)

Hệ thống nhận diện AI của Web Dinh Dưỡng sử dụng module chuyên biệt **Gemini Vision Service** (`geminiVision.service.js`) để trích xuất dữ liệu từ bảng thành phần dinh dưỡng (Nutrition Facts) và đọc mã vạch thông qua mô hình Google Generative AI (`gemini-2.5-flash`). Dưới đây là phân tích chi tiết về kiến trúc và các cơ chế được áp dụng trong dịch vụ này.

## Các tính năng cốt lõi và Kiến trúc:

### 1. Cơ chế Xoay vòng Khóa (API Key Rotation)
Để giải quyết bài toán giới hạn số lượng request (Rate Limit / Quota Exceeded - Lỗi 429) của gói API miễn phí, hệ thống cài đặt cơ chế xoay vòng khóa thông minh thông qua hàm `executeWithKeyRotation`:
- Nhận vào một danh sách nhiều API Keys (phân tách bằng dấu phẩy trong biến môi trường `.env`).
- Khi một Key bị lỗi Quota (429) hoặc cạn kiệt, hệ thống lập tức bắt được lỗi và tự động chuyển sang Key tiếp theo trong mảng để thử lại request. Nhờ vậy, trải nghiệm trích xuất AI của người dùng hoàn toàn không bị gián đoạn.

### 2. Zero-Storage Policy (Chính sách Không lưu trữ ảnh)
Khi gọi AI Vision, hệ thống **không hề lưu trữ** ảnh người dùng tải lên ở bất kỳ thư mục tạm nào trên Backend:
- Ảnh dạng Base64 được xử lý trực tiếp trong bộ nhớ (In-memory) và truyền thẳng vào Google API.
- Ngay sau khi API trả về kết quả, biến chứa Base64 bị loại bỏ và dọn dẹp hoàn toàn bởi bộ thu gom rác (Garbage Collector) của JavaScript. Điều này đảm bảo quyền riêng tư dữ liệu cực cao và giảm tải tối đa cho hệ thống lưu trữ (Disk I/O).

### 3. Prompt Engineering Thông minh (Extract Nutrition)
Prompt `NUTRITION_PROMPT` được thiết kế rất chặt chẽ để chuẩn hóa luồng dữ liệu AI:
- **Ép kiểu JSON:** Yêu cầu Gemini trả về định dạng JSON thuần (loại bỏ markdown blocks bằng Regex `replace(/```json\s*/gi, '')`).
- **Chuẩn hóa mốc 100g/ml:** Ép AI luôn quy chuẩn dữ liệu về mốc "per 100g" hoặc "per 100ml" (bỏ qua cột "per serving"), giúp dữ liệu đồng nhất khi lưu vào CSDL.
- **Chuyển đổi Vi chất (IU sang mcg):** Bắt buộc Gemini tự động thực hiện phép tính đổi đơn vị quốc tế `IU` sang `µg/mcg` theo tiêu chuẩn y khoa (Ví dụ: Vitamin A nhân 0.3, Vitamin D nhân 0.025).

### 4. Fallback Đọc Mã Vạch (Barcode Fallback)
Hệ thống cung cấp hàm `extractBarcodeFromImage` như một giải pháp dự phòng (fallback) mạnh mẽ. Khi camera của điện thoại trên Frontend không quét được mã vạch quang học (do mờ, chói sáng, hoặc góc hẹp), người dùng có thể chụp nguyên cái nhãn và Gemini Vision sẽ dùng OCR kết hợp nhận thức hình ảnh để "đọc" trực tiếp dãy số in bên dưới các sọc mã vạch.

## Kết luận
**Gemini Vision Service** đóng vai trò là bộ não khai phá dữ liệu tự động cho NMS. Kiến trúc của nó không chỉ mạnh mẽ về mặt chức năng AI mà còn có khả năng phục hồi lỗi (Fault Tolerance) xuất sắc thông qua Key Rotation, đồng thời đảm bảo bảo mật cao thông qua Zero-Storage Policy.
