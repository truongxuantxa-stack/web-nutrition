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
- [x] Phase 1-5: Đã hoàn thành (Core Logic, Backend, React SPA, Thuật toán Gauss, TDEE, PDF Report).
- [ ] Phase 6: Tính năng WOW-Factor & UI/UX Redesign (Kế hoạch sắp tới)
  - [x] **Quét nhãn dinh dưỡng bằng AI (Hybrid Nutrition Scanner):** Barcode + AI Vision OCR (Gemini) + Crowdsourcing DB + Physics Validation.
  - [x] **UI Redesign - That Clean Life (Đang thực hiện):** Phase 0 (Design Tokens) ✅ · Phase 1 (Landing Page) ✅ · Phase 2 (Auth Pages) ✅ → Phase 3 tiếp theo.
  - [ ] **Biểu đồ Ruy-băng "Giải nhiễu" cân nặng (Weight Trend Chart) - Cảm hứng từ MacroFactor:** Trực quan hóa xu hướng cân nặng bằng thuật toán Trung bình động (Rolling Average) hiển thị dạng ruy-băng phát sáng (Canvas Gradient), loại bỏ tâm lý hoang mang do dao động nước hàng ngày.
  - [ ] **Bác sĩ Dinh dưỡng Ảo (Daily Smart Insights):** Tổng hợp cảnh báo thiếu/thừa dinh dưỡng (Macros, Micros, Water) dựa trên chuẩn y khoa (Context-aware sau 20:00).

## 6. Changelog (Nhật ký thay đổi)
- **[feat/ui] UI Redesign Phase 0+1 — TCL Design System + Landing Page:** Pha 0: Thêm TCL design tokens vào `@theme` (colors, radius, shadows) và toàn bộ custom CSS classes có prefix `tcl-` (buttons, cards, inputs, badges, nav-links, modal, table, toggle) song song DaisyUI — app vẫn chạy được. Pha 1: Xóa `data-theme="emerald"` khỏi LandingPage, thay toàn bộ DaisyUI classes (`btn`, `btn-outline`, `btn-lg`, `bg-base-100`) bằng `tcl-btn-*` và Tailwind thuần trong: Navbar, HeroSection, Testimonials, PricingSection, CTASection.
- **[feat/scanner] Hybrid Nutrition Scanner:** Xây dựng tính năng quét dinh dưỡng kép — Tab thứ 3 trong AddFoodModal. Barcode Scanner (html5-qrcode + 4-Layer Lookup Pipeline). AI Vision OCR (Gemini 2.0 Flash). Crowdsourcing DB Flywheel. Physics Validation (Atwater check).
- **[feat/algorithm] Nutrient Density Scoring & PDF Report:** Xây dựng thuật toán chấm điểm món ăn theo mật độ dinh dưỡng (0-100đ, base 50đ) và miễn trừ ngoại lệ y khoa cho thực phẩm thô/trái cây. Tích hợp bảng điểm vi chất vào Báo cáo PDF.
- **[fix/ui] Tối ưu hóa UI/UX & Hình ảnh:** Thêm SafeImage fallback, ImageLightbox phóng to ảnh, thu gọn lịch sử cân nặng (Collapse), sửa hiển thị gram và ảnh Whey Protein.
- **[feat/db] Cập nhật Database:** Tạo script `fill-raw-micronutrients.js` tự động tính 7 vi chất; script tải 226 ảnh món ăn từ Wikipedia API.
