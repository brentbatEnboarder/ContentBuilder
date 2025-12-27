# Enboarder Design Guide

Design tokens and guidelines extracted from the official Enboarder Figma design system.

---

## Typography

- **Font Family**: Roboto (components), Inter (color swatches)
- **Font Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Base Text Color**: `#342F46`

| Style           | Size | Weight | Line Height | Usage                         |
| --------------- | ---- | ------ | ----------- | ----------------------------- |
| Display (3xl)   | 48px | 700    | 125% (60px) | Marketing, component titles   |
| Subheading (lg) | 20px | 500    | 125% (25px) | Modal headers, section titles |
| Body Default    | 16px | 400    | 140% (22px) | Primary body text             |
| Body Medium     | 16px | 500    | 140% (22px) | Button labels                 |
| Body Bold       | 16px | 700    | 140% (22px) | Emphasis                      |
| Label           | 14px | 400    | 125% (18px) | Form labels, badges           |
| Caption         | 12px | 400    | 130% (16px) | Hints, helper text            |

---

## Color Palette

### Grey Scale

| Name     | Hex       | HSL         | Usage                              |
| -------- | --------- | ----------- | ---------------------------------- |
| grey-50  | `#F6F7F9` | 220 20% 97% | Page backgrounds, hover states     |
| grey-100 | `#EFF0F4` | 228 18% 95% | Card backgrounds, subtle borders   |
| grey-200 | `#D5D7E1` | 228 18% 86% | Borders, dividers, disabled states |
| grey-300 | `#AEB0C5` | 235 15% 73% | Placeholder text, icons            |
| grey-400 | `#706E95` | 244 17% 51% | Secondary/muted text               |
| grey-900 | `#342F46` | 253 22% 23% | Primary text, headings             |
| white    | `#FFFFFF` | 0 0% 100%   | Backgrounds, cards                 |

### Brand (Purple)

| Name      | Hex       | HSL          | Usage                                             |
| --------- | --------- | ------------ | ------------------------------------------------- |
| brand-900 | `#68009F` | 280 100% 31% | Dark hover/pressed states                         |
| brand-800 | `#7C21CC` | 274 73% 46%  | **Primary brand color** - buttons, links, accents |
| brand-600 | `#9F42F1` | 274 86% 60%  | Focus rings, active states                        |
| brand-500 | `#BE75FE` | 274 99% 73%  | Lighter interactive elements                      |
| brand-400 | `#DCB6FF` | 274 100% 85% | Tags, badges background                           |
| brand-300 | `#E9D3FF` | 274 100% 91% | Light backgrounds                                 |
| brand-200 | `#F4E9FF` | 274 100% 95% | Subtle backgrounds                                |
| brand-100 | `#FAF5FF` | 274 100% 98% | Very subtle backgrounds                           |

### Info (Blue)

| Name     | Hex       | HSL          | Usage                   |
| -------- | --------- | ------------ | ----------------------- |
| info-900 | `#103186` | 226 79% 29%  | Dark info states        |
| info-800 | `#0049A8` | 214 100% 33% | Primary info color      |
| info-600 | `#3C82EC` | 216 83% 58%  | Info buttons, links     |
| info-500 | `#76ABFF` | 216 100% 73% | Info highlights         |
| info-400 | `#97BFFF` | 216 100% 80% | Light info elements     |
| info-300 | `#CADEFF` | 216 100% 89% | Info backgrounds        |
| info-200 | `#EDF3FF` | 216 100% 96% | Subtle info backgrounds |

### Success (Green/Teal)

| Name        | Hex       | HSL          | Usage                      |
| ----------- | --------- | ------------ | -------------------------- |
| success-900 | `#00634A` | 164 100% 19% | Dark success states        |
| success-800 | `#008161` | 164 100% 25% | Primary success color      |
| success-600 | `#009C7B` | 164 100% 31% | Success text on light bg   |
| success-500 | `#02B794` | 167 97% 36%  | Success highlights         |
| success-400 | `#9CE9D7` | 163 66% 76%  | Light success elements     |
| success-300 | `#CAF5EA` | 163 74% 88%  | Success backgrounds        |
| success-200 | `#E2F9F3` | 160 67% 93%  | Subtle success backgrounds |

### Warning (Orange)

| Name        | Hex       | HSL         | Usage                      |
| ----------- | --------- | ----------- | -------------------------- |
| warning-900 | `#D04700` | 21 100% 41% | Dark warning states        |
| warning-800 | `#DC5D05` | 24 96% 44%  | Primary warning color      |
| warning-600 | `#FF9838` | 29 100% 61% | Warning highlights         |
| warning-500 | `#FEB15A` | 33 99% 67%  | Light warning elements     |
| warning-400 | `#FDD99E` | 39 96% 81%  | Warning badges             |
| warning-300 | `#FDE8BE` | 42 94% 87%  | Warning backgrounds        |
| warning-200 | `#FEF5DF` | 45 93% 94%  | Subtle warning backgrounds |

### Error/Danger (Red)

| Name      | Hex       | HSL        | Usage                    |
| --------- | --------- | ---------- | ------------------------ |
| error-900 | `#B80B0B` | 0 89% 38%  | Dark error states        |
| error-800 | `#DB1E1E` | 0 77% 49%  | Primary error color      |
| error-600 | `#ED3E27` | 7 85% 54%  | Error highlights         |
| error-500 | `#FF715B` | 9 100% 68% | Light error elements     |
| error-400 | `#FFB8B8` | 0 100% 86% | Error badges             |
| error-300 | `#FCCCCC` | 0 85% 89%  | Error backgrounds        |
| error-200 | `#FEF3F3` | 0 85% 97%  | Subtle error backgrounds |

---

## Design Principles

### Surfaces & Backgrounds

| Element          | Sci-Fi Theme             | Enboarder Theme                       |
| ---------------- | ------------------------ | ------------------------------------- |
| Page background  | Dark gradient `#1a0a2e`  | Light solid `#F6F7F9`                 |
| Card background  | Glassmorphism `white/12` | Solid white `#FFFFFF`                 |
| Card border      | Glowing `white/20`       | Subtle `#D5D7E1` or `rgba(0,0,0,0.1)` |
| Elevated surface | Blurred backdrop         | Light shadow                          |

### Shadows

Enboarder uses subtle divider lines instead of heavy shadows:

```css
/* Row divider */
box-shadow: 0px -1px 0px rgba(0, 0, 0, 0.25);

/* Card shadow (if needed) */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Border Radius

Standard radius across the system:

- Cards, containers: `16px` (rounded-2xl)
- Buttons, inputs: `8px` (rounded-lg)
- Small elements: `4px` (rounded)

---

## Component Patterns

### Buttons

**Primary Button**

```css
background: #7c21cc;
color: #ffffff;
border-radius: 8px;
padding: 0px 12px;
height: 40px;
font-family: 'Roboto';
font-weight: 500;
font-size: 16px;
```

**Secondary/Ghost Button**

```css
background: transparent;
color: #706e95;
border-radius: 8px;
/* Icon + text pattern */
```

**Destructive Button**

```css
background: #db1e1e;
color: #ffffff;
```

**Disabled State**

```css
background: #d5d7e1;
color: #aeb0c5;
```

---

### Text Fields & Inputs

**Default State**

```css
background: #ffffff;
border: 1px solid #d5d7e1;
border-radius: 8px;
height: 40px; /* default */
height: 56px; /* large */
padding: 0px 12px;
font-size: 16px;
color: #342f46; /* filled */
color: #aeb0c5; /* placeholder */
```

**Hover State**

```css
border: 1px solid #9f42f1;
```

**Focus State** ⚡ Important!

```css
border: 1px solid #9f42f1;
box-shadow: 0px 0px 0px 2px #dcb6ff; /* Focus ring */
```

**Error State**

```css
border: 1px solid #ff715b; /* or #DB1E1E */
/* Validation message */
color: #db1e1e;
```

**Disabled State**

```css
background: #f6f7f9;
border: none;
color: #d5d7e1;
```

**Read-only State**

```css
background: #f6f7f9;
color: #342f46;
```

**Label & Hint Text**

```css
/* Label */
font-size: 14px;
color: #706e95;

/* Hint text (right-aligned) */
font-size: 12px;
color: #706e95;
```

---

### Checkboxes

**Unchecked**

```css
background: #ffffff;
border: 1px solid #d5d7e1;
border-radius: 6px;
width: 20px;
height: 20px;
```

**Checked**

```css
background: #7c21cc;
border: 1px solid #9f42f1;
border-radius: 4px;
/* White checkmark icon inside */
```

**Disabled**

```css
background: #f6f7f9;
border: 1px solid #d5d7e1;
```

---

### Radio Buttons

**Unselected**

```css
background: #ffffff;
border: 1px solid #d5d7e1;
border-radius: 50%;
width: 20px;
height: 20px;
```

**Hover (unselected)**

```css
background: #f4e9ff;
border: 1px solid #9f42f1;
```

**Selected**

```css
background: #7c21cc;
/* Inner circle: 10px, white dot or same purple */
```

**Focus**

```css
border: 1px solid #9f42f1;
box-shadow: 0px 0px 0px 2px #dcb6ff;
```

**Disabled Selected**

```css
background: #ffffff;
border: 2px solid #d5d7e1;
/* Inner dot: #D5D7E1 */
```

---

### Toasts / Notifications

**Info Toast**

```css
background: #edf3ff;
border: 1px solid #76abff;
box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
border-radius: 8px;
/* Icon color: #0049A8 */
```

**Warning Toast**

```css
background: #fef5df;
border: 1px solid #feb15a;
/* Icon color: #DC5D05 */
```

**Error Toast**

```css
background: #fef3f3;
border: 1px solid #ff715b;
/* Icon color: #DB1E1E */
```

**Success Toast**

```css
background: #e2f9f3;
border: 1px solid #02b794;
/* Icon color: #008161 */
```

**High Contrast Toast** (for busy backgrounds)

```css
background: #342f46;
border: 1px solid #342f46;
color: #ffffff;
/* Icon: white */
```

---

### Modals

**Modal Container**

```css
background: #ffffff;
box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
border-radius: 12px;
```

**Modal Content Area**

```css
padding: 24px;
gap: 16px;
```

**Modal Actions/Footer**

```css
padding: 0px 24px 24px;
/* Left action: ghost/text button */
/* Right actions: secondary + primary buttons */
```

**Close Button** (top-right)

```css
position: absolute;
right: 16px;
top: 16px;
width: 32px;
height: 32px;
/* X icon color: #706E95 */
```

---

### Badges

**Neutral Badge**

```css
background: #706e95;
color: #ffffff;
border-radius: 16px;
padding: 0px 4px;
font-size: 14px;
```

**Success Badge**

```css
background: #02b794;
color: #ffffff;
```

---

### Dropdown List Items

**Default**

```css
background: #ffffff;
padding: 8px;
border-radius: 4px;
color: #342f46;
```

**Hover**

```css
background: #f6f7f9;
color: #7c21cc;
```

**Selected**

```css
background: #ffffff;
color: #7c21cc;
/* Checkmark icon: #7C21CC */
```

**Disabled**

```css
color: #d5d7e1;
```

---

### Cards

**Standard Card**

```css
background: #ffffff;
border: 1px solid rgba(0, 0, 0, 0.1);
border-radius: 16px;
```

**No glow effects, backdrop blur, or gradient backgrounds** in Enboarder theme.

---

## CSS Variable Mapping

Reference for implementing the theme in `globals.css`:

```css
.theme-enboarder {
  /* ═══════════════════════════════════════════════════════════
     BASE COLORS
     ═══════════════════════════════════════════════════════════ */
  --background: 220 20% 97%; /* #F6F7F9 - page background */
  --foreground: 253 22% 23%; /* #342F46 - primary text */

  /* Card/surfaces */
  --card: 0 0% 100%; /* #FFFFFF */
  --card-foreground: 253 22% 23%; /* #342F46 */

  /* Popover/dropdowns */
  --popover: 0 0% 100%; /* #FFFFFF */
  --popover-foreground: 253 22% 23%; /* #342F46 */

  /* ═══════════════════════════════════════════════════════════
     BRAND COLORS
     ═══════════════════════════════════════════════════════════ */
  --primary: 274 73% 46%; /* #7C21CC - buttons, links */
  --primary-foreground: 0 0% 100%; /* white text on primary */
  --primary-hover: 280 100% 31%; /* #68009F - darker hover */

  /* Secondary/accent (lighter purple) */
  --secondary: 220 20% 97%; /* #F6F7F9 */
  --secondary-foreground: 253 22% 23%; /* #342F46 */

  /* ═══════════════════════════════════════════════════════════
     FORM ELEMENTS
     ═══════════════════════════════════════════════════════════ */
  --border: 228 18% 86%; /* #D5D7E1 - default borders */
  --input: 228 18% 86%; /* #D5D7E1 - input borders */
  --input-focus: 274 86% 60%; /* #9F42F1 - focus border */
  --ring: 274 100% 85%; /* #DCB6FF - focus ring */

  /* Placeholder & muted text */
  --muted: 220 20% 97%; /* #F6F7F9 */
  --muted-foreground: 244 17% 51%; /* #706E95 - labels, hints */
  --placeholder: 235 15% 73%; /* #AEB0C5 */

  /* Accent (hover states) */
  --accent: 220 20% 97%; /* #F6F7F9 - hover background */
  --accent-foreground: 274 73% 46%; /* #7C21CC - hover text */

  /* ═══════════════════════════════════════════════════════════
     STATUS COLORS
     ═══════════════════════════════════════════════════════════ */
  /* Destructive/Error */
  --destructive: 0 77% 49%; /* #DB1E1E */
  --destructive-foreground: 0 0% 100%;
  --error-border: 9 100% 68%; /* #FF715B */
  --error-bg: 0 85% 97%; /* #FEF3F3 */

  /* Success */
  --success: 164 100% 25%; /* #008161 */
  --success-foreground: 0 0% 100%;
  --success-border: 167 97% 36%; /* #02B794 */
  --success-bg: 160 67% 93%; /* #E2F9F3 */

  /* Warning */
  --warning: 24 96% 44%; /* #DC5D05 */
  --warning-foreground: 253 22% 23%;
  --warning-border: 33 99% 67%; /* #FEB15A */
  --warning-bg: 45 93% 94%; /* #FEF5DF */

  /* Info */
  --info: 214 100% 33%; /* #0049A8 */
  --info-foreground: 0 0% 100%;
  --info-border: 216 100% 73%; /* #76ABFF */
  --info-bg: 216 100% 96%; /* #EDF3FF */

  /* ═══════════════════════════════════════════════════════════
     DISABLED STATES
     ═══════════════════════════════════════════════════════════ */
  --disabled-bg: 220 20% 97%; /* #F6F7F9 */
  --disabled-text: 228 18% 86%; /* #D5D7E1 */
  --disabled-border: 228 18% 86%; /* #D5D7E1 */

  /* ═══════════════════════════════════════════════════════════
     SCI-FI THEME OVERRIDES (disable effects)
     ═══════════════════════════════════════════════════════════ */
  --glow-primary: transparent;
  --glow-accent: transparent;
  --glass-bg: 0 0% 100%; /* Solid white, no transparency */
  --glass-border: 0 0% 0% / 0.1; /* Subtle black border */
  --surface-dark: 0 0% 100%; /* White instead of dark purple */

  /* Particles/animations - use neutral or disable */
  --particle-1: 228 18% 86%; /* grey-200 instead of purple */
  --particle-2: 235 15% 73%; /* grey-300 instead of fuchsia */

  /* ═══════════════════════════════════════════════════════════
     SHADOWS
     ═══════════════════════════════════════════════════════════ */
  --shadow-elevation: 0px 2px 10px rgba(0, 0, 0, 0.1);
  --shadow-divider: 0px -1px 0px rgba(0, 0, 0, 0.25);

  /* ═══════════════════════════════════════════════════════════
     BORDER RADIUS
     ═══════════════════════════════════════════════════════════ */
  --radius: 0.5rem; /* 8px - default */
  --radius-sm: 0.25rem; /* 4px */
  --radius-md: 0.5rem; /* 8px */
  --radius-lg: 0.75rem; /* 12px - modals */
  --radius-xl: 1rem; /* 16px - cards, badges */
}
```

---

## Key Differences: Sci-Fi vs Enboarder

| Aspect     | Sci-Fi                     | Enboarder                |
| ---------- | -------------------------- | ------------------------ |
| Background | Dark purple gradients      | Light grey/white         |
| Cards      | Glassmorphism, blur        | Solid white with borders |
| Glows      | Purple/pink glow effects   | None                     |
| Animations | Particles, neural networks | Subtle/none              |
| Typography | Can use lighter weights    | Inter 400/600/700        |
| Shadows    | Colored glow shadows       | Neutral subtle shadows   |
| Borders    | White with opacity         | Grey or subtle black     |
