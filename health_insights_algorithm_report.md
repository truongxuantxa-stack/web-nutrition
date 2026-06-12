# Báo cáo Chi tiết: Thuật toán Cảnh báo Y khoa & Chấm điểm Sức khỏe (Health Insights & Score)

Thuật toán Health Insights là hệ thống "bác sĩ ảo" của NMS, chịu trách nhiệm phân tích dữ liệu ăn uống để đưa ra các cảnh báo dinh dưỡng theo chuẩn y khoa thế giới (AHA, WHO) và tổng hợp thành một Điểm Sức Khỏe (Health Score) dễ hiểu cho người dùng.

Báo cáo này phân tích cấu trúc logic và cơ chế nhận thức ngữ cảnh (Context-Awareness) của thuật toán này.

---

## 1. Cơ chế Nhận thức Ngữ cảnh (Context-Awareness)

Điểm khác biệt lớn nhất của Health Insights so với các ứng dụng khác nằm ở cờ `shouldWarnDeficiency` (Biết nhận thức thời gian thực).

* **Vấn đề:** Nếu một người dùng mới thức dậy lúc 8h sáng và ăn một quả táo, hệ thống không thể ngay lập tức cảnh báo: *"Bạn đang thiếu đạm, thiếu xơ, thiếu canxi!"* vì đơn giản là ngày mới chỉ vừa bắt đầu.
* **Giải pháp:** Thuật toán phân nhóm các cảnh báo thành 2 loại:
  1. **Nhóm THỪA (Excess):** Kích hoạt MỌI LÚC. Ví dụ: Nếu lúc 9h sáng bạn ăn một bát phở chứa 2500mg Natri, hệ thống sẽ cảnh báo ngay lập tức vì lượng muối này đã vượt ngưỡng cả ngày.
  2. **Nhóm THIẾU (Deficiency):** Bị "khóa" lại vào ban ngày. Hệ thống chỉ mở khóa cảnh báo thiếu chất khi thỏa mãn 1 trong 3 điều kiện:
     - Thời gian thực tế đã vượt qua **20:00 (8h tối)**.
     - Người dùng đã nạp đủ **≥ 100%** mục tiêu Calo (hết ngân sách ăn).
     - Truy vấn dữ liệu trong **Quá khứ** (`isHistorical = true` như khi xuất báo cáo PDF hàng tuần).

---

## 2. Các Cấp độ Cảnh báo (Severity Levels)

Hệ thống phân chia các vi phạm thành 4 cấp độ nghiêm trọng, mỗi cấp độ đi kèm một hình phạt điểm số (Penalty) khác nhau:

1. **🔴 Danger (Nguy hiểm | -15 điểm):**
   - Vượt > 110% mục tiêu Calo (Tích mỡ).
   - Natri (Muối) > 2300mg (Nguy cơ tăng huyết áp - Chuẩn WHO).
   - Đường tự do > 36g (Nam) hoặc 25g (Nữ) (Chuẩn AHA).
   - Tinh bột (Carbs) > 120% mục tiêu (Nguy cơ tăng đường huyết).

2. **🟡 Warning (Cảnh báo | -8 điểm):**
   - Vượt nhẹ mục tiêu Calo (từ 101% đến 110%) - Cảnh báo nên dừng ăn. Mặc dù bị phạt -8 điểm, nhưng ở mức này người dùng vẫn được cộng +5 điểm thưởng (Bonus) vì vẫn nằm trong "Khoảng lý tưởng (90-110%)", tổng trừ chỉ là -3 điểm.
   - Chất béo (Fat) > 150% mục tiêu.
   - Thiếu Đạm (Protein < 80% mục tiêu).
   - Thiếu Xơ (Fiber < 25g).
   - Ăn quá ít chất béo (Dưới 20% tổng calo nạp vào - Cản trở hấp thụ Vitamin).

3. **💧 Water (Nước | -5 điểm):**
   - Uống không đủ mục tiêu nước trong ngày (Làm chậm trao đổi chất).

4. **⚪ Suggestion (Khuyến nghị vi chất | -3 điểm):**
   - Canxi < 80% RDI (Thiếu hụt canxi cho xương).
   - Sắt < 80% RDI (Nguy cơ thiếu máu).
   - Vitamin C < 80% RDI (Giảm đề kháng).

---

## 3. Thuật toán Tính Điểm Sức Khỏe (Daily Health Score)

Nếu người dùng chưa log bất kỳ thực phẩm nào (`calories === 0`), hệ thống trả về Empty State (Không chấm điểm). Nếu đã có dữ liệu, điểm số được tính như sau:

**Công thức tổng quát:**
> `Score = 100 - SUM(Penalty từ Insights) + SUM(Bonus Thói quen tốt)`

**Các điểm thưởng (Bonus):**
Để khuyến khích hành vi tích cực, hệ thống cộng điểm khi người dùng đạt được các cột mốc khó:
* **+5 điểm:** Nạp Calo trong khoảng lý tưởng (90% - 110% mục tiêu).
* **+5 điểm:** Uống đủ 100% mục tiêu nước.
* **+3 điểm:** Nạp đủ mục tiêu Protein.
* **+2 điểm:** Nạp đủ mục tiêu Chất xơ (38g cho nam, 25g cho nữ).

**Xếp loại kết quả (Khống chế từ 0 - 100):**
* `≥ 90`: 🏆 Tuyệt vời
* `≥ 75`: 💪 Rất tốt
* `≥ 60`: 👍 Khá ổn
* `≥ 40`: ⚡ Cần cải thiện
* `< 40`: ⚠️ Đáng lo ngại

---

## 4. Tích hợp Báo cáo PDF (Historical PDF Render)

Khi xuất báo cáo PDF hàng tuần/tháng, thuật toán thay đổi hành vi để phù hợp với phân tích dữ liệu vĩ mô:
1. **Ép cờ `isHistorical = true`:** Kích hoạt toàn bộ cảnh báo thiếu chất mà không cần quan tâm đến giờ xuất báo cáo.
2. **Trung bình hóa:** Thay vì chạy trên một ngày, hệ thống lấy dữ liệu trung bình cộng của cả tuần (Avg Calo, Avg Sodium, Avg Sugar...) để ném vào thuật toán.
3. **Card Hiển thị:** Thay cho checklist đơn giản cũ, PDF sẽ vẽ ra một "Health Score Card" với điểm số trung bình toàn kỳ kèm theo danh sách các Điểm cộng (Bonus), phía dưới là dải cảnh báo nhiều màu tương ứng với các Insight bị vi phạm.

Thuật toán này đảm bảo người dùng có cái nhìn chuẩn xác, khoa học và linh hoạt nhất về tình trạng sức khỏe của bản thân trong từng thời điểm cụ thể.
