# Design Document — NutriTrack UI/UX

> **Mục đích:** Tài liệu thiết kế giao diện cho dự án **NutriTrack** (Nutrition Management System).
> Lấy cảm hứng phong cách từ That Clean Life (clean, card-based, whitespace, green health theme) nhưng nội dung và bố cục phục vụ chức năng thực tế của dự án: theo dõi dinh dưỡng cá nhân, nhật ký ăn uống, cân nặng, luyện tập.
>
> **Bổ sung cho:** [thatcleanlife.com-DESIGN.md](file:///c:/Users/Hi%20Windows%2010/webdinhduong/thatcleanlife.com-DESIGN.md) — file design tokens gốc (colors, typography, spacing, buttons...).

---

## 1. Phong cách thiết kế chung (Rút từ TCL)

### 1.1. Nguyên tắc cốt lõi

| Nguyên tắc | Mô tả | Cách áp dụng trong NutriTrack |
|---|---|---|
| **Clean & Minimal** | Nền trắng, ít đường viền nặng, whitespace rộng rãi | Mỗi card có padding `24px`, khoảng cách giữa các widget `24px` |
| **Card-based Layout** | Mọi nội dung được nhóm trong card có border nhẹ, shadow tinh tế | Tất cả widget Dashboard, form, biểu đồ đều nằm trong `tcl-card` |
| **Green Health Theme** | Tông xanh lá / teal thể hiện sức khỏe, tin cậy | Primary `#003139`, accent `#5FE089` / `#2EA850` |
| **Icon + Text** | Mọi label đều kết hợp icon nhỏ + text, không để text đứng một mình | Emoji hoặc Lucide icons đi kèm tiêu đề widget |
| **Subtle Depth** | Shadow nhẹ phân tầng, không nặng nề | `0 1px 3px rgba(0,0,0,0.06)` cho card, tăng khi hover |
| **Progressive Disclosure** | Thông tin quan trọng nhất hiện trước, chi tiết mở rộng sau | Macro summary cards → click "Chi tiết" xem biểu đồ |

### 1.2. Phong cách lấy cảm hứng cụ thể

Từ 4 ảnh giao diện TCL, rút ra các pattern áp dụng:

| Pattern TCL | Áp dụng NutriTrack |
|---|---|
| Tab navigation ngang (Dashboard, Recipes, Planner...) | Sidebar dọc với các mục: Tổng quan, Nhật ký, Lập kế hoạch, Cân nặng, Luyện tập, Hồ sơ |
| Widget card bo góc `12px`, border `1px solid #E5E7EB` | Áp dụng cho tất cả dashboard card (CalorieRing, MacroChart...) |
| Header widget: icon + title bold + action button | Mỗi widget có header dạng: `[emoji] Title` + nút "Chi tiết >" |
| List item có thumbnail + title + meta + arrow `>` | Áp dụng cho RecentMeals, RecentActivity |
| Card-based option selector (Settings) | Áp dụng cho ProfilePage khi chọn đơn vị, mục tiêu |
| Progress badge pill (40% complete) | Áp dụng cho calorie progress, macro progress bars |
| Three-dot menu `⋯` | Áp dụng cho meal entries, exercise logs (sửa/xóa) |

---

## 2. Cấu trúc App Shell (Layout)

### 2.1. Desktop (≥1024px)

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────┐  ┌───────────────────────────────────────────┐  │
│  │           │  │                                           │  │
│  │  SIDEBAR  │  │           MAIN CONTENT                    │  │
│  │  (260px)  │  │           (flex-1)                        │  │
│  │  fixed    │  │                                           │  │
│  │           │  │  max-width: 1280px                        │  │
│  │  ─────    │  │  padding: 32px                            │  │
│  │  Logo     │  │                                           │  │
│  │  Nav      │  │                                           │  │
│  │  ─────    │  │                                           │  │
│  │  User     │  │                                           │  │
│  │  Logout   │  │                                           │  │
│  │           │  │                                           │  │
│  └──────────┘  └───────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 2.2. Mobile (<1024px)

```
┌───────────────────────────────────┐
│  [☰]  🍃 NutriTrack              │  ← Mobile topbar (sticky)
├───────────────────────────────────┤
│                                   │
│         MAIN CONTENT              │
│         (full width)              │
│         padding: 16px             │
│                                   │
└───────────────────────────────────┘

    ┌──────────┐
    │ SIDEBAR  │  ← Slide-in overlay khi nhấn ☰
    │ (260px)  │     backdrop: black/40 blur
    └──────────┘
```

### 2.3. Quy tắc Layout chung

| Thuộc tính | Giá trị |
|---|---|
| **Background app** | `#F0F2F3` (xám nhạt, tạo contrast với card trắng) |
| **Sidebar width** | `260px` |
| **Sidebar bg** | `#FFFFFF` + `border-right: 1px solid #DFE3E4` |
| **Main content max-width** | `1280px` (7xl) |
| **Main padding** | Desktop `32px`, Tablet `24px`, Mobile `16px` |
| **Page content gap** | `24px` giữa các section |

---

## 3. Sidebar

### 3.1. Cấu trúc

```
┌─────────────────────────┐
│  🍃 NutriTrack          │  Logo + tên app
├─────────────────────────┤
│  📊 Tổng quan           │  NavLink active
│  📖 Nhật ký             │  NavLink
│  📅 Lập kế hoạch        │  NavLink
│  ⚖️ Cân nặng            │  NavLink
│  🏋️ Luyện tập           │  NavLink
│  👤 Hồ sơ               │  NavLink
│                         │
│         (spacer)        │
│                         │
├─────────────────────────┤
│  [A] Tên người dùng     │  Avatar + name + email
│      email@abc.com      │
│  🚪 Đăng xuất           │  Logout button
└─────────────────────────┘
```

### 3.2. Trạng thái NavLink

| State | Style |
|---|---|
| **Default** | `text-[#244348]`, `bg: transparent` |
| **Hover** | `bg-[#003139]/5`, `text-[#003139]` |
| **Active** | `bg-[#003139]/8`, `text-[#003139]`, `font-semibold`, `border-left: 2px solid #003139` |

### 3.3. Spacing

- Logo section: `px-6 py-5`, `border-bottom: 1px solid #DFE3E4`
- Nav items: `px-3`, mỗi item `px-3 py-2.5`, `gap: 2px`
- User section: `px-3 py-4`, `border-top: 1px solid #DFE3E4`
- Icon size: `16x16px`
- Khoảng cách icon-text: `12px`

---

## 4. Dashboard Page — Bố cục Widget

### 4.1. Sơ đồ tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│  GREETING BAR                                               │
│  [Avatar] Chào buổi sáng, [Name]! 👋                       │
│  Hôm nay bạn đã nạp 65% mục tiêu calo.    [📄 Tải báo cáo] [◀ 13/06 ▶] │
└─────────────────────────────────────────────────────────────┘

┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ 🥩 Protein│ │ 🍚 Carbs  │ │ 🥑 Fat    │ │ 🔥 Calo   │
│  120/150g │ │  200/250g │ │  50/60g   │ │  đốt 350  │
│ ████░░░░  │ │ ██████░░  │ │ ████░░░░  │ │  kcal     │
└───────────┘ └───────────┘ └───────────┘ └───────────┘

┌─────────────────────────────────────┐  ┌──────────────────┐
│  CALORIE RING  │  MACRO PROGRESS    │  │ 💧 NƯỚC          │
│  [Ring Chart]  │  🥩 Protein ████   │  │  [Progress bar]  │
│   1500/2000    │  🍚 Carbs   ████   │  │  1.5L / 2.5L     │
│   kcal         │  🥑 Fat     ████   │  │                  │
├─────────────────────────────────────┤  ├──────────────────┤
│  MACROS DONUT  │  🎯 TDEE THÍCH ỨNG│  │ 💊 VI CHẤT       │
│  [Donut Chart] │  2150 kcal/ngày    │  │  Vitamin A  80%  │
│  P/C/F %       │  Mục tiêu: 2000   │  │  Sắt        45%  │
│                │  Chi tiết >        │  │  Canxi      60%  │
├─────────────────────────────────────┤  ├──────────────────┤
│  ⚖️ BIỂU ĐỒ CÂN NẶNG              │  │ 🧠 PHÂN TÍCH     │
│  [Line Chart — 30 ngày]            │  │  AI Insights     │
│  Xu hướng: 72kg  ↓0.5kg            │  │  3 lời khuyên    │
├────────────────┬────────────────────┤  │                  │
│ 🍜 BỮA ĂN     │ 🏃 LUYỆN TẬP      │  │                  │
│  GẦN ĐÂY       │  GẦN ĐÂY          │  │                  │
│  [list items]  │  [list items]      │  │                  │
└────────────────┴────────────────────┘  └──────────────────┘
                                              [+ Thêm bữa ăn]  ← FAB button
```

### 4.2. Grid Layout

```
Desktop (lg): grid 3 cột
├── Cột trái (col-span-2): CalorieRing, Charts, Weight, RecentMeals/Activity
└── Cột phải (col-span-1): Water, Micronutrient, DailyInsights

Tablet (md): grid 2 cột → 1 cột ở phần sub-widgets
Mobile: grid 1 cột, stack dọc tất cả
```

---

## 5. Widget Card — Quy chuẩn thiết kế

### 5.1. Card chuẩn (phong cách TCL)

| Thuộc tính | Giá trị | Ghi chú |
|---|---|---|
| **Background** | `#FFFFFF` | Nổi bật trên nền app `#F0F2F3` |
| **Border** | `1px solid #DFE3E4` | Border nhẹ, tinh tế |
| **Border Radius** | `16px` (`rounded-2xl`) | Bo góc mềm mại kiểu TCL |
| **Padding** | `24px` (p-6) | Rộng rãi, thoáng |
| **Box Shadow** | `rgba(21,23,29,0.1) 0 0 5px` | Shadow nhẹ (Raised level) |
| **Hover shadow** | `rgba(21,23,29,0.15) 0 2px 8px` | Tăng nhẹ khi tương tác |

### 5.2. Widget Header chuẩn

```
[Icon] Title                    [Action button]
```

| Phần tử | Style |
|---|---|
| **Icon** | Emoji hoặc Lucide icon, `16-20px` |
| **Title** | `text-xs font-semibold uppercase tracking-widest text-[#96A5A8]` |
| **Action** | Text link "Chi tiết >" hoặc nút icon |
| **Margin bottom** | `16px` |

### 5.3. Widget Footer chuẩn

```
                          [View more >]
```

- `border-top: 1px solid #DFE3E4`
- `padding-top: 12px`, `margin-top: 16px`
- Link: `text-xs font-bold text-[#003139] hover:underline`

---

## 6. Các Widget cụ thể

### 6.1. Greeting Bar

| Phần tử | Style |
|---|---|
| Container | `tcl-card rounded-2xl p-5`, flexbox row |
| Avatar | Tròn `48x48px`, `bg-[#003139]/15`, hiện chữ cái đầu tên |
| Greeting | `text-lg font-extrabold text-[#003139]` + emoji 👋 |
| Subtitle | `text-sm text-[#96A5A8]`, highlight calo % bằng `font-bold text-[#003139]` |
| Actions | Nút "Tải báo cáo" (ghost) + DateNavigator |

### 6.2. Macro Summary Cards (4 cột)

Dãy 4 card nhỏ ngang: Protein, Carbs, Fat, Calo đốt.

| Thuộc tính | Giá trị |
|---|---|
| Grid | `grid-cols-2 md:grid-cols-4 gap-4` |
| Mỗi card | `tcl-card rounded-2xl p-4` |
| Icon | Emoji `20px` |
| Label | `text-xs text-[#96A5A8] uppercase` |
| Value | `text-xl font-black text-[#003139]` + unit nhỏ |
| Progress bar | `h-2 bg-[#F0F2F3] rounded-full`, fill color theo loại |

**Màu progress bar theo loại:**

| Macro | Fill Color |
|---|---|
| Protein | `#003139` (teal chính) |
| Carbs | `#C87C46` (nâu cam) |
| Fat | `#96A5A8` (xám) |
| Calories burned | `#2EA850` (xanh lá — thành tích tích cực) |

### 6.3. Calorie Ring Hero Card

| Phần tử | Style |
|---|---|
| Layout | Flexbox row: Ring bên trái \| Divider \| Macro bars bên phải |
| Ring | SVG donut chart, `consumed/target` kcal ở giữa |
| Divider | `w-px h-36 bg-[#DFE3E4]` (chỉ hiện md+) |
| Macro bars | 3 progress bar (Protein, Carbs, Fat) với label + value |

### 6.4. Macros Donut Chart

- Donut chart (Chart.js) hiển thị tỷ lệ P/C/F
- Bên trong: `tcl-card rounded-2xl p-6`
- Header: `🍽️ Tỷ lệ dinh dưỡng`

### 6.5. TDEE Card

| Phần tử | Style |
|---|---|
| Badge | `tcl-badge-neutral text-[10px]` — "EMA" |
| Value | `text-3xl font-black text-[#003139]` + "kcal/ngày" |
| Description | `text-[10px] text-[#96A5A8]` |
| Footer | Divider + "Mục tiêu: X kcal" + link "Chi tiết >" |

### 6.6. Weight Chart

- Line chart (Chart.js) — 30 ngày cân nặng
- Badge xu hướng: `bg-[#5FE089]/15 text-[#2EA850]` (giảm) hoặc `bg-[#DC2626]/10 text-[#DC2626]` (tăng)
- Header: `⚖️ Cân nặng` + xu hướng badge ở góc phải

### 6.7. Recent Meals (List — phong cách TCL)

Danh sách bữa ăn gần đây, mỗi item kiểu TCL list:

| Phần tử | Style |
|---|---|
| Thumbnail | `48x48px`, `rounded-lg`, ảnh món ăn |
| Title | `text-sm font-semibold text-[#003139]` — tên món ăn |
| Meta | `text-xs text-[#96A5A8]` — "🥩 25g · 🍚 40g · 120 kcal" |
| Meal badge | Pill badge: Sáng (xanh), Trưa (cam), Tối (tím) |
| Spacing | Mỗi item cách `8px`, border-bottom `1px solid #F0F2F3` |

### 6.8. Recent Activity (List)

| Phần tử | Style |
|---|---|
| Icon | Emoji bài tập (🏃 🏋️ 🚴...) trong circle `40x40px` |
| Title | `text-sm font-semibold` — tên bài tập |
| Meta | `text-xs text-[#96A5A8]` — "30 phút · 🔥 250 kcal" |
| Spacing | Giống RecentMeals |

### 6.9. Water Progress

| Phần tử | Style |
|---|---|
| Header | `💧 Nước uống` |
| Visual | Progress bar dọc hoặc ngang, fill `#3B82F6` (blue) |
| Value | `text-2xl font-black` — "1.5L / 2.5L" |
| Buttons | +250ml, +500ml — `tcl-btn-ghost` nhỏ |

### 6.10. Micronutrient Card

| Phần tử | Style |
|---|---|
| Header | `💊 Vi chất dinh dưỡng` |
| Items | List: tên vi chất + progress bar + phần trăm |
| Progress | `h-1.5 rounded-full`, fill theo mức: xanh (≥80%), vàng (50-79%), đỏ (<50%) |

### 6.11. Daily Insights (AI)

| Phần tử | Style |
|---|---|
| Header | `🧠 Phân tích AI` |
| Items | Card nhỏ với icon + text lời khuyên |
| Max visible | 3 item, "Xem thêm" mở rộng |
| Health Score | Badge tròn hoặc number lớn |

---

## 7. Các trang khác

### 7.1. Diary Page (Nhật ký ăn uống)

**Layout:** Theo ngày, chia theo bữa (Sáng / Trưa / Tối / Snack)

```
[◀ 12/06/2025 ▶]     ← DateNavigator

┌─ 🌅 Bữa sáng ─────────────────────────────────┐
│  [Ảnh] Phở bò    · 450 kcal · 🥩 25g 🍚 55g  [⋯] │
│  [Ảnh] Sữa chua  · 120 kcal · 🥩 8g  🍚 15g  [⋯] │
│                              [+ Thêm món]        │
└──────────────────────────────────────────────────┘

┌─ ☀️ Bữa trưa ─────────────────────────────────┐
│  (trống)                                         │
│                              [+ Thêm món]        │
└──────────────────────────────────────────────────┘
```

**Quy tắc:**
- Mỗi meal group là 1 card
- Meal entry giống pattern list item TCL (thumbnail + title + meta + menu ⋯)
- Nút "Thêm món" dạng ghost button trong card
- Tổng calo ngày hiển thị ở bottom summary

### 7.2. Meal Planner Page (Lập kế hoạch)

**Layout:** Calendar view hoặc weekly view

- Card-based: mỗi ngày là 1 column hoặc 1 card
- Drag & drop thêm món ăn
- Tổng macro hiển thị dưới mỗi ngày

### 7.3. Weight Page (Cân nặng)

**Layout:** Biểu đồ chính + form nhập + lịch sử

```
┌─ BIỂU ĐỒ XU HƯỚNG CÂN NẶNG ──────────────────┐
│  [WeightTrendChart — full width]                 │
│  Tab: 7 ngày | 30 ngày | 90 ngày | Tất cả       │
└──────────────────────────────────────────────────┘

┌─ NHẬP CÂN NẶNG ─┐  ┌─ THỐNG KÊ ────────────────┐
│  [Input] kg       │  │  Hiện tại: 72.5 kg        │
│  [Ngày]           │  │  Thay đổi: -1.2 kg        │
│  [Lưu]            │  │  BMI: 23.1                │
└───────────────────┘  └───────────────────────────┘

┌─ LỊCH SỬ CÂN NẶNG ────────────────────────────┐
│  13/06  72.5 kg   ↓0.3                     [⋯]  │
│  12/06  72.8 kg   ↑0.1                     [⋯]  │
│  11/06  72.7 kg   ↓0.5                     [⋯]  │
└──────────────────────────────────────────────────┘
```

### 7.4. Exercise Page (Luyện tập)

**Layout:** Form nhập + danh sách hôm nay + tổng kết

- Mỗi exercise entry: icon + tên + thời gian + calo đốt + menu ⋯
- Card pattern giống TCL list items
- Tổng "Calo đốt hôm nay" badge lớn

### 7.5. Profile Page (Hồ sơ / Cài đặt)

**Lấy cảm hứng từ ảnh Settings/Preferences TCL:**

- Card-based option selector cho: Đơn vị đo (Metric / Imperial), Mục tiêu (Giảm / Giữ / Tăng cân)
- Toggle switch cho: Bật/Tắt TDEE thích ứng, Thông báo nhắc nhở
- Form input cho: Tên, Tuổi, Chiều cao, Cân nặng mục tiêu
- Viền `2px solid #4CAF50` + checkmark ✅ cho option đang chọn (giống TCL)

---

## 8. Component Patterns chung

### 8.1. Empty State

Khi widget không có dữ liệu:

```
┌────────────────────────────────────┐
│                                    │
│        [Illustration/Emoji]        │
│                                    │
│     Chưa có dữ liệu nào           │
│     Bắt đầu thêm bữa ăn đầu tiên │
│                                    │
│         [+ Thêm ngay]              │
│                                    │
└────────────────────────────────────┘
```

- Emoji/icon: `64px`, opacity `0.4`
- Title: `text-sm font-semibold text-[#244348]`
- Subtitle: `text-xs text-[#96A5A8]`
- CTA: `tcl-btn-primary` nhỏ

### 8.2. Loading Skeleton

- `background: linear-gradient(to right, #DFE3E4, #F0F2F3, #DFE3E4)`
- `background-size: 200% 100%`
- `animation: shimmer 1.5s ease-in-out infinite`
- Bo góc `rounded-2xl` giống card thật

### 8.3. Error State

- `bg-red-50 border border-red-200 rounded-xl`
- `text-red-700 text-sm font-medium`
- Padding: `16px`

### 8.4. Toast Notification

- Sử dụng `react-hot-toast`
- Success: icon ✅, border-left xanh lá
- Error: icon ❌, border-left đỏ
- Position: `top-right`

### 8.5. Modal

- Backdrop: `bg-black/40 backdrop-blur-sm`
- Modal card: `bg-white rounded-2xl p-6 max-w-lg`
- Shadow: `0 20px 60px rgba(0,0,0,0.2)`
- Close button: ✕ ở góc phải trên
- Animation: fade-in + scale-up

### 8.6. FAB (Floating Action Button)

- Position: `fixed bottom-6 right-6`
- Style: `tcl-btn-primary rounded-full w-14 h-14`
- Icon: `+ (Plus)` trắng, `24px`
- Shadow: `0 4px 12px rgba(0,49,57,0.3)`
- Z-index: `50`
- Hover: scale `1.05` + shadow tăng

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout | Content changes |
|---|---|---|---|
| **Mobile** | `< 768px` | 1 cột, sidebar overlay | Cards stack dọc, padding `16px` |
| **Tablet** | `768px - 1023px` | 1 cột, sidebar overlay | Cards 2 cột ở macro summary |
| **Desktop** | `≥ 1024px` | Sidebar cố định + main content | Grid 3 cột (2+1), padding `32px` |

---

## 10. Accessibility & Contrast

### 10.1. Focus State (Keyboard Navigation)

Mọi phần tử tương tác (input, button, link, select) **bắt buộc** phải có trạng thái `:focus-visible` rõ ràng để hỗ trợ người dùng điều hướng bằng phím Tab.

| Phần tử | Focus Style |
|---|---|
| **Text Input / Textarea / Select** | `border-color: #003139` + `ring-2 ring-[#003139]/20` (box-shadow: `0 0 0 3px rgba(0,49,57,0.2)`) |
| **Button (Primary)** | `ring-2 ring-[#003139]/30 ring-offset-2` |
| **Button (Ghost/Secondary)** | `ring-2 ring-[#003139]/20 ring-offset-1` |
| **NavLink (Sidebar)** | `bg-[#003139]/8` + `outline: 2px solid #003139` |
| **Checkbox / Toggle** | `ring-2 ring-[#003139]/20` |

**CSS mẫu cho input:**
```css
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  border-color: #003139;
  box-shadow: 0 0 0 3px rgba(0, 49, 57, 0.2);
}
```

**Tailwind tương đương:**
```
focus-visible:outline-none focus-visible:border-[#003139] focus-visible:ring-2 focus-visible:ring-[#003139]/20
```

> Đặc biệt quan trọng ở trang **Profile** (form cập nhật thông tin) và **Weight** (form nhập cân nặng) — nơi người dùng nhập liệu nhiều nhất.

### 10.2. Dark Mode

> **Dự án hiện tại chỉ hỗ trợ Light Mode** để tối ưu trải nghiệm thị giác theo chuẩn y khoa. Giao diện sáng giúp hiển thị dữ liệu dinh dưỡng, biểu đồ, và bảng màu thực phẩm một cách chính xác nhất — phù hợp với ngữ cảnh sức khỏe nơi độ chính xác màu sắc ảnh hưởng đến khả năng đọc hiểu.

Nếu tương lai mở rộng Dark Mode, cần bổ sung bảng mapping:

| Light Mode | Dark Mode (dự kiến) |
|---|---|
| Nền app `#F0F2F3` | `#0F1419` (đen ngả xanh) |
| Card `#FFFFFF` | `#1A2332` (xám than) |
| Text `#003139` | `#E8ECED` (trắng ngả xám) |
| Border `#DFE3E4` | `#2A3A42` (viền tối) |
| Secondary text `#96A5A8` | `#8899A0` (sáng hơn 1 bậc) |

### 10.3. Contrast Ratio — Lưu ý màu `#96A5A8`

Màu `#96A5A8` (secondary text) có contrast ratio **~3.5:1** trên nền trắng `#FFFFFF` — đạt WCAG AA cho large text (≥18px) nhưng **không đạt** cho small text (<18px).

**Quy tắc bắt buộc:**

| ✅ Được phép | ❌ Không được |
|---|---|
| `#96A5A8` + `font-medium` (500) trở lên | `#96A5A8` + `font-light` (300) hoặc `font-thin` (100) |
| `#96A5A8` cho text ≥ `12px` với weight ≥ `500` | `#96A5A8` cho body text dài cần đọc kỹ |
| `#96A5A8` cho label phụ, meta, timestamp | `#96A5A8` cho placeholder input (nên dùng `#9CA3AF` hoặc đậm hơn) |

**Thay thế an toàn khi cần contrast cao hơn:**
- `#6B7C80` (~5.2:1) — dùng khi text nhỏ (<12px) hoặc font-weight thấp
- `#244348` (~8.5:1) — dùng cho body text quan trọng

---

## 11. Tổng kết — Checklist áp dụng

Khi implement hoặc review UI, kiểm tra:

- [ ] Mọi card đều dùng `tcl-card` (trắng, border `#DFE3E4`, rounded `16px`, padding `24px`)
- [ ] Text primary: `#003139`, secondary: `#96A5A8`, body: `#244348`
- [ ] Widget header: icon + title uppercase + tracking-widest
- [ ] Progress bar: `h-2 rounded-full`, nền `#F0F2F3`, fill color theo ngữ cảnh
- [ ] List item pattern: thumbnail + title + meta + action (⋯ hoặc >)
- [ ] Empty state có illustration + CTA
- [ ] Loading có skeleton shimmer animation
- [ ] Sidebar active item có `border-left` + `bg` teal nhạt
- [ ] Background app: `#F0F2F3` (không phải trắng thuần)
- [ ] Responsive: sidebar ẩn trên mobile, hiện overlay khi nhấn ☰
- [ ] **Focus state**: mọi input/button có `focus-visible` ring `#003139`
- [ ] **Contrast**: text `#96A5A8` luôn dùng `font-medium` (500) trở lên, không dùng `font-light/thin`
- [ ] **Dark Mode**: ghi chú rõ Light Mode only trong codebase
