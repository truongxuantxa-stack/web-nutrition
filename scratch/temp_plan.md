# Upload Ảnh Mặt Trước Sản Phẩm + Gamification Level 1.5

Hoàn thiện vòng lặp Crowdsourcing: người dùng đóng góp ảnh mặt trước sản phẩm → cộng đồng dễ nhận diện hơn. Đồng thời thêm hệ thống Gamification nhẹ để tạo động lực đóng góp.

## User Review Required

> [!IMPORTANT]
> **Cloudinary Account**: Bạn cần tạo tài khoản Cloudinary (miễn phí) và lấy 3 thông tin: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Thêm vào file `.env` của Backend.

> [!IMPORTANT]
> **Kiến trúc Upload**: Sử dụng **Cách A (FE → BE → Cloudinary)** — đơn giản, an toàn, dễ debug. Khi bảo vệ đồ án có thể trình bày Cách B (Signed Upload) như hướng mở rộng.

## Proposed Changes

### Tính năng 1: Upload Ảnh Mặt Trước Sản Phẩm

---

### Backend — Cài đặt dependency

#### [MODIFY] [package.json](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/package.json)

Cài đặt package Cloudinary:
```bash
cd backend && npm install cloudinary
```

> [!NOTE]
> **Express.js Payload Limit**: File [app.js L12-13](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/app.js#L12-L13) đã được cấu hình `express.json({ limit: '10mb' })` và `express.urlencoded({ limit: '10mb' })` từ trước (khi implement AI Vision Scanner). Không cần sửa thêm — ảnh base64 sau nén (~200-500KB) nằm trong giới hạn.

---

### Backend — Cloudinary Service

#### [NEW] [cloudinary.service.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/services/cloudinary.service.js)

Service upload ảnh lên Cloudinary:

- Hàm `uploadProductImage(base64, productName)`:
  - Nhận ảnh base64 từ Frontend
  - Upload lên Cloudinary folder `products/`
  - Tự động resize tối đa 800x800px, format webp, quality auto
  - Trả về `{ url, publicId }`
- Config Cloudinary từ biến môi trường `.env`

---

### Backend — Scanner Controller & Service

#### [MODIFY] [scanner.controller.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/controllers/api/scanner.controller.js)

Thêm endpoint mới `POST /api/v1/scanner/upload-product-image`:

```js
// Body: { scannedProductId, image: "base64..." }
// Response: { imageUrl: "https://res.cloudinary.com/..." }
```

Logic:
1. Validate: `scannedProductId` và `image` bắt buộc
2. Tìm `ScannedProduct` bằng ID
3. Gọi `cloudinary.service.uploadProductImage(image, product.name)`
4. Cập nhật `product.imageUrl` = URL trả về từ Cloudinary
5. Cũng cập nhật `Food.imageUrl` nếu tồn tại Food liên kết (cùng barcode, do user tạo)
6. Tăng `req.user.contributionCount` thêm 1 (phần Gamification)
7. Trả về `{ imageUrl }` cho Frontend

#### [MODIFY] [scanner.routes.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/routes/api/scanner.routes.js)

Thêm route:
```js
router.post('/upload-product-image', ctrl.uploadProductImage);
```

#### [MODIFY] [scanner.controller.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/controllers/api/scanner.controller.js) — `confirmContribution`

Sau khi lưu đóng góp thành công, thêm logic:
- Tăng `req.user.contributionCount` thêm 1
- Trả thêm `contributionCount` trong response để Frontend hiển thị

---

### Backend — Cấu hình

#### [MODIFY] [.env](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/.env)

Thêm 3 biến Cloudinary:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### Frontend — Scanner Tab (Luồng chính)

#### [MODIFY] [ScannerTab.jsx](file:///c:/Users/Hi%20Windows%2010/webdinhduong/frontend/src/components/diary/ScannerTab.jsx)

**Thay đổi state machine**: Thêm state `upload_photo` giữa `done` và nút "Thêm vào nhật ký".

Luồng mới ở màn hình `done`:
1. Sau khi `confirmAndSave` thành công → kiểm tra `scannedProduct.imageUrl`
2. Nếu `imageUrl` **rỗng** VÀ có `scannedProductId`:
   - Hiển thị khu vực nhắc nhở chụp ảnh mặt trước sản phẩm
   - Giao diện: Icon Camera + text "📸 Chụp ảnh mặt trước sản phẩm để giúp cộng đồng nhận diện!"
   - 2 nút: `[Chụp ngay]` và `[Bỏ qua]`
3. Nếu chọn "Chụp ngay" → mở `<input capture>` tương tự `PhotoCapture`
4. Sau khi chụp → gọi API `POST /scanner/upload-product-image` → cập nhật ảnh
5. Hiển thị ảnh preview + thông báo "✅ Đã thêm ảnh sản phẩm! Cảm ơn bạn!"
6. Nếu chọn "Bỏ qua" → tiếp tục luồng bình thường (chọn bữa + thêm diary)

**Nâng cấp màn hình `done`**:
- Hiển thị `contributionCount` từ response: "🎉 Cảm ơn! Bạn đã đóng góp sản phẩm thứ **X** cho cộng đồng!"
- Confetti chỉ chạy khi có barcode (tức là thực sự đóng góp cho DB chung)

#### [MODIFY] [useScanner.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/frontend/src/hooks/useScanner.js)

Thêm mutation mới `uploadProductImageMutation`:
```js
const uploadImageMutation = useMutation({
    mutationFn: ({ scannedProductId, image }) =>
        api.post('/scanner/upload-product-image', { scannedProductId, image }).then(r => r.data.data),
});
```

Expose thêm:
- `uploadProductImage(scannedProductId, image)`
- `isUploadingImage: uploadImageMutation.isPending`
- `uploadedImageUrl: uploadImageMutation.data?.imageUrl || null`
- Lấy `scannedProductId` và `contributionCount` từ `confirmMutation.data`

---

### Tính năng 2: Gamification Level 1.5

---

### Backend — User Model

#### [MODIFY] [User.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/models/User.js)

Thêm cột mới:
```js
contributionCount: {
    // Số lần đóng góp sản phẩm cho cộng đồng
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
},
```

#### [MODIFY] [profile.controller.js](file:///c:/Users/Hi%20Windows%2010/webdinhduong/backend/controllers/api/profile.controller.js) — `getProfile`

Thêm `contributionCount` vào response `user` object:
```diff
-const { id, fullName, email, gender, ... } = req.user;
+const { id, fullName, email, gender, ..., contributionCount } = req.user;
 return res.success({
-    user: { id, name: fullName, ... },
+    user: { id, name: fullName, ..., contributionCount },
     metrics
 });
```

---

### Frontend — Profile Page (Badge đóng góp)

#### [MODIFY] [ProfilePage.jsx](file:///c:/Users/Hi%20Windows%2010/webdinhduong/frontend/src/pages/ProfilePage.jsx)

Thêm **Badge đóng góp** vào Stats sidebar (card bên phải tab Bio):

```
┌─────────────────────────────┐
│ Thông số tính toán           │
│                              │
│  BMI: 22.1 [Bình thường]    │
│  ───────────────────         │
│  BMR: 1,650 kcal            │
│  ───────────────────         │
│  TDEE: 2,558 kcal           │
│  ───────────────────         │
│  Mục tiêu: 2,200 kcal       │
│  ═══════════════════         │
│  🏆 Đóng góp cộng đồng     │  ← MỚI
│  ✨ 12 sản phẩm             │  ← MỚI
│  [Badge: Chuyên gia/...]     │  ← MỚI
└─────────────────────────────┘
```

Logic badge dựa trên `contributionCount`:
- 0: Không hiển thị
- 1-4: 🌱 "Người mới bắt đầu"
- 5-14: ⭐ "Cộng tác viên tích cực"
- 15-29: 🏅 "Chuyên gia đóng góp"
- 30+: 🏆 "Huyền thoại cộng đồng"

---

## Tổng kết files thay đổi

| # | File | Hành động | Mô tả |
|---|------|-----------|-------|
| 1 | `backend/package.json` | MODIFY | Cài đặt package `cloudinary` |
| 2 | `backend/services/cloudinary.service.js` | **NEW** | Service upload ảnh Cloudinary |
| 3 | `backend/controllers/api/scanner.controller.js` | MODIFY | Thêm endpoint `uploadProductImage` + trả `contributionCount` |
| 4 | `backend/routes/api/scanner.routes.js` | MODIFY | Thêm route `upload-product-image` |
| 5 | `backend/models/User.js` | MODIFY | Thêm cột `contributionCount` |
| 6 | `backend/controllers/api/profile.controller.js` | MODIFY | Trả `contributionCount` trong profile |
| 7 | `backend/.env` | MODIFY | Thêm Cloudinary credentials |
| 8 | `frontend/src/hooks/useScanner.js` | MODIFY | Thêm mutation upload ảnh + expose data |
| 9 | `frontend/src/components/diary/ScannerTab.jsx` | MODIFY | Thêm prompt chụp ảnh mặt trước + nâng cấp Done screen |
| 10 | `frontend/src/pages/ProfilePage.jsx` | MODIFY | Thêm badge đóng góp vào Stats sidebar |

## Verification Plan

### Automated Tests
- Không có test tự động hiện tại (dự án không có test framework). Verify thủ công.

### Manual Verification
1. **Luồng chụp ảnh**:
   - Quét barcode sản phẩm chưa có ảnh → AI đọc nhãn → Xác nhận → Hiện prompt chụp ảnh mặt trước
   - Chụp ảnh → Upload thành công → Ảnh hiển thị trên sản phẩm khi tra cứu lần sau
   - Chọn "Bỏ qua" → Tiếp tục luồng bình thường
2. **Gamification**:
   - Sau đóng góp → Hiện "Bạn đã đóng góp sản phẩm thứ X"
   - Vào Profile → Kiểm tra badge đóng góp hiển thị đúng cấp
3. **Edge cases**:
   - Sản phẩm đã có ảnh → Không hiện prompt chụp
   - Quét không có barcode (chỉ AI Vision) → Không hiện prompt chụp (vì không lưu vào ScannedProduct)
   - Upload ảnh lỗi (Cloudinary down) → Graceful error, vẫn tiếp tục được
