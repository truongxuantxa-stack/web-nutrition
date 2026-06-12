# Báo cáo Chi tiết: Thuật toán Điều chỉnh TDEE Thích ứng (Adaptive TDEE)

Báo cáo này phân tích cơ chế hoạt động của thuật toán **Adaptive TDEE** (Tổng năng lượng tiêu hao thích ứng) - một trong những tính năng thông minh nhất của hệ thống Nutrition Management System (NMS), nhằm giải quyết triệt để vấn đề "đứng cân" (Plateau) do sự thích ứng chuyển hóa của cơ thể.

---

## 1. Vấn đề và Ý tưởng Cốt lõi

### 1.1. Hạn chế của các công thức tĩnh
Hầu hết các ứng dụng dinh dưỡng hiện nay sử dụng công thức tĩnh (như **Mifflin-St Jeor**) để tính TDEE. Tuy nhiên, công thức này chỉ đúng ở thời điểm ban đầu. Sự trao đổi chất của cơ thể luôn biến động (Metabolic Adaptation):
* **Khi ăn kiêng giảm cân:** Cơ thể tự động giảm tốc độ trao đổi chất để bảo tồn năng lượng, làm TDEE thực tế giảm xuống, khiến người dùng bị "chững cân".
* **Khi tập luyện (đặc biệt là Gym/Tập tạ):** Việc gia tăng khối lượng cơ bắp và cường độ vận động sẽ khiến quá trình trao đổi chất tăng mạnh, làm TDEE thực tế cao hơn dự tính.

Dù TDEE tăng hay giảm, công thức tĩnh đều không thể tự động bám sát được những sự thay đổi liên tục này của cơ địa.

### 1.2. Giải pháp dựa trên Nhiệt động lực học
Thuật toán Adaptive TDEE đảo ngược lại bài toán: Thay vì cố gắng "đoán" TDEE bằng chiều cao/cân nặng, hệ thống dùng **dữ liệu thực tế** (lượng calo đã ăn và sự thay đổi cân nặng) để nội suy ra TDEE thực tế.

Nguyên lý cơ bản (với giả định 1kg mỡ cơ thể chứa khoảng 7700 kcal):
> `Thay đổi cân nặng (kg) = (Calo nạp vào - TDEE thực tế) / 7700`

Suy ra công thức lõi:
> **`TDEE thực tế = Calo nạp vào - (Δ Cân nặng × 7700 / 7 ngày)`**

---

## 2. Chi tiết Thuật toán Toán học

Toàn bộ quy trình tính toán được thực hiện theo chu kỳ hàng tuần, thông qua 5 bước xử lý dữ liệu phức tạp trong file `adaptiveTDEE.service.js`.

### Bước 1: Tính Calo Nạp Trung Bình Tuần (Avg Weekly Intake)
Hệ thống truy xuất dữ liệu từ bảng Nhật ký (`DiaryEntry`).
* `avgIntake = Tổng calo 7 ngày / Số ngày đã ghi nhận nhật ký`
* Yêu cầu người dùng phải ghi nhận nhật ký tối thiểu **5/7 ngày** (`MIN_DAYS_LOGGED = 5`) để dữ liệu được coi là hợp lệ.

### Bước 2: Khử Nhiễu Cân Nặng bằng EMA (Smoothed Weight)
Cân nặng con người trên thực tế dao động rất mạnh (có thể lệch 1-2kg mỗi ngày) chứ không giảm/tăng theo một đường thẳng. Sự dao động này bắt nguồn từ 3 yếu tố nhiễu chính:
1. **Tích trữ Glycogen và Nước:** Khi bạn ăn nhiều tinh bột hoặc ăn mặn, cơ thể lập tức giữ thêm nước (1g glycogen đi kèm khoảng 3g nước).
2. **Trọng lượng thức ăn:** Thức ăn chưa tiêu hóa và chất thải chưa bài tiết trong đường ruột tạo ra một mức trọng lượng "ảo".
3. **Chu kỳ sinh lý:** Sự gia tăng hormone căng thẳng (Cortisol) hoặc chu kỳ kinh nguyệt ở phụ nữ đều có thể gây ra hiện tượng tích nước cục bộ.

Chính vì vậy, nếu chỉ tính toán đơn giản bằng cách lấy **cân nặng ngày cuối tuần trừ đi ngày đầu tuần**, kết quả chênh lệch (Δ Cân nặng) có thể bị bóp méo hoàn toàn chỉ vì bạn lỡ ăn một bữa mặn vào tối hôm trước. Sự sai lệch này khi đưa vào công thức nhân với 7700 kcal sẽ tạo ra một **sai số khổng lồ**, khiến TDEE tính ra hoàn toàn vô nghĩa.

Giải pháp: Sử dụng bộ lọc làm mượt **Trung bình trượt có trọng số mũ (Exponential Moving Average - EMA)**.
* **Công thức EMA:** `EMA(t) = (0.1 × Weight) + (0.9 × EMA(t-1))` (với hệ số `α = 0.1` giúp ưu tiên dữ liệu quá khứ, chống nhiễu tốt).
* **Warm-up Period:** Thuật toán luôn truy xuất lùi lại **14 ngày** trước đó để chạy bộ lọc làm mượt (warm-up), nhằm đảm bảo giá trị `startWeight` ở đầu tuần đã được khử nhiễu hoàn toàn.
* Yêu cầu tối thiểu **2 lần ghi cân nặng** (`MIN_WEIGHT_LOGS = 2`) trong tuần hiện tại.

### Bước 3: Tính TDEE Thích Ứng Tuần (Weekly Adaptive TDEE)
Áp dụng công thức cốt lõi:
* `calculatedTDEE = avgIntake - (weightDelta × 7700 / 7)`
* Nếu `weightDelta < 0` (giảm cân), công thức tự động nội suy ra TDEE thực tế **cao hơn** lượng nạp vào.

### Bước 4: Kiểm soát Dữ liệu Cực đoan (Clamping Bounds)
Để phòng hờ trường hợp người dùng nhập sai số liệu nghiêm trọng (ví dụ: gõ nhầm cân nặng từ 60kg thành 6kg), thuật toán áp dụng cơ chế khóa an toàn (Clamping).
* TDEE Thích ứng **tuyệt đối không được vượt quá ±30%** so với TDEE tĩnh (Mifflin).
* `minBound = StaticTDEE × 0.7`
* `maxBound = StaticTDEE × 1.3`
* Nếu vượt ra ngoài vùng này, thuật toán sẽ cắt bằng giá trị giới hạn và lưu log trạng thái là `clamped` thay vì `applied`.

### Bước 5: Làm mượt qua nhiều tuần (Rolling Average TDEE)
Một tuần ăn uống có thể bị ảnh hưởng bởi tiệc tùng hoặc chu kỳ kinh nguyệt (phụ nữ). Để có độ chính xác cao nhất, hệ thống tính **Trung bình cộng của 4 tuần gần nhất** (Rolling Average).
* Giá trị Rolling TDEE này mới chính là con số cuối cùng được cập nhật vào hồ sơ (`User.adaptiveTDEE`) để điều chỉnh mục tiêu calo cho người dùng.
* Nếu người dùng đổi mục tiêu (Ví dụ: từ Giảm cân sang Tăng cân), chuỗi Rolling Average sẽ **tự động reset** để tính lại từ đầu nhằm tránh nhiễu dữ liệu lịch sử.

---

## 3. Quản trị Trải nghiệm & Quy tắc Kích hoạt (Validation Rules)

Thuật toán này chạy ngầm (Zero Configuration) như một Cron Job mỗi đêm Chủ Nhật rạng sáng Thứ 2, tự động quyết định có áp dụng dữ liệu hay không thông qua các bộ lọc:

1. **User Opt-out:** Nếu user chủ động bấm "Bỏ qua tuần" (`skipped_by_user`), dữ liệu tuần đó bị loại bỏ.
2. **Thiếu dữ liệu (`skipped_low_data`):** Nếu số ngày log nhật ký < 5 hoặc số ngày log cân nặng < 2, thuật toán hủy tính toán tuần đó và giữ nguyên TDEE cũ.
3. **Tuần cơ sở (Baseline Week):** Yêu cầu tối thiểu **2 tuần dữ liệu hợp lệ liên tiếp** để thuật toán chính thức tác động đến người dùng. Tuần 1 đóng vai trò là "Baseline" (điểm cơ sở), hệ thống lưu log nhưng không thay đổi mục tiêu calo. Bắt đầu từ tuần 2 trở đi, thông số `User.adaptiveTDEE` mới thực sự được cập nhật và điều chỉnh thực đơn.

---

## 4. Tóm lược

Thuật toán **Adaptive TDEE** là sự giao thoa hoàn hảo giữa Nguyên lý Sinh học (Nhiệt động lực học) và Khoa học Dữ liệu (EMA Smoothing, Rolling Averages, Outlier Clamping). Nó biến ứng dụng NMS từ một bộ đếm calo thụ động thành một cỗ máy thông minh, có khả năng **"lắng nghe" và "phản hồi"** lại những thay đổi nhỏ nhất trong quá trình trao đổi chất của người dùng.
