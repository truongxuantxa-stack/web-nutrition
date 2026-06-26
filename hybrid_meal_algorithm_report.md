# Báo cáo Chi tiết: Thuật toán Gợi ý Thực đơn (Gauss Meal Solver)

Thuật toán Gợi ý Thực đơn (Gauss Meal Solver) là trái tim của hệ thống Nutrition Management System (NMS), được thiết kế với triết lý **Hardcore Tracking**. Thay vì gợi ý các món ăn đã nấu chín với lượng calo ước tính thiếu chính xác, hệ thống tính toán trực tiếp trọng lượng của từng nguyên liệu thô (raw ingredients) để đảm bảo đáp ứng chính xác 100% mục tiêu Macro của người dùng.

Mặc dù trong giao diện hiện tại của phiên bản thực tế, các gợi ý món ăn tự động đã được gỡ bỏ để tối ưu hệ thống và nhấn mạnh việc người dùng chủ động ghi chép (Hardcore Tracking), nhưng thuật toán cốt lõi trong `mealPlanner.service.js` vẫn là một kiệt tác kỹ thuật giải quyết bài toán phức tạp của Macro Overlap.

## 1. Tổng quan Kiến trúc (4 Modules)

Luồng hoạt động của thuật toán được chia làm 4 module nối tiếp nhau:
1. **Meal Target Allocation:** Chuyển đổi mục tiêu Calo/Macro tổng của một ngày thành ngân sách chính xác bằng Gram cho Protein, Carbs, Fat của từng bữa ăn (dựa trên cấu hình % phân bổ).
2. **Template Matching:** Chọn ngẫu nhiên các nguyên liệu thô phù hợp để điền vào "Khuôn mẫu" 4 Slot (1 Carb, 1 Protein, 1 Fat, 1 Rau/Fiber).
3. **Weight Calculator:** (Cốt lõi Toán học) Giải hệ phương trình để tìm trọng lượng chuẩn xác cho 3 nguyên liệu (Carb, Protein, Fat) sao cho khớp 100% Macro.
4. **Edge Cases & Smart Swap:** Kiểm tra ngoại lệ (âm trọng lượng, quá ít, quá nhiều).

## 2. Cốt lõi Toán học: Bộ tính khối lượng (Weight Calculator)

Bài toán khó nhất ở đây là **Macro Overlap** (Chồng lấn đa lượng). Một nguyên liệu thô thường chứa nhiều macro (ví dụ: gạo lứt chứa cả Carbs và Protein). Không thể tính đơn giản bằng phép chia, mà phải giải một hệ phương trình.

### 2.1. Lập Hệ Phương Trình Tuyến Tính
Giả sử có 3 nguyên liệu (Carb, Protein, Fat) với trọng lượng cần tìm là `w1, w2, w3` (tính theo đơn vị 100g). Mỗi nguyên liệu có thành phần `(pi, ci, fi)` trên 100g.
Mục tiêu của bữa ăn là `Tp, Tc, Tf`. Ta có hệ 3 phương trình:
1. `p1*w1 + p2*w2 + p3*w3 = Tp`
2. `c1*w1 + c2*w2 + c3*w3 = Tc`
3. `f1*w1 + f2*w2 + f3*w3 = Tf`

*Lưu ý về Slot Rau (Fiber):* Khối lượng rau được cố định ở mức **200g**. Lượng macro từ 200g rau này được trừ thẳng vào mục tiêu `(Tp, Tc, Tf)` trước khi đưa vào giải hệ.

### 2.2. Giải Hệ bằng Thuật toán Khử Gauss (Gaussian Elimination)
Hệ thống sử dụng ma trận `3x3` và áp dụng phương pháp Khử Gauss kết hợp **Partial Pivoting** (Hoán vị dòng) để luôn tìm phần tử lớn nhất làm phần tử chéo chính, tránh chia cho 0 và sai số.

*Nếu định thức của ma trận bằng 0 (các nguyên liệu có tỷ lệ macro quá giống nhau gây suy biến ma trận), thuật toán trả về `null` và thử lại (Retry).*

## 3. Xử lý Ngoại lệ và Trải nghiệm Người dùng

Toán học luôn đúng, nhưng thực tế dinh dưỡng thì không. Hệ phương trình có thể cho ra kết quả phi thực tế (Ví dụ: Trọng lượng là số âm do nguồn Protein chọn chứa quá nhiều Fat).

### Cơ chế Smart Swap
Dự án đã loại bỏ hoàn toàn **Heuristic Fallback** (thuật toán dự phòng cố tình bóp méo kết quả cho gần đúng). Thay vào đó, áp dụng **Smart Swap**:
- Thuật toán tiến hành thử ngẫu nhiên tối đa 15 vòng (Retries) để tìm tổ hợp khả thi nhất.
- Nếu nghiệm vẫn ra số âm (Ví dụ: Thịt ba chỉ phá vỡ ngân sách mỡ), thuật toán chặn lại, trả về lỗi chi tiết ("Nguồn đạm này chứa quá nhiều mỡ") kèm theo Gợi ý Đổi Món (ví dụ: "Hãy đổi sang Ức gà hoặc Thăn bò").
- Tính năng Cache được áp dụng cho danh sách nguồn đạm nạc (`_leanAlternativesCache`) để tối ưu hiệu năng cơ sở dữ liệu khi hệ thống phải gọi hàm `getLeanAlternatives` nhiều lần.

Sự kết hợp giữa Toán học tuyến tính (Gauss) và Nhận thức UX (Smart Swap) giúp thuật toán không bao giờ thỏa hiệp với sai số, giữ vững triết lý Hardcore Tracking của dự án.
