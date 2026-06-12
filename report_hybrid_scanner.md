# Báo Cáo Chức Năng: Hybrid Nutrition Scanner (Quét Dinh Dưỡng Kết Hợp AI & Mã Vạch)

## 1. Đặt vấn đề (Problem Statement)
Trong quá trình theo dõi và kiểm soát dinh dưỡng hằng ngày (Diet Tracking), rào cản lớn nhất khiến người dùng dễ nản lòng và từ bỏ là thao tác **nhập liệu thủ công**. Đối với các thực phẩm đóng gói, người dùng thường phải đọc từng dòng nhỏ xíu trên bao bì và gõ tay hàng loạt các chỉ số phức tạp như: Năng lượng (Calories), Protein, Carbs, Fat, Chất xơ, Đường, Natri,... Việc này không chỉ mất nhiều thời gian mà còn cực kỳ dễ xảy ra sai sót nhập liệu (typo), dẫn đến sai lệch toàn bộ hồ sơ dinh dưỡng trong ngày.

Để giải quyết vấn đề đó, nhiều ứng dụng trên thị trường cung cấp tính năng **quét mã vạch (Barcode Scanner)**. Tuy nhiên, giải pháp này bộc lộ một điểm yếu chí mạng: Tính phụ thuộc vào cơ sở dữ liệu. Nếu một sản phẩm là hàng nội địa, hàng nhập khẩu ngách, hoặc sản phẩm của các cơ sở sản xuất nhỏ lẻ chưa được đăng ký vào các kho dữ liệu lớn (như OpenFoodFacts), tính năng quét mã vạch sẽ hoàn toàn vô dụng, đẩy người dùng quay lại với thao tác nhập tay truyền thống.

Từ những bất cập trên, yêu cầu đặt ra là phải xây dựng một giải pháp **nhập liệu tự động toàn diện**, không bị phụ thuộc hoàn toàn vào cơ sở dữ liệu có sẵn, đồng thời phải nhanh chóng, chính xác và giảm thiểu tối đa sức lực của người dùng.

## 2. Giải pháp: Hybrid Nutrition Scanner (Tổng quan)
Chức năng **Hybrid Nutrition Scanner** được ra đời như một mũi nhọn công nghệ của hệ thống Web Dinh Dưỡng nhằm giải quyết triệt để bài toán nhập liệu. Thay vì chỉ dùng mã vạch truyền thống, hệ thống kết hợp sức mạnh của Trí tuệ Nhân tạo (AI) để tạo ra 2 phương thức bổ trợ lẫn nhau:
1. **Quét Mã Vạch (Barcode):** Giải pháp tra cứu siêu tốc (dưới 1 giây) dành cho các sản phẩm phổ biến đã có sẵn trong cơ sở dữ liệu.
2. **AI Vision (Đọc bảng thành phần):** Giải pháp cứu cánh cho các sản phẩm "lạ" chưa có mã vạch trong hệ thống. Người dùng chỉ cần cầm điện thoại lên, chụp một bức ảnh "Bảng thông tin dinh dưỡng" (Nutrition Facts) dán trên bao bì. Trí tuệ Nhân tạo (LLM Vision) sẽ phân tích hình ảnh, hiểu được cấu trúc của bảng, trích xuất chính xác từng con số và tự động điền vào form nhập liệu.

## 3. Công nghệ sử dụng
- **Frontend:** React.js, TailwindCSS, DaisyUI. Thư viện `@nicolo-ribaudo/html5-qrcode` xử lý truy cập camera máy điện thoại và quét mã vạch theo thời gian thực (real-time).
- **Backend:** Node.js, Express.js, Sequelize ORM (MySQL).
- **Trí tuệ nhân tạo (AI):** API `gemini-2.5-flash` của Google Generative AI để nhận diện hình ảnh và trích xuất dữ liệu (Zero-Storage, ảnh chỉ xử lý trên RAM chứ không lưu xuống ổ cứng).
- **Dữ liệu bên thứ 3 (Third-party API):** Open Food Facts API (Cơ sở dữ liệu thực phẩm mã nguồn mở toàn cầu).

## 4. Kiến trúc & Luồng hoạt động (Architecture & Flow)

### 4.1. Luồng Quét Mã Vạch (Barcode Scanner)
1. Ứng dụng kích hoạt Camera thông qua thư viện `html5-qrcode`. Quá trình quét diễn ra hoàn toàn trên trình duyệt người dùng (Client-side) để tối ưu độ trễ.
2. Khi phát hiện mã vạch (VD: `8935001282266`), Frontend gửi chuỗi mã vạch lên Backend.
3. Backend tra cứu theo 3 lớp (3-Layer Fallback):
   - **Lớp 1 (Local DB):** Tìm trong bảng `ScannedProduct` (những sản phẩm đã được quét/đóng góp trước đó).
   - **Lớp 2 (OpenFoodFacts API):** Nếu Local DB chưa có, gọi API OpenFoodFacts. Nếu tìm thấy, chuẩn hóa dữ liệu và **lưu đệm (cache)** ngược lại vào Local DB để dùng cho các lần sau.
   - **Lớp 3 (Not Found):** Nếu cả 2 đều không có, chuyển người dùng sang luồng AI Vision.

### 4.2. Luồng AI Vision (Trích xuất từ hình ảnh)
1. Người dùng chụp ảnh bảng thành phần dinh dưỡng. Ảnh được nén và chuyển thành chuỗi `Base64` để tiết kiệm băng thông.
2. Backend gửi ảnh cùng `System Prompt` (câu lệnh hướng dẫn chi tiết) tới API của Google Gemini 2.5 Flash.
3. Gemini phân tích ảnh và trả về JSON chứa các trường: `calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `unit` (100g/100ml) và `confidence` (độ tự tin).
4. **Physics Validation (Kiểm tra vật lý):** Hệ thống tự động kiểm tra tính hợp lý của dữ liệu do AI trả về:
   - Tổng Khối Lượng: Đảm bảo `Protein + Carbs + Fat <= 100g`.
   - Giới hạn Vật Lý: Năng lượng tối đa của 100g không thể vượt quá 900 kcal.
   - Atwater System: So sánh lượng Calo khai báo với tổng lượng Calo tính toán theo quy tắc Atwater (Protein x 4 + Carbs x 4 + Fat x 9). Nếu sai số > 15%, hệ thống sẽ cảnh báo.
5. Hiển thị form cho người dùng xem trước, chỉnh sửa (kể cả chuyển đổi linh hoạt giữa 100g và 100ml), và xác nhận.

### 4.3. Luồng Đóng Góp Cộng Đồng (Crowdsourcing)
- Khi một người dùng dùng AI Vision quét thành công một sản phẩm mới (chưa có mã vạch trong DB), hệ thống sẽ lưu sản phẩm này vào bảng `ScannedProduct`.
- Bảng `ProductContribution` sẽ lưu vết ai là người đóng góp.
- Các người dùng khác khi quét mã vạch này trong tương lai sẽ nhận được ngay kết quả từ Local DB (với `dataSource: 'community'`) mà không cần tốn chi phí gọi AI hay đợi API từ OpenFoodFacts.

## 5. Điểm nhấn Kỹ thuật (Technical Highlights)

- **State Machine UI (Frontend):** Giao diện quét (ScannerTab) được thiết kế theo mô hình State Machine rõ ràng (`idle` -> `barcode_scanning` -> `barcode_processing` -> `barcode_found` / `photo_capture` -> `review_result` -> `done`). Điều này giúp kiểm soát luồng giao diện mượt mà và tránh lỗi bất đồng bộ.
- **Tính linh hoạt về đơn vị (Dynamic Unit):** Người dùng có quyền can thiệp vào kết quả của AI. Cung cấp Radio Button để chủ động chuyển đổi giữa `100g` (đồ ăn) và `100ml` (đồ uống). Khi đơn vị được chuyển đổi, toàn bộ label của Form và Category của cơ sở dữ liệu sẽ tự động tính toán lại.
- **Zero-Storage Image Processing:** Hình ảnh chụp lên không được lưu dưới dạng file trên ổ cứng Server (nhằm tiết kiệm chi phí lưu trữ và đảm bảo bảo mật), mà chỉ truyền trực tiếp qua memory RAM đến Google API dưới dạng Buffer/Base64.
- **Data Integrity:** Sử dụng MySQL Enum chặt chẽ cho các trường phân loại như `category` (`do_uong`, `thit_ca`,...) và `dataSource` (`local`, `community`, `openfoodfacts`).

## 6. Kết luận
Chức năng **Hybrid Nutrition Scanner** không chỉ là một tiện ích đơn thuần mà là một vòng lặp thu thập dữ liệu khép kín (Data Flywheel). Càng nhiều người dùng ứng dụng để quét bằng AI, cơ sở dữ liệu `ScannedProduct` của hệ thống càng lớn, dẫn đến tốc độ trả về kết quả ở luồng quét mã vạch càng nhanh, giảm bớt sự phụ thuộc vào API bên ngoài cũng như tiết kiệm chi phí vận hành AI.
