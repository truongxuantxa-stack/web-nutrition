# Design System Inspired by That Clean Life

## 1. Visual Theme & Atmosphere

That Clean Life embodies a clean, professional, and health-forward aesthetic designed for nutrition professionals and their clients. The design balances a calming, trust-building color palette with vibrant accent colors that convey energy and positive health outcomes. The visual language prioritizes clarity and usability, with generous whitespace, precise typography, and subtle depth to guide users through complex nutritional data. The overall atmosphere is modern, approachable, and grounded in wellness—conveying both scientific rigor and accessible guidance.

**Key Characteristics**
- Deep teal and navy primary palette suggesting stability, professionalism, and healthcare credibility
- Vibrant green accents representing health, vitality, and positive outcomes
- Clean, minimal aesthetic with ample whitespace and breathing room
- Sophisticated but accessible typography hierarchy
- Subtle shadows and elevation for depth without visual noise
- Health and wellness-forward color psychology throughout
- Professional yet approachable tone suitable for practitioners and clients alike

## 2. Color Palette & Roles

### Primary
- **Deep Teal** (`#003139`): Primary brand color, highest contrast actions, hero sections, strong CTAs
- **Teal Slate** (`#244348`): Secondary primary, navigation, card backgrounds, text emphasis
- **Navy Deep** (`#01272E`): Darkest primary variant, footer backgrounds, high-contrast text
- **Navy Alt** (`#002126`): Alternative deep navy, section backgrounds, subtle layering

### Accent Colors
- **Health Green** (`#5FE089`): Success state, positive actions, vitality indicators, wellness highlights
- **Complementary Green** (`#2EA850`): Success confirmations, secondary wellness actions, achievement states

### Interactive
- **Primary CTA** (`#003139`): Button fills, primary navigation active states, leading interactions
- **Secondary Interactive** (`#244348`): Secondary buttons, alternative interactions, hover states
- **Teal Ghost** (`#244348`): Ghost button text and borders for minimal interactions

### Neutral Scale
- **Off White** (`#FFFFFF`): Primary background, card surfaces, main content area
- **Light Gray** (`#F0F2F3`): Subtle background distinction, light section separation
- **Neutral Gray** (`#DFE3E4`): Border lines, dividers, subtle UI separation
- **Medium Gray** (`#C1C9CB`): Input borders, disabled states, secondary borders
- **Dark Charcoal** (`#222222`): Body text (rare), contrast text alternative
- **Black** (`#000000`): Maximum contrast text, emphasis (minimal use)

### Surface & Borders
- **Card Surface** (`#003139`): Dark card backgrounds, elevated content containers
- **Border Light** (`#DFE3E4`): Input borders, light dividers, subtle separation
- **Border Medium** (`#96A5A8`): Form inputs, secondary borders, soft boundaries

### Semantic / Status
- **Success** (`#2EA850`): Confirmations, positive states, achieved actions
- **Overlay Dark** (`#0009`): Semi-transparent overlay for modals and overlays

## 3. Typography Rules

### Font Family
**Primary Font:** Inter (Google Fonts)
- Fallback stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Secondary Font:** Inter (same as primary for consistency)
- Fallback stack: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display | Inter | 80px | 700 | 96px | 0px | Hero headlines, page titles |
| Heading 1 | Inter | 56px | 700 | 67.2px | 0px | Section headings, major titles |
| Heading 2 | Inter | 46px | 700 | 55.2px | 0px | Subsection headings, feature titles |
| Heading 3 | Inter | 24px | 700 | 28.8px | 0px | Card titles, smaller headings |
| Body | Inter | 20px | 400 | 36px | 0px | Main body copy, descriptions |
| Body Small | Inter | 18px | 400 | 22.5px | 0px | Form labels, smaller text |
| Link | Inter | 16px | 400 | 28.8px | 0px | Navigation links, hyperlinks |
| Button | Inter | 14px | 400 | 14px | 0px | Button text, action labels |
| Caption | Inter | 14px | 400 | 22.4px | 0px | Small descriptive text, captions |
| Input | Inter | 18px | 400 | normal | 0px | Form input text, user entry |

### Principles
- Clean, geometric sans-serif for professional and accessible communication
- Deliberate size jumps create clear visual hierarchy without excessive steps
- Generous line heights (1.2x to 1.8x font size) ensure readability and breathing room
- Weight variation (400 regular, 500 semibold, 700 bold) provides subtle emphasis without heaviness
- Consistent letter spacing with minimal kerning adjustments needed
- Typography reinforces health and wellness messaging through clarity and openness

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `#003139`
- **Text Color:** `#FFFFFF`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `8px 11.2px`
- **Border Radius:** `6px`
- **Border:** `0px none`
- **Height:** `32px`
- **Line Height:** `14px`
- **Hover State:** Background `#244348`, shadow `rgba(21, 23, 29, 0.15) 0px 2px 8px 0px`
- **Active State:** Background `#002126`
- **Disabled State:** Background `#C1C9CB`, text `#FFFFFF`, opacity `0.6`

#### Secondary Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#003139`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `8px 11.2px`
- **Border Radius:** `6px`
- **Border:** `1px solid #003139`
- **Height:** `32px`
- **Line Height:** `14px`
- **Hover State:** Background `#F0F2F3`, border `#003139`
- **Active State:** Background `#DFE3E4`
- **Disabled State:** Border `#C1C9CB`, text `#C1C9CB`

#### Ghost Button
- **Background:** `rgba(0, 0, 0, 0)` (transparent)
- **Text Color:** `#003139`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `8px 11.2px`
- **Border Radius:** `6px`
- **Border:** `1px solid #003139`
- **Height:** `32px`
- **Line Height:** `14px`
- **Hover State:** Background `rgba(0, 49, 57, 0.08)`
- **Active State:** Background `rgba(0, 49, 57, 0.12)`

#### Success Button
- **Background:** `#2EA850`
- **Text Color:** `#FFFFFF`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `8px 11.2px`
- **Border Radius:** `6px`
- **Border:** `0px none`
- **Height:** `32px`
- **Line Height:** `14px`
- **Hover State:** Background `#28963f`, shadow `rgba(46, 168, 80, 0.25) 0px 4px 12px 0px`
- **Active State:** Background `#1f7a30`

### Cards & Containers

#### Primary Card
- **Background:** `#003139`
- **Text Color:** `#FFFFFF`
- **Padding:** `40px`
- **Border Radius:** `16px`
- **Border:** `0px none`
- **Box Shadow:** `rgba(21, 23, 29, 0.25) 0px 2px 5px 0px`
- **Font Size:** `16px`
- **Line Height:** `28.8px`
- **Hover State:** Box shadow `rgba(21, 23, 29, 0.35) 0px 4px 12px 0px`

#### Secondary Card
- **Background:** `#F0F2F3`
- **Text Color:** `#003139`
- **Padding:** `40px`
- **Border Radius:** `16px`
- **Border:** `1px solid #DFE3E4`
- **Box Shadow:** `rgba(21, 23, 29, 0.1) 0px 0px 5px 0px`
- **Font Size:** `16px`
- **Line Height:** `28.8px`

#### Light Card / Container
- **Background:** `#FFFFFF`
- **Text Color:** `#003139`
- **Padding:** `40px`
- **Border Radius:** `16px`
- **Border:** `1px solid #DFE3E4`
- **Box Shadow:** `rgba(21, 23, 29, 0.1) 0px 0px 5px 0px`
- **Font Size:** `16px`
- **Line Height:** `28.8px`

### Inputs & Forms

#### Text Input Default
- **Background:** `#FFFFFF`
- **Text Color:** `#244348`
- **Font Size:** `18px`
- **Font Weight:** `400`
- **Padding:** `0px 12px`
- **Border Radius:** `0px`
- **Border:** `1px solid #C1C9CB`
- **Height:** `40px`
- **Line Height:** `18px`
- **Focus State:** Border `#003139`, box shadow `0px 0px 0px 2px rgba(0, 49, 57, 0.1)`
- **Placeholder Color:** `#96A5A8`
- **Disabled State:** Background `#F0F2F3`, border `#DFE3E4`, text `#C1C9CB`

#### Textarea
- **Background:** `#FFFFFF`
- **Text Color:** `#244348`
- **Font Size:** `18px`
- **Font Weight:** `400`
- **Padding:** `12px`
- **Border Radius:** `4px`
- **Border:** `1px solid #C1C9CB`
- **Min Height:** `120px`
- **Line Height:** `22.5px`
- **Focus State:** Border `#003139`, box shadow `0px 0px 0px 2px rgba(0, 49, 57, 0.1)`

#### Checkbox
- **Width:** `18px`
- **Height:** `18px`
- **Border Radius:** `4px`
- **Border:** `1px solid #C1C9CB`
- **Background Checked:** `#003139`
- **Checkmark Color:** `#FFFFFF`
- **Focus State:** Box shadow `0px 0px 0px 2px rgba(0, 49, 57, 0.2)`

#### Label
- **Font Size:** `18px`
- **Font Weight:** `500`
- **Line Height:** `22.5px`
- **Color:** `#003139`
- **Margin Bottom:** `8px`

### Navigation

#### Main Navigation Bar
- **Background:** `#FFFFFF`
- **Height:** `64px`
- **Padding:** `16px 40px`
- **Border Bottom:** `1px solid #DFE3E4`
- **Box Shadow:** `none`

#### Navigation Link (Default)
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Color:** `#244348`
- **Line Height:** `28.8px`
- **Padding:** `8px 16px`
- **Text Decoration:** `none`
- **Hover State:** Color `#003139`, background `rgba(0, 49, 57, 0.05)`
- **Active State:** Color `#003139`, font weight `600`, bottom border `2px solid #003139`

#### Breadcrumb Navigation
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Color:** `#96A5A8`
- **Separator:** `#96A5A8` ("/" or "›")
- **Active Link Color:** `#003139`
- **Padding:** `8px 0px`

### Badges

#### Primary Badge
- **Background:** `#003139`
- **Text Color:** `#FFFFFF`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Padding:** `4px 12px`
- **Border Radius:** `300px`
- **Display:** `inline-block`

#### Success Badge
- **Background:** `#2EA850`
- **Text Color:** `#FFFFFF`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Padding:** `4px 12px`
- **Border Radius:** `300px`

#### Neutral Badge
- **Background:** `#F0F2F3`
- **Text Color:** `#244348`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Padding:** `4px 12px`
- **Border Radius:** `300px`
- **Border:** `1px solid #DFE3E4`

### Links

#### Text Link (Primary)
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Color:** `#2EA850`
- **Text Decoration:** `underline`
- **Line Height:** `28.8px`
- **Hover State:** Color `#28963f`, text decoration `underline`
- **Active State:** Color `#1f7a30`

#### Text Link (Secondary)
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Color:** `#003139`
- **Text Decoration:** `underline`
- **Line Height:** `28.8px`
- **Hover State:** Color `#244348`

#### Inline Link Button
- **Background:** `#F0F2F3`
- **Text Color:** `#003139`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Padding:** `6.4px 12px`
- **Border Radius:** `6px`
- **Height:** `32px`
- **Line Height:** `22.4px`
- **Hover State:** Background `#DFE3E4`

## 5. Layout Principles

### Spacing System

The spacing system uses a base unit of `4px` with a modular scale for consistent rhythm and alignment.

- **Micro spaces:** `4px`, `8px` — Form fields, tight component clusters, icon spacing
- **Small spaces:** `12px`, `16px` — Component padding, section dividers, text grouping
- **Medium spaces:** `20px`, `24px` — Card padding, content sections, vertical rhythm
- **Large spaces:** `32px`, `40px` — Major section padding, container breathing room
- **XL spaces:** `48px`, `76px`, `80px` — Section separation, hero spacing, page-level margins

**Usage Context:**
- Input fields and buttons: `8px` to `12px` internal padding
- Cards and containers: `40px` padding
- Section margins: `48px` to `80px` vertical spacing
- Grid gaps: `16px` to `24px` between elements

### Grid & Container

- **Max Width:** `1200px` for content containers
- **Side Margins:** `40px` on desktop (responsive)
- **Column Strategy:** 12-column flexible grid with 16px gutters
- **Container Padding:** `40px` on desktop, `24px` on tablet, `16px` on mobile
- **Nested Sections:** Full-width sections with internal content containers at max width
- **Section Patterns:** Hero (full width), Feature Rows (alternating left/right), Card Grids (3-4 columns)

### Whitespace Philosophy

Generous whitespace is fundamental to That Clean Life's design language. Ample breathing room around content creates visual clarity and reduces cognitive load—essential for nutrition professionals managing complex data. Whitespace balances density with legibility; cards and sections are separated by consistent margins, and internal padding within components prevents visual cramping. This creates an open, accessible, and professional aesthetic that supports focus and comprehension.

### Border Radius Scale

- **Sharp:** `0px` — Form inputs, minimal UI elements, technical components
- **Subtle:** `4px` — Small cards, minor UI elements, inputs in some contexts
- **Standard:** `6px` — Buttons, badges, pill-shaped containers, consistent component rounding
- **Rounded:** `16px` — Primary cards, elevated containers, feature cards
- **Full Rounded:** `24px` — Large cards, special emphasis containers
- **Pill:** `300px` — Badges, fully rounded buttons, inline labels
- **Top Rounded:** `32px 32px 0px 0px` — Image containers, modals with image headers

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, `box-shadow: none` | Form inputs, subtle UI, backgrounds |
| Raised | `rgba(21, 23, 29, 0.1) 0px 0px 5px 0px` | Secondary cards, light elevation, subtle containers |
| Elevated | `rgba(21, 23, 29, 0.25) 0px 2px 5px 0px` | Primary cards, primary containers, standard depth |
| Floating | `rgba(21, 23, 29, 0.1) 0px 0px 15px 0px` | Dropdowns, tooltips, floating UI elements |
| Deep | `rgba(21, 23, 29, 0.35) 0px 4px 12px 0px` | Hover cards, interactive elevation, emphasis |
| Focus | `0px 0px 0px 2px rgba(0, 49, 57, 0.1)` | Form focus states, active inputs, keyboard navigation |

**Shadow Philosophy:**
Shadows are subtle and used sparingly to establish depth hierarchy without visual noise. Elevation is used primarily to distinguish interactive or prominent content (cards, dropdowns, buttons on hover) from static backgrounds. Dark overlays and shadows reflect the professional healthcare context, with soft diffusion and minimal spread to maintain clarity. Shadows always include slight blur radius for natural, realistic depth.

## 7. Do's and Don'ts

### Do
- Use the teal primary palette (`#003139`, `#244348`) for all main CTAs and primary interactions
- Ensure minimum `44px` height for button touch targets on touch devices
- Pair dark teal cards with white text for maximum readability and contrast
- Use the health green (`#2EA850`) exclusively for success states and positive outcomes
- Maintain `16px` minimum line height for body text to ensure readability
- Apply generous padding (`40px`) to cards and containers for breathing room
- Use Inter font exclusively with specific weights (400, 500, 700) for hierarchy
- Stack elements vertically with consistent `48px` to `80px` spacing in hero sections
- Apply subtle shadows (`rgba(21, 23, 29, 0.25) 0px 2px 5px 0px`) for card elevation
- Test all forms and inputs with proper focus states showing `#003139` border highlighting

### Don't
- Use both teal colors interchangeably—establish hierarchy with primary (`#003139`) and secondary (`#244348`)
- Apply shadows heavier than `0.35` opacity or blur radius greater than `12px`—maintain subtlety
- Create buttons smaller than `32px` height; accessibility and touch targets must be honored
- Mix font families—Inter is the exclusive typeface family
- Apply rounded corners smaller than `4px` or larger than `300px` without design justification
- Use the green accent (`#5FE089` or `#2EA850`) for anything other than success, vitality, or positive states
- Override line heights below `1.2x` font size—maintain readability across all text
- Create cards with padding smaller than `24px` or inputs without visible focus states
- Reduce contrast below WCAG AA standards (`4.5:1` for text, `3:1` for UI components)
- Apply multiple shadows stacked together—use single, well-considered shadow values

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes | Column Count |
|------|-------|-------------|--------------|
| Mobile | 320px – 480px | Single column, full-width containers, `16px` padding, font sizes -2px | 1 |
| Tablet | 481px – 768px | 2 columns, `24px` padding, navigation collapses to hamburger, `80px` display font → `56px` | 2 |
| Desktop | 769px – 1024px | 3 columns, `40px` padding, full navigation, standard typography | 3 |
| Large | 1025px+ | 4 columns, max-width containers at `1200px`, optimized spacing, `80px` display font | 4 |

### Touch Targets

- **Minimum Size:** `44px × 44px` for all interactive elements (buttons, links, inputs)
- **Spacing Between Targets:** Minimum `8px` to prevent accidental activation
- **Button Padding:** Minimum `8px` horizontal, `8px` vertical to meet touch requirements
- **Link Padding:** Minimum `12px` horizontal, `8px` vertical
- **Form Inputs:** Minimum height `40px`, minimum width `200px`
- **Checkbox / Radio:** `18px × 18px` with `8px` padding around clickable area

### Collapsing Strategy

- **Hero Section:** Display font reduces from `80px` to `56px` on tablet, `40px` on mobile
- **Headings:** H1 (`56px`) → H2 (`40px`) → H3 (`32px`) at each breakpoint
- **Body Copy:** `20px` → `18px` → `16px` maintaining `1.8x` line height
- **Cards:** 3-column grid → 2-column on tablet → 1-column on mobile with full width
- **Navigation:** Horizontal menu with `16px` spacing → hamburger menu at `768px`
- **Padding:** `40px` desktop → `24px` tablet → `16px` mobile
- **Margins:** `80px` section spacing → `48px` tablet → `32px` mobile
- **Forms:** 2-column input layout → stacked single column below `768px`
- **Images:** Constrained to container width, aspect ratio maintained, max-width `100%`

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Deep Teal (`#003139`)
- **Secondary CTA:** Teal Slate (`#244348`)
- **Success / Health:** Health Green (`#2EA850`)
- **Background:** Off White (`#FFFFFF`)
- **Card Background (Dark):** Deep Teal (`#003139`)
- **Card Background (Light):** Light Gray (`#F0F2F3`)
- **Heading Text:** Dark Teal (`#003139`)
- **Body Text:** Teal Slate (`#244348`)
- **Borders & Dividers:** Neutral Gray (`#DFE3E4`)
- **Input Borders:** Medium Gray (`#C1C9CB`)
- **Secondary Text:** Border Medium (`#96A5A8`)

### Iteration Guide

1. **Color Foundation:** All primary interactions use `#003139` (Deep Teal). Secondary interactions use `#244348`. Success states always use `#2EA850`. Never mix teal variants randomly—establish clear hierarchy.

2. **Typography Lock:** Inter font exclusively. Display: `80px / 700 / 96px line`. H1: `56px / 700 / 67.2px line`. Body: `20px / 400 / 36px line`. Button: `14px / 400 / 14px line`. Do not deviate from these sizes without breakpoint adaptation.

3. **Spacing Rhythm:** Base unit `4px` scale: use `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px` for padding/margins. Section spacing: `48px` (default), `76px` (emphasis), `80px` (hero). Never use arbitrary spacing values.

4. **Component Padding:** Buttons: `8px 11.2px`. Cards: `40px`. Form inputs: `0px 12px` (horizontal only). Use these consistently—components should feel rhythmically aligned.

5. **Elevation & Shadow:** Cards use `rgba(21, 23, 29, 0.25) 0px 2px 5px 0px`. Hover cards: `rgba(21, 23, 29, 0.35) 0px 4px 12px 0px`. Inputs/fields: flat shadow or focus state `0px 0px 0px 2px rgba(0, 49, 57, 0.1)`. Shadow should feel subtle, never dominating.

6. **Border Radius Consistency:** Buttons & badges: `6px`. Cards: `16px`. Special containers: `24px`. Form inputs: `0px` (sharp) unless styled differently. Pills & fully rounded: `300px`. Maintain these—mixing radius values feels disconnected.

7. **Interactive States:** Primary buttons: `#003139` default → `#244348` hover → `#002126` active. Secondary buttons: transparent with `#003139` border → `#F0F2F3` background on hover. All interactive elements need visible hover/focus states.

8. **Form Field Styling:** Inputs: `#FFFFFF` background, `#244348` text, `1px solid #C1C9CB` border, `18px` font, `40px` height. Focus: border `#003139` + `0px 0px 0px 2px rgba(0, 49, 57, 0.1)` shadow. Labels: `18px / 500 / #003139`.

9. **Responsive Breakpoints:** Mobile (320–480px): single column, `16px` padding. Tablet (481–768px): 2 columns, `24px` padding, hamburger nav. Desktop (769px+): 3–4 columns, `40px` padding, full nav. Always test button sizes remain `44px` minimum on touch.

10. **Accessibility Minimum:** Text contrast `#003139` on `#FFFFFF` = `10.8:1` (AAA compliant). Text contrast `#244348` on light backgrounds ≥ `7:1` (AA compliant). All interactive elements have focus states. All form inputs labeled. Color is never the sole indicator—always include text or icons.