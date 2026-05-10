# CLAUDE.md - Nutrition Management System (NMS)

## Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa dành cho sinh viên tốt nghiệp (Graduation Project).
- **Mục tiêu:** Tính toán chỉ số cơ thể, theo dõi nhật ký ăn uống và gợi ý thực đơn thông minh.
- **Vibe:** Giao diện hiện đại, tối giản (Green/Health vibe), phản hồi nhanh.

## Tech Stack
- **Backend:** Node.js, Express.js.
- **Database:** MySQL với Sequelize ORM.
- **Frontend:** EJS Template Engine, Tailwind CSS, DaisyUI.
- **Libraries:** Chart.js (Biểu đồ), PDFKit (Xuất báo cáo), JWT (Auth).

## Git & Version Control Workflow

> ⚠️ Dự án đồ án 10 tín chỉ — Không có Git = Không có mạng lưới an toàn. Tuân thủ nghiêm ngặt.

### 1. Snapshot Before Major Changes
Trước khi thực hiện bất kỳ thay đổi lớn nào (refactor UI, thay đổi logic tính toán, cập nhật schema DB), AI **bắt buộc phải nhắc** người dùng lưu snapshot:
```bash
git add .
git commit -m "Snapshot: mô tả trạng thái ổn định hiện tại"
```

### 2. Branching Strategy
Khi thử nghiệm giao diện mới (lấy cảm hứng từ Godly, các web dinh dưỡng...), tạo nhánh riêng để không ảnh hưởng `master`:
```bash
git checkout -b ui/ten-phong-cach   # ví dụ: ui/olive-dark, ui/bento-grid
git checkout master                  # quay về nhánh chính khi cần
```

### 3. Recovery Plan
Nếu kết quả sau chỉnh sửa bị lỗi hoặc xấu, dùng ngay một trong hai lệnh:
```bash
git restore .          # Hủy toàn bộ thay đổi chưa commit (an toàn hơn)
git reset --hard HEAD  # Reset cứng về commit gần nhất (mạnh hơn)
```

### 4. Commit Message Convention
Viết commit message **tiếng Việt có dấu**, rõ ràng, theo định dạng:
```
<Hành động>: <Mô tả ngắn gọn>

Ví dụ:
✅ "Hoàn thiện logic tính TDEE và Macros"
✅ "Cập nhật giao diện Dashboard màu Olive"
✅ "Fix lỗi route đăng nhập /dang-nhap"
❌ "update" / "fix" / "wip"
```

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
3. **Logic Gợi ý:** Thuật toán gợi ý món ăn phải dựa trên số Calo còn thiếu ($TDEE - \text{Calo đã nạp}$) và TUYỆT ĐỐI chỉ gợi ý thức ăn chín/món ăn hoàn chỉnh (`foodType: 'dish'`), không gợi ý nguyên liệu thô (`raw`).
4. **Security:** Kiểm tra JWT middleware cho tất cả các route cần đăng nhập.
5. **Dữ liệu Thực phẩm (Food):** Phải luôn phân định rõ `foodType` là `'raw'` (nguyên liệu thô - tính trên 100g/quả) hay `'dish'` (món ăn chế biến - tính trên 1 bát/đĩa/suất). Đồng thời sử dụng trường `isSuggestable` (Boolean: true cho dish, false cho raw) để hỗ trợ thuật toán gợi ý. Thuật toán `getSuggestions` BẮT BUỘC phải filter theo `isSuggestable: true`.
6. **Documentation (Cập nhật tài liệu):** AI BẮT BUỘC phải tự động cập nhật file `claude.md` (đặc biệt là phần Changelog) sau mỗi lần hoàn thành một tính năng, thay đổi cấu trúc DB hoặc hoàn tất một tiến trình lớn để đảm bảo mọi thay đổi luôn được track lại.

## Behavioral Guidelines (AI Rules)
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals (e.g., "Write tests for invalid inputs, then make them pass").
- For multi-step tasks, state a brief plan and verify each step.

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

4C — Gợi Ý Món Ăn

 services/suggestion.service.js:Tính remainingCalories = TDEE - Calo đã nạp

Lọc Food phù hợp (Bắt buộc dùng `isSuggestable: true` để tránh gợi ý đồ sống) → sắp xếp theo macro balance → top 5

4D — Theo Dõi Cân Nặng

 CRUD WeightLog

✅ Done khi: Nhập bữa sáng → calo đúng → gợi ý bữa tiếp hợp lý

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

## Changelog
- **[Core DB & Logic Upgrade]**: Hoàn thiện cấu trúc bảng Thực phẩm với 5 nhóm nguyên liệu thô (Đạm, Tinh bột, Béo, Chất xơ, Vitamin). Mở rộng dữ liệu lên 125+ món ăn chuẩn hóa (seeders/foods.js).
- **[UI & Insight System]**: Tối ưu hóa giao diện tìm kiếm món ăn (optgroup) và triển khai thành công thuật toán cảnh báo cân bằng dinh dưỡng (Health Insights) dựa trên cửa sổ trượt dữ liệu.
- **[Food DB Expansion v2 - 2026-05-10]**: Mở rộng database thực phẩm lên ~290 items (+150 mới). Bổ sung: 32 nguyên liệu thô (protein, carb, fiber, vitamin, fat), 80 món chế biến healthy, 38 đồ uống (nước ép, sinh tố, sữa Milo, trà, cà phê, smoothie). Thêm mảng `beverages` vào seeder.