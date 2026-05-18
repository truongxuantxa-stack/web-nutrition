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

## 5. Roadmap Status (Kế hoạch dự án)
- [x] Phase 1-3: Khởi tạo, Database, Auth & Onboarding.
- [x] Phase 4: Core Logic (Nhật ký ăn, uống, tập, cân nặng).
- [x] Phase 5: Giao diện UI/UX & Thuật toán lõi (Meal Planner, Adaptive TDEE).
- [ ] **Phase 6: Xuất Báo cáo PDF 
phase 7:Landing page

## 6. Changelog (Nhật ký thay đổi)
- **[feat] Adaptive TDEE System:** Triển khai thuật toán chống thích ứng chuyển hóa (EMA filtering, ±30% Clamping, 4-week Rolling Average). Tích hợp Cron Job chạy mỗi tuần, cho phép user theo dõi lịch sử và chủ động Skip tuần. Đồng bộ huy hiệu cảnh báo (Badges) xuyên suốt Dashboard và Diary.
- **[feat] Meal Planner Solver:** Cài đặt thuật toán giải tích số Khử Gauss 3x3 sinh thực đơn. Tích hợp UI/UX mượt mà: cấu hình % macro, tự động chia bữa, smart swap đổi món, và đồng bộ đẩy thẳng vào nhật ký ăn uống.
- **[feat] Custom Macros Planner:** Hỗ trợ người dùng tuỳ chỉnh tỷ lệ P/C/F theo mục tiêu (Keto, Low-fat...).
- **[feat] Custom Food & Food Library:** Tính năng tạo món ăn cá nhân (Private). Bổ sung thêm nhiều nguyên liệu thô (Trứng thô, Thịt thô...). Mở rộng giới hạn tìm kiếm (limit 100).
- **[fix/refactor] UI & System Optimization:** Chuyển đổi Date Navigator sang UI mũi tên tĩnh. Gỡ bỏ thuật toán gợi ý cũ để nhường chỗ cho Gauss Solver. Đồng nhất UI Nước uống (Water Tracking) qua cơ chế AJAX không tải lại trang.
