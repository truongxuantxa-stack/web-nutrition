# 🎨 Design System — Web Quản Lý Dinh Dưỡng
> Phong cách lấy cảm hứng từ Felt.com: Olive-Dark × White × Orange Accent, Bento Grid Layout.

---

## 1. Bảng Màu (Color Palette)

### Primary Colors
| Tên | Hex | Mô tả |
|---|---|---|
| `--color-bg-base` | `#1A1F12` | Nền tổng thể - Xanh olive tối |
| `--color-bg-surface` | `#252C18` | Nền card, panel - Olive đậm hơn |
| `--color-bg-elevated` | `#2E3820` | Nền hover/active trên card |
| `--color-primary` | `#4A5C2F` | Màu chính - Olive xanh |
| `--color-primary-light` | `#6B7F45` | Olive sáng hơn, dùng cho border |

### Secondary & Text Colors
| Tên | Hex | Mô tả |
|---|---|---|
| `--color-text-primary` | `#F0EDE4` | Trắng kem - Text tiêu đề |
| `--color-text-secondary` | `#A8A89A` | Xám ấm - Text mô tả, label |
| `--color-text-muted` | `#6B6B60` | Xám mờ - Placeholder, disabled |
| `--color-border` | `#3A4428` | Viền card, input |
| `--color-border-light` | `#4D5A36` | Viền khi hover |

### Accent Colors
| Tên | Hex | Mô tả |
|---|---|---|
| `--color-accent` | `#E8722A` | Cam chính - CTA, highlight |
| `--color-accent-hover` | `#D45F18` | Cam tối hơn khi hover |
| `--color-accent-soft` | `rgba(232,114,42,0.10)` | Cam trong suốt - Tag bg |
| `--color-success` | `#5A8A3E` | Xanh lá - Đạt mục tiêu |
| `--color-warning` | `#D4A017` | Vàng - Cảnh báo vượt macro |
| `--color-danger` | `#C0392B` | Đỏ - Vượt calo |

### CSS Variables (khai báo trong `:root`)
```css
:root {
  --color-bg-base:       #1A1F12;
  --color-bg-surface:    #252C18;
  --color-bg-elevated:   #2E3820;
  --color-primary:       #4A5C2F;
  --color-primary-light: #6B7F45;

  --color-text-primary:  #F0EDE4;
  --color-text-secondary:#A8A89A;
  --color-text-muted:    #6B6B60;
  --color-border:        #3A4428;
  --color-border-light:  #4D5A36;

  --color-accent:        #E8722A;
  --color-accent-hover:  #D45F18;
  --color-accent-soft:   rgba(232, 114, 42, 0.10);
  --color-success:       #5A8A3E;
  --color-warning:       #D4A017;
  --color-danger:        #C0392B;
}
```

---

## 2. Typography

### Font Stack
```html
<!-- Nhúng vào <head> trong layout EJS -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```
```css
:root {
  --font-primary: 'Inter', sans-serif;   /* UI, body, label */
  --font-display: 'DM Sans', sans-serif; /* Số liệu lớn, tiêu đề hero */
}
```

### Thang kích thước chữ
| Token | Size | Weight | Dùng cho |
|---|---|---|---|
| `--text-xs`   | `11px` | 500 | Badge, tag nhỏ |
| `--text-sm`   | `13px` | 400 | Label form, metadata |
| `--text-base` | `15px` | 400 | Body text chính |
| `--text-md`   | `17px` | 500 | Sub-heading, card title |
| `--text-lg`   | `22px` | 600 | Section heading |
| `--text-xl`   | `28px` | 700 | Page title |
| `--text-2xl`  | `40px` | 800 | Số calo lớn trên dashboard |
| `--text-3xl`  | `56px` | 800 | Hero number (font: DM Sans) |

---

## 3. Spacing & Border Radius

### Spacing Scale (8px base grid)
```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

### Border Radius Scale
```css
:root {
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-2xl:  32px;
  --radius-full: 9999px;
}
```

### Quy tắc áp dụng cho Form
| Element | Border Radius | Padding | Border |
|---|---|---|---|
| `<input>`, `<select>` | `--radius-md` (12px) | `12px 16px` | `1px solid var(--color-border)` |
| `<textarea>` | `--radius-lg` (16px) | `14px 16px` | `1px solid var(--color-border)` |
| `.btn-primary` | `--radius-md` (12px) | `12px 24px` | none |
| `.btn-pill` | `--radius-full` | `10px 20px` | none |
| `.form-card` | `--radius-xl` (24px) | `--space-8` (32px) | `1px solid var(--color-border)` |

---

## 4. Card Hiển Thị Món Ăn (Food Card)

### Cấu trúc HTML
```html
<div class="food-card">
  <div class="food-card__image">
    <img src="..." alt="Tên món ăn">
    <span class="food-card__tag">Bữa sáng</span>
  </div>
  <div class="food-card__body">
    <h3 class="food-card__name">Cơm gà nướng</h3>
    <p class="food-card__desc">500g · 2 phần</p>
    <div class="food-card__macros">
      <span class="macro macro--protein">P: 42g</span>
      <span class="macro macro--carbs">C: 68g</span>
      <span class="macro macro--fat">F: 18g</span>
    </div>
  </div>
  <div class="food-card__footer">
    <span class="food-card__calories">580 <small>kcal</small></span>
    <button class="btn-icon" aria-label="Thêm vào nhật ký">+</button>
  </div>
</div>
```

### CSS Food Card
```css
.food-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.food-card:hover {
  border-color: var(--color-border-light);
  transform: translateY(-2px);
}
.food-card__image {
  position: relative;
  height: 160px;
  background: var(--color-bg-elevated);
}
.food-card__image img {
  width: 100%; height: 100%;
  object-fit: cover;
}
.food-card__tag {
  position: absolute;
  top: 12px; left: 12px;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 4px 10px;
  letter-spacing: 0.03em;
}
.food-card__body {
  padding: var(--space-5) var(--space-5) var(--space-3);
}
.food-card__name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}
.food-card__desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
}
.food-card__macros {
  display: flex;
  gap: var(--space-2);
}
.macro {
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}
.macro--protein { background: rgba(90,138,62,0.15);  color: var(--color-success); }
.macro--carbs   { background: rgba(212,160,23,0.15); color: var(--color-warning); }
.macro--fat     { background: rgba(232,114,42,0.12); color: var(--color-accent);  }
.food-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5) var(--space-5);
  border-top: 1px solid var(--color-border);
}
.food-card__calories {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-text-primary);
}
.food-card__calories small {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-weight: 400;
}
```

---

## 5. Bento Grid Dashboard — Theo Dõi Calo

### Sơ đồ Layout
```
┌────────────────────────────────────┬──────────────┐
│  [A] CALO HÔM NAY (hero số lớn)   │ [B] VÒNG    │
│  Consumed / Target / Remaining     │  TRÒN MACRO  │
├──────────────┬─────────────────────┤              │
│ [C] PROTEIN  │ [D] CARBS           ├──────────────┤
│  mini-card   │  mini-card          │ [E] FAT      │
├──────────────┴─────────────────────┼──────────────┤
│  [F] DANH SÁCH BỮA ĂN HÔM NAY     │ [G] CÂN      │
│  (list các food log entry)         │  NẶNG LOG    │
└────────────────────────────────────┴──────────────┘
```

### CSS Grid Bento
```css
.dashboard-bento {
  display: grid;
  grid-template-columns: 1fr 1fr 280px;
  grid-template-rows: auto auto 1fr;
  gap: var(--space-4);
  padding: var(--space-6);
}

/* [A] Hero Calo */
.bento-hero {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-8);
}

/* [B] Macro Donut Chart */
.bento-macro-chart {
  grid-column: 3 / 4;
  grid-row: 1 / 3;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
}

/* [C][D] Mini Macro Cards */
.bento-mini {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
}

/* [F] Danh sách bữa ăn */
.bento-meal-list {
  grid-column: 1 / 3;
  grid-row: 3 / 4;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
}

/* [G] Cân nặng log */
.bento-weight {
  grid-column: 3 / 4;
  grid-row: 3 / 4;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-6);
}
```

### Hero Card — Số Calo Lớn
```css
.calo-hero__number {
  font-family: var(--font-display);
  font-size: var(--text-3xl);  /* 56px */
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1;
}
.calo-hero__label {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-top: var(--space-1);
}
.calo-progress {
  height: 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  margin-top: var(--space-4);
  overflow: hidden;
}
.calo-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent), #F59E42);
  border-radius: var(--radius-full);
  transition: width 0.6s ease;
}
```

### Responsive Breakpoints
```css
@media (max-width: 1024px) {
  .dashboard-bento {
    grid-template-columns: 1fr 1fr;
  }
  .bento-hero        { grid-column: 1 / 3; }
  .bento-macro-chart { grid-column: 1 / 2; grid-row: auto; }
  .bento-meal-list   { grid-column: 1 / 3; }
  .bento-weight      { grid-column: 2 / 3; }
}
@media (max-width: 640px) {
  .dashboard-bento {
    grid-template-columns: 1fr;
    gap: var(--space-3);
    padding: var(--space-4);
  }
  .bento-hero,
  .bento-macro-chart,
  .bento-meal-list,
  .bento-weight { grid-column: 1 / 2; }
}
```

---

## 6. Components — Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}
.btn-primary {
  background: var(--color-accent);
  color: #fff;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(232,114,42,0.35);
}
.btn-secondary {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover {
  border-color: var(--color-border-light);
  background: var(--color-primary);
}
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.btn-ghost:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-light);
}
```

---

## 7. Quy Tắc Form Nhập Liệu

```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}
.form-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}
.form-input {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-base);
  color: var(--color-text-primary);
  font-family: var(--font-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
  width: 100%;
}
.form-input::placeholder { color: var(--color-text-muted); }
.form-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(232, 114, 42, 0.15);
}
.form-input:hover:not(:focus) {
  border-color: var(--color-border-light);
}
/* Input có icon bên trái */
.form-input-wrapper { position: relative; }
.form-input-wrapper .form-input { padding-left: 44px; }
.form-input-icon {
  position: absolute;
  left: 14px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}
/* Select */
.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A8A89A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}
/* Textarea */
.form-textarea {
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  resize: vertical;
  min-height: 100px;
}
/* Error state */
.form-input.is-error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.15);
}
.form-error-msg {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: var(--space-1);
}
/* Form card wrapper */
.form-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
}
```

---

## 8. Micro-animations

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.bento-card-animate { animation: fadeInUp 0.4s ease both; }
.bento-card-animate:nth-child(2) { animation-delay: 0.05s; }
.bento-card-animate:nth-child(3) { animation-delay: 0.10s; }
.bento-card-animate:nth-child(4) { animation-delay: 0.15s; }

@keyframes countUp {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
.calo-hero__number {
  animation: countUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes slideIn { from { width: 0%; } }
.calo-progress__fill {
  animation: slideIn 0.8s ease both;
  animation-delay: 0.3s;
}
```

---

## 9. Checklist Áp Dụng Vào Dự Án

- [ ] Tạo file `/public/css/design-tokens.css` — khai báo toàn bộ CSS variables
- [ ] Import vào layout chính: `@import './design-tokens.css'` trong `style.css`
- [ ] Cập nhật `views/partials/header.ejs` — thêm Google Fonts Inter + DM Sans
- [ ] Áp dụng `dashboard-bento` grid vào `views/diary/index.ejs`
- [ ] Áp dụng `.food-card` component vào danh sách món ăn
- [ ] Áp dụng `.form-input`, `.form-card` vào form nhập liệu (onboarding, log meal)
- [ ] Thêm class `bento-card-animate` vào các card để có animation fade-in khi load
