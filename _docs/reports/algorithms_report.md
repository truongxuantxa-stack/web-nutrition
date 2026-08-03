# Báo cáo Chi tiết: Tổng hợp Các Thuật toán Cốt lõi của Dự án Web Dinh Dưỡng

Hệ thống Web Dinh Dưỡng được thiết kế xoay quanh triết lý **Hardcore Tracking** và cá nhân hóa. Dưới đây là báo cáo tổng hợp chi tiết về cơ chế hoạt động của toàn bộ các thuật toán cốt lõi trong Backend.

---

## 1. Thuật toán Tính toán & Điều chỉnh Mục tiêu (Nutrition Core)
**Vị trí:** `backend/services/nutrition.service.js`

Khởi tạo nền tảng chuyển hóa cho người dùng dựa trên công thức y khoa chuẩn.
* **BMR & TDEE:** Sử dụng công thức Mifflin-St Jeor và chỉ số hoạt động thể chất (PAL) để tính TDEE tĩnh.
* **Điều chỉnh Mục tiêu Calo:**
  * Giảm cân: Giảm 500 kcal từ TDEE. (Luôn chặn dưới bằng BMR - *không bao giờ được ăn dưới BMR*).
  * Tăng cân: Tăng 300 kcal.
* **Mục tiêu Macro & Nước:** Chuyển đổi linh hoạt từ % sang Gram (P/C/F theo tỷ lệ 30/40/30 hoặc cấu hình riêng). Tính nước theo quy tắc 35ml/kg.

---

## 2. Thuật toán TDEE Thích ứng (Adaptive TDEE)
**Vị trí:** `backend/services/adaptiveTDEE.service.js`

Khắc phục nhược điểm của công thức TDEE tĩnh do sự "thích ứng chuyển hóa" (metabolic adaptation) sau thời gian dài ăn kiêng.
* **EMA Filter:** Lọc nhiễu cân nặng hàng ngày bằng Exponential Moving Average (Alpha = 0.1) sau 14 ngày Warm-up.
* **Tính toán Năng lượng Thực tế:** `AdaptiveTDEE = AvgIntake - (WeightDelta * 7700 / 7)` (Vì 1kg mỡ ~ 7700 kcal).
* **Bảo vệ Hệ thống:** Áp dụng trung bình động 4 tuần (Rolling Average) và kẹp giới hạn (Clamping $\pm 30\%$ so với TDEE tĩnh).

---

## 3. Chấm điểm Mật độ Dinh dưỡng (Nutrient Density Scoring)
**Vị trí:** `backend/services/foodScoring.service.js`

Đánh giá chất lượng món ăn trên mỗi 100 kcal thay vì tổng lượng.
* **Pure Function Architecture:** Khởi đầu 50 điểm (hoặc 100 điểm với các thức uống < 20kcal).
* **Penalty:** Trừ điểm nếu Natri/Đường dư thừa (Cảnh báo vàng -10đ, Cảnh báo đỏ -25đ). Trừ 15đ nếu nghèo nàn vi chất (Micronutrient Starvation).
* **Bonus:** Cộng điểm cho Protein và Chất xơ (+15đ hoặc +25đ), cộng điểm cho vi chất (+5đ hoặc +10đ).
* **Hard Caps (Điểm Liệt) & Triage:** Không áp dụng phạt cho thực phẩm tự nhiên (raw). Điểm liệt tối đa là 50 (nếu vi chất <20% RDI) hoặc 60 (nếu chất xơ <30% RDI).

---

## 4. Gợi ý Y khoa (Health Insights & Daily Scoring)
**Vị trí:** `backend/services/suggestion.service.js`

Phân tích hành vi ăn uống trong ngày với **Cơ chế Triage** và **Context-Awareness**.
* **Triage (Phân cấp ưu tiên):**
  * Tầng Sinh tồn (<50% Calo): Mute mọi cảnh báo thiếu vi chất, yêu cầu bổ sung năng lượng ngay.
  * Tầng Đa lượng (50%-70% Calo): Yêu cầu nạp Protein/Fat.
  * Tầng Vi lượng (>70% Calo): Bắt đầu soi xét vi khoáng (Chất xơ, Canxi, Sắt, Vit C, Vit A).
* **Context-Awareness:** Cảnh báo thiếu hụt chỉ kích hoạt khi ngày sắp kết thúc (sau 20h), hoặc đã đủ 3 bữa, tránh spam cảnh báo buổi sáng.
* **Điểm Sức khỏe Ngày:** Trừ điểm theo lỗi, phạt Multiplier nếu Calo quá lệch (Sliding Multiplier) hoặc nạp quá nhiều đường (Sugar Toxicity), có Hard Caps nếu bỏ bê rau xanh và vi chất.

---

## 5. Thuật toán Quét Kết hợp (Hybrid Scanner 4-Layer)
**Vị trí:** `backend/services/scanner.service.js`

Cơ chế nhập liệu siêu tốc kết hợp Mã vạch và Trí tuệ Nhân tạo.
* **4-Layer Lookup Pipeline:**
  1. Local DB (Verified, confidence $\geq 0.7$)
  2. Local DB (Unverified)
  3. OpenFoodFacts API (lưu Cache ngược lại DB)
  4. AI Vision (Flash 2.5 phân tích ảnh bao bì)
* **Physics Validation:** Dữ liệu AI được test các định luật vật lý (Tổng $\leq 100g$, Năng lượng $\leq 900$ kcal) và độ lệch Atwater $< 15\%$.
* **Trust Score:** Tự động tăng độ tin cậy từ 0.3 lên 0.8 và thăng hạng `verified` nếu có nhiều luồng đóng góp cộng đồng tương đồng.

---

## 6. Giải hệ Phương trình Thực đơn (Gauss Meal Solver)
**Vị trí:** `backend/services/mealPlanner.service.js`

Cốt lõi toán học giải quyết bài toán **Macro Overlap** (Chồng lấn đa lượng).
* Lập hệ phương trình 3x3 để cân bằng chính xác lượng Protein, Carbs, Fat đến từng gram sau khi đã cố định lượng rau xanh.
* Sử dụng thuật toán **Khử Gauss kết hợp Partial Pivoting** để giải ma trận.
* Xử lý ngoại lệ với tính năng **Smart Swap**: Nếu tìm ra nghiệm âm (do chọn nguồn đạm quá nhiều mỡ), hệ thống không che giấu lỗi mà hướng dẫn người dùng đổi sang các lựa chọn nạc hơn (đã được lưu cache qua `_leanAlternativesCache`).
