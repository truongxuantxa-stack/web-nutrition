# CLAUDE.md - Nutrition Management System (NMS)

## Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa dành cho sinh viên tốt nghiệp (Graduation Project).
- **Mục tiêu:** Tính toán chỉ số cơ thể (BMI/BMR/TDEE), theo dõi nhật ký ăn uống hàng ngày và tra cứu giá trị dinh dưỡng từ thư viện thực phẩm phong phú.
- **Vibe:** Giao diện hiện đại, tối giản (Green/Health vibe), phản hồi nhanh.

## Tech Stack
- **Backend:** Node.js, Express.js.
- **Database:** MySQL với Sequelize ORM.
- **Frontend:** EJS Template Engine, Tailwind CSS, DaisyUI.
- **Libraries:** Chart.js (Biểu đồ), PDFKit (Xuất báo cáo), JWT (Auth).
## Project Structure
- `/controllers`: Xử lý logic nghiệp vụ.
- `/models`: Định nghĩa Schema Sequelize (MySQL).
- `/routes`: Định nghĩa các đường dẫn API và Page.
- `/views`: Các file giao diện EJS.
- `/public`: Static files (CSS, JS, Images).
- `/middlewares`: Xử lý Auth, Validation.
- `/services`: Các thuật toán tính toán dinh dưỡng (BMR, TDEE, Suggestion).

## Core Logic & Formulas
- **BMR (Mifflin-St Jeor):** 
  - Nam: $10 \times weight + 6.25 \times height - 5 \times age + 5$
  - Nữ: $10 \times weight + 6.25 \times height - 5 \times age - 161$
- **TDEE:** BMR $\times$ Activity Factor (1.2 đến 1.9).
- **Macros Ratio (Default):** Protein (30%), Carbs (40%), Fat (30%).

## Code Style Guidelines
- **Naming:** 
  - Biến và hàm: `camelCase`.
  - Models: `PascalCase` (Số ít).
  - Routes: Kebab-case (e.g., `/dinh-duong/nhat-ky`).
- **Response Format:** Luôn trả về định dạng JSON nhất quán cho các API xử lý dữ liệu.
- **Error Handling:** Sử dụng try-catch trong tất cả controllers, trả về thông báo lỗi thân thiện.
- **Tailwind:** Ưu tiên sử dụng utility classes của Tailwind và components của DaisyUI.

## Critical Instructions for AI
1. **Database:** Khi tạo Model, luôn bao gồm `createdAt` và `updatedAt`.
2. **UI/UX:** Giao diện phải Responsive. Sử dụng biểu đồ tròn cho Macros và biểu đồ đường cho cân nặng.
3. **Thư viện Thực phẩm (Food Database):** Ưu tiên mở rộng và chuẩn hóa dữ liệu thực phẩm. Phân định rõ `foodType` là `'raw'` (nguyên liệu thô, tính trên 100g) hay `'dish'` (món ăn chế biến, tính trên 1 suất). Dữ liệu phải sát với các món ăn hàng ngày của người Việt để phục vụ tra cứu chính xác.
4. **Security:** Kiểm tra JWT middleware cho tất cả các route cần đăng nhập.
5. **Triết lý UX (Quan trọng):** Không áp đặt kế hoạch ăn uống theo từng bữa hay gợi ý món tự động. Người dùng là người có kiến thức về dinh dưỡng — chỉ cần cung cấp dữ liệu chính xác (tổng calo, macro cả ngày) và để họ tự quyết định.
6. **Documentation (Cập nhật tài liệu):** AI BẮT BUỘC phải tự động cập nhật file `claude.md` (đặc biệt là phần Changelog) sau mỗi lần hoàn thành một tính năng, thay đổi cấu trúc DB hoặc hoàn tất một tiến trình lớn để đảm bảo mọi thay đổi luôn được track lại.



## Development Commands
- `npm install`: Cài đặt thư viện.
- `npm start`: Chạy server (node app.js).
- `npm run dev`: Chạy với nodemon.

Kế Hoạch Dự Án — Nutrition Management System

📦 Phase 1 — Khởi Tạo Dự Án

Mục tiêu: Server Express chạy được, kết nối MySQL thành công.

 npm init + cài packages: express sequelize mysql2 ejs bcryptjs jsonwebtoken cookie-parser dotenv pdfkit nodemon

 Tạo cấu trúc thư mục: /controllers /models /routes /views /services /middlewares /public /config

 app.js — cấu hình Express + EJS + static files

 .env — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT

 config/database.js — khởi tạo Sequelize kết nối MySQL

 views/partials/ — header.ejs, navbar.ejs, footer.ejs (Tailwind + DaisyUI CDN)

 package.json scripts: start và dev (nodemon)

✅ Done khi: npm run dev → localhost:3000 không lỗi

🗄️ Phase 2 — Database & Models (Sequelize)

Mục tiêu: 4 Model sync vào MySQL, có dữ liệu mẫu.



ModelCác trường chínhUserfullName, email, password, gender, birthDate, height, weight, activityLevel, goalFoodname, calories, protein, carbs, fat, unit, foodType ('raw'|'dish'), isSuggestable (boolean)DiaryEntryuserId, foodId, amount, mealType, dateWeightLoguserId, weight, date

⚠️ Mỗi model bắt buộc có createdAt & updatedAt

 Tạo 4 models với associations (hasMany, belongsTo)

 seeders/foods.js — ~50 món ăn phổ biến Việt Nam

 Sync DB + chạy seed

✅ Done khi: 4 bảng trong MySQL, dữ liệu food có sẵn

🔐 Phase 3 — Authentication & Onboarding

Mục tiêu: Đăng ký/đăng nhập/JWT hoạt động.

 middlewares/auth.middleware.js — verify JWT từ cookie

 controllers/auth.controller.js — register, login, logout, updateProfile

 views/auth/ — login.ejs, register.ejs, onboarding.ejs (nhập chiều cao, cân nặng, mục tiêu)

 Routes: POST /dang-ky, POST /dang-nhap, GET /dang-xuat, PUT /ho-so

✅ Done khi: Đăng ký → Onboarding → redirect Dashboard, cookie JWT được set

⚙️ Phase 4 — Core Logic (Tính Toán Dinh Dưỡng)

Mục tiêu: Các công thức hoạt động đúng, nhật ký ăn uống ghi được.

4A — services/nutrition.service.js

 calculateBMR(user) — Mifflin-St Jeor (Nam/Nữ)

 calculateTDEE(bmr, activityLevel) — ×1.2 đến ×1.9

 calculateMacros(tdee) — Protein 30%, Carbs 40%, Fat 30%

4B — Nhật Ký Ăn Uống

 controllers/diary.controller.js — getDiary, addEntry, deleteEntry, searchFood (hỗ trợ filter foodType)

 views/diary/index.ejs — nhóm theo bữa Sáng/Trưa/Tối/Phụ, Modal tìm kiếm có badge Raw/Dish và Dropdown filter loại.

4C — Thư Viện Thực Phẩm

 Duy trì và mở rộng seeders/foods.js với các món ăn thô và chín phổ biến Việt Nam.

 Hỗ trợ tìm kiếm AJAX (GET /nhat-ky/tim-mon) với filter theo category và foodType.

4D — Theo Dõi Cân Nặng

 CRUD WeightLog

✅ Done khi: Nhập món ăn → calo/macro cập nhật đúng → người dùng tự điều chỉnh theo nhu cầu

🎨 Phase 5 — Giao Diện (UI/UX)

Mục tiêu: Dashboard đẹp, responsive, có biểu đồ động.

 Dashboard: Card calo vs TDEE, BMI/BMR/TDEE🍩 Biểu đồ tròn (Chart.js Doughnut): Macros Protein/Carbs/Fat

📈 Biểu đồ đường (Chart.js Line): Lịch sử cân nặng 30 ngày

 Nhật ký: Date picker, modal tìm kiếm món (AJAX) có phân loại Raw/Dish trực quan

 Hồ sơ: Form cập nhật thông tin, chọn mục tiêu

 Theme: Green/Health, DaisyUI, font Inter/Nunito, mobile-first

✅ Done khi: Dashboard responsive, 2 biểu đồ hiển thị đúng

📄 Phase 6 — Xuất PDF & Hoàn Thiện

Mục tiêu: Báo cáo PDF xuất đúng, app không còn lỗi.

 utils/pdf.util.js (PDFKit + font Unicode tiếng Việt)

— Báo cáo tuần/tháng: thông tin user, BMR/TDEE, calo TB, danh sách bữa ăn

 Route: GET /bao-cao/pdf?from=...&to=...

 Edge cases: chưa nhập thông tin → redirect onboarding

 Flash messages, 404 page, loading states

 Test toàn bộ flow end-to-end

✅ Done khi: PDF xuất đúng, flow đăng ký → dashboard → báo cáo không lỗi

🔢 Thứ Tự Thực Hiện

Phase 1 → Phase 2 → Phase 3 → Phase 4A → Phase 4B

↓

Phase 6 ← Phase 5 ← Phase 4C + 4D



## Nhật ký thay đổi (Changelog)

- [feat] Tối ưu hóa UI Nhật ký ăn uống: Thêm món ăn không cần reload lại trang (AJAX update).
- [fix] Xóa bỏ hoàn toàn trường `intensity` (cường độ) khỏi Model và Logic luyện tập để đồng nhất với giao diện.
