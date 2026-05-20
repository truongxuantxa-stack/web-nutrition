# BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN TỐT NGHIỆP

**Tên đề tài:** Xây dựng Hệ thống Quản lý Dinh dưỡng Cá nhân hóa (Nutrition Management System)
**Học kỳ:** ......................................
**Giáo viên hướng dẫn:** ......................................
**Sinh viên thực hiện:** ......................................

---

## 1. TỔNG QUAN ĐỀ TÀI
Hệ thống Quản lý Dinh dưỡng Cá nhân hóa là một ứng dụng Web (Web Application) được xây dựng nhằm hỗ trợ người dùng theo dõi và quản lý dữ liệu dinh dưỡng, tập luyện một cách chủ động. 
Dự án theo đuổi triết lý thiết kế **"Hardcore Tracking"** — đề cao tính tự quyết của người dùng, cung cấp các công cụ ghi chép và biểu đồ dữ liệu chính xác thay vì áp đặt các thực đơn máy móc.

## 2. CÔNG NGHỆ VÀ CÔNG CỤ PHÁT TRIỂN
- **Kiến trúc:** Mô hình **Monorepo** chia tách độc lập để chuẩn bị cho kiến trúc SPA hiện đại.
  - `/backend`: Mã nguồn Node.js/Express.js & RESTful APIs.
  - `/frontend`: Dự án React SPA mới tinh được khởi tạo bằng Vite.
- **Cơ sở dữ liệu:** MySQL quản lý thông qua Sequelize ORM.
- **Frontend (Giao diện):** EJS Template Engine (bản cũ dùng để đối chiếu UI/UX) và đang chuyển đổi sang **React (Vite) + Tailwind CSS + DaisyUI**.
- **Thư viện hỗ trợ:** 
  - `Chart.js` / React Chart libraries: Vẽ biểu đồ trực quan (Biểu đồ tròn Macros, biểu đồ đường theo dõi Cân nặng).
  - `JSON Web Token (JWT)` & `Bcryptjs`: Bảo mật xác thực và mã hóa mật khẩu không trạng thái (stateless).
  - `PDFKit`: Phục vụ chức năng kết xuất báo cáo thống kê chuyên nghiệp hỗ trợ tiếng Việt.
  - `Axios` & `React Router Dom`: Phục vụ gọi API và định tuyến trang cho React.

## 3. CẤU TRÚC HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU
Hệ thống được thiết kế theo kiến trúc chuẩn MVC (Model-View-Controller) ở phần Backend API, tách biệt rõ ràng giữa luồng định tuyến (Routes), xử lý nghiệp vụ (Services/Controllers) và giao diện hiển thị (React Components).

Cơ sở dữ liệu hiện tại đã được đồng bộ hóa thành công với **6 thực thể (Models)** cốt lõi:
1. `User`: Quản lý thông tin cá nhân, chỉ số cơ thể, mục tiêu.
2. `Food`: Thư viện thực phẩm phân loại theo nguyên liệu thô (raw) và món ăn (dish).
3. `DiaryEntry`: Lưu trữ nhật ký ăn uống chi tiết.
4. `WeightLog`: Ghi nhận lịch sử biến động cân nặng.
5. `WaterLog`: Theo dõi lượng nước nạp vào cơ thể theo giờ.
6. `ExerciseLog`: Quản lý nhật ký luyện tập thể chất.

## 4. CHI TIẾT TIẾN ĐỘ THỰC HIỆN (Đạt ~95%)
Dự án được chia thành 6 giai đoạn phát triển (Phases). Hiện tại dự án đã hoàn tất phần lớn khối lượng công việc ở Backend và đang bứt phá ở chặng đường Frontend, cụ thể:

- ✅ **Giai đoạn 1: Khởi tạo kiến trúc (Hoàn thành 100%)**
  - Cài đặt server Express, kết nối MySQL thành công.
- ✅ **Giai đoạn 2: Phát triển Database (Hoàn thành 100%)**
  - Xây dựng đầy đủ Models và Relationships (1-N). Đã nạp (seed) thành công danh mục hơn 50 món ăn phổ biến của Việt Nam.
- ✅ **Giai đoạn 3: Xác thực và Hồ sơ (Hoàn thành 100%)**
  - Xây dựng thành công luồng Đăng ký, Đăng nhập (với JWT cookie). Hoàn thiện luồng Onboarding (thiết lập ban đầu) thu thập chiều cao, cân nặng để hệ thống làm cơ sở tính toán.
- ✅ **Giai đoạn 4: Thuật toán & Xử lý Nghiệp vụ (Hoàn thành 100%)**
  - Tích hợp chuẩn xác công thức **Mifflin-St Jeor** để tính BMR và TDEE.
  - Tự động phân bổ vĩ lượng (Macros: 30% Protein - 40% Carbs - 30% Fat).
  - Xây dựng thành công module tự tạo thực phẩm (Custom Food) với tính năng Soft Delete đảm bảo tính toàn vẹn dữ liệu.
  - ⚡ **Nghiên cứu & Triển khai đột phá**: Đưa vào hoạt động thành công **Thuật toán TDEE Thích ứng (Adaptive TDEE)**, tự động bù trừ Metabolic Adaptation bằng dữ liệu nhật ký ăn và biến động cân nặng thực tế.
- ✅ **Giai đoạn 5: Phát triển Giao diện UI/UX & Tái Cấu Trúc (Hoàn thành 100%)**
  - Hoàn thiện giao diện Dashboard, Nhật ký trên nền tảng EJS cũ với điều hướng ngày tháng linh hoạt và cơ chế AJAX mượt mà.
  - **Tái cấu trúc Monorepo:** Tách đôi hệ thống thành `/backend` (API) và `/frontend` (Vite/React) độc lập, giải quyết xung đột cấu hình và tối ưu hiệu suất cho AI Agent hỗ trợ phát triển.
  - Tích hợp cơ chế **Ghim Nguyên Liệu (Meal Pinning)** thông minh, hỗ trợ tự động khóa nguyên liệu (Auto-pin) từ menu dropdown và đồng bộ hóa tức thì sang giao diện kết quả.
- ✅ **Giai đoạn 6: Xuất Báo cáo & Hoàn thiện PDF (Hoàn thành 100%)**
  - Hoàn thành module kết xuất file PDF thống kê dinh dưỡng 7 ngày/30 ngày chuyên nghiệp sử dụng `pdfkit`.
  - Giải quyết triệt để lỗi ngắt trang (Smart Page-breaks) và chân trang (drawFooter) bằng kỹ thuật tinh chỉnh lề dưới (bottom margin 20) và chế độ chống xuống dòng `lineBreak: false`.
  - Tích hợp vẽ lại tiêu đề bảng khi ngắt trang, áp dụng bảng màu Green/Health chuẩn y khoa và cơ chế gom trang bằng Buffer để hiển thị số trang `X/N` động chính xác.

## 5. NHỮNG THUẬT TOÁN ĐƯỢC ÁP DỤNG TRONG HỆ THỐNG
1. **Thuật toán Lập kế hoạch Bữa ăn bằng Hệ Phương Trình Tuyến Tính (Gauss Solver Algorithm) ⚡:** Dựa trên khuôn mẫu thực đơn (Meal Template), hệ thống tự động giải hệ phương trình tuyến tính 3x3 bằng thuật toán khử Gauss (Gaussian Elimination) để tính toán chính xác khối lượng gram (của Carb, Protein, Fat) sao cho khớp 100% mục tiêu đa lượng của bữa ăn, đồng thời tự động chốt lượng rau và hỗ trợ khóa/ghim (pinning) nguyên liệu theo mong muốn của người dùng.
2. **Thuật toán Ước tính Năng lượng & Phân bổ Dinh dưỡng (Target Metrics Algorithm):** Thuật toán quyết định rẽ nhánh dựa trên thông số sinh học (giới tính, cân nặng, chiều cao, tuổi), ánh xạ mức độ hoạt động và phân rã mục tiêu calo thành tỷ lệ 3 đại dưỡng chất (Protein/Carb/Fat).
3. **Thuật toán Scale Macros Động theo Luyện tập (Effective Macros Algorithm):** Thuật toán tỷ lệ thuận (Proportional Scaling) giúp tính toán lại lượng calo và tái cấu trúc tỷ lệ các dưỡng chất nạp thêm dựa trên lượng calo đốt cháy từ việc luyện tập, giúp bảo toàn mật độ dinh dưỡng (Nutrient Density).
4. **Thuật toán Phân tích Sức khỏe & Cảnh báo Thông minh (Health Insights Algorithm):** Một hệ chuyên gia dựa trên luật (Rule-based Expert System) phân tích tiến độ calo nạp vào, tính toán sự mất cân bằng macro (Macro Balance) tại thời điểm thực, và quét qua thành phần món ăn thô để đưa ra cảnh báo thiếu hụt.
5. **Thuật toán Tổng hợp & Snapshot Dinh dưỡng (Nutrition Aggregation Algorithm):** Thuật toán tính toán tổng hợp (Reduce) kết hợp cơ chế ưu tiên dữ liệu (Data Prioritization). Thuật toán kiểm tra và sử dụng trạng thái dữ liệu tại thời điểm ăn (snapshot) để tính toán tổng, nhằm bảo toàn tính toàn vẹn của lịch sử nhật ký.
6. **Thuật toán Tìm kiếm & Xếp hạng Ưu tiên (Prioritized Search Algorithm):** Tự động xây dựng câu lệnh lọc (Dynamic Query Building) dựa trên danh mục/từ khóa, đồng thời thực thi thuật toán xếp hạng: ưu tiên đẩy các món ăn tùy chỉnh (Custom Foods) của người dùng lên trước các món mặc định của hệ thống.
7. **Thuật toán TDEE Thích ứng (Adaptive TDEE Algorithm) ⚡:** Thay vì tính tĩnh bằng công thức Mifflin, hệ thống áp dụng logic lọc nhiễu cân nặng (Exponential Moving Average) kết hợp với dữ liệu nhật ký ăn để tìm ra chính xác mức độ thay đổi chuyển hóa (Metabolic Adaptation), qua đó tự động hiệu chỉnh (CLAMP) TDEE thực tế để phá vỡ hiệu ứng "đứng cân" của người dùng.

## 6. CƠ SỞ LÝ THUYẾT & CÔNG THỨC ÁP DỤNG
Dưới đây là các công thức toán học và sinh học cốt lõi được lập trình trong hệ thống:

**1. Chỉ số cơ thể (Cơ bản):**
- **BMI** = Cân nặng / (Chiều cao * Chiều cao) *(Lưu ý: Chiều cao tính bằng mét)*
- **BMR (Nam)** = (10 * Cân nặng) + (6.25 * Chiều cao) - (5 * Tuổi) + 5
- **BMR (Nữ)** = (10 * Cân nặng) + (6.25 * Chiều cao) - (5 * Tuổi) - 161
- **TDEE** = BMR * Hệ số vận động (1.2 đến 1.9)

**2. Mục tiêu dinh dưỡng (Ngày):**
- **Calo Duy trì** = TDEE
- **Calo Giảm cân** = TDEE - 500
- **Calo Tăng cân** = TDEE + 500

**3. Công thức chia Macros (Tỷ lệ 30% Đạm - 40% Tinh bột - 30% Béo):**
- **Protein (g)** = (Tổng Calo * 0.3) / 4
- **Carbs (g)** = (Tổng Calo * 0.4) / 4
- **Fat (g)** = (Tổng Calo * 0.3) / 9

**4. Công thức luyện tập & Nước:**
- **Calo Đốt cháy** = MET * Cân nặng * Thời gian tập (giờ)
- **Mục tiêu Nước (ml)** = Cân nặng * 35

**5. Công thức luyện tập & Scale Macros:**
- **Hệ số nhân thêm** = (Calo Mục tiêu + Calo Đốt từ tập luyện) / Calo Mục tiêu
- **Macros Mới** = Macros Gốc * Hệ số nhân thêm

**6. Công thức giải hệ phương trình tuyến tính 3x3 trong Meal Planner (Khử Gauss):**
- Cho ma trận hệ số dinh dưỡng $A$ (3x3 đại diện cho Carb, Protein, Fat của 3 nguyên liệu) và mục tiêu dinh dưỡng $T$ (sau khi đã trừ đi lượng rau).
- Hệ phương trình có dạng: $A \cdot W = T$
- Thực thi phương pháp Khử Gauss (Partial Pivoting & Back Substitution) để tìm vector trọng lượng $W = [w_{carb}, w_{protein}, w_{fat}]$ tương ứng.

## 7. KẾ HOẠCH CÔNG VIỆC SẮP TỚI (Tập trung xây dựng Frontend React)
Để nghiệm thu và nộp sản phẩm hoàn chỉnh với hiệu ứng thị giác tuyệt đỉnh, các công việc sắp tới bao gồm:
1. **Thiết kế Landing Page siêu đẹp (React + Vite):** Xây dựng trang chủ thu hút với các hiệu ứng animation chuyển động mượt mà giới thiệu đầy đủ tính năng của hệ thống.
2. **Cấu hình RESTful APIs ở Backend:** Hỗ trợ đầy đủ CORS, chuyển đổi cơ chế Session cũ sang JWT Token Stateless phục vụ API.
3. **Chuyển đổi giao diện sang React SPA:** Viết lại các trang Dashboard (vẽ chart dynamic), Nhật ký ăn uống, và Meal Planner theo chuẩn component React.
4. Hoàn thiện Quyển Báo Cáo Đồ Án bản cứng.

## 8. HƯỚNG PHÁT TRIỂN & CÁC THUẬT TOÁN DỰ KIẾN (Future Scope)
Để mở rộng hệ thống đạt tiêu chuẩn của các ứng dụng dinh dưỡng thương mại lớn, dự án có định hướng nghiên cứu và tích hợp thêm các thuật toán bậc cao sau:

**1. Thuật toán Chấm điểm Chất lượng Bữa ăn (Meal Quality Scoring Algorithm):**
- **Vấn đề:** Việc chỉ đạt đủ số lượng Calo/Macro là chưa đủ để phản ánh sức khỏe toàn diện. Nguồn gốc của lượng calo đó (từ thực phẩm sạch hay thức ăn nhanh) mới quyết định chất lượng dinh dưỡng.
- **Giải pháp thuật toán:** Áp dụng logic đánh giá **Mật độ dinh dưỡng (Nutrient Density)**. Thuật toán sẽ quét qua các vi chất (Fiber, Sugar, Sodium) đã được lưu trữ trong Database. Dựa vào bộ luật tiêu chuẩn y tế, hệ thống sẽ chấm điểm xếp hạng (A, B, C, D) cho tổng thể các bữa ăn trong ngày. Ví dụ: Bữa ăn đủ Macro nhưng quá lượng đường và natri cho phép sẽ bị hạ điểm, giúp định hướng thói quen ăn uống lành mạnh hơn.

**2. Tư duy Kiến trúc Tách biệt (Decoupling) giữa Dinh dưỡng và Tập luyện:**
- **Hạn chế của hệ thống hiện tại:** Hiện tại, thuật toán của dự án đang tính toán theo hướng cộng dồn lượng calo đốt cháy từ tập luyện vào quỹ calo được phép nạp trong ngày (tương tự MyFitnessPal). Cách tiếp cận này bộc lộ điểm yếu thực tế: Dẫn đến hiện tượng tính trùng (Double-counting) do mức độ vận động đã được bao hàm trong hệ số tính TDEE ban đầu. Cùng với sai số ước tính lượng calo đốt từ bài tập có thể lên tới 40-90%, việc cho phép "ăn bù" sẽ phá hỏng hoàn toàn quá trình thâm hụt năng lượng.
- **Hướng cải tiến (Triết lý Hardcore Tracking):** Trong tương lai, hệ thống sẽ được tái cấu trúc để tách biệt hoàn toàn hai module. Module tập luyện sẽ hoạt động độc lập chỉ với mục đích lưu lịch sử, đánh giá tiến độ sức mạnh và tạo động lực tâm lý. Quỹ calo ăn uống sẽ được "chốt" cố định theo TDEE mục tiêu ban đầu. Việc "cắt đứt" liên kết này giúp triệt tiêu hoàn toàn sai số và đưa hệ thống tiệm cận với tiêu chuẩn y khoa thể thao hiện đại.

---
**Nhận xét chung của sinh viên:**
Dự án đã hoàn thành xuất sắc các nghiệp vụ lõi phức tạp nhất ở Backend bao gồm thuật toán TDEE Thích ứng (Adaptive TDEE), bộ giải phương trình Khử Gauss (Gauss 3x3 Solver) lập thực đơn tự động và module xuất báo cáo PDF hoàn mỹ không tì vết. Hệ thống đã được tái cấu trúc thành công thành kiến trúc Monorepo `/backend` - `/frontend` chuyên nghiệp. Sẵn sàng bước vào giai đoạn thiết kế giao diện React SPA đỉnh cao và trang Landing Page lôi cuốn để sẵn sàng cho buổi bảo vệ đồ án tốt nghiệp xuất sắc.
