# Nhật Ký & Tổng Hợp Kinh Nghiệm Phát Triển Đồ Án Tốt Nghiệp

Tài liệu này tổng hợp toàn bộ những bài học xương máu, các quyết định kiến trúc, những sai lầm từng mắc phải và cách khắc phục trong suốt vòng đời phát triển dự án "Hệ Thống Dinh Dưỡng Thông Minh". Đây là tư liệu quan trọng để minh chứng cho năng lực giải quyết vấn đề (Problem-Solving) và tư duy kỹ sư phần mềm (Software Engineering Mindset) trước Hội đồng bảo vệ.

---

## Phần 1: Các Lỗi Kiến Trúc Hệ Thống & Cách Khắc Phục (System Architecture & Reliability)

### 1.1. Sự cố "Wipe Data" và bài học về Single Source of Truth
* **Sai lầm:** Xây dựng file `seeders/foods.js` chạy lệnh xóa toàn bộ bảng (`bulkDelete`) mỗi khi được gọi mà không có cơ chế phân tách dữ liệu tĩnh. Việc hardcode dữ liệu trong file JS khiến thông tin cập nhật sau này (như 300+ hình ảnh AI sinh ra, các vi chất thu thập được) bị ghi đè và mất trắng khi chạy lại seeder.
* **Kinh nghiệm khắc phục (Defensive Programming):**
  * **Tách biệt Data & Logic:** Dump toàn bộ dữ liệu chuẩn ra file `foods_dump.json` (đóng vai trò là Single Source of Truth). Code JS chỉ đóng vai trò đọc file này.
  * **Bảo vệ nhiều lớp (Multi-layer Protection):** 
    1. Thêm Guard Clause (`if (require.main === module)`) chặn thực thi nhầm khi file bị require.
    2. Prompt hộp thoại xác nhận `YES` trên Terminal.
    3. Tự động Auto-backup toàn bộ cấu trúc DB ra file `.json` trước khi xóa, giới hạn giữ 5 file gần nhất.
  * **Soft Delete:** Áp dụng `paranoid: true` cho Model Sequelize để mọi lệnh `DELETE` qua API chỉ mang tính chất ẩn dữ liệu (`deletedAt`), phòng ngừa thao tác nhầm của admin.

### 1.2. Nút thắt cổ chai (Bottleneck) khi gọi External APIs
* **Sai lầm:** Ban đầu, ý định xử lý hình ảnh và cào dữ liệu (scraping) cho hơn 300 món ăn được chạy trong một vòng lặp đồng bộ (Synchronous). Kết quả: Node.js bị treo (Memory Leak/Timeout), API trả về HTTP 429 (Too Many Requests).
* **Kinh nghiệm khắc phục:** 
  * Áp dụng kiến trúc **Batch Processing** (Xử lý theo lô): Chia nhỏ danh sách thành từng cụm (ví dụ 20 món/lần).
  * **Checkpointing (Lưu trạng thái):** Ghi tiến trình vào file `generate_progress.json`. Tính năng này giúp hệ thống có tính **Idempotency** — nếu rớt mạng hoặc sập server giữa chừng, lần chạy sau sẽ đọc file JSON và tiếp tục ngay tại điểm lỗi thay vì chạy lại từ đầu.

### 1.3. Lỗi Quản lý Connection Pool của Database
* **Sai lầm:** Trong các script tự động (như script dump data), gọi `process.exit(0)` ngay khi ghi file xong mà quên không đóng kết nối Database.
* **Kinh nghiệm khắc phục:** Luôn luôn gọi `await sequelize.close()` trong khối `finally` trước khi exit để giải phóng Connection Pool, tránh tình trạng treo connections (Zombie connections) trên server.

---

## Phần 2: Kinh Nghiệm Tích Hợp Trí Tuệ Nhân Tạo (AI & Data Integration)

### 2.1. Chiến lược Hybrid Data (Lai ghép Dữ Liệu)
* **Vấn đề:** Ban đầu định cào 100% dữ liệu từ Wikipedia tiếng Việt. Nhưng thực tế dữ liệu cực kỳ thiếu chuẩn hóa, món có món không, hình ảnh sai bản quyền hoặc chất lượng kém.
* **Giải pháp:** Sử dụng mô hình Hybrid. Ưu tiên lấy từ Wikipedia/OpenFoodFacts nếu có; nếu không, gọi API của LLM (Gemini/OpenAI) để ước lượng vi chất dinh dưỡng và sinh hình ảnh (Image Generation) cho các món thuần Việt (như Bún Bò, Phở).

### 2.2. Prompt Engineering cho Cấu Trúc JSON
* **Vấn đề:** AI trả về câu chữ tự do, khó parse vào Database. Đôi lúc sinh ra mã Markdown hoặc key bị sai lệch.
* **Giải pháp:** Cấu trúc Prompt chặt chẽ, ép AI phải trả về định dạng `application/json` thuần túy không chứa code block. Đưa schema mẫu định nghĩa rõ các trường `fiber`, `sugar`, `vitaminA` bắt buộc phải là kiểu `Float` để chuẩn hóa trước khi insert vào DB.

---

## Phần 3: Kinh Nghiệm Về Thuật Toán Cốt Lõi (Core Algorithms)

### 3.1. Thuật Toán Cảnh Báo Y Khoa (Health Insights) & Tính Điểm (Scoring)
* **Sai lầm ban đầu:** Dùng các ngưỡng If-Else cố định (ví dụ: > 10g đường là trừ điểm) áp dụng cho mọi người dùng và mọi thời điểm trong ngày. Hệ quả là sáng sớm user chưa kịp ăn sáng đã bị app cảnh báo "Thiếu trầm trọng chất xơ, vitamin".
* **Bước đột phá kiến trúc (Architecture Breakthrough):** 
  * Áp dụng **Tháp ưu tiên y khoa (Triage Mechanism):** Giống như cấp cứu bệnh viện, thuật toán phân cấp mức độ nguy hiểm. Nếu lượng Calo nạp vào < 50% (Tầng Sinh Tồn), hệ thống sẽ *Mute (ẩn)* toàn bộ cảnh báo thiếu Vitamin/Xơ. Lý do: Khi cơ thể đang suy nhược vì thiếu năng lượng trầm trọng, việc ép ăn rau xanh là sai logic y khoa.
  * Thiết kế **Context-Awareness (Nhận thức ngữ cảnh):** Chỉ mở khóa cảnh báo "Thiếu chất" khi user đã qua 20:00 (8h tối) hoặc đã ăn đủ 3 bữa.
  * Chuyển đổi từ chấm điểm tuyến tính sang **Hệ số trượt (Multipliers) & Hard Caps:** Thay vì cộng trừ điểm thông thường, hệ thống dùng hệ số nhân (Multiplier) để trừng phạt nặng các hành vi độc hại (Vượt >200% đường) hoặc rớt điểm liệt (Hard Cap 50) nếu trung bình vi chất quá thấp. Cùng với điểm thưởng (Bonus) nếu uống đủ nước và cân bằng Macro.

---

## Phần 4: UX/UI & Trải Nghiệm Người Dùng (Frontend Practices)

* **Vượt rào cản MVP (Minimum Viable Product):** Một đồ án tốt nghiệp thường có giao diện sơ sài. Dự án này tập trung mạnh vào **Premium UI/UX**.
  * Áp dụng **Glassmorphism**, hiệu ứng mờ ảo (backdrop-blur) và Gradient hiện đại.
  * Sử dụng **Micro-animations** (hiệu ứng hover, chuyển trang mượt mà) để tạo cảm giác ứng dụng "đang sống" và tương tác tốt.
* **Xử lý Loading State:** Khi chờ API từ AI sinh thực đơn tốn nhiều thời gian, áp dụng Skeleton Loading và Progress Bar thay vì cục Spinner đơn điệu, giúp giữ chân người dùng không bị nản lòng.

---

## Phần 5: Tính Năng Đã Từ Bỏ (Abandoned Features) & Lý Do Thực Tế

1. **Chatbot Dinh Dưỡng Real-time (WebSockets):** 
   * *Lý do:* Chi phí token LLM quá lớn và độ trễ cao, dễ gây thất vọng. 
   * *Đổi hướng:* Sang tính năng "Health Insights Report" định kỳ tĩnh, hiệu quả và rẻ hơn.
2. **Kiến trúc Microservices:** 
   * *Lý do:* Overkill (cồng kềnh không cần thiết). Việc quản lý Docker, CI/CD cho nhiều service tốn nhiều công sức hạ tầng thay vì tập trung code tính năng. Mô hình **Monolithic (Nguyên khối) MVC** với Express.js đã giải quyết cực tốt bài toán hiện tại.

---

## Phần 6: Hướng Phát Triển Tương Lai (Future Scalability Roadmap)

Nếu hệ thống Scale lên hàng chục ngàn Users, đây là lộ trình nâng cấp:

1. **Lớp Bộ Nhớ Đệm (Caching Layer với Redis):** Cache lại danh sách 300+ Foods và các Meal Templates phổ biến, giúp giảm 80% tải trực tiếp lên Database.
2. **Event-Driven Architecture (Message Broker):** Dùng RabbitMQ/Kafka để đưa các tác vụ nặng (Sinh hình ảnh, Xuất PDF báo cáo, Gửi Email nhắc nhở) xuống chạy ngầm (Background Workers) thay vì block HTTP Request.
3. **Automated Cloud Snapshots:** Tách Database lên AWS RDS hoặc Cloud SQL để bật sao lưu Point-in-time recovery tự động, đạt chuẩn an toàn doanh nghiệp.
4. **Tích hợp IoT / Wearables:** Link API với Apple HealthKit / Google Fit để thu thập chỉ số Calo tiêu thụ (Burned Calories) thực tế thay cho việc ước lượng thủ công.
5. **Mobile App:** Sử dụng React Native/Flutter gọi trực tiếp đến API hiện hành để làm tính năng quét mã vạch (Barcode Scanner) cho bao bì thực phẩm tại siêu thị.
