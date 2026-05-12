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
- **Backend:** Node.js cùng framework Express.js.
- **Cơ sở dữ liệu:** MySQL quản lý thông qua Sequelize ORM.
- **Frontend (Giao diện):** EJS Template Engine, Tailwind CSS kết hợp với DaisyUI components.
- **Thư viện hỗ trợ:** 
  - `Chart.js`: Kết xuất các biểu đồ trực quan (Biểu đồ tròn Macros, biểu đồ đường theo dõi Cân nặng).
  - `JSON Web Token (JWT)` & `Bcryptjs`: Bảo mật xác thực và mã hóa mật khẩu.
  - `PDFKit`: Phục vụ chức năng kết xuất báo cáo thống kê.

## 3. CẤU TRÚC HỆ THỐNG VÀ CƠ SỞ DỮ LIỆU
Hệ thống được thiết kế theo kiến trúc chuẩn MVC (Model-View-Controller) tách biệt rõ ràng giữa luồng định tuyến (Routes), xử lý nghiệp vụ (Services/Controllers) và giao diện hiển thị (Views).

Cơ sở dữ liệu hiện tại đã được đồng bộ hóa thành công với **6 thực thể (Models)** cốt lõi:
1. `User`: Quản lý thông tin cá nhân, chỉ số cơ thể, mục tiêu.
2. `Food`: Thư viện thực phẩm phân loại theo nguyên liệu thô (raw) và món ăn (dish).
3. `DiaryEntry`: Lưu trữ nhật ký ăn uống chi tiết.
4. `WeightLog`: Ghi nhận lịch sử biến động cân nặng.
5. `WaterLog`: Theo dõi lượng nước nạp vào cơ thể theo giờ.
6. `ExerciseLog`: Quản lý nhật ký luyện tập thể chất.

## 4. CHI TIẾT TIẾN ĐỘ THỰC HIỆN (Đạt ~90%)
Dự án được chia thành 6 giai đoạn phát triển (Phases). Hiện tại dự án đã hoàn tất phần lớn khối lượng công việc, cụ thể:

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
- ✅ **Giai đoạn 5: Phát triển Giao diện UI/UX (Hoàn thành 95%)**
  - Hoàn thiện giao diện Dashboard, Nhật ký.
  - Tích hợp điều hướng ngày tháng (Date Navigation) linh hoạt, chặn xem dữ liệu tương lai.
  - Ứng dụng AJAX (bất đồng bộ) vào các tác vụ thêm món ăn, uống nước, giúp trải nghiệm mượt mà không cần tải lại trang.
- ⏳ **Giai đoạn 6: Xuất Báo cáo & Hoàn thiện cuối cùng (Đang triển khai - 0%)**
  - Module kết xuất file PDF thống kê tuần/tháng.

## 5. NHỮNG THUẬT TOÁN ĐƯỢC ÁP DỤNG TRONG HỆ THỐNG
1. **Thuật toán Ước tính Năng lượng & Phân bổ Dinh dưỡng (Target Metrics Algorithm):** Thuật toán quyết định rẽ nhánh dựa trên thông số sinh học (giới tính, cân nặng, chiều cao, tuổi), ánh xạ mức độ hoạt động và phân rã mục tiêu calo thành tỷ lệ 3 đại dưỡng chất (Protein/Carb/Fat).
2. **Thuật toán Scale Macros Động theo Luyện tập (Effective Macros Algorithm):** Thuật toán tỷ lệ thuận (Proportional Scaling) giúp tính toán lại lượng calo và tái cấu trúc tỷ lệ các dưỡng chất nạp thêm dựa trên lượng calo đốt cháy từ việc luyện tập, giúp bảo toàn mật độ dinh dưỡng (Nutrient Density).
3. **Thuật toán Phân tích Sức khỏe & Cảnh báo Thông minh (Health Insights Algorithm):** Một hệ chuyên gia dựa trên luật (Rule-based Expert System) phân tích tiến độ calo nạp vào, tính toán sự mất cân bằng macro (Macro Balance) tại thời điểm thực, và quét qua thành phần món ăn thô để đưa ra cảnh báo thiếu hụt.
4. **Thuật toán Tổng hợp & Snapshot Dinh dưỡng (Nutrition Aggregation Algorithm):** Thuật toán tính toán tổng hợp (Reduce) kết hợp cơ chế ưu tiên dữ liệu (Data Prioritization). Thuật toán kiểm tra và sử dụng trạng thái dữ liệu tại thời điểm ăn (snapshot) để tính toán tổng, nhằm bảo toàn tính toàn vẹn của lịch sử nhật ký.
5. **Thuật toán Tìm kiếm & Xếp hạng Ưu tiên (Prioritized Search Algorithm):** Tự động xây dựng câu lệnh lọc (Dynamic Query Building) dựa trên danh mục/từ khóa, đồng thời thực thi thuật toán xếp hạng: ưu tiên đẩy các món ăn tùy chỉnh (Custom Foods) của người dùng lên trước các món mặc định của hệ thống.

## 6. KẾ HOẠCH CÔNG VIỆC SẮP TỚI (Sprint cuối)
Để nghiệm thu và nộp sản phẩm hoàn chỉnh, các công việc trong thời gian  tới bao gồm:
1. Xây dựng module `utils/pdf.util.js` sử dụng thư viện PDFKit hỗ trợ font Unicode Tiếng Việt.
2. Hoàn thiện tính năng tải Báo Cáo Thống Kê dạng PDF cho người dùng.
3. Rà soát lỗi (End-to-end QA Testing) trên các tình huống ngoại lệ (edge cases).
4. Viết và chỉnh sửa Quyển Báo Cáo Đồ Án bản cứng.
5. Nghiên cứu và phát triển tính năng **Tùy chỉnh tỷ lệ Macros (Custom Macros Planner)**: Cho phép người dùng linh hoạt điều chỉnh tỷ lệ phần trăm (Protein/Carbs/Fat) thay vì cố định, nâng tầm trải nghiệm cá nhân hóa.
6. Cài đặt tính năng **Gom nhóm món ăn (Meal Builder / Combo)**: Giải quyết vấn đề nhập liệu lặp lại bằng cách cho phép người dùng gom nhiều nguyên liệu/món lẻ thành một công thức (Recipe) tự nấu dùng chung nhiều lần.

---
**Nhận xét chung của sinh viên:** 
Dự án đang theo đúng tiến độ đề ra, kiến trúc được thiết kế vững chắc, cho phép dễ dàng mở rộng thêm tính năng. Hệ thống hoạt động trơn tru trên môi trường thực tế ảo hóa (Localhost). Sẵn sàng hoàn thiện khâu xuất PDF cuối cùng để tiến hành nghiệm thu.
