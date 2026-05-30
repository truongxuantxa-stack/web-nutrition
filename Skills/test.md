# Skill: Testing (Kiểm Thử Kỹ Thuật & QA)

## 🎯 Mục đích (Purpose)
Đảm bảo hệ thống NMS (Nutrition Management System) luôn hoạt động ổn định về mặt kỹ thuật sau mỗi lần thêm/sửa/xóa code. Tránh tình trạng lỗi "cộng dồn", lỗi logic, hoặc code mới làm hỏng chức năng cũ.

---

## 📋 Quy trình áp dụng (Workflow)
Mỗi khi AI hoàn thành một Task hoặc người dùng yêu cầu kiểm tra, AI sẽ thực hiện các bước kiểm thử kỹ thuật sau:

### Bước 1: Xác định phạm vi bị ảnh hưởng (Scope)
AI cần xác định: "Task vừa rồi thay đổi phần nào?"
*   **Database (Models):** Cần test validation các trường dữ liệu, khóa ngoại, các quan hệ (relationships).
*   **Logic (Services):** Tính BMR, TDEE, Gauss Solver -> Bắt buộc chạy thử/test logic bằng dữ liệu giả.
*   **API (Controllers & Routes):** Đăng nhập, thêm/xóa entries, cập nhật nước -> Kiểm tra HTTP Response Status (200, 400, 401...).
*   **Giao diện (React Components):** React render, cập nhật state (custom hooks, TanStack Query cache), luồng Auth (JWT & Refresh Token) -> Đảm bảo mượt mà, không giật lag và đồng bộ dữ liệu tốt.

### Bước 2: Thực thi Test (Execution)

#### 1. Logic / Math Test (Services)
*   **Cách làm:** Gọi hàm với đầu vào cố định và kiểm tra đầu ra xem có đúng kỳ vọng không.
*   **Ví dụ (Water Goal):**
    *   Giả định: Người dùng nặng 70kg.
    *   Kỳ vọng: `waterGoal` = `70 * 35` = `2450`.
    *   Thực tế: Chạy hàm `calculateWaterGoal(70)` -> Kết quả phải là 2450.
*   **Ví dụ (Gauss Solver):**
    *   Giả định: Giải hệ phương trình với các món ăn đầu vào có khối lượng xác định.
    *   Kỳ vọng: Trả về kết quả chính xác, hoặc trả về lỗi nếu nghiệm âm / không khả thi.

#### 2. API / Controller Test (Routes)
*   **Cách làm:** Gửi giả lập Request, hoặc tốt nhất là chạy các script kiểm thử tích hợp (Integration Test) viết bằng Node.js kết nối trực tiếp database/mock request-response để kiểm tra luồng xử lý của Services & API Controllers.
*   **Ví dụ (Thêm món ăn):**
    *   Giả định: Gửi `POST /api/v1/diary/entries` với `amount: -10` (số âm).
    *   Kỳ vọng: Validation middleware hoặc service chặn lại, trả về lỗi `400 Bad Request`.

#### 3. UI/UX Test (Reactivity & React SPA)
*   **Cách làm:** Kiểm tra thủ công giao diện và luồng tương tác trên trình duyệt (hoặc qua devtools).
*   **Tiêu chí bắt buộc:**
    *   **Responsive:** Không bị vỡ giao diện cơ bản trên các màn hình di động/tablet/desktop.
    *   **Reactivity & Cache Sync (Tính phản ứng):** Khi tương tác (thêm nước, xóa món, đổi món), TanStack Query phải thực hiện invalidate cache (`queryClient.invalidateQueries`) để các component liên quan tự động cập nhật ngay lập tức nhờ React State, tuyệt đối không reload trang.
    *   **Luồng Auth (Token Refresh):** Khi Access Token (15 phút) hết hạn, Axios Interceptors phải tự động refresh token bằng Refresh Token từ HttpOnly Cookie mà không làm ngắt quãng trải nghiệm của người dùng.
    *   **Console Log:** Không có lỗi màu đỏ (`Error`) hoặc cảnh báo màu vàng (`Warning`) phát sinh trong Console của trình duyệt.

### Bước 3: Dọn rác & Tối ưu (Dead Code Hygiene)
Trước khi hoàn thành việc kiểm thử, AI bắt buộc phải dọn dẹp mã nguồn:
1.  **Xóa code debug:** Xóa toàn bộ các dòng `console.log()` debug.
2.  **Dọn biến thừa:** Xóa bỏ các biến, hàm, thư viện import không sử dụng (`_unused`).
3.  **Simplicity Check:** Đơn giản hóa các cấu trúc điều kiện hoặc logic lặp phức tạp không cần thiết.

### Bước 4: Code Review & Tối ưu (Checklist trước khi Git Push)
Tránh tâm lý "Để sau dọn cũng được" (Later never comes). Bắt buộc rà soát và tối ưu xong mới được phép cung cấp lệnh `git commit`.

AI và người dùng cần rà soát các tiêu chí sau:
1.  **Sự đơn giản (Simplicity Check):** Đoạn code này có thể viết ngắn gọn hơn không? Có lạm dụng cấu trúc phức tạp không?
2.  **Kiểm soát thư viện (Dependency Discipline):** Có thêm thư viện ngoài (npm package) cho một việc có thể giải quyết bằng code thuần không? (Mỗi thư viện là một gánh nặng, ưu tiên Vanilla JS/CSS).
3.  **Dọn rác (Dead Code Hygiene):** Có để lại hàm, biến không dùng, dòng comment nháp hay `console.log()` nào không? Nếu có, hãy xóa bỏ hoàn toàn.
4.  **Phạm vi tác động (Surgical Changes):** Thay đổi có nhỏ gọn, tập trung vào đúng vấn đề không? Có vô tình làm hỏng logic hay xóa nhầm comment cũ ở file khác không?

---

## 💡 Nguyên tắc cốt lõi:
> **"Thà code chậm nhưng chắc, còn hơn code nhanh mà lỗi. LUÔN hoàn thành test kỹ thuật trước khi bàn giao."**
