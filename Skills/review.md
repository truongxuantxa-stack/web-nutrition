---
name: webdinhduong-code-review
description: Hướng dẫn Code Review chuyên biệt cho dự án Nutrition Management System (Web Dinh Dưỡng). Sử dụng skill này để đảm bảo chất lượng mã nguồn trước khi merge, áp dụng cho cả Frontend (React) và Backend (Node.js/Express).
---

# Quy trình Code Review - NMS (Web Dinh Dưỡng)

## Tổng quan

Quy trình Đánh giá Mã nguồn (Code Review) đa chiều được thiết kế dành riêng cho dự án **Nutrition Management System**. Mọi thay đổi (PR/Commit lớn) đều phải vượt qua 5 tiêu chí cốt lõi: Tính chính xác, Tính dễ đọc, Kiến trúc, Bảo mật và Hiệu năng.

**Tiêu chuẩn phê duyệt:** Phê duyệt thay đổi khi nó cải thiện sức khỏe tổng thể của codebase. Không yêu cầu sự hoàn hảo 100%, nhưng phải tuân thủ nghiêm ngặt các quy chuẩn (`claude.md`) của dự án.

## Trục Đánh giá (The 5-Axis Review)

### 1. Tính Chính xác (Correctness) & Logic Lõi
- **Thuật toán cốt lõi:** Các thay đổi liên quan đến thuật toán Gauss (Meal Planner) hoặc Adaptive TDEE có làm ảnh hưởng đến độ chính xác của kết quả toán học không? (Đặc biệt chú ý đến trường hợp nghiệm âm).
- **Quy tắc Backend:** API có được bọc trong khối `try-catch` và trả về JSON đồng nhất qua middleware `apiResponse` không?
- **Quy tắc Database:** Bảng/Model mới có đủ trường `createdAt` và `updatedAt` không? Phân định rõ ràng `foodType` ('raw' vs 'dish').
- **Giao diện/UX:** Fallback hình ảnh (SafeImage/ImageLightbox) có hoạt động đúng trong trường hợp ảnh lỗi (chặn hotlink, URL hỏng) không?

### 2. Tính Dễ đọc (Readability & Simplicity)
- **Chuẩn đặt tên (Naming Conventions):**
  - Biến/Hàm: `camelCase`
  - React Components / Database Models: `PascalCase`
  - API Routes / URLs: `kebab-case`
- **React/Frontend:** Component có bị quá lớn không? Có thể tách nhỏ (Extract) thành các component tái sử dụng (như thẻ Card, nút bấm Tailwind/DaisyUI) không?
- **Dọn dẹp code rác:** Tuyệt đối không để lại các component, route cũ (như các file liên quan đến view EJS cũ) sau khi đã chuyển đổi sang React SPA.

### 3. Kiến trúc (Architecture)
- **Backend (MVC):** Các API Controllers có nằm đúng trong `/controllers/api` không? Routes có nằm trong `/routes/api` không? Business logic nên được tách ra `/services`.
- **Frontend (SPA):** Có tuân thủ luồng quản lý trạng thái (State Management) với TanStack Query không? (Cần có `staleTime`, `invalidateQueries` đúng cách).
- **Giao diện & UI/UX:** Có tuân thủ thiết kế Glassmorphism, bo góc `rounded-3xl` và ứng dụng hoạt ảnh Framer Motion để tạo trải nghiệm cao cấp không?

### 4. Bảo mật (Security)
- **Xác thực API:** Các endpoint nhạy cảm (Private) có sử dụng middleware `requireAuthApi` để kiểm tra Bearer Token (JWT) không?
- **Cơ sở dữ liệu:** Mọi câu truy vấn Database phải dùng Sequelize ORM chuẩn mực để phòng chống SQL Injection.
- **Kiểm soát Rate Limit:** API có sử dụng bộ đếm (Rate Limiter) để chống spam không? (Đặc biệt là các API như login/register/meal-planner).

### 5. Hiệu năng (Performance)
- **Frontend:** Cảnh giác với việc Component bị Re-render quá nhiều lần khi state thay đổi. Sử dụng `useMemo` hoặc `useCallback` nếu biểu đồ Chart.js (WeightChart, MacrosChart) có dấu hiệu bị giật lag.
- **Backend:** 
  - Các truy vấn CSDL có bị lỗi N+1 Query không? (Nên dùng `.findAll({ include: [...] })` thay vì lặp qua từng item để query).
  - Tối ưu hóa các tác vụ Cron Job chạy ngầm (Node-cron), không được chặn (block) Event Loop chính.

## Quy tắc Kích thước (Change Sizing)
- **Tối ưu:** ~100 dòng code thay đổi. Dễ dàng review và merge trong 15 phút.
- **Mức vừa:** ~300 dòng. Chấp nhận được nếu thuộc cùng 1 chức năng (Ví dụ: Thêm 1 API route và 1 Controller).
- **Quá tải:** >1000 dòng. Bắt buộc chia nhỏ theo chiến lược (Chia theo API trước, làm Frontend sau). **Lưu ý:** Cho phép ngoại lệ với các thao tác tự động/xóa file cũ (ví dụ: gỡ bỏ toàn bộ EJS views).

## Phân loại Phản hồi (Feedback Labels)
- **Critical:** Lỗi logic thuật toán, sai chuẩn response JSON, thiếu try-catch. (Bắt buộc sửa để merge).
- **Architecture:** Sai chuẩn MVC, viết API lộn xộn ngoài thư mục `api`. (Bắt buộc sửa).
- **UX/Nit:** Các tiểu tiết về CSS/Tailwind, thiếu animation nhỏ. (Khuyến nghị sửa nhưng không block merge).

## Tự động kiểm tra trước khi Review
1. Đảm bảo server backend chạy ổn định không crash.
2. Kiểm tra xem file build frontend (`npm run build` hoặc dùng Vite) có báo lỗi cú pháp không.
3. Chắc chắn đã xem file `claude.md` trước khi code.

> **Trích dẫn dự án:** "Trao quyền quyết định cho người dùng. Cung cấp dữ liệu thô và công cụ tính toán thay vì ép buộc khuôn mẫu." - Hãy giữ vững tinh thần này trong code của bạn.
