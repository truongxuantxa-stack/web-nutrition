# CLAUDE.md - Nutrition Management System (NMS)

## Project Overview
Hệ thống quản lý dinh dưỡng cá nhân hóa dành cho sinh viên tốt nghiệp (Graduation Project).
- **Mục tiêu:** Tính toán chỉ số cơ thể, theo dõi nhật ký ăn uống và gợi ý thực đơn thông minh.

## Tech Stack
- **Backend:** Node.js, Express.js.
- **Database:** MySQL với Sequelize ORM.
- **Frontend:** EJS Template Engine, Tailwind CSS, DaisyUI.
- **Libraries:** Chart.js (Biểu đồ), PDFKit (Xuất báo cáo), JWT (Auth).

## Project Structure
- `/controllers`: Xử lý logic nghiệp vụ.
- `/models`: Định nghĩa database schema.
- `/routes`: Định tuyến API.
- `/views`: Các file EJS cho frontend.
- `/public`: CSS tùy chỉnh, JS client và hình ảnh tĩnh.

## Core Logic & Formulas
- **BMR (Mifflin-St Jeor):**
  - Nam: `10 * weight + 6.25 * height - 5 * age + 5`
  - Nữ: `10 * weight + 6.25 * height - 5 * age - 161`
- **TDEE:** BMR × Activity Factor (1.2 đến 1.9).
- **Macros Ratio (Default):** Protein (30%), Carbs (40%), Fat (30%).

## Code Style Guidelines
- **Naming:**
  - Biến và hàm: `camelCase`.
  - Models: `PascalCase` (Số ít).
  - Routes: Kebab-case (e.g., `/dinh-duong/nhat-ky`).
- **Response Format:** Luôn trả về định dạng JSON nhất quán cho các API xử lý dữ liệu.
- **Error Handling:** Sử dụng try-catch trong tất cả controllers, trả về thông báo lỗi thân thiện.

## UI & Design Specifications
### 1. Bảng màu (Color Palette)
- **Primary Background:** `#1A1F12` (Xanh olive siêu tối, mang cảm giác thiên nhiên nhưng sang trọng).
- **Surface/Card:** `#252C18` hoặc `#1A1F12` kết hợp với viền `#3A4428` (Tạo chiều sâu bằng border nhẹ).
- **Text:** `#F2F0E9` (Trắng kem/off-white cho text chính) và `#A8AE9D` (Text phụ, placeholder).
- **Accent/Action:** `#E8722A` (Màu cam đất/rỉ sét nổi bật, dùng cho nút bấm chính như Login/Lưu/Thêm món).
- **Success/Warning/Danger:**
  - Success: `#5C8036` (Xanh lá sáng hơn, tone rêu).
  - Danger: `#B94A4A` (Đỏ gạch, tránh đỏ chóe).

### 2. Typography
- **Font chính:** `DM Sans` hoặc `Inter` (Sạch sẽ, hiện đại).

### 3. Layout & Forms
- **Bento Grid:** Áp dụng cho các trang Dashboard. Các widget (chỉ số calo, biểu đồ) là các khối bo góc, cách nhau đều đặn.
- **Forms:**
  - Input field có background hơi sáng hơn nền một chút (`#252C18`), border `1px solid #3A4428`.
  - Khi focus input: Đổi border sang màu cam Accent (`#E8722A`) và thêm glow effect nhẹ.
  - Border Radius: Nút bấm và card dùng bo góc rộng (`rounded-2xl` hoặc `16px`). Input bo góc vừa (`rounded-lg`).

## Roadmap & Current Progress
- [x] Phase 1: Khởi tạo dự án & Cấu hình cơ bản.
- [x] Phase 2: Database & Models.
- [x] Phase 3: Core Nutrition Logic (BMR, TDEE).
- [x] Phase 4: Authentication & Security.
- [x] Phase 5: Giao diện cơ bản.

## Critical Instructions cho AI
- Tuân thủ chặt chẽ kiến trúc MVC và coding style đã định nghĩa.
- Sử dụng các component của DaisyUI khi xây dựng giao diện thay vì code chay.
