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
- [ ] Phase 6: Các tính năng nâng cao & Trải nghiệm người dùng (Kế hoạch tiếp theo)
  - [ ] **Habit Trackers - Theo dõi thói quen phụ (Lấy cảm hứng từ LIFESUM):** Cho phép người dùng tạo và theo dõi các thói quen phụ lành mạnh (uống đủ nước, ngủ đủ giấc, ăn rau xanh, hạn chế đồ ngọt, v.v.) đi kèm với giao diện visual sinh động giúp tăng sự gắn kết với ứng dụng.
  - [ ] **Giao diện "Ribbon Chart" cho Cân nặng (Lấy cảm hứng từ MACROFACTOR):** Trực quan hóa cân nặng thực tế và xu hướng cân nặng trung bình (Weight Trend) dưới dạng biểu đồ dải (Ribbon Chart) mượt mà, giúp người dùng lọc nhiễu dao động cân nặng do nước/glycogen hàng ngày và hiểu rõ tiến trình tăng/giảm cân thực tế.

## 6. Changelog (Nhật ký thay đổi)
- **[fix/db] Cập nhật hình ảnh Sữa Tăng Cơ (Whey Protein):** Thay thế hình ảnh bị quét nhầm thành sữa tăng chiều cao trẻ em bằng hình ảnh hũ bột Whey Protein thể thao chuyên nghiệp (từ Wikimedia Commons) và cập nhật đồng bộ trong file seeder `foods.js`.
- **[fix/ui] Định dạng hiển thị số gram thực phẩm thô:** Sửa lỗi hiển thị ghép chữ đơn vị thô (ví dụ: hiển thị "215g" thay vì "215 100g") trên giao diện Nhật ký ăn uống (`DiaryEntryRow.jsx`), Bữa ăn gần đây trên Dashboard (`RecentMeals.jsx`), và Modal thêm món (`AddFoodModal.jsx`).
- **[feat] Kiểm tra và cập nhật toàn bộ vi chất cho thực phẩm thô:** Tạo script `fill-raw-micronutrients.js` để tự động điền các vi chất (`vitaminA`, `vitaminC`, `calcium`, `iron`, `fiber`, `sugar`, `sodium`) cho 123 thực phẩm thô (`raw`) trong cơ sở dữ liệu dựa trên Bảng thành phần thực phẩm Việt Nam và thuật toán ước lượng theo category. Chạy script backfill snapshot để đồng bộ lại dữ liệu nhật ký ăn uống lịch sử có chứa thực phẩm thô.
- **[feat/fix] Cải thiện cơ chế fallback hình ảnh bằng SafeImage:** Tạo component `SafeImage.jsx` tự động hiển thị icon/emoji mặc định có màu nền và thiết kế đồng bộ khi hình ảnh của thực phẩm bị lỗi tải (do URL hỏng hoặc chặn hotlink từ phía máy chủ). Tích hợp vào hàng ghim nguyên liệu (`PinSlotRow.jsx`), Bảng thực đơn kết quả (`MealResult.jsx`), Modal đổi món (`IngredientSwapModal.jsx`), và hàng nhật ký món ăn (`DiaryEntryRow.jsx`).
- **[fix] Sửa lỗi không phóng to được ảnh món ăn ở kết quả tìm kiếm:** Đồng bộ các thuộc tính (props) truyền vào `ImageLightbox` trong `FoodSearchResult.jsx` (`imageUrl`, `altText` thành `src`, `alt`) để khớp với định nghĩa của component `ImageLightbox`.
- **[feat] Phóng to hình ảnh món ăn (Lightbox) trên giao diện:** Tạo component `ImageLightbox.jsx` dùng chung với thiết kế Glassmorphism và tích hợp vào Nhật ký ăn uống (`DiaryEntryRow.jsx`), Bảng thực đơn gợi ý (`MealResult.jsx`), Modal đổi món (`IngredientSwapModal.jsx`), và hàng ghim nguyên liệu (`PinSlotRow.jsx`). Sử dụng **React Portals (`createPortal`)** để chèn trực tiếp vào `document.body` giúp tránh các lỗi z-index/stacking context do thẻ cha áp dụng transform/modal đè lên. Hỗ trợ đóng lightbox linh hoạt bằng cách nhấn phím `ESC`, click trực tiếp lên ảnh lớn, click vào vùng nền tối, hoặc nhấn nút đóng (X). Hỗ trợ `e.stopPropagation()` để ngăn chặn kích hoạt các sự kiện chọn món ngoài ý muốn.
- **[feat] Tự động hóa cập nhật ảnh món ăn không cần API Key:** Tạo script `update-food-images.js` tự động quét 226 món ăn chưa có ảnh trong database, tìm kiếm ảnh chính xác từ Wikipedia API tiếng Việt (miễn phí, không giới hạn) kết hợp thuật toán gán ảnh Fallback chất lượng cao từ Unsplash theo phân loại món ăn (cơm, bún/phở, salad, nước uống...).
- **[feat/cleanup] Dọn dẹp các files và tài nguyên cũ dư thừa:** Xóa bỏ toàn bộ các tệp routes cũ dùng để render HTML (EJS), xóa thư mục giao diện EJS `/views`, các scripts JS tĩnh không còn dùng ở `/public/js`, gỡ bỏ gói thư viện `ejs` khỏi backend `package.json`, và dọn dẹp các React components không còn sử dụng ở frontend (`StatCard`, `MealCalorieBreakdown`).
- **[feat/dashboard-redesign] Tái thiết kế Dashboard v2 (Bento Grid):** Tích hợp Greeting Bar động theo giờ, Avatar gradient, 4 Macro Cards nổi bật (Protein/Carbs/Fat/Calo đốt), FAB Quick Action thêm món ăn nhanh, và Empty States CTA thân thiện khi dữ liệu rỗng.
- **[feat/ui-dashboard-bento] Bento Grid & Glassmorphism Dashboard Layout:** Tái thiết kế toàn bộ bố cục trang Dashboard thành Bento Grid với độ bo góc lớn (`rounded-3xl`), gom nhóm vòng tròn Calo (`CalorieRing`) và các thanh chỉ số Macros vào cùng một Card Hero nổi bật, sắp xếp các widget nước uống, biểu đồ macros, chỉ số TDEE thích ứng và biểu đồ cân nặng theo tỷ lệ bất đối xứng cân bằng, đảm bảo responsive mượt mượt và trực quan hơn.
- **[feat/ui-redesign] Premium UI Redesign (Bước 5 - UI/UX):** Làm mới toàn bộ giao diện ứng dụng React SPA bằng thiết kế Glassmorphism đồng bộ (Light/Dark mode compatible), tích hợp Framer Motion cho hiệu ứng entry animation mượt mà, sử dụng Chart.js Scriptable Options để vẽ canvas gradient cho WeightChart và TDEE History Chart, nâng cấp CalorieRing với SVG linear gradient và keyframe animation vẽ cung tròn, thêm custom pill progress bars và các hiệu ứng micro-animations (hover scale/active states) trên tất cả các trang chính (Dashboard, Diary, Weight, Exercise, Meal Planner).
- **[feat] React SPA Core Pages (Bước 4):** Chuyển đổi Dashboard, Nhật ký ăn uống, Meal Planner sang React 19 SPA. Phase 0: Vite proxy, Axios interceptors (auto-refresh JWT), TanStack Query (staleTime 30s, cascade invalidation), dayjs locale vi, AuthContext, ProtectedRoute (Strangler Fig pattern), AppLayout (DaisyUI drawer sidebar). Phase 1: 6 API controllers mới (`/api/v1/dashboard`, `/diary`, `/weight`, `/water`, `/exercise`, `/meal-planner`) wrap service layer, không sửa EJS controllers cũ. Phase 2: DashboardPage với CalorieRing SVG animated, MacrosChart Doughnut, WeightChart Line, WaterProgress quick-add. Phase 3: DiaryPage với 4 MealGroup accordion, AddFoodModal (tìm kiếm debounce + tạo custom food), WaterTracker inline. Phase 4: MealPlannerPage với Gauss Solver integration, swap ingredients, push to diary.
- **[feat] API v1 (Bước 3):** Triển khai nhánh API JSON song song với EJS: namespace `/api/v1`, CORS chỉ bật ở production (dev dùng Vite Proxy), Auth Flow với Access Token 15 phút (JSON body) + Refresh Token 7 ngày (HttpOnly Cookie), `requireAuthApi` middleware (Bearer token, JSON 401), rate limiter 20req/15min, `express-validator` cho input validation, chuẩn hóa response qua `apiResponse.js` middleware, tài liệu `API_DOCS.md`.
- **[feat/docs/refactor] PDF Report System:** Nâng cấp và tối ưu hóa hệ thống xuất PDF: thiết kế Trang bìa (Cover Page) sang trọng, Kế hoạch hành động (Actionable Insights) dựa trên Adaptive TDEE, khắc phục lỗi phân trang/tràn chữ/thiếu biến `avgFiber`, nâng cấp UI Profile Card và checklist đánh giá theo chuẩn IOM.
- **[feat] Adaptive TDEE System:** Triển khai thuật toán chống thích ứng chuyển hóa (EMA, Rolling Average 4 tuần), lập lịch tự động hàng tuần qua Cron Job, đồng bộ badges cảnh báo.
- **[feat/ux] Meal Planner Solver (Gauss):** Triển khai thuật toán giải tích số Khử Gauss 3x3 sinh thực đơn tự động, cơ chế ghim nguyên liệu (pinning), smart swap (đổi món) và tích hợp đẩy trực tiếp vào nhật ký.
- **[feat] Custom Planner & Food Library:** Hỗ trợ tùy chỉnh tỷ lệ dinh dưỡng cá nhân (Custom Macros) và tạo món ăn cá nhân (Private), mở rộng thư viện nguyên liệu thô.
- **[fix/refactor] UI & System Optimization:** Chuyển Date Navigator sang UI mũi tên tĩnh, đồng bộ UI Water Tracking bằng AJAX không tải lại trang, loại bỏ thuật toán gợi ý cũ.
- **[fix] Meal Planner Fixes:** Loại bỏ Heuristic Fallback khi Gauss Solver ra nghiệm âm, trả về trực tiếp nghiệm âm kèm cảnh báo lỗi trên UI để người dùng tự do bấm Swap đổi món; Cập nhật hook `useFoodsByRole` và `IngredientSwapModal` để đồng bộ truyền tham số `tags` lọc nguyên liệu phù hợp khi Đổi món (Swap) trên giao diện React SPA.
- **[feat] Preset Ingredient Pinning:** Tích hợp component `PinSlotRow` và tính năng Ghim Sẵn Nguyên Liệu trước khi sinh thực đơn (Bước 2.5) trên trang Meal Planner React SPA, hỗ trợ tự động tải danh sách lọc theo tag phù hợp và nút xóa tất cả ghim tiện lợi.
- **[feat/ux] Weight Logs Collapse:** Thêm cơ chế giới hạn hiển thị danh sách lịch sử cân nặng tối đa 5 dòng bằng cách sử dụng `useState` nội bộ, kèm nút "Xem thêm / Thu gọn" nhằm tối giản hóa giao diện trang Theo dõi Cân nặng khi dữ liệu dài lên.
- **[chore/refactor] Đồng bộ cấu trúc API Folder:** Di chuyển toàn bộ các controller còn lại vào thư mục `backend/controllers/api`, gom nhóm và làm sạch các route cũ sang `backend/routes/api` đảm bảo kiến trúc API-only chuẩn hóa, gỡ bỏ tệp route gốc `backend/routes/index.js` và xóa component `MealCalorieBreakdown.jsx` không còn sử dụng ở frontend.


