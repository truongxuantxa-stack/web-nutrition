# Skill: Testing (Kiểm Thử Tự Động & Bán Tự Động)

## 🎯 Mục đích (Purpose)
Đảm bảo hệ thống NMS (Nutrition Management System) luôn hoạt động ổn định sau mỗi lần thêm/sửa/xóa code. Tránh tình trạng lỗi "cộng dồn" hoặc tính năng mới làm hỏng tính năng cũ.

## 📋 Quy trình áp dụng (Workflow)
Mỗi khi AI hoàn thành một Task hoặc người dùng yêu cầu kiểm tra, AI sẽ tự động (hoặc người dùng sẽ làm theo) các bước sau:

### Bước 1: Xác định phạm vi bị ảnh hưởng (Scope)
AI cần tự hỏi: "Task vừa rồi thay đổi phần nào?"
- **Database (Models):** Cần test validation, thêm trường thiếu, quan hệ (relationships).
- **Logic (Services):** BMR, TDEE, Suggesion -> Bắt buộc Unit Test bằng data giả.
- **API (Controllers):** Route đăng nhập, thêm món, xóa món -> Bắt buộc check Response HTTP (Status 200, 400).
- **Giao diện (Views):** EJS render, AJAX, CSS -> Hướng dẫn user tự check bằng mắt hoặc AI check kỹ HTML tĩnh.

### Bước 2: Thực thi Test (Execution)

#### 1. Logic / Math Test (Services)
- **Cách làm:** Gọi hàm với đầu vào cố định và kiểm tra đầu ra.
- **Ví dụ (Water Tracking):**
  - Giả định: Người dùng nặng 70kg.
  - Kỳ vọng: `waterGoal` = `70 * 35` = `2450`.
  - Thực tế: Chạy hàm `calculateWaterGoal(70)` -> Kết quả phải là 2450.

#### 2. API / Controller Test (Routes)
- **Cách làm:** Gửi giả lập Request (nếu có thư viện như Postman/Supertest) hoặc sử dụng file script nhỏ.
- **Ví dụ (Thêm món ăn):**
  - Giả định: Gửi `POST /nhat-ky/them` với `amount: -10` (số âm).
  - Kỳ vọng: Controller chặn lại, trả về lỗi `400 Bad Request`.

#### 3. UI/UX Test (Giao diện EJS/AJAX)
- **Cách làm:** Review lại code render.
- **Tiêu chí:** 
  - Responsive có bị vỡ không?
  - AJAX cập nhật (ví dụ: vòng tròn nước, thêm món) có bị reload trang toàn bộ không? (Vi phạm triết lý app).

### Bước 3: Báo cáo & Khắc phục (Report & Fix)
- Nếu mọi thứ Pass: AI cung cấp lệnh `git commit`.
- Nếu có lỗi: AI tự động phân tích và đề xuất hướng sửa ngay trong phản hồi.

---
**💡 Nguyên tắc cốt lõi:**
"Thà code chậm nhưng chắc, còn hơn code nhanh mà lỗi. LUÔN test kỹ trước khi `git push`."
