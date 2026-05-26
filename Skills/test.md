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
*   **Giao diện (React Components):** React render, cập nhật state (như custom hooks, TanStack Query), call API -> Đảm bảo mượt mà, không giật lag.

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
*   **Cách làm:** Gửi giả lập Request hoặc chạy các script test nhỏ để kiểm tra phản hồi của Server.
*   **Ví dụ (Thêm món ăn):**
    *   Giả định: Gửi `POST /api/v1/diary/entries` với `amount: -10` (số âm).
    *   Kỳ vọng: Validation middleware chặn lại, trả về lỗi `400 Bad Request`.

#### 3. UI/UX Test (Reactivity & React SPA)
*   **Cách làm:** Kiểm tra thủ công giao diện và các trạng thái của component.
*   **Tiêu chí bắt buộc:**
    *   **Responsive:** Không bị vỡ giao diện cơ bản trên các màn hình di động/tablet/desktop.
    *   **Reactivity (Tính phản ứng):** Khi người dùng tương tác (như thêm nước, xóa món ăn, đổi món), các thông số tổng liên quan (như thanh progress bar calo nạp, nước nạp) phải tự động thay đổi ngay lập tức nhờ React State, tuyệt đối không được tải lại trang (reload).
    *   **Console Log:** Không có lỗi màu đỏ (`Error`) hoặc cảnh báo màu vàng (`Warning`) phát sinh trong Console của trình duyệt.

### Bước 3: Dọn rác & Tối ưu (Dead Code Hygiene)
Trước khi hoàn thành việc kiểm thử, AI bắt buộc phải dọn dẹp mã nguồn:
1.  **Xóa code debug:** Xóa toàn bộ các dòng `console.log()` debug.
2.  **Dọn biến thừa:** Xóa bỏ các biến, hàm, thư viện import không sử dụng (`_unused`).
3.  **Simplicity Check:** Đơn giản hóa các cấu trúc điều kiện hoặc logic lặp phức tạp không cần thiết.

---

## 💡 Nguyên tắc cốt lõi:
> **"Thà code chậm nhưng chắc, còn hơn code nhanh mà lỗi. LUÔN hoàn thành test kỹ thuật trước khi bàn giao."**
