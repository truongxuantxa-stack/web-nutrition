# Báo cáo Chi tiết: Thuật toán Gợi ý Thực đơn (Gauss Meal Solver)

Thuật toán Gợi ý Thực đơn (Gauss Meal Solver) là một trong những cốt lõi kỹ thuật phức tạp nhất của hệ thống Nutrition Management System (NMS), được thiết kế để phục vụ triết lý **Hardcore Tracking**.

---

## 1. Vấn đề và Ý tưởng Cốt lõi

### 1.1. Bài toán thực tiễn: Nỗi đau của việc "Lên thực đơn chuẩn Macro"

Trong xu hướng chăm sóc sức khỏe và dinh dưỡng khoa học hiện nay, việc chỉ quan tâm đến **tổng lượng calo** là không đủ. Ngày càng có nhiều người dùng (từ những người muốn kiểm soát cân nặng, cải thiện vóc dáng cho đến những người theo đuổi lối sống lành mạnh) nhận ra tầm quan trọng của việc phân bổ chính xác giữa các Đa lượng chất (Macronutrients - gọi tắt là Macro): **Protein (Đạm)**, **Carbohydrates (Tinh bột)** và **Fat (Chất béo)**.

Tuy nhiên, khi người dùng hoặc các ứng dụng thông thường cố gắng lên thực đơn để khớp với một con số Macro mục tiêu (Ví dụ: Bữa trưa cần 40g Protein, 50g Carbs, 15g Fat), họ sẽ ngay lập tức vấp phải một rào cản toán học lớn gọi là **Macro Overlap (Sự chồng lấn đa lượng)**. 

Trong tự nhiên, gần như không có nguyên liệu nào chứa 100% tinh khiết một chất.
* **Ví dụ:** Bạn cần thêm Protein, bạn quyết định ăn thêm Thịt gà. Nhưng Thịt gà không chỉ có Protein, nó còn có Fat. Nếu bạn ăn đủ lượng Thịt gà để đạt 40g Protein, lượng Fat có thể bị đội lên quá 15g. 
* Tương tự, nếu bạn ăn Gạo lứt để lấy Carbs, Gạo lứt lại chứa cả một lượng nhỏ Protein và Fat. 

Cứ mỗi lần bạn tăng/giảm trọng lượng của một nguyên liệu để làm khớp một chất, nó sẽ kéo theo sự sai lệch của các chất còn lại. Việc cố gắng tính nhẩm hay thử sai bằng tay (trial and error) để các con số vừa vặn khớp 100% với mục tiêu là một **nhiệm vụ bất khả thi** hoặc tiêu tốn hàng giờ đồng hồ.

Các ứng dụng ăn kiêng trên thị trường hiện nay thường né tránh bài toán này bằng cách:
1. Gợi ý các món ăn nấu chín chung chung (Ví dụ: "1 bát phở bò" = 400 calo) với lượng macro sai số cực kỳ lớn.
2. Ép người dùng tự điền khối lượng thức ăn và chấp nhận sai số (thường là lệch vài chục gram macro mỗi ngày).

### 1.2. Giải pháp: Thuật toán Gauss Meal Solver

Dự án NMS từ chối sự thỏa hiệp này và theo đuổi triết lý **Hardcore Tracking** - Mọi thứ phải được tính bằng nguyên liệu thô (Raw Ingredients) và độ chính xác phải đạt 100%.

Để giải quyết bài toán Macro Overlap, hệ thống không dùng cách thử sai thô sơ (Heuristics), mà chuyển hóa hoàn toàn bài toán dinh dưỡng thành một **Hệ phương trình Đại số tuyến tính** và giải quyết nó bằng thuật toán **Khử Gauss (Gaussian Elimination)**. 

Bằng cách đưa thông số dinh dưỡng của các nguyên liệu vào một Ma trận 3x3 và giải phương trình, hệ thống có thể tính ngược ra chính xác đến từng gram trọng lượng của Gạo, Thịt, Dầu ăn... sao cho khi kết hợp lại, chúng bù trừ cho nhau và tạo ra tổng lượng Macro hoàn hảo không sai một ly.

Mặc dù trong giao diện hiện tại của phiên bản thực tế, các gợi ý món ăn tự động đã tạm được ẩn đi để tối ưu hệ thống và khuyến khích người dùng chủ động ghi chép (Hardcore Tracking), nhưng thuật toán cốt lõi ẩn trong file `mealPlanner.service.js` vẫn là một kiệt tác kỹ thuật giải quyết trọn vẹn bài toán khó nhất của việc thiết kế thực đơn.

---

## 2. Tổng quan Kiến trúc (4 Modules)

Luồng hoạt động của thuật toán được chia làm 4 module nối tiếp nhau:
1. **Meal Target Allocation:** Chuyển đổi mục tiêu Calo/Macro tổng của một ngày thành ngân sách chính xác bằng Gram cho Protein, Carbs, Fat của từng bữa ăn (dựa trên cấu hình % phân bổ).
2. **Template Matching:** Chọn ngẫu nhiên các nguyên liệu thô phù hợp để điền vào "Khuôn mẫu" 4 Slot (1 Carb, 1 Protein, 1 Fat, 1 Rau/Fiber).
3. **Weight Calculator:** (Cốt lõi Toán học) Giải hệ phương trình để tìm trọng lượng chuẩn xác cho 3 nguyên liệu (Carb, Protein, Fat) sao cho khớp 100% Macro.
4. **Edge Cases & Smart Swap:** Kiểm tra ngoại lệ (âm trọng lượng, quá ít, quá nhiều).

## 3. Cốt lõi Toán học: Bộ tính khối lượng (Weight Calculator)

Bài toán khó nhất ở đây là **Macro Overlap** (Chồng lấn đa lượng). Một nguyên liệu thô thường chứa nhiều macro (ví dụ: gạo lứt chứa cả Carbs và Protein). Không thể tính đơn giản bằng phép chia, mà phải giải một hệ phương trình.

### 3.1. Lập Hệ Phương Trình Tuyến Tính
Giả sử có 3 nguyên liệu (Carb, Protein, Fat) với trọng lượng cần tìm là `w1, w2, w3` (tính theo đơn vị 100g). Mỗi nguyên liệu có thành phần `(pi, ci, fi)` trên 100g.
Mục tiêu của bữa ăn là `Tp, Tc, Tf`. Ta có hệ 3 phương trình:
1. `p1*w1 + p2*w2 + p3*w3 = Tp`
2. `c1*w1 + c2*w2 + c3*w3 = Tc`
3. `f1*w1 + f2*w2 + f3*w3 = Tf`

*Lưu ý về Slot Rau (Fiber):* Khối lượng rau được cố định ở mức **200g**. Lượng macro (Protein, Carbs, Fat) có trong 200g rau này sẽ được tính toán trước và trừ thẳng vào mục tiêu `(Tp, Tc, Tf)` ban đầu, sau đó phần mục tiêu còn lại mới được đưa vào giải hệ phương trình 3x3.

**Tại sao lại cố định Rau ở mức 200g và điều này có ảnh hưởng đến dinh dưỡng không?**

- **Lý do Toán học và Sự Ưu tiên Dinh dưỡng:** Trong kiểm soát vóc dáng, việc tính toán chuẩn xác đến từng gram cho 3 Đa lượng (Protein, Carbs, Fat) là ưu tiên sống còn và quan trọng hơn rất nhiều so với việc cân đo đong đếm chi ly lượng Chất xơ (Fiber). Hệ thống thiết lập 3 mục tiêu độc lập (Protein, Carbs, Fat) tương đương với 3 phương trình. Nếu cố gắng đưa thêm lượng Rau (nguồn Fiber) vào làm biến số thứ 4, hệ phương trình sẽ có 4 ẩn nhưng chỉ có 3 phương trình, dẫn đến vô số nghiệm. Do đó, thuật toán quyết định "hi sinh" biến số ít quan trọng hơn bằng cách cố định khối lượng Rau thành một hằng số (200g). Sự đánh đổi này giúp thu gọn bài toán về ma trận 3x3 hoàn hảo, cho phép hệ thống dồn toàn lực tính toán chính xác tuyệt đối 100% cho 3 Đa lượng lõi.
- **Không gây sai số và Đảm bảo sức khỏe:** 200g rau xanh/bữa là khẩu phần tiêu chuẩn cung cấp đủ chất xơ và vi chất thiết yếu. Điều tuyệt vời là toàn bộ lượng Macro nhỏ bé có trong 200g rau này đã được hệ thống **khấu trừ trước** khỏi mục tiêu tổng. Nhờ đó, việc chốt cứng con số 200g **hoàn toàn không làm sai lệch** mục tiêu Calo hay Macro của bữa ăn, vừa tháo gỡ thành công rào cản toán học, vừa đảm bảo người dùng nạp đủ chất xơ cho sức khỏe.

### 3.2. Giải Hệ bằng Thuật toán Khử Gauss (Gaussian Elimination)
Hệ thống sử dụng ma trận `3x3` và áp dụng phương pháp Khử Gauss kết hợp **Partial Pivoting** (Hoán vị dòng) để luôn tìm phần tử lớn nhất làm phần tử chéo chính, tránh chia cho 0 và sai số.

*Nếu định thức của ma trận bằng 0 (các nguyên liệu có tỷ lệ macro quá giống nhau gây suy biến ma trận), thuật toán trả về `null` và thử lại (Retry).*

## 4. Xử lý Ngoại lệ và Trải nghiệm Người dùng

Toán học luôn đúng, nhưng thực tế dinh dưỡng thì không. Hệ phương trình có thể cho ra kết quả phi thực tế (Ví dụ: Trọng lượng là số âm do nguồn Protein chọn chứa quá nhiều Fat).

### Cơ chế Smart Swap
Dự án đã loại bỏ hoàn toàn **Heuristic Fallback** (thuật toán dự phòng cố tình bóp méo kết quả cho gần đúng). Thay vào đó, áp dụng **Smart Swap**:
- Thuật toán tiến hành thử ngẫu nhiên tối đa 15 vòng (Retries) để tìm tổ hợp khả thi nhất.
- Nếu nghiệm vẫn ra số âm (Ví dụ: Thịt ba chỉ phá vỡ ngân sách mỡ), thuật toán chặn lại, trả về lỗi chi tiết ("Nguồn đạm này chứa quá nhiều mỡ") kèm theo Gợi ý Đổi Món (ví dụ: "Hãy đổi sang Ức gà hoặc Thăn bò").
- Tính năng Cache được áp dụng cho danh sách nguồn đạm nạc (`_leanAlternativesCache`) để tối ưu hiệu năng cơ sở dữ liệu khi hệ thống phải gọi hàm `getLeanAlternatives` nhiều lần.

Sự kết hợp giữa Toán học tuyến tính (Gauss) và Nhận thức UX (Smart Swap) giúp thuật toán không bao giờ thỏa hiệp với sai số, giữ vững triết lý Hardcore Tracking của dự án.
