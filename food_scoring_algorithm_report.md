# Báo cáo Chi tiết: Thuật toán Chấm điểm Mật độ Dinh dưỡng (Nutrient Density Scoring)

## Đặt vấn đề: Lỗ hổng của phương pháp đếm Calo truyền thống
Hầu hết các ứng dụng theo dõi dinh dưỡng hiện nay chỉ tập trung vào một câu hỏi duy nhất: *"Món này bao nhiêu Calo?"*. Tuy nhiên, góc nhìn này tồn tại một điểm mù lớn: **Calo bằng nhau không có nghĩa là chất lượng dinh dưỡng bằng nhau**. 
Ví dụ: 300 kcal từ một miếng ức gà nướng mang lại lượng đạm dồi dào giúp phát triển cơ bắp, trong khi 300 kcal từ một ly trà sữa lại chứa toàn đường tự do (empty calories - calo rỗng). Nếu chỉ đếm lượng calo ròng, hệ thống sẽ vô tình dung túng cho những chế độ ăn tuy đủ năng lượng nhưng lại thiếu hụt trầm trọng các vi chất thiết yếu (đạm, xơ), hoặc tiêu thụ quá liều các chất tiềm ẩn rủi ro cho sức khỏe tim mạch (natri, đường).

**Giải pháp của NMS:** Thuật toán Chấm điểm Mật độ Dinh dưỡng (Nutrient Density Scoring) ra đời như một bộ lọc chất lượng thứ hai. Thay vì đánh giá một món ăn chỉ dựa trên tổng khối lượng (khẩu phần ăn lớn hay nhỏ dễ gây sai lệch), thuật toán quy đổi toàn bộ dưỡng chất về một hệ quy chiếu chuẩn mực duy nhất: **Mật độ dưỡng chất trên mỗi 100 kcal**. Nhờ đó, hệ thống có thể bóc trần những món ăn mác "ít calo" nhưng thực chất là calo rỗng, và tôn vinh những thực phẩm đậm đặc giá trị cốt lõi.

---

## 1. Cơ chế Chấm điểm Đơn lẻ (`scoreFoodItem`)

Khi một món ăn được đưa vào hệ thống, thuật toán sẽ đi qua một bộ lọc và chấm điểm dựa trên thang điểm chuẩn từ **0 đến 100**.

### 1.1. Zero Calorie Guard (Lọc món rỗng calo)
* Nếu món ăn có lượng calo `< 20 kcal` (ví dụ: Diet Coke, trà đá, nước lọc), thuật toán sẽ đánh dấu là `skipped` (Không tính điểm).
* Lý do: Khi calo quá thấp, phép chia cho calo (để quy về 100 kcal) sẽ tạo ra các tỷ lệ khổng lồ, làm sai lệch toàn bộ hệ thống đánh giá.

### 1.2. Công thức Điểm cơ sở (Base Score)
Mọi món ăn hợp lệ đều bắt đầu với **50 điểm cơ sở**. Từ đó, hệ thống sẽ cộng/trừ điểm dựa trên 4 chỉ số chính: Muối, Đường, Đạm, Xơ.

#### A. Trừ điểm (Penalty) - Các chất cần hạn chế
Hệ thống giám sát gắt gao lượng Muối (Sodium) và Đường (Sugar) dựa trên ngưỡng an toàn:
* **Muối (Ngưỡng 100mg/100kcal):**
  - Vượt quá 100mg: Cảnh báo Vàng (`-10 điểm`).
  - Vượt quá 150mg: Cảnh báo Đỏ (`-25 điểm`).
* **Đường (Ngưỡng 2.5g/100kcal):**
  - Vượt quá 2.5g: Cảnh báo Vàng (`-10 điểm`).
  - Vượt quá 5g: Cảnh báo Đỏ (`-25 điểm`).

*Lưu ý: Mỡ (Fat) và Tinh bột (Carb) không bị đưa vào Penalty vì bản thân chúng không "độc hại", mức độ tốt/xấu phụ thuộc vào tỷ lệ Macro tổng thể của người dùng, không phụ thuộc vào mật độ.*

#### B. Cộng điểm thưởng (Bonus) - Các chất có lợi
* **Đạm (Protein):**
  - Mức Tốt (≥ 3g/100kcal): `+15 điểm`.
  - Mức Xuất sắc (≥ 5g/100kcal): `+25 điểm`.
* **Chất xơ (Fiber):**
  - Mức Tốt (≥ 0.5g/100kcal): `+15 điểm`.
  - Mức Xuất sắc (≥ 1.25g/100kcal): `+25 điểm`.

### 1.3. Miễn trừ Y khoa (Natural Exemptions)
Một trong những điểm thông minh nhất của thuật toán là khả năng phân biệt giữa "Đường tự nhiên" và "Đường hóa học".
* Nếu là đường trong Trái cây tươi, Rau củ, hoặc Carbohydrate tự nhiên: Hệ thống đánh giá là **🟢 Đường tự nhiên** và KHÔNG trừ điểm.
* Nếu là Natri (Muối) tự nhiên trong các loại thịt thô/hải sản: Đánh giá là **🟢 Natri tự nhiên** và KHÔNG trừ điểm.

### 1.4. Xếp loại Cuối cùng (Quality Level)
Tổng điểm được khóa cứng trong dải `[0, 100]` và phân loại:
* `≥ 80`: 🌟 Lành mạnh (Excellent)
* `≥ 60`: 🟢 Khá tốt (Good)
* `≥ 40`: 🟡 Trung bình (Moderate)
* `< 40`: 🔴 Cần hạn chế (Poor)

---

## 2. Đánh giá Thói quen Tổng thể (`buildWeeklyFoodReport`)

Đây là module dùng để tổng hợp lại toàn bộ dữ liệu ăn uống trong Tuần/Tháng để xuất ra báo cáo PDF chuyên sâu.

### 2.1. Phân loại Thói quen bằng Ngưỡng động (Dynamic Threshold)
Hệ thống không đánh giá 1 món ăn là "thói quen" nếu bạn chỉ ăn nó 1 lần. Mức ngưỡng (Threshold) được nội suy động theo thời gian:
* **Theo Tuần (7 ngày):** Ăn ≥ 2 lần mới được coi là thói quen.
* **Theo Tháng (30 ngày):** Ăn ≥ 4 lần mới được coi là thói quen.

Dựa trên ngưỡng này, hệ thống chia thói quen thành 3 nhóm:
* **Thói quen Tốt:** Điểm chất lượng `≥ 70` VÀ đạt ngưỡng tần suất.
* **Thói quen Xấu:** Điểm chất lượng `< 60` VÀ đạt ngưỡng tần suất.
* **Nhóm Trung Lập (Vùng xám):** Các món từ `60 - 69 điểm`. Hệ thống không khen (vì chưa đủ xuất sắc) và cũng không chê (vì không vi phạm nghiêm trọng).

### 2.2. Xếp loại Báo Cáo Tuần (Weekly Verdict)
Để chốt lại đánh giá của cả một tuần, hệ thống đối chiếu 2 biến số: (1) Tỷ lệ phần trăm các bữa ăn bị cờ Đỏ (Red Flag %), và (2) Điểm chất lượng trung bình của mọi bữa ăn (Avg Quality Score).
* **Tuyệt vời:** Red Flag ≤ 15% & Avg Score ≥ 75.
* **Tốt:** Red Flag ≤ 30% & Avg Score ≥ 65.
* **Cần cải thiện:** Red Flag ≤ 50% & Avg Score ≥ 50.
* **Kém:** Còn lại (Đang tiêu thụ quá nhiều calories rỗng).

---

## 3. Tổng kết

Thuật toán Nutrient Density Scoring khắc phục được lỗ hổng lớn nhất của các ứng dụng đếm Calo truyền thống: "Calo bằng nhau không có nghĩa là chất lượng bằng nhau" (Ví dụ: 300 kcal Ức gà hoàn toàn khác 300 kcal Trà sữa). Bằng cách đi sâu vào mật độ dinh dưỡng, NMS giúp người dùng dần hình thành các thói quen lựa chọn thực phẩm lành mạnh và phòng tránh các bệnh lý mãn tính liên quan đến đường và muối.
