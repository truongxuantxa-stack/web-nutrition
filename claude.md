# CLAUDE.md - Nutrition Management System (NMS)

## 1. Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa. **Lưu ý quan trọng:** Đây là Đồ án tốt nghiệp ngành Khoa học Máy tính (Computer Science Graduation Project). Trọng tâm đánh giá là Kiến trúc hệ thống (System Architecture), thuật toán cốt lõi và Trải nghiệm người dùng (UX), ưu tiên chất lượng và tư duy thiết kế hệ thống hơn là khối lượng dữ liệu.
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
  - [x] **Quét nhãn dinh dưỡng bằng AI (Hybrid Nutrition Scanner):** Barcode Scanner (html5-qrcode + 4-Layer Lookup Pipeline) + AI Vision OCR (Gemini 2.0 Flash) + Crowdsourcing DB Flywheel + Physics Validation. Tab thứ 3 trong AddFoodModal.
  - [ ] **Biểu đồ Ruy-băng "Giải nhiễu" cân nặng (Weight Trend Chart) - Cảm hứng từ MacroFactor:** Trực quan hóa xu hướng cân nặng bằng thuật toán Trung bình động (Rolling Average) hiển thị dạng ruy-băng phát sáng (Canvas Gradient), loại bỏ tâm lý hoang mang do dao động nước hàng ngày.
  - [ ] **Bác sĩ Dinh dưỡng Ảo (Daily Smart Insights):** Tổng hợp cảnh báo thiếu/thừa dinh dưỡng (Macros, Micros, Water) dựa trên chuẩn y khoa (Context-aware sau 20:00).
  - [ ] **Trích xuất Công thức từ URL (Recipe Importer):** Tự động cào dữ liệu (Crawl) từ các blog nấu ăn (sử dụng JSON-LD Schema), bóc tách nguyên liệu và khớp với Database để tính ra tổng Calo siêu tốc.
  - [ ] **Quản lý Hình thể & Ảnh Before/After (Progress Photos):** Ghi nhận số đo cơ thể, upload ảnh tĩnh, tạo công cụ so sánh ghép ảnh trước/sau (Compare Slider) và xuất file (Canvas) để chia sẻ thành tích.

## 6. Changelog (Nhật ký thay đổi)
- **[feat/scanner] Hybrid Nutrition Scanner:** Xây dựng tính năng quét dinh dưỡng kép — Tab thứ 3 trong AddFoodModal. Barcode Scanner (html5-qrcode + 4-Layer Lookup Pipeline: LocalDB verified → LocalDB unverified → OpenFoodFacts API → AI Vision fallback). AI Vision OCR (Gemini 2.0 Flash, Zero-Storage policy). Crowdsourcing DB Flywheel (ScannedProduct + ProductContribution models, auto confidence scoring). Physics Validation (Atwater check, warn/error 2 mức). Rate limit 5 req/phút cho AI Vision. Ảnh nén Canvas API (max 1280px JPEG 0.8) trước khi gửi.
- **[feat/ui] Landing Page v2 Redesign:** Thiết kế lại toàn bộ giao diện Landing Page theo phong cách Deep Teal & Glassmorphism chuẩn That Clean Life. Thêm CSS Mockups, Algorithm Showcase, Integration Diagram và tối ưu hóa animations.
- **[feat/algorithm] Nutrient Density Scoring & PDF Report:** Xây dựng thuật toán chấm điểm món ăn theo mật độ dinh dưỡng (0-100đ, base 50đ) và miễn trừ ngoại lệ y khoa cho thực phẩm thô/trái cây. Tích hợp bảng điểm vi chất vào Báo cáo PDF, khắc phục lỗi font emoji, siết chặt logic đánh giá tổng quan y khoa.
- **[feat/plan] Cập nhật Roadmap Phase 6:** Thêm kế hoạch phát triển Trích xuất công thức từ URL (Recipe Importer) và Quản lý Hình thể Before/After (Progress Photos).
- **[fix/ui] Tối ưu hóa UI/UX & Hình ảnh:** Thêm SafeImage fallback, ImageLightbox phóng to ảnh, thu gọn lịch sử cân nặng (Collapse), sửa hiển thị gram và ảnh Whey Protein.
- **[feat/db] Cập nhật Database:** Tạo script `fill-raw-micronutrients.js` tự động tính 7 vi chất; script tải 226 ảnh món ăn từ Wikipedia API.
- **[feat/ui] Chuyển đổi React SPA & Bento Grid:** Hoàn tất chuyển đổi Frontend sang React 19 (Vite), tái thiết kế Dashboard chuẩn Bento Grid & Glassmorphism, áp dụng Framer Motion và Chart.js nâng cao.
- **[chore] Kiến trúc Backend API v1:** Tách nhánh API JSON `/api/v1` chuẩn RESTful, xử lý JWT Auth, dọn dẹp sạch sẽ toàn bộ tài nguyên EJS tĩnh cũ.
- **[feat] Core Algorithms (Thuật toán lõi):** Tích hợp thuật toán Khử Gauss (sinh thực đơn), Adaptive TDEE (chống thích ứng chuyển hóa), xuất báo cáo PDF y khoa chuyên sâu.
- **[feat/ux] Trải nghiệm Meal Planner:** Thêm cơ chế Ghim nguyên liệu (PinSlotRow), Đổi món thông minh (Smart Swap), tùy chỉnh Macros cá nhân hóa.

