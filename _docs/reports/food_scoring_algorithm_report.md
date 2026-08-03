# Báo cáo Chi tiết: Thuật toán Chấm điểm Mật độ Dinh dưỡng (Nutrient Density Scoring)

Đánh giá chất lượng của một món ăn không dựa trên tổng lượng, mà dựa trên **Mật độ dinh dưỡng trên mỗi 100 kcal**. Đây là cốt lõi của thuật toán `foodScoring.service.js` trong hệ thống Web Dinh Dưỡng, giúp người dùng phân biệt giữa lượng calo rỗng và calo chất lượng.

## 1. Kiến trúc Hàm Thuần túy (Pure Function Architecture)
Thuật toán được cấu trúc theo mô hình Pure Function (Hàm thuần túy) với biến tích lũy trạng thái rõ ràng. Hàm chính `scoreFoodItem` nhận vào đối tượng dinh dưỡng (`food`, đã quy đổi trên 100 kcal) và tính toán điểm số cuối cùng thông qua việc tích lũy các giá trị Penalty (Phạt) và Bonus (Thưởng). Điều này giúp code dễ test, dễ hiểu và dễ bảo trì.

## 2. Điểm Cơ Sở (Baseline Score)
- Mọi món ăn (có năng lượng >= 20 kcal/100g) đều xuất phát với **50 điểm** (trên thang điểm 100).
- Những món siêu ít calo (dưới 20 kcal/100g như nước lọc, trà, cà phê đen) sẽ **không tính điểm mật độ** (`qualityScore: null`) vì calo quá thấp không mang nhiều ý nghĩa phân tích.

## 3. Cơ chế Phạt (Penalty Mechanism)
Hệ thống sử dụng đối tượng cấu hình trung tâm `NUTRIENT_THRESHOLDS` để định nghĩa các ngưỡng phạt.

### Natri (Muối)
Natri dư thừa liên quan chặt chẽ đến bệnh huyết áp và tim mạch.
- > 100 mg / 100 kcal: Cảnh báo vàng (**-10 điểm**)
- > 150 mg / 100 kcal: Cảnh báo đỏ (**-25 điểm**)

### Đường (Sugar)
Đường bổ sung sinh ra năng lượng rỗng, gây tăng insulin và tích mỡ.
- > 2.5 g / 100 kcal: Cảnh báo vàng (**-10 điểm**)
- > 5.0 g / 100 kcal: Cảnh báo đỏ (**-25 điểm**)

### Chất béo bão hòa (Saturated Fat) (Dự kiến)
Hệ thống chừa sẵn slot trong `NUTRIENT_THRESHOLDS` cho Saturated Fat (Ngưỡng: 2g/100kcal và 3g/100kcal) để áp dụng trong tương lai.

## 4. Cơ chế Thưởng (Bonus Mechanism)
Các dưỡng chất mang lại lợi ích cho sức khỏe sẽ cộng thêm điểm.

- **Protein (Đạm):** Rất quan trọng cho việc duy trì và xây dựng cơ bắp.
  - Tốt (>= 3 g / 100 kcal): **+15 điểm**
  - Xuất sắc (>= 5 g / 100 kcal): **+25 điểm**
- **Chất xơ (Fiber):** Hỗ trợ tiêu hóa, kiểm soát đường huyết và nuôi hệ vi sinh đường ruột.
  - Tốt (>= 0.7 g / 100 kcal): **+15 điểm**
  - Xuất sắc (>= 1.25 g / 100 kcal): **+25 điểm**

## 5. Đánh giá Vi chất và Nạn đói Vi chất (Micronutrients & Starvation)
Hệ thống không chỉ chấm điểm đa lượng (Macros) mà còn đánh giá vi lượng (Micros). Một thực phẩm được coi là "Nghèo nàn vi chất" nếu cả Vitamin A, Vitamin C, Canxi và Sắt đều ở mức rất thấp (hoặc không có).
- Nếu >= 3 vi chất bị đánh giá là nghèo nàn, món ăn bị trừ thêm **15 điểm** (Nạn đói vi chất - Micronutrient Starvation).
- Nếu có vi chất xuất sắc (>= 10% RDI trên mỗi 100 kcal): **+10 điểm**
- Nếu có vi chất ở mức tốt (>= 5% RDI trên mỗi 100 kcal): **+5 điểm**

## 6. Cơ chế Triage và Hard Caps (Chặn trên an toàn)
Để tránh các món ăn "tệ" nhưng nhờ có tí ưu điểm mà kéo điểm lên, hệ thống áp dụng các ngưỡng chặn trên (Hard Caps):
- **Cơ chế Triage (Miễn trừ phạt Vi chất):** Các thực phẩm dồi dào Đạm (mức Excellent) hoặc thuộc nhóm Thịt/Cá/Protein sẽ KHÔNG bị phạt lỗi "Calo rỗng" và không bị áp dụng Micro Hard Cap 50.
- **Micro Hard Cap (50 điểm):** Nếu tỷ lệ đạt chuẩn trung bình của các vi chất (Vitamin A, C, Canxi, Sắt) ở mức quá thấp (< 20% RDI mong đợi), điểm tối đa không thể vượt quá 50 (bất kể điểm cộng).
- **Fiber Hard Cap (60 điểm):** Nếu hàm lượng chất xơ < 30% RDI mong đợi, điểm tối đa không thể vượt quá 60 (trừ nhóm thịt cá/đồ uống không cần chất xơ).
- **Sodium Danger Hard Cap (60 điểm):** Nếu nồng độ muối ở mức báo đỏ (> 150 mg / 100 kcal), điểm tối đa bị chặn ở 60.
- **Sodium Extreme Hard Cap (40 điểm):** Nếu nồng độ muối cực kỳ mặn (> 300 mg / 100 kcal) HOẶC tổng muối vượt 1000mg, điểm tối đa bị chặn ở 40.

## 7. Phân loại và Giao diện (Quality Classification)
Sau khi áp dụng chặn dưới (0 điểm) và chặn trên (100 điểm), điểm số được ánh xạ sang 4 cấp độ phân loại, đi kèm Emoji huy hiệu để UI dễ dàng hiển thị:
- **Lành mạnh (Healthy):** >= 80 điểm (Huy hiệu: 🌟 - Xuất sắc)
- **Khá tốt (Good):** >= 60 điểm (Huy hiệu: 🟢)
- **Trung bình (Fair):** >= 40 điểm (Huy hiệu: 🟡)
- **Cần hạn chế (Poor):** < 40 điểm (Huy hiệu: 🔴)

## Kết luận
Thuật toán Food Scoring của NMS với kiến trúc Pure Function, cấu hình tập trung (`NUTRIENT_THRESHOLDS`) và cơ chế Triage (Hard Caps) đảm bảo tính công bằng và chính xác khi đánh giá mọi loại thực phẩm. Nó giúp người dùng có cái nhìn sâu sắc và trực quan về chất lượng thực phẩm, hỗ trợ lựa chọn những món ăn giàu dinh dưỡng thay vì chỉ đếm calo mù quáng.
