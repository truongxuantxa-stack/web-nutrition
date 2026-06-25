# Báo cáo Chi tiết: Thuật toán Cảnh báo Y khoa & Chấm điểm Sức khỏe (Health Insights & Score)

Thuật toán Health Insights là hệ thống "bác sĩ ảo" của NMS, chịu trách nhiệm phân tích dữ liệu ăn uống để đưa ra các cảnh báo dinh dưỡng theo chuẩn y khoa thế giới (AHA, WHO) và tổng hợp thành một Điểm Sức Khỏe (Health Score) dễ hiểu cho người dùng.

Báo cáo này phân tích cấu trúc logic, tháp ưu tiên y khoa, cơ chế nhận thức ngữ cảnh (Context-Awareness) và hệ thống chấm điểm dựa trên hệ số nhân (Multipliers) của thuật toán hiện tại.

---

## 1. Phân cấp Ưu tiên Y khoa (Hierarchy of Nutritional Needs)

Thuật toán áp dụng cơ chế "Triage" (Phân loại cấp cứu) trong y khoa, đánh giá dữ liệu theo Tháp nhu cầu từ quan trọng nhất (Sinh tồn) đến tối ưu hóa (Vi lượng). 

Việc nạp quá ít calo được xem là tình trạng khẩn cấp. Mức Calo nạp vào (`calPct` = Nạp / Mục tiêu) quyết định cách thuật toán phản ứng:

1. **Tầng Sinh Tồn (Critical - Calo < 50%):**
   - **Hành động:** Phát cảnh báo đỏ 🚨 "Lượng ăn quá thấp, nguy cơ suy nhược". Khuyên người dùng ưu tiên nạp thực phẩm giàu năng lượng.
   - **Mute Logic:** Ẩn (Mute) TOÀN BỘ các cảnh báo về thiếu hụt Đa lượng (Macro) và Vi lượng (Micro). Việc khuyên ăn rau xanh khi đang suy nhược vì đói là sai y khoa.

2. **Tầng Đa Lượng (Low - Calo từ 50% đến < 70%):**
   - **Hành động:** Cảnh báo vàng ⚠️ "Calo vẫn đang thiếu". Kích hoạt kiểm tra Đa lượng (Protein, Fat).
   - **Mute Logic:** Vẫn ẩn (Mute) các cảnh báo Vi lượng (Micro) vì ưu tiên lúc này vẫn là năng lượng nền tảng và cơ bắp.

3. **Tầng Vi Lượng (Adequate - Calo ≥ 70%):**
   - **Hành động:** Mở khóa kiểm tra toàn diện cả Macro và Micro (Xơ, Canxi, Sắt, Vitamin C, Vitamin A) để tối ưu hóa sức khỏe.

> **Lưu ý quan trọng:** Cảnh báo **THỪA** (Vượt Calo, đường, muối, chất béo xấu) luôn được kích hoạt **MỌI LÚC** bất chấp mức Calo. (Ví dụ: Ăn đói nhưng uống toàn nước đường là hành vi rất nguy hiểm, phải cảnh báo ngay).

---

## 2. Nhận thức Ngữ cảnh (Context-Awareness) & Cảnh báo Nhóm

### Khóa Cảnh Báo Thiếu (Deficiency Gate)
Các cảnh báo THIẾU chỉ được mở khóa khi thỏa mãn 1 trong 3 điều kiện (tránh việc cảnh báo sai vào buổi sáng sớm khi người dùng chưa kịp ăn):
- Đã ăn đủ 3 bữa (Sáng, Trưa, Tối).
- Thời gian thực tế vượt qua **20:00 (8h tối)**.
- Đang truy vấn trong **Quá khứ** (`isHistorical = true`).

### Cảnh báo Nhóm (Grouped Micro Warnings)
Khi hệ thống xét đến Tầng Vi Lượng (Calo ≥ 70%), nếu người dùng **thiếu hụt nghiêm trọng từ 3 vi chất trở lên** (ví dụ thiếu cả Xơ, Canxi, Sắt), hệ thống sẽ **gom lại thành 1 cảnh báo duy nhất**: 📉 "Thiếu hụt Đa Vi Chất trầm trọng".
- **Lợi ích:** Giảm tải nhận thức (cognitive load) cho người dùng, tránh gây hoảng loạn vì màn hình bị ngập lụt bởi hàng loạt cảnh báo đỏ, đồng thời không trừng phạt (penalty) quá nặng cho cùng một nguyên nhân (ăn ít rau/củ).

---

## 3. Các Cấp độ Cảnh báo (Severity Levels) & Penalty

Hệ thống phân chia các vi phạm thành 4 cấp độ nghiêm trọng, đi kèm mức phạt (Penalty) bám sát nguyên lý *Loss Aversion* trong Y tế (Tránh độc quan trọng hơn Bồi bổ):

1. **🔴 Danger (Nguy hiểm | -15 điểm):**
   - Vượt > 110% mục tiêu Calo (Tích mỡ).
   - Lượng ăn quá thấp (< 50% mục tiêu).
   - Natri (Muối) > 2300mg (Nguy cơ tăng huyết áp - Chuẩn WHO).
   - Đường tự do > 36g (Nam) / 25g (Nữ) (Chuẩn AHA).
   - Tinh bột > 120% mục tiêu.
   - Thiếu hụt nghiêm trọng (<30% RDI) của một vi chất, hoặc 📉 **Thiếu Đa Vi Chất (bị phạt -25 điểm gộp)**.

2. **🟡 Warning (Cảnh báo | -6 điểm):**
   - Calo dưới mức tối ưu (50-70%).
   - Vượt nhẹ mục tiêu Calo (101-110%).
   - Thiếu Đạm (<80%), Fat (<20%).
   - Thiếu hụt mức độ trung bình (<70-80% RDI) của các vi chất (Xơ, Canxi, Sắt, Vit A, Vit C).

3. **💧 Water (Nước | -4 điểm):**
   - Uống không đủ tiến độ nước trong ngày.

4. **⚪ Suggestion (Khuyến nghị | -2 điểm):**
   - Các chỉ số gần đạt mục tiêu (ví dụ: Vi chất đạt > 70% nhưng chưa đến 100%).

---

## 4. Thuật toán Tính Điểm Sức Khỏe (Daily Health Score)

Nếu người dùng chưa log thực phẩm (`calories === 0`), hệ thống trả về Empty State. Nếu đã có dữ liệu, điểm số được tính theo 3 bước:

### Bước 1: Base Score (Điểm Cơ sở)
> `Base Score = 100 - SUM(Penalties) + SUM(Bonuses)`

**Các điểm thưởng (Bonus):**
* **+5 điểm:** Nạp Calo trong khoảng lý tưởng (90% - 110%).
* **+5 điểm:** Uống đủ 100% mục tiêu nước.
* **+3 điểm:** Nạp đủ mục tiêu Protein.
* **+2 điểm:** Nạp đủ mục tiêu Chất xơ.

### Bước 2: Hệ số trượt (Multipliers) - Đánh giá Định lượng & Độc hại
Điểm cơ sở sẽ bị nhân với các hệ số hình phạt (trượt dần để không tạo gãy gập cliff-drop):

**Calorie Multiplier (Hệ số Lượng):**
- `< 30%` (Nguy hiểm thực sự) ➔ **x 0.3**
- `< 50%` (Ăn quá ít) ➔ **x 0.5**
- `< 70%` (Dưới mức tối ưu) ➔ **x 0.7**
- `> 130%` (Ăn quá nhiều) ➔ **x 0.6**
- `> 110%` (Vượt nhẹ) ➔ **x 0.85**
- Còn lại (Ổn định) ➔ **x 1.0**

**Sugar Multiplier (Hệ số Độc hại):**
- Đường bổ sung vượt > 200% chuẩn AHA ➔ **x 0.7**

> `Score sau Multiplier = Base Score * Calorie Multiplier * Sugar Multiplier`

### Bước 3: Điểm Liệt (Hard Caps)
Chỉ áp dụng nếu người dùng ở Tầng Vi Lượng (Calo ≥ 70%). Nếu Calo đang thiếu, hệ thống bỏ qua Hard Caps để tránh phạt "kép".
- **Cap 50:** Trung bình các Vi chất đạt < 20% RDI (Điểm tối đa bị ép xuống 50).
- **Cap 60:** Chất xơ đạt < 30% RDI (Điểm tối đa bị ép xuống 60).

**Xếp loại kết quả (0 - 100):**
* `≥ 90`: 🏆 Tuyệt vời
* `≥ 75`: 💪 Rất tốt
* `≥ 60`: 👍 Khá ổn
* `≥ 40`: ⚡ Cần cải thiện
* `< 40`: ⚠️ Đáng lo ngại

---

## 5. Tích hợp Báo cáo PDF (Historical PDF Render)

Khi xuất báo cáo PDF hàng tuần/tháng, thuật toán thay đổi hành vi để phù hợp với phân tích dữ liệu vĩ mô:
1. **Ép cờ `isHistorical = true`:** Kích hoạt toàn bộ cảnh báo thiếu chất mà không bị chặn bởi giờ xuất báo cáo.
2. **Trung bình hóa:** Thay vì chạy trên một ngày, hệ thống lấy dữ liệu trung bình cộng của cả tuần (Avg Calo, Avg Sodium, Avg Sugar...) để ném vào thuật toán. Mute logic và Multiplier vẫn hoạt động chính xác trên số liệu trung bình.
3. **Card Hiển thị:** Thay cho checklist đơn giản, PDF sẽ vẽ ra một "Health Score Card" với điểm số trung bình toàn kỳ kèm theo danh sách các Điểm cộng (Bonus), phía dưới là dải cảnh báo nhiều màu tương ứng với các Insight bị vi phạm.

Thuật toán này đảm bảo người dùng có cái nhìn chuẩn xác, khoa học và không bị ảo giác về tình trạng sức khỏe của bản thân. Mọi điểm số đưa ra đều có liên kết trực tiếp với lời khuyên hành động (Actionable Insights).
