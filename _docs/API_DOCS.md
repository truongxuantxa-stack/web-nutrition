# NMS API Documentation — v1

> **Base URL:** `/api/v1`
>
> **Auth:** Các endpoint có ✅ yêu cầu header `Authorization: Bearer <accessToken>`.
>
> **Response Format:**
> ```json
> { "success": true, "data": {...}, "message": "..." }
> { "success": false, "message": "..." }
> { "success": false, "message": "Dữ liệu không hợp lệ.", "errors": [{ "field": "email", "msg": "..." }] }
> ```

---

## Auth (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Đăng nhập — nhận Access Token (body JSON) + Refresh Token (HttpOnly Cookie) |
| POST | `/auth/register` | ❌ | Đăng ký user mới — tự động đăng nhập, trả tokens |
| POST | `/auth/logout` | ❌ | Đăng xuất — xóa cookie `refreshToken` |
| POST | `/auth/refresh-token` | ❌ | Làm mới Access Token bằng Refresh Token từ cookie |
| GET | `/auth/me` | ✅ | Lấy thông tin user hiện tại |

### POST `/auth/login`

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "matkhau123"
}
```

**Response 200:**
```json
{
    "success": true,
    "message": "Đăng nhập thành công.",
    "data": {
        "user": { "id": 1, "name": "Nguyễn Văn A", "email": "user@example.com", "isOnboarded": true },
        "accessToken": "eyJhbGci..."
    }
}
```

**Set-Cookie:** `refreshToken=<token>; HttpOnly; Path=/api/v1/auth/refresh-token; SameSite=Strict`

---

### POST `/auth/register`

**Request Body:**
```json
{
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "password": "matkhau123"
}
```

**Response 201:** Tương tự login nhưng status `201 Created`.

---

### POST `/auth/refresh-token`

**Cookie Required:** `refreshToken`

**Response 200:**
```json
{
    "success": true,
    "message": "Token đã được làm mới.",
    "data": { "accessToken": "eyJhbGci..." }
}
```

---

### GET `/auth/me`

**Header:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1, "name": "Nguyễn Văn A", "email": "user@example.com",
            "isOnboarded": true, "gender": "male", "height": 170, "weight": 65,
            "activityLevel": "moderate", "goal": "lose_weight"
        }
    }
}
```

---

## Error Codes

| Status | Code | Ý nghĩa |
|--------|------|---------|
| 400 | — | Dữ liệu request sai |
| 401 | — | Chưa đăng nhập hoặc token không hợp lệ |
| 401 | `TOKEN_EXPIRED` | Access Token đã hết hạn → trigger refresh |
| 409 | — | Conflict (email đã tồn tại) |
| 422 | — | Lỗi validation input (xem field `errors`) |
| 429 | — | Rate limit — quá nhiều request trong 15 phút |
| 500 | — | Lỗi máy chủ nội bộ |

---

## Rate Limiting

Các route `/auth/login` và `/auth/register` bị giới hạn **20 request / 15 phút / IP**.
Vượt quá → `429 Too Many Requests`.

---

*Cập nhật lần cuối: Bước 3 — 2026-05-24*
