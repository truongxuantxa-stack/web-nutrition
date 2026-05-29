# CLAUDE.md - Nutrition Management System (NMS)

## 1. Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa dành cho sinh viên tốt nghiệp (Graduation Project).
- **Mục tiêu:** Tính toán chỉ số cơ thể, theo dõi nhật ký ăn uống/tập luyện, tự động hóa gợi ý thực đơn (Toán học Gauss) và điều chỉnh TDEE thích ứng (Adaptive TDEE).
- **Vibe:** Giao diện hiện đại, tối giản (Green/Health vibe), phản hồi nhanh, UX cao cấp.

## 2. Tech Stack & Architecture
- **Backend:** Node.js, Express.js.
- **Database:** MySQL với Sequelize ORM.
- **Frontend:** React 19 SPA (Vite + Tailwind v4 + DaisyUI v5).
- **Libraries:** react-chartjs-2/Chart.js (Biểu đồ), TanStack Query (server state), react-hot-toast (notifications), dayjs (date), PDFKit (Xuất báo cáo), node-cron (Chạy ngầm).
- **Architecture (MVC):** `/controllers/api`, `/models`, `/routes/api`, `/services`, `/middlewares`, `/public`.

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
- [x] **Bước 2 (Ngày 3):** Khởi tạo dự án Frontend React (Vite) độc lập + Setup Tailwind CSS/DaisyUI + Thiết kế giao diện Dashboard/Diary/Meal Planner siêu đẹp với đầy đủ hiệu ứng animation.
- [x] **Bước 3 (Ngày 4-5):** Cấu hình CORS ở Express Backend + Tạo các JSON API Route (`/api/v1/...`) song song + Xử lý Auth (JWT/Cookie).
- [x] **Bước 4 (Tuần 2):** Chuyển đổi toàn bộ các trang cốt lõi (Dashboard vẽ biểu đồ, Nhật ký ăn uống, Meal Planner) sang React SPA.
- [ ] Phase 6: Tính năng WOW-Factor & Trải nghiệm người dùng chuyên sâu (Kế hoạch sắp tới)
  - [ ] **Quét mã vạch sản phẩm (Barcode Scanner) - Cảm hứng từ MyFitnessPal:** Tích hợp thư viện `html5-qrcode` và API Open Food Facts để nhận diện thông tin dinh dưỡng siêu tốc, giải quyết pain-point nhập liệu thủ công.
  - [ ] **Biểu đồ Ruy-băng "Giải nhiễu" cân nặng (Weight Trend Chart) - Cảm hứng từ MacroFactor:** Trực quan hóa xu hướng cân nặng bằng thuật toán Trung bình động (Rolling Average) hiển thị dạng ruy-băng phát sáng (Canvas Gradient), loại bỏ tâm lý hoang mang do dao động nước hàng ngày.
  - [ ] **Bác sĩ Dinh dưỡng Ảo (Daily Smart Insights):** Tổng hợp cảnh báo thiếu/thừa dinh dưỡng (Macros, Micros, Water) dựa trên chuẩn y khoa (Context-aware sau 20:00).

## 6. Changelog (Nhật ký thay đổi)
- **[feat/plan] Cập nhật Roadmap Phase 6:** Thêm kế hoạch phát triển Quét mã vạch (Barcode Scanner) và Biểu đồ Ruy-băng giải nhiễu (Weight Ribbon Chart).
- **[fix/ui] Tối ưu hóa UI/UX & Hình ảnh:** Thêm SafeImage fallback, ImageLightbox phóng to ảnh, thu gọn lịch sử cân nặng (Collapse), sửa hiển thị gram và ảnh Whey Protein.
- **[feat/db] Cập nhật Database:** Tạo script `fill-raw-micronutrients.js` tự động tính 7 vi chất; script tải 226 ảnh món ăn từ Wikipedia API.
- **[feat/ui] Chuyển đổi React SPA & Bento Grid:** Hoàn tất chuyển đổi Frontend sang React 19 (Vite), tái thiết kế Dashboard chuẩn Bento Grid & Glassmorphism, áp dụng Framer Motion và Chart.js nâng cao.
- **[chore] Kiến trúc Backend API v1:** Tách nhánh API JSON `/api/v1` chuẩn RESTful, xử lý JWT Auth, dọn dẹp sạch sẽ toàn bộ tài nguyên EJS tĩnh cũ.
- **[feat] Core Algorithms (Thuật toán lõi):** Tích hợp thuật toán Khử Gauss (sinh thực đơn), Adaptive TDEE (chống thích ứng chuyển hóa), xuất báo cáo PDF y khoa chuyên sâu.
- **[feat/ux] Trải nghiệm Meal Planner:** Thêm cơ chế Ghim nguyên liệu (PinSlotRow), Đổi món thông minh (Smart Swap), tùy chỉnh Macros cá nhân hóa.

