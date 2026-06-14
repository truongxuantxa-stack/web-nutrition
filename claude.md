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
  - [x] **UI Redesign - That Clean Life:** Phase 0 ✅ · Phase 1 (Landing) ✅ · Phase 2 (Auth) ✅ · Phase 3 (Layout/Sidebar) ✅ · Phase 4 (Dashboard) ✅ · Phase 5 (Diary/Exercise/MealPlanner/Weight/Profile/NotFound) ✅ → DaisyUI migration hoàn tất toàn bộ pages.
  - [x] **Biểu đồ Ruy-băng "Giải nhiễu" cân nặng (Weight Trend Chart):** Migrate WeightTrendChart/TrendSummaryCard → TCL. Xóa glass-card, bg-primary, bg-base-*, DaisyUI tooltip → HTML title, tab buttons → bg-[#003139] active.
  - [x] **Bác sĩ Dinh dưỡng Ảo (Daily Smart Insights):** Migrate DailyInsightsCard → TCL. Xóa SEVERITY_STYLE DaisyUI vars, stroke-base-content/10, border-base-content, bg-base-content/*, text-primary/success/error → màu TCL. Migrate toàn bộ sub-components: CalorieRing, MacrosChart, WeightChart, MealGroup, DaySummaryWidget, DateNavigator, DiaryEntryRow, WaterTracker, WeeklyCalendarStrip, AddWeightModal.

## 6. Changelog (Nhật ký thay đổi)
- **[feat/ui] UI Redesign Phase 0+1 — TCL Design System + Landing Page:** Pha 0: Thêm TCL design tokens vào `@theme` (colors, radius, shadows) và toàn bộ custom CSS classes có prefix `tcl-` (buttons, cards, inputs, badges, nav-links, modal, table, toggle) song song DaisyUI — app vẫn chạy được. Pha 1: Xóa `data-theme="emerald"` khỏi LandingPage, thay toàn bộ DaisyUI classes (`btn`, `btn-outline`, `btn-lg`, `bg-base-100`) bằng `tcl-btn-*` và Tailwind thuần trong: Navbar, HeroSection, Testimonials, PricingSection, CTASection.
- **[feat/scanner] Hybrid Nutrition Scanner:** Xây dựng tính năng quét dinh dưỡng kép — Tab thứ 3 trong AddFoodModal. Barcode Scanner (html5-qrcode + 4-Layer Lookup Pipeline). AI Vision OCR (Gemini 2.0 Flash). Crowdsourcing DB Flywheel. Physics Validation (Atwater check).
- **[feat/algorithm] Nutrient Density Scoring & PDF Report:** Xây dựng thuật toán chấm điểm món ăn theo mật độ dinh dưỡng (0-100đ, base 50đ) và miễn trừ ngoại lệ y khoa cho thực phẩm thô/trái cây. Tích hợp bảng điểm vi chất vào Báo cáo PDF.
- **[fix/ui] Tối ưu hóa UI/UX & Hình ảnh:** Thêm SafeImage fallback, ImageLightbox phóng to ảnh, thu gọn lịch sử cân nặng (Collapse), sửa hiển thị gram và ảnh Whey Protein.
- **[feat/db] Cập nhật Database:** Tạo script `fill-raw-micronutrients.js` tự động tính 7 vi chất; script tải 226 ảnh món ăn từ Wikipedia API.
- **[feat/pdf] Nâng cấp Báo cáo PDF (Task 1-4):** Task 1: QR Code góc phải dưới trang bìa (qrcode pkg, async generateReportPDF, await controller). Task 2: 4 KPI Summary Cards hàng ngang (⚡Calo/📊Tuân thủ/⚖️Cân/🏃Tập). Task 3: Bảng nhật ký 7 cột (Ngày|Cân|Cal|Protein|Carbs|Fat|Trạng thái, 495px fit A4). Task 4: Typography nâng cấp (section title 10→11pt/22→26px, body 9→10pt, macro bars 18→22px spacing, health insights/recs 8.5→9.5pt).
- **[feat/pdf] Charts PDF (Task 5):** Thêm 3 biểu đồ via QuickChart.io — Donut (Macro ratio), Bar (Calories theo ngày vs mục tiêu), Line (Xu hướng cân nặng). Fetch parallel với Promise.all + 8s timeout + PNG header validation. Graceful fallback nếu API lỗi/timeout.
- **[perf] Tối ưu Hiệu suất (5 Phases):** P1: `staleTime` 30s→5 phút trong QueryClient. P2: `refetchType:'active'` cho tất cả mutations (useDiary/useWeight/useExercise/useProfile/useMealPlanner/useAdaptiveTDEE) — chỉ refetch query đang mount, query ẩn đánh dấu stale. P3: Endpoint nhẹ `GET /diary/recent` (backend) + hook `useRecentEntries` + `RecentMeals` tự fetch với Suspense skeleton thay vì nhận props; `DashboardPage` loại bỏ `useDiaryData`/`useExerciseData` — chỉ còn 1 API `/dashboard` block render. P4: Optimistic update concurrent-safe cho `useAddWater` (useDiary) và `WaterProgress` (dashboard). P5: Backend `sequelize.sync({ alter: false })` trong dev — startup nhanh, không ALTER TABLE.
