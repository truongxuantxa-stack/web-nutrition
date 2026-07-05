# Báo Cáo Chức Năng: Hybrid Nutrition Scanner (Quét Dinh Dưỡng Kết Hợp AI & Mã Vạch)

## 1. Đặt vấn đề (Problem Statement)
Trong quá trình theo dõi và kiểm soát dinh dưỡng hằng ngày (Diet Tracking), rào cản lớn nhất khiến người dùng dễ nản lòng và từ bỏ là thao tác **nhập liệu thủ công**. Đối với các thực phẩm đóng gói, người dùng thường phải đọc từng dòng nhỏ xíu trên bao bì và gõ tay hàng loạt các chỉ số phức tạp như: Năng lượng (Calories), Protein, Carbs, Fat, Chất xơ, Đường, Natri,... Việc này không chỉ mất nhiều thời gian mà còn cực kỳ dễ xảy ra sai sót nhập liệu (typo), dẫn đến sai lệch toàn bộ hồ sơ dinh dưỡng trong ngày.

Để giải quyết vấn đề đó, tính năng quét mã vạch (Barcode Scanner) ra đời nhưng vẫn mang điểm yếu chí mạng: Phụ thuộc vào cơ sở dữ liệu. Nếu là sản phẩm nội địa hoặc ngách, quét mã vạch sẽ vô dụng.

## 2. Giải pháp: Hybrid Nutrition Scanner
Hệ thống kết hợp sức mạnh của Trí tuệ Nhân tạo (AI) để tạo ra phương thức bổ trợ lẫn nhau:
1. **Quét Mã Vạch (Barcode):** Giải pháp tra cứu siêu tốc cho các sản phẩm phổ biến.
2. **AI Vision (Đọc bảng thành phần):** Giải pháp cứu cánh cho các sản phẩm chưa có trong cơ sở dữ liệu. Đặc biệt, tính năng này được thiết kế để **hỗ trợ tự động hóa việc nhập liệu đối với các sản phẩm đóng gói mua tại siêu thị**. Thay vì phải gõ tay từng dòng nhỏ xíu trên bao bì, người dùng chỉ cần chụp ảnh Bảng thông tin dinh dưỡng (Nutrition Facts), AI (Gemini Flash) sẽ phân tích và trích xuất toàn bộ số liệu ngay lập tức.

## 3. Kiến trúc 4-Layer Lookup Pipeline
Hệ thống tra cứu mã vạch trong `scanner.service.js` được tối ưu hóa theo 4 lớp Fallback:

- **Layer 1 (Local Verified):** Ưu tiên cao nhất. Tìm trong Local DB các sản phẩm có trạng thái `verified` và độ tin cậy `confidenceScore >= 0.7`. Điều này đảm bảo tốc độ phản hồi tính bằng mili-giây.
- **Layer 2 (Local Unverified):** Nếu không tìm thấy, hệ thống tiếp tục tìm các sản phẩm do cộng đồng đóng góp nhưng chưa được xác thực (Unverified / Disputed).
- **Layer 3 (OpenFoodFacts API):** Nếu Local DB hoàn toàn trống, hệ thống gọi API bên thứ ba (Open Food Facts). Nếu tìm thấy, dữ liệu được **lưu đệm (cache)** ngược lại vào Local DB (với confidence 1.0) để người dùng sau không phải gọi API nữa.
- **Layer 4 (AI Vision Fallback):** Trả về `Not Found`, Frontend lập tức chuyển người dùng sang luồng chụp ảnh AI Vision.

## 4. Xử lý Dữ liệu AI & Physics Validation
Khi dữ liệu AI trả về, hệ thống backend phải đảm bảo nó không phá vỡ định luật vật lý thông qua `validateNutritionPhysics`:
- **Định luật bảo toàn khối lượng:** Tổng trọng lượng (Protein + Carbs + Fat) không được vượt quá 100g (hoặc 100ml).
- **Định luật bảo toàn năng lượng:** 100g thức ăn không thể vượt quá 900 kcal.
- **Hệ thống Atwater:** Kiểm tra chéo mức năng lượng AI báo cáo với công thức Atwater (Protein x 4 + Carbs x 4 + Fat x 9). Nếu độ lệch quá 15%, hệ thống sẽ đánh dấu cảnh báo.
- Dữ liệu sau khi vượt qua bài test sẽ được lưu vào DB với `confidenceScore = 0.3` (Unverified) và ghi nhận `ProductContribution`.

## 5. Đóng Góp Cộng Đồng & Cập nhật Trust Score
Hàm `recalculateConfidence` là cơ chế tự làm sạch (Self-Healing) của cơ sở dữ liệu:
- Khi có nhiều người dùng sử dụng AI để chụp cùng một sản phẩm mã vạch, hệ thống gom nhóm (aggregate) các `ProductContribution`.
- Nếu có từ 3 lượt đóng góp trở lên mà sai lệch năng lượng so với trung bình dưới 15%, sản phẩm sẽ được thăng cấp lên `verified` với `confidence = 0.8`.
- Nếu phát hiện dữ liệu sai, người dùng có thể Báo Cáo (Report), lập tức hạ cấp sản phẩm về `disputed`.

## Kết luận
Hybrid Nutrition Scanner tạo ra một Data Flywheel hoàn hảo. Càng nhiều người dùng dùng AI Vision, Local DB càng phong phú, giúp các lượt tra cứu mã vạch sau nhanh hơn và tiết kiệm chi phí gọi API. Cơ chế Physics Validation và Trust Score đảm bảo dữ liệu cộng đồng ngày càng chính xác và đáng tin cậy.
