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
- Nếu có lỗi: AI tự động phân tích và đề xuất hướng sửa ngay trong phản hồi.
- Nếu mọi thứ Pass: Chuyển sang Bước 4 để Review code.

### Bước 4: Code Review & Tối ưu (Checklist trước khi Git Push)
Tránh tâm lý "Để sau dọn cũng được" (Later never comes). Bắt buộc dọn dẹp và tối ưu xong mới được phép cung cấp lệnh `git commit`.

AI và người dùng cần rà soát 4 tiêu chí sau:
1. **Sự đơn giản (Simplicity Check):** Đoạn code này có thể viết ngắn gọn hơn không? Có lạm dụng cấu trúc phức tạp không?
2. **Kiểm soát thư viện (Dependency Discipline):** Có thêm thư viện ngoài (npm package) cho một việc có thể giải quyết bằng code thuần không? (Mỗi thư viện là một gánh nặng, ưu tiên Vanilla JS/CSS).
3. **Dọn rác (Dead Code Hygiene):** Có để lại hàm, biến không dùng (`_unused`), dòng comment nháp hay `console.log()` nào không? Nếu có, liệt kê ra và xin phép xóa.
4. **Phạm vi tác động (Surgical Changes):** Thay đổi có nhỏ gọn, tập trung vào đúng vấn đề không? Có vô tình làm hỏng logic hay xóa nhầm comment cũ ở file khác không?

---
**💡 Nguyên tắc cốt lõi:**
"Thà code chậm nhưng chắc, còn hơn code nhanh mà lỗi. LUÔN test kỹ trước khi `git push`."
