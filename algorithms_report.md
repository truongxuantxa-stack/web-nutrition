# Báo cáo Chi tiết: Tổng hợp Các Thuật toán Cốt lõi của Dự án NMS

Dự án Hệ thống Quản lý Dinh dưỡng (Nutrition Management System - NMS) sử dụng một loạt các thuật toán và công thức toán học từ cơ bản đến phức tạp để cá nhân hóa hoàn toàn trải nghiệm người dùng. Dưới đây là báo cáo tổng hợp chi tiết về cơ chế hoạt động của toàn bộ các thuật toán đang được áp dụng trong Backend.

---

## 1. Thuật toán Gợi ý Thực đơn (Gauss Meal Solver)
**Vị trí file:** `backend/services/mealPlanner.service.js`

Đây là thuật toán quan trọng nhất trong việc tự động hóa lên thực đơn, tính toán chính xác khối lượng từng nguyên liệu cần ăn để đạt được mục tiêu Macro (Đạm, Tinh bột, Béo).

### Cơ chế hoạt động:
* **Loại bỏ hằng số Rau (Fiber):** Một bữa ăn được định nghĩa gồm 4 nhóm chất (Carb, Protein, Fat, Fiber). Hệ thống cố định lượng rau (Fiber) là 200g. Calo và macro từ 200g rau này được trừ thẳng vào mục tiêu Macro tổng của bữa ăn.
* **Lập Hệ Phương trình Tuyến tính 3x3:**
  Sau khi loại trừ rau, còn lại 3 nguyên liệu. Gọi W1, W2, W3 là khối lượng cần tìm của 3 nguyên liệu đó. Ta có hệ 3 phương trình dựa trên lượng Protein, Carb, và Fat trên 100g của mỗi nguyên liệu để cân bằng với mục tiêu dinh dưỡng Tp, Tc, Tf.
* **Giải bằng Thuật toán Khử Gauss (Gaussian Elimination với Partial Pivoting):**
  - Hệ thống sử dụng phép khử Gauss trên ma trận. Để tránh sai số và chia cho 0, thuật toán áp dụng cơ chế **Partial Pivoting** (luôn tìm phần tử có trị tuyệt đối lớn nhất trong cột để hoán vị lên làm phần tử chéo chính).
  - Thuật toán tiếp tục thực hiện biến đổi về ma trận tam giác trên (Forward elimination) và thế ngược (Back substitution) để tìm ra kết quả khối lượng.

### Xử lý Ngoại lệ (Edge Cases & Smart Swap):
* Không phải tổ hợp thực phẩm nào cũng giải ra nghiệm dương (Ví dụ: một loại thịt quá nhiều mỡ sẽ làm âm khối lượng của dầu ăn). 
* Nếu giải thuật Gauss thử lại (Retry) ngẫu nhiên 15 lần mà vẫn thất bại, hệ thống sẽ trả về lỗi kèm theo kết quả tốt nhất (chứa nghiệm âm).
* **Smart Swap (Trao quyền cho người dùng):** Hệ thống không tự ý bóp méo số liệu để ép ra một thực đơn sai lệch Macro. Thay vào đó, nó sẽ giải thích lý do bất khả thi (ví dụ: "Thịt này quá nhiều mỡ") và để người dùng tự do lựa chọn đổi nguyên liệu khác thông qua tính năng đổi món thông minh (Smart Swap). Điều này giúp giáo dục dinh dưỡng và bảo vệ độ chính xác của chế độ ăn (Hardcore Tracking).

---

## 2. Thuật toán TDEE Thích ứng (Adaptive TDEE)
**Vị trí file:** `backend/services/adaptiveTDEE.service.js`

Khắc phục nhược điểm của công thức TDEE tĩnh (dễ bị sai lệch do sự "thích ứng chuyển hóa" của cơ thể sau 1-2 tuần ăn kiêng), thuật toán này tìm ra **Mức tiêu hao năng lượng thực tế** của cơ thể dựa trên số liệu calo nạp vào và sự thay đổi cân nặng hàng tuần.

### Cơ chế hoạt động:
* **Trung bình Calo Nạp (Weekly Intake):** Tính tổng lượng calo nạp vào thực tế chia cho số ngày ghi nhận nhật ký trong tuần (yêu cầu ghi nhật ký tối thiểu 5 ngày/tuần).
* **Khử nhiễu Cân nặng bằng Bộ lọc EMA (Exponential Moving Average):**
  - Cân nặng hàng ngày dao động rất mạnh do nước. Hệ thống sử dụng thuật toán làm mượt EMA với hệ số Alpha = 0.1.
  - Công thức: `EMA(t) = (Alpha * Weight) + ((1 - Alpha) * EMA(t-1))`
  - Để bộ lọc chính xác, hệ thống lùi lại **14 ngày (Warm-up period)** trước khi bắt đầu tuần để tính toán nền tảng EMA.
* **Tính toán TDEE Thực tế (Adaptive TDEE):**
  - Dựa trên nguyên lý: 1 kg mỡ tương đương 7700 kcal.
  - Công thức: `AdaptiveTDEE = AvgIntake - (WeightDelta * 7700 / 7)`
  - Nếu WeightDelta âm (giảm cân), TDEE thực tế sẽ lớn hơn lượng nạp vào.
* **Rolling Average (Trung bình động 4 tuần):** Nhằm tránh cú sốc TDEE, kết quả cuối cùng áp dụng cho người dùng là giá trị trung bình của 4 tuần gần nhất.
* **Clamping (Ràng buộc an toàn):** TDEE tính toán không được vượt quá cộng trừ 30% so với TDEE tĩnh để đề phòng lỗi do nhập sai dữ liệu cân nặng.

---

## 3. Thuật toán Chấm điểm Mật độ Dinh dưỡng (Nutrient Density Scoring)
**Vị trí file:** `backend/services/foodScoring.service.js`

Đánh giá chất lượng của một món ăn không dựa trên tổng lượng, mà dựa trên **Mật độ dinh dưỡng trên mỗi 100 kcal**.

### Cơ chế hoạt động:
* **Điểm Cơ sở:** Mọi món ăn (có Calo >= 20) bắt đầu với **50 điểm** (thang điểm 0 - 100).
* **Chỉ số phạt (Penalty):**
  - **Natri (Muối):** 
    - > 100mg/100kcal: Cảnh báo vàng (-10đ).
    - > 150mg/100kcal: Cảnh báo đỏ (-25đ).
  - **Đường (Sugar):**
    - > 2.5g/100kcal: Cảnh báo vàng (-10đ).
    - > 5g/100kcal: Cảnh báo đỏ (-25đ).
* **Chỉ số thưởng (Bonus):**
  - **Protein (Đạm):** Tốt (>= 3g / +15đ), Xuất sắc (>= 5g / +25đ).
  - **Chất xơ (Fiber):** Tốt (>= 0.5g / +15đ), Xuất sắc (>= 1.25g / +25đ).
* **Miễn trừ Y khoa:** Các thực phẩm nguyên bản, thô chưa qua chế biến (Ví dụ: Đường trong trái cây, Natri trong thịt/cá tự nhiên) được hệ thống tự động nhận diện và **không bị trừ điểm**, luôn gán cờ an toàn.
* **Phân loại cuối cùng:** Tổng kết lại để xếp hạng chất lượng (Lành mạnh / Khá tốt / Trung bình / Cần hạn chế). Thuật toán này dùng để xây dựng báo cáo dinh dưỡng tổng thể hàng tuần/tháng.

---

## 4. Các Công thức Y khoa Nền tảng
**Vị trí file:** `backend/services/nutrition.service.js`

Đây là các công thức tiêu chuẩn y khoa tĩnh, đóng vai trò nền móng để khởi tạo thông tin cho người dùng mới.

* **Công thức BMR (Mifflin-St Jeor):** Chính xác nhất hiện nay cho người bình thường.
  - Nam: `(10 * W) + (6.25 * H) - (5 * A) + 5`
  - Nữ: `(10 * W) + (6.25 * H) - (5 * A) - 161`
* **TDEE tĩnh:** `TDEE = BMR * PAL` (Hệ số hoạt động dao động từ 1.2 đến 1.9).
* **Điều chỉnh Calo Mục tiêu:**
  - Giảm cân: `TDEE - 500 kcal` (Nhưng được chặn dưới nghiêm ngặt: **Không bao giờ thấp hơn BMR**).
  - Tăng cân: `TDEE + 300 kcal`.
* **Tính Toán Macros:** Chuyển đổi linh hoạt từ % sang Gram (1g Protein = 4 kcal, 1g Carbs = 4 kcal, 1g Fat = 9 kcal).
* **Mục tiêu Nước Uống:** Tính toán cá nhân hóa theo cân nặng dựa trên tỷ lệ `35ml / kg`.
