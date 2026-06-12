# Báo cáo Chi tiết: Kiến trúc Hybrid Caching & Tích hợp Open Food Facts

Trong quá trình phát triển ứng dụng dinh dưỡng, một trong những rào cản lớn nhất là việc phải tự xây dựng một cơ sở dữ liệu (Database) thực phẩm đồ sộ. Để giải quyết bài toán này mà không tốn chi phí nhập liệu thủ công, hệ thống NMS đã triển khai kiến trúc **Hybrid Caching (Bộ đệm Lai)** kết hợp với API của **Open Food Facts (OFF)** - một nền tảng thực phẩm mã nguồn mở toàn cầu.

Báo cáo này phân tích chi tiết luồng xử lý và các thiết kế chống chịu lỗi (Resilience Design) của cơ chế này.

---

## 1. Mục đích và Ý tưởng Cốt lõi
* **Vấn đề:** Database nội bộ (`local`) chỉ chứa sẵn vài trăm món ăn cơ bản của Việt Nam. Sẽ rất trải nghiệm tệ nếu người dùng tìm các sản phẩm đóng gói (như "Bánh Oreo", "Sữa Vinamilk") mà không có kết quả.
* **Giải pháp:** Sử dụng **Cache-Aside Pattern**. Hệ thống ưu tiên tìm trong Database nội bộ trước. Nếu thiếu dữ liệu, hệ thống tự động "cầu viện" API bên ngoài (Open Food Facts), sau đó **lưu tự động (auto-save)** kết quả mới này vào Database nội bộ để dùng cho các lần sau.

---

## 2. Luồng Xử lý Hybrid Search (Tìm kiếm Lai)
Toàn bộ quá trình tìm kiếm được thiết kế để diễn ra trong suốt (seamless) với người dùng:

1. **Truy vấn Local DB:** Hệ thống query MySQL tìm kiếm theo từ khóa. Tốc độ cực nhanh (~5ms).
2. **Kích hoạt External API:** Nếu kết quả trả về từ Local DB **ít hơn 5 món**, hệ thống nhận diện đây là từ khóa "hiếm" và lập tức gọi sang API của Open Food Facts.
3. **Chuẩn hóa Dữ liệu (Normalization):** Dữ liệu thô từ OFF được map chính xác vào Schema của NMS:
   - Quy đổi Natri, Canxi, Sắt từ Gram sang Miligram (`* 1000`).
   - Bỏ qua các sản phẩm lỗi (không có tên, hoặc thiếu năng lượng).
   - Đánh dấu `dataSource = 'openfoodfacts'`.
   - **Bảo vệ Gauss Solver:** Gắn cờ `isSuggestable = false`. Điều này đảm bảo thuật toán gợi ý thực đơn (Meal Planner) chỉ sử dụng các nguyên liệu thô nội bộ (`local`), không bị "ô nhiễm" bởi các sản phẩm đóng gói tràn lan từ OFF gây lỗi giải hệ phương trình.
4. **Khử trùng lặp & Lưu Cache (Dedup & Auto-save):** 
   - Hệ thống kiểm tra trường dữ liệu `barcode` (Mã vạch) do API trả về. *(Lưu ý: Đây là mã định danh gốc từ nhà sản xuất giúp Backend đối chiếu dữ liệu chính xác 100%, hoàn toàn độc lập với việc ứng dụng có tính năng mở Camera quét mã vạch hay không)*. Nếu mã này đã tồn tại trong DB, hệ thống sẽ bỏ qua để tránh tạo ra các bản ghi trùng lặp.
   - Nếu mã vạch (hoặc tên món ăn) chưa tồn tại, hệ thống tự động Insert vào MySQL. Lần sau người dùng tìm từ khóa đó, kết quả sẽ được load thẳng từ DB nội bộ cực nhanh mà không cần gọi OFF API nữa.
5. **Trộn kết quả (Merge):** Kết quả Local được đẩy lên trên, kết quả OFF được xếp ngay bên dưới.

---

## 3. Thiết kế Chống chịu Lỗi (Resilience Design)
Nguyên tắc tối thượng trong kiến trúc Microservices/External API là: **"Không bao giờ để bên thứ 3 làm sập hệ thống của bạn"**. 

Thuật toán này áp dụng 2 chốt chặn an toàn (Circuit Breakers) trong tệp `openfoodfacts.service.js`:

### 3.1. Strict Timeout (3 Giây)
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 3000);
```
Nếu máy chủ Open Food Facts bị chậm hoặc lag, truy vấn sẽ tự động bị hủy (Abort) ngầm ngay đúng giây thứ 3. Điều này ngăn chặn việc giao diện Frontend của người dùng bị "treo" xoay vòng vòng vô tận.

### 3.2. Graceful Fallback (Bắt lỗi im lặng)
```javascript
try {
   // Gọi OFF API và lưu cache
} catch (err) {
   console.warn('[HybridSearch] OFF API failed/timeout:', error.message);
   // Bỏ qua lỗi và Trả về kết quả Local hiện có
}
```
Toàn bộ khối gọi API được bọc trong `try...catch`. Nếu OFF API trả về mã lỗi 500, quá tải (Rate Limit), hoặc bị Timeout như đã nói ở trên, hệ thống chỉ âm thầm log ra console và **vẫn tiếp tục trả về kết quả từ Local DB** cho người dùng. Ứng dụng không bao giờ bị sập hay báo lỗi màn hình đỏ chỉ vì API bên ngoài chết.

---

## 4. Tóm lược
Bằng cách áp dụng **Hybrid Caching** với chốt chặn **Timeout + Fallback**, hệ thống NMS có khả năng tự động "học" và "phình to" kho dữ liệu thực phẩm theo thói quen tìm kiếm của người dùng một cách hoàn toàn tự động, miễn phí, nhưng vẫn đảm bảo tính độc lập và độ ổn định ở mức cao nhất.
