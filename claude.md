# CLAUDE.md - Nutrition Management System (NMS)

## 1. Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa dành cho sinh viên tốt nghiệp (Graduation Project).
- **Mục tiêu:** Tính toán chỉ số cơ thể, theo dõi nhật ký ăn uống/tập luyện, tự động hóa gợi ý thực đơn (Toán học Gauss) và điều chỉnh TDEE thích ứng (Adaptive TDEE).
- **Vibe:** Giao diện hiện đại, tối giản (Green/Health vibe), phản hồi nhanh, UX cao cấp.

## 2. Tech Stack & Architecture
- **Backend:** Node.js, Express.js.
- **Database:** MySQL với Sequelize ORM.
- **Frontend:** EJS Template Engine, Tailwind CSS, DaisyUI.
- **Libraries:** Chart.js (Biểu đồ), PDFKit (Xuất báo cáo), node-cron (Chạy ngầm).
- **Architecture (MVC):** `/controllers`, `/models`, `/routes`, `/views`, `/services`, `/middlewares`, `/public`.

## 3. Core Algorithms & Formulas
- **BMR (Mifflin-St Jeor) & TDEE:** Công thức nền tảng tĩnh.
- **Gauss Meal Solver (Thuật toán Gợi ý thực đơn):** Sử dụng hệ phương trình tuyến tính 3x3 (Khử Gauss với Partial Pivoting) để tính chính xác khối lượng (gram) cho tổ hợp 4 nguyên liệu (Carb, Protein, Fat, Fiber).
- **Adaptive TDEE (Thuật toán Thích ứng):** Sử dụng bộ lọc nhiễu tín hiệu EMA (Exponential Moving Average) và Rolling Average 4 tuần để theo dõi sự thay đổi cân nặng, tự động tính toán lại mức TDEE thực tế nhằm chống lại sự thích ứng chuyển hóa.

## 4. Code Style & AI Guidelines
1. **Naming:** `camelCase` cho biến/hàm, `PascalCase` cho Models, Kebab-case cho Routes.
2. **Database:** Luôn có `createdAt` và `updatedAt`.
3. **Food Database:** Phân định rõ `foodType` là `'raw'` (nguyên liệu thô 100g) hay `'dish'` (món ăn chế biến 1 suất).
4. **UX Philosophy:** Trao quyền quyết định cho người dùng. Cung cấp dữ liệu thô và công cụ tính toán thay vì ép buộc khuôn mẫu.
5. **AI Rule:** Luôn sử dụng try-catch, trả JSON nhất quán. BẮT BUỘC cung cấp lệnh `git push` sau mỗi task hoàn thành.

## 5. Roadmap Status (Kế hoạch dự án - Siêu tốc độ với AI Agent)
- [x] Phase 1-3: Khởi tạo, Database, Auth & Onboarding.
- [x] Phase 4: Core Logic (Nhật ký ăn, uống, tập, cân nặng).
- [x] Phase 5: Giao diện UI/UX & Thuật toán lõi (Meal Planner, Adaptive TDEE).
  - [x] **Bước 1 (Ngày 1-2):** Hoàn thành tính năng Xuất báo cáo PDF chất lượng cao bằng `pdfkit` trên Backend Express hiện tại.
- [ ] **Bước 2 (Ngày 3):** Khởi tạo dự án Frontend React (Vite) độc lập + Setup Tailwind CSS/DaisyUI + Thiết kế Landing Page siêu đẹp với đầy đủ hiệu ứng animation.
- [ ] **Bước 3 (Ngày 4-5):** Cấu hình CORS ở Express Backend + Tạo các JSON API Route (`/api/v1/...`) song song + Xử lý Auth (JWT/Cookie).
- [ ] **Bước 4 (Tuần 2):** Chuyển đổi toàn bộ các trang cốt lõi (Dashboard vẽ biểu đồ, Nhật ký ăn uống, Meal Planner) sang React SPA.


## 6. Changelog (Nhật ký thay đổi)
- **[feat] PDF Report Export:** Triển khai tính năng xuất báo cáo dinh dưỡng PDF (7 ngày / 30 ngày) dùng PDFKit + font Roboto hỗ trợ tiếng Việt. Layout 3 trang: Thông tin cá nhân & chỉ số, Tổng hợp & đánh giá, Bảng chi tiết theo ngày. Stream trực tiếp về client, không tạo file tạm. UI: Dropdown button trên Dashboard.
- **[feat] Adaptive TDEE System:** Triển khai thuật toán chống thích ứng chuyển hóa (EMA filtering, ±30% Clamping, 4-week Rolling Average). Tích hợp Cron Job chạy mỗi tuần, cho phép user theo dõi lịch sử và chủ động Skip tuần. Đồng bộ huy hiệu cảnh báo (Badges) xuyên suốt Dashboard và Diary.
- **[feat] Meal Planner Solver:** Cài đặt thuật toán giải tích số Khử Gauss 3x3 sinh thực đơn. Tích hợp UI/UX mượt mà: cấu hình % macro, tự động chia bữa, smart swap đổi món, và đồng bộ đẩy thẳng vào nhật ký ăn uống.
- **[ux] Meal Planner - Ghim Sẵn Trước Khi Tạo:** Bổ sung section "Ghim Sẵn Nguyên Liệu" ngay tại panel Sinh Bữa Ăn. Người dùng chọn nguyên liệu yêu thích cho từng slot (Protein/Carb/Fat/Fiber) và ghim trước khi bấm Tạo Gợi Ý. Hỗ trợ badge hiển thị món đã ghim, nút Xoá hết pin, đồng bộ state `pinnedFoods` với kết quả sau khi generate.
- **[feat] Custom Macros Planner:** Hỗ trợ người dùng tuỳ chỉnh tỷ lệ P/C/F theo mục tiêu (Keto, Low-fat...).
- **[feat] Custom Food & Food Library:** Tính năng tạo món ăn cá nhân (Private). Bổ sung thêm nhiều nguyên liệu thô (Trứng thô, Thịt thô...). Mở rộng giới hạn tìm kiếm (limit 100).
- **[fix/refactor] UI & System Optimization:** Chuyển đổi Date Navigator sang UI mũi tên tĩnh. Gỡ bỏ thuật toán gợi ý cũ để nhường chỗ cho Gauss Solver. Đồng nhất UI Nước uống (Water Tracking) qua cơ chế AJAX không tải lại trang.
