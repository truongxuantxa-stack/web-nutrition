# Báo cáo Chi tiết: Health Insights & Daily Scoring Algorithm

Thuật toán gợi ý y khoa (Health Insights) trong Web Dinh Dưỡng cung cấp các phân tích đa chiều về hành vi ăn uống trong ngày của người dùng. Không chỉ là đếm calo, thuật toán mô phỏng suy nghĩ của một chuyên gia dinh dưỡng thực thụ với cơ chế đánh giá ưu tiên (Triage) và nhận thức ngữ cảnh (Context-Awareness).

## 1. Cơ chế Triage (Phân cấp ưu tiên y khoa)
Con người khi bị bỏ đói sẽ không quan tâm đến thiếu Vitamin C. Tương tự, thuật toán ưu tiên đánh giá dinh dưỡng theo tháp nhu cầu:
Hàm `getCalorieLevel` phân chia lượng calo tiêu thụ so với mục tiêu thành 3 tầng:
1. **Tầng Sinh Tồn (Critical, $< 50\%$ Calo):** Cơ thể đang ở trạng thái suy nhược hoặc nhịn ăn thái quá. Hệ thống **tắt (mute)** toàn bộ các cảnh báo thiếu vi chất và cảnh báo thiếu đa lượng. Chỉ cảnh báo duy nhất một điều: "Lượng ăn quá thấp, hãy bổ sung năng lượng ngay lập tức".
2. **Tầng Đa Lượng (Low, $50\% - 70\%$ Calo):** Nhu cầu năng lượng cơ bản đã được đáp ứng nhưng vẫn thiếu. Hệ thống cảnh báo thiếu Calo, Protein và Chất béo, nhưng **tắt** cảnh báo vi chất (Vitamin/Khoáng) vì ăn ít thì hiển nhiên vi chất sẽ thấp, cảnh báo sẽ gây nhiễu.
3. **Tầng Vi Lượng (Adequate, $\geq 70\%$ Calo):** Khi đa lượng và năng lượng đã hòm hòm, hệ thống mới bắt đầu soi xét đến các nhóm vi chất (Sắt, Canxi, Vitamin C, Vitamin A, Chất xơ) và kích hoạt cảnh báo nếu thiếu.

**Lưu ý:** Cơ chế Triage chỉ áp dụng cho nhóm **THIẾU (Deficiency)**. Các cảnh báo **THỪA (Toxicity)** như thừa muối, thừa đường, thừa calo sẽ luôn được kích hoạt mọi lúc.

## 2. Context-Awareness (Nhận thức Ngữ cảnh)
Hệ thống không đánh giá một cách máy móc vào lúc 8h sáng rằng "Bạn đang thiếu 80% lượng calo trong ngày".
Cảnh báo THIẾU hụt dinh dưỡng (`shouldWarnDeficiency`) chỉ được kích hoạt khi:
- Đã quá 20h00 tối (gần hết ngày).
- Hoặc người dùng đã ghi chép đủ 3 bữa (Sáng, Trưa, Tối).
- Hoặc đang xem báo cáo lịch sử của các ngày trước đó (`isHistorical = true`).

Hệ thống sử dụng `clientHour` truyền từ frontend để đảm bảo tính toán thời gian chính xác theo múi giờ thực tế của người dùng, thay vì giờ của server.

## 3. Khuyến nghị Y khoa Nền tảng (RDI)
RDI (Reference Daily Intake) được tập trung hóa vào hàm `getRDIByGender(gender)` để tránh trùng lặp code và dễ dàng cập nhật theo chuẩn WHO/AHA.
- **Đường (AHA):** Giới hạn tối đa 36g/ngày (Nam) và 25g/ngày (Nữ).
- **Natri (WHO):** Giới hạn tối đa 2300mg/ngày. Hệ thống áp dụng cơ chế **Cảnh báo 3 tầng (Escalation)**: Cảnh báo sớm (>85%), Vượt ngưỡng (>100%), và Báo động đỏ Critical (>130%) để phản ánh đúng mức độ nguy hiểm thay vì chỉ có một mốc duy nhất.
- **Chất xơ (AHA):** 30g (Nam) / 25g (Nữ). *(Áp dụng mức sàn AHA thay vì IOM 38g để tăng tính khả thi — người dùng thực tế chỉ nạp ~10-15g/ngày, mốc 38g gây "learned helplessness".)*
- **Vi khoáng:** Vitamin C (90mg/75mg), Canxi (1000mg chung), Sắt (8mg Nam / 18mg Nữ), Vitamin A (900µg/700µg).

*Điểm mới: Đã tích hợp đánh giá Vitamin A vào nhóm vi chất.*

## 4. Liên kết Vĩ lượng (Cross-Macro Guidance)
Thay vì đánh giá từng chất một cách cô lập, hệ thống có khả năng phân tích chéo (Cross-Macro). Ví dụ điển hình: Nếu người dùng đã nạp đủ Carbs (100%-120% mục tiêu) nhưng tổng Calo trong ngày vẫn đang ở mức thấp (<90%), hệ thống sẽ chủ động đề xuất: *"Bạn đã đủ tinh bột, hãy ưu tiên dùng quỹ calo còn lại cho Protein hoặc Rau xanh"*. Điều này giúp định hướng bữa ăn tiếp theo chính xác hơn là chỉ báo cáo kết quả.

## 5. Chấm điểm Ngày (Daily Health Score)
Điểm khởi điểm là 100. Thuật toán `calculateDailyHealthScore` thực hiện trừ điểm dựa trên **Độ lệch tuyến tính (Weighted Penalty)** thay vì trừ một con số cố định.
- Mỗi cảnh báo (Insight) có một mức phạt gốc: Danger = 15đ, Warning = 6đ, Suggestion = 2đ.
- Hệ thống tính độ lệch (deviation) giữa lượng thực nạp và mục tiêu. Lệch càng xa, mức phạt càng được nhân lên (dao động từ x0.5 cho sai lệch nhỏ, đến tối đa x2.5 nếu sai lệch >60%). Cơ chế này giúp điểm số công bằng hơn: vượt mục tiêu 5% sẽ bị phạt rất nhẹ so với vượt 50%.
Nếu chế độ ăn thiếu hụt từ 3 vi chất trở lên (Nạn đói vi chất), hệ thống gộp cảnh báo và trừ thẳng một mức phạt lớn (-25 điểm) thay vì trừ lẻ tẻ.

### Sliding Calorie Multiplier & Sugar Toxicity
Tổng điểm sau đó được nhân với hệ số trừng phạt:
- **Calorie Multiplier:** Phạt nặng nếu calo $<30\%$ (x0.3) hoặc $>130\%$ (x0.6).
- **Sugar Toxicity Multiplier:** Nếu lượng đường vượt quá 200% mức AHA cho phép, điểm sẽ bị phạt tiếp (x0.7).

### Hard Caps (Điểm Liệt)
Áp dụng cơ chế điểm liệt để ngăn chặn tình trạng ăn đủ lượng calo (Adequate) nhưng chất lượng rác (Junk food):
- **Hard Cap 50:** Nếu trung bình mức độ đáp ứng 4 vi chất chính (Vit A, C, Canxi, Sắt) $< 20\%$, điểm trong ngày tối đa chỉ đạt 50.
- **Hard Cap 60:** Nếu lượng chất xơ $< 30\%$ RDI, điểm tối đa chỉ đạt 60.

## Kết luận
Bằng việc kết hợp Cơ chế Triage, Nhận thức Ngữ cảnh và Điểm liệt (Hard Caps), thuật toán Health Insights mang lại các cảnh báo thông minh, hợp lý và không gây phiền báo. Người dùng nhận được đúng lời khuyên họ cần vào đúng thời điểm, thúc đẩy thói quen theo dõi dinh dưỡng một cách chủ động và tích cực.

## 6. Chấm điểm Món ăn — Sodium Hard Caps (Double Medical Protection)
Đối với việc tính điểm **từng món ăn** riêng lẻ (nutrient density score), trước đây tồn tại một "điểm mù": Các món ăn chứa lượng muối cực cao (ví dụ: Rau Cải Luộc Chấm Mắm với 2400mg Natri) vẫn có thể đạt điểm tuyệt đối 100đ, bởi điểm phạt muối (-25đ) bị "bù đắp thừa" bởi các điểm cộng từ đạm, xơ và vi chất trong món ăn đó. 

Để khắc phục, hệ thống áp dụng cơ chế **Bảo vệ y khoa kép (Double Medical Protection)** cho Natri:
- **Bảo vệ Cấu trúc (Density) - Cap 60:** Nếu mật độ Natri vượt ngưỡng nguy hiểm (>150mg/100kcal), điểm của món ăn không thể vượt quá 60 (Mức trung bình/khá).
- **Bảo vệ Lâm sàng (Absolute & Extreme Density) - Cap 40:** 
  - Nếu món ăn *vô cùng mặn* về mặt cấu trúc (mật độ >300mg/100kcal, ví dụ mắm, dưa muối).
  - HOẶC gây rủi ro *y khoa trực tiếp* (chứa giá trị tuyệt đối > 1000mg/khẩu phần). Một khẩu phần chứa >1000mg là cực kỳ báo động đối với thận.
  - Khi thoả mãn 1 trong 2 điều kiện này, điểm của món ăn bị chặn ở mức tối đa 40đ (Mức kém). Mọi điểm cộng từ xơ, đạm đều vô nghĩa trước lượng muối độc hại này.
