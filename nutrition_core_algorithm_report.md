# Báo cáo Chi tiết: Các Thuật toán Dinh dưỡng Cốt lõi (Core Nutrition Algorithms)

Tệp `nutrition.service.js` đóng vai trò là "bộ não" tính toán sinh học của toàn bộ hệ thống NMS. Nó chứa tất cả các công thức y khoa nền tảng để xác định chỉ số cơ thể, năng lượng tiêu hao và phân bổ đa lượng (Macros) cho từng người dùng cụ thể. 

Báo cáo này phân tích chi tiết các công thức toán học và logic y khoa được sử dụng.

---

## 1. Đánh giá Chỉ số Cơ thể (BMI)
Hệ thống sử dụng công thức tính BMI (Body Mass Index) tiêu chuẩn và phân loại theo bảng tham chiếu của Tổ chức Y tế Thế giới (WHO).
* **Công thức:** `BMI = Cân nặng(kg) / Chiều cao(m)²`
* **Phân loại WHO:**
  * `< 18.5`: Thiếu cân (Màu xanh dương)
  * `18.5 - 24.9`: Bình thường (Màu xanh lá)
  * `25.0 - 29.9`: Thừa cân (Màu vàng)
  * `≥ 30.0`: Béo phì (Màu đỏ)

---

## 2. Tính toán Năng lượng Chuyển hóa Cơ bản (BMR)
Hệ thống áp dụng công thức **Mifflin-St Jeor** - đây là công thức được Hiệp hội Dinh dưỡng Hoa Kỳ (ADA) đánh giá là chính xác nhất hiện nay để tính BMR (Năng lượng cơ thể tiêu hao ở trạng thái nghỉ ngơi hoàn toàn).
* **Nam giới:** `BMR = (10 × Trọng lượng) + (6.25 × Chiều cao) - (5 × Tuổi) + 5`
* **Nữ giới:** `BMR = (10 × Trọng lượng) + (6.25 × Chiều cao) - (5 × Tuổi) - 161`

*(Ghi chú: Thuật toán có bước xử lý Timezone chặt chẽ khi tính tuổi từ ngày sinh để tránh lỗi lệch ngày do múi giờ Việt Nam).*

---

## 3. Tính Tổng Năng lượng Tiêu hao (TDEE)
TDEE là tổng năng lượng cơ thể tiêu hao trong 1 ngày, bao gồm cả BMR và các hoạt động thể chất (Physical Activity Level - PAL).
* **Công thức tĩnh (Static TDEE):** `TDEE = BMR × Hệ số Vận động`
* **Các mức hệ số (PAL):**
  * Ít vận động (Sedentary): `1.2`
  * Vận động nhẹ (Light): `1.375`
  * Vận động vừa (Moderate): `1.55`
  * Vận động nhiều (Active): `1.725`
  * Rất nhiều/Vận động viên (Very Active): `1.9`

> **Tích hợp Adaptive TDEE:** Tại hàm `calculateAllMetrics`, hệ thống sẽ tự động kiểm tra xem người dùng có kích hoạt và có đủ dữ liệu Adaptive TDEE hay không. Nếu có, TDEE động (Adaptive TDEE) sẽ ngay lập tức được lấy làm gốc thay thế cho TDEE tĩnh (Mifflin) để các phép tính phía sau (Target Calo, Macros) bám sát thực tế hơn.

---

## 4. Điều chỉnh Mục tiêu Calo (Target Calories)
Sau khi có TDEE, hệ thống sẽ tính toán lượng Calo Mục tiêu hàng ngày dựa trên mục tiêu sức khỏe của người dùng (Goal). Đây là nơi chứa logic khóa an toàn rất quan trọng.
* **Tăng cân (Gain Weight):** `Target = TDEE + 300 kcal` (Thặng dư calo vừa phải để ưu tiên tăng cơ, hạn chế tăng mỡ).
* **Duy trì (Maintain Weight):** `Target = TDEE`
* **Giảm cân (Lose Weight):** `Target = TDEE - 500 kcal` (Tạo thâm hụt để giảm khoảng 0.5kg/tuần).

> **KHÓA AN TOÀN (Safety Floor):** Ở mục tiêu giảm cân, hệ thống có một hàm `Math.max(BMR, TDEE - 500)`. Điều này đảm bảo rằng lượng calo mục tiêu **KHÔNG BAO GIỜ được phép tụt xuống dưới mức BMR**. Ăn dưới BMR (dưới mức cơ bản để sinh tồn) sẽ gây suy nhược, mất cơ bắp và làm sập hệ thống trao đổi chất. Hệ thống cũng đặt mức sàn cứng thấp nhất là `1200 kcal` đề phòng BMR bị lỗi/quá thấp.

---

## 5. Phân bổ Đa lượng (Macro Distribution)
Hệ thống chuyển đổi từ Calo tổng sang Gram cụ thể cho 3 nhóm đa lượng (Protein, Carbs, Fat).
* **Tỷ lệ mặc định (MACRO_DEFAULTS):** `Protein 30%` - `Carbs 40%` - `Fat 30%`. Đây là tỷ lệ cân bằng, phù hợp với hầu hết mọi người. Người dùng hoàn toàn có thể tự tùy chỉnh tỷ lệ này.
* **Hệ số chuyển đổi Năng lượng:**
  * 1g Protein = 4 kcal
  * 1g Carbs = 4 kcal
  * 1g Fat = 9 kcal
* **Công thức (Ví dụ cho Protein):** `Protein (g) = (Target Calories × Tỷ lệ Protein) / 4`

---

## 6. Mục tiêu Nước uống (Water Goal)
Hệ thống không khuyến nghị "2 lít nước mỗi ngày" một cách chung chung, mà cá nhân hóa lượng nước theo cân nặng.
* **Công thức Y khoa:** `Water Goal (ml) = Cân nặng (kg) × 35`
* *Ví dụ: Người 50kg cần 1750ml, người 80kg cần 2800ml.*

---

## Tóm lược
`nutrition.service.js` là hạt nhân tính toán của NMS. Thuật toán không chỉ áp dụng các công thức chuẩn y khoa mà còn lồng ghép các lớp **Khóa an toàn** (không ăn dưới BMR) và tự động nhận diện dữ liệu thông minh (Ghi đè Adaptive TDEE nếu có, Fallback Macro mặc định nếu thiếu).
