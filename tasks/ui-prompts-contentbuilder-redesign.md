# ContentBuilder UI Redesign - AI Frontend Prompts

> **Purpose**: Multi-stage prompts for AI frontend tools (v0, Lovable, etc.) to build the redesigned ContentBuilder interface.
>
> **Created**: December 29, 2024
>
> **Design Decisions**:
> - Collapsible left navigation (icons only ↔ icons + labels)
> - Nav items replace main content (not overlays/drawers)
> - 40/60 split for Chat + Preview in page editor
> - Unified toolbar at top of preview pane
> - Desktop-only (1280px+ viewport)

---

## How to Use These Prompts

1. **Copy one stage at a time** - Each stage is marked with clear cut lines
2. **Paste into your AI tool** (v0.dev, Lovable.ai, etc.)
3. **Review the output** before moving to the next stage
4. **Iterate if needed** - Ask the AI to adjust specific parts
5. **Proceed to next stage** only when satisfied

---

## Quick Reference: What Each Stage Builds

| Stage | What It Builds | Key Components |
|-------|----------------|----------------|
| 1 | App Shell + Navigation | Layout, LeftNav, NavItem, UserMenu |
| 2 | Settings Screens | CompanyInfo, BrandVoice, ImageStyle |
| 3 | Pages Screen | PagesList, PageCard, Search, Empty State |
| 4 | Page Editor | Chat + Preview split, Toolbar, Input |

---

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- STAGE 1: APP SHELL & NAVIGATION                                              -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

## Stage 1: App Shell & Navigation

### ✂️ --- CUT HERE - START OF PROMPT --- ✂️

```markdown
# ContentBuilder - Stage 1: App Shell & Navigation

## Project Context

Build the foundational shell for a desktop-first AI content generation application. This stage creates the main layout structure and collapsible left navigation.

### Tech Stack
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS with shadcn/ui components
- Lucide React icons
- Desktop-optimized (1280px+ viewport, no mobile responsiveness)

### Design System (Enboarder Theme)

/* Colors */
--primary: #7C21CC;        /* Purple - buttons, active states */
--primary-hover: #68009F;  /* Darker purple - hover states */
--primary-light: #F4E9FF;  /* Light purple - hover backgrounds */
--focus-ring: #DCB6FF;     /* Purple - focus rings */
--background: #F6F7F9;     /* Light grey - page background */
--card: #FFFFFF;           /* White - cards, nav, surfaces */
--text-primary: #342F46;   /* Dark - headings, body text */
--text-muted: #706E95;     /* Grey - secondary text, labels */
--border: #D5D7E1;         /* Light grey - borders, dividers */
--success: #008161;        /* Teal - success states */
--error: #DB1E1E;          /* Red - error states */

/* Typography */
font-family: 'Roboto', sans-serif;
font-weights: 400 (regular), 500 (medium), 700 (bold);

/* Border Radius */
--radius-sm: 4px;   /* Small elements */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 16px;  /* Cards, containers */

/* No glow effects, gradients, or decorative animations */

---

## High-Level Goal

Create the app shell with:
1. Full-viewport layout (100vw × 100vh)
2. Collapsible left navigation bar
3. Dynamic main content area (placeholder for now)

---

## Layout Structure

┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  LEFT NAV              │           MAIN CONTENT AREA                   │
│  (64px collapsed)      │           (placeholder for now)               │
│  (240px expanded)      │                                               │
│                        │                                               │
│  ┌──────────────────┐  │     ┌────────────────────────────────────┐   │
│  │ [«] Toggle       │  │     │                                    │   │
│  ├──────────────────┤  │     │                                    │   │
│  │ [+] New Page     │  │     │     Content screens will go here   │   │
│  ├──────────────────┤  │     │                                    │   │
│  │ 🏢 Company Info  │  │     │     (Stage 2-4)                    │   │
│  ├──────────────────┤  │     │                                    │   │
│  │ 🎚️ Brand Voice   │  │     │                                    │   │
│  ├──────────────────┤  │     │                                    │   │
│  │ 🎨 Image Style   │  │     │                                    │   │
│  ├──────────────────┤  │     │                                    │   │
│  │ 📄 Pages         │  │     │                                    │   │
│  │                  │  │     │                                    │   │
│  │    (spacer)      │  │     └────────────────────────────────────┘   │
│  │                  │  │                                               │
│  ├──────────────────┤  │                                               │
│  │ 👤 User          │  │                                               │
│  │    Logout        │  │                                               │
│  └──────────────────┘  │                                               │
│                        │                                               │
└────────────────────────────────────────────────────────────────────────┘

---

## Detailed Requirements

### 1. App Layout Container

- Full viewport: `min-h-screen w-full`
- Background: `#F6F7F9`
- CSS Grid or Flexbox layout
- Two areas: left nav (fixed width) + main content (flex-1)

### 2. Left Navigation Bar

#### 2.1 Container
- Fixed to left side
- Height: 100vh
- Background: `#FFFFFF`
- Right border: `1px solid #D5D7E1`
- Padding: `16px 12px`
- Flex column layout with space-between (nav items top, user bottom)
- **Collapsed width**: 64px
- **Expanded width**: 240px
- Smooth transition: `transition-all duration-300 ease-in-out`

#### 2.2 Toggle Button (Top)
- Position: First item in nav
- Collapsed: `ChevronsRight` icon (indicates "expand")
- Expanded: `ChevronsLeft` icon (indicates "collapse")
- Style: Ghost button, centered when collapsed, left-aligned when expanded
- Click toggles nav state

#### 2.3 Navigation Items

Create these nav items in order:

| Icon (Lucide) | Label | Type | Notes |
|---------------|-------|------|-------|
| `FilePlus` | "New Page" | Primary CTA | Purple background, white text |
| `Building2` | "Company Info" | Nav item | Standard styling |
| `SlidersHorizontal` | "Brand Voice" | Nav item | Standard styling |
| `Palette` | "Image Style" | Nav item | Standard styling |
| `FileText` | "Pages" | Nav item | Standard styling |

**"New Page" Button Styling:**
background: #7C21CC;
color: white;
padding: 10px 16px;
border-radius: 8px;
font-weight: 500;
/* Hover */
background: #68009F;

**Standard Nav Item Styling:**
/* Default */
background: transparent;
color: #706E95;
padding: 10px 16px;
border-radius: 8px;
display: flex;
align-items: center;
gap: 12px;
width: 100%;
text-align: left;

/* Hover */
background: #F4E9FF;
color: #7C21CC;

/* Active/Selected */
background: #F4E9FF;
color: #7C21CC;
border-left: 3px solid #7C21CC;
/* Adjust padding to account for border */

**Collapsed State:**
- Only show icons, centered
- Tooltip on hover showing label (optional)
- "New Page" shows only `+` icon

**Expanded State:**
- Icon + label visible
- Left-aligned

#### 2.4 User Section (Bottom)

Pinned to bottom of nav with `margin-top: auto`:

- **Avatar**: 36px circle with user initials, purple background (`#7C21CC`), white text
- **Expanded shows**:
  - User name (font-weight: 500)
  - Email below (text-muted, smaller, truncate if long)
- **Logout button**:
  - `LogOut` icon
  - Visible on hover of user section OR always visible as icon
  - Ghost/text button style
  - Collapsed: Only logout icon visible below avatar

Expanded:                    Collapsed:
┌────────────────────────┐   ┌────────┐
│ [BP]  Brent Pearson    │   │  [BP]  │
│       brent@acme.com   │   │  [→]   │
│              [Logout]  │   └────────┘
└────────────────────────┘

### 3. Main Content Area

For this stage, just create a placeholder:

<main className="flex-1 p-8">
  <div className="h-full flex items-center justify-center text-muted-foreground">
    <p>Select an item from the navigation</p>
  </div>
</main>

### 4. Navigation State Management

Create a simple state to track:
- `isNavCollapsed: boolean` - controls nav width
- `activeScreen: 'new-page' | 'company' | 'voice' | 'style' | 'pages'`

When nav item is clicked, update `activeScreen`. The content will be built in later stages.

---

## Component Structure

src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Main shell component
│   │   ├── LeftNav.tsx        # Navigation container
│   │   ├── NavItem.tsx        # Reusable nav item button
│   │   └── UserMenu.tsx       # User avatar + logout
│   └── ui/
│       └── (shadcn components)
├── hooks/
│   └── useNavigation.ts       # Nav state management
└── App.tsx                    # Root component

---

## Acceptance Criteria

1. Nav collapses/expands smoothly on toggle click
2. Nav items highlight on hover and show active state when selected
3. "New Page" button is visually distinct (purple CTA)
4. User section stays pinned to bottom
5. Collapsed state shows only icons, centered
6. Expanded state shows icons + labels
7. Main content area fills remaining space

---

## DO NOT:
- Add actual content screens yet (Stage 2-4)
- Add routing - use state-based screen switching
- Add mobile responsiveness
- Use dark mode
- Add glow effects or gradients
```

### ✂️ --- CUT HERE - END OF PROMPT --- ✂️

---

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- STAGE 2: SETTINGS SCREENS                                                    -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

## Stage 2: Settings Screens (Company, Voice, Style)

### ✂️ --- CUT HERE - START OF PROMPT --- ✂️

```markdown
# ContentBuilder - Stage 2: Settings Screens

## Context

Building on Stage 1's app shell, add three settings screens that display in the main content area when their nav items are clicked:
1. Company Info
2. Brand Voice
3. Image Style

Use the same design system from Stage 1.

---

## Screen 1: Company Info

When "Company Info" is selected in nav, show this screen:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Company Information                                                   │
│                                                                         │
│   Set up your company profile to personalize generated content.         │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Company URL                                                     │  │
│   │                                                                  │  │
│   │  [https://                                        ] [Scan]       │  │
│   │                                                                  │  │
│   │  Enter your company website to auto-extract profile information  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  Company Profile                                                 │  │
│   │                                                                  │  │
│   │  ┌──────────┐                                                    │  │
│   │  │          │   Company Name                                     │  │
│   │  │   Logo   │   [Acme Corporation                    ]           │  │
│   │  │          │                                                    │  │
│   │  └──────────┘   Industry                                         │  │
│   │                 [Technology                          ]           │  │
│   │                                                                  │  │
│   │  Description                                                     │  │
│   │  ┌───────────────────────────────────────────────────────────┐  │  │
│   │  │ Acme Corporation is a leading technology company...       │  │  │
│   │  │                                                           │  │  │
│   │  └───────────────────────────────────────────────────────────┘  │  │
│   │                                                                  │  │
│   │  Brand Colors                                                    │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│   │  │ Primary     │  │ Secondary   │  │ Accent      │              │  │
│   │  │ [█] #7C21CC │  │ [█] #342F46 │  │ [█] #008161 │              │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                                              [Cancel]  [Save Changes]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

### Company Info Requirements

1. **URL Input Section**
   - Text input with placeholder "https://yourcompany.com"
   - "Scan" button (primary style)
   - Helper text below
   - Loading state: button shows spinner, text says "Scanning..."

2. **Company Profile Card**
   - White card with border
   - Logo placeholder: 80x80px grey box with `Building2` icon, or uploaded image
   - Editable fields: Company Name, Industry (text inputs)
   - Description: Textarea, 3-4 rows
   - Brand Colors: 3 color pickers with hex input
     - Use a simple color input or popover color picker
     - Show color swatch + hex value

3. **Action Buttons**
   - "Cancel" - ghost button, resets changes
   - "Save Changes" - primary button, saves to state/localStorage

4. **State Management**
   - Store: `{ url, name, industry, description, logo, colors: { primary, secondary, accent } }`
   - Persist to localStorage

---

## Screen 2: Brand Voice

When "Brand Voice" is selected in nav, show this screen:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Brand Voice                                                           │
│                                                                         │
│   Configure how your generated content should sound.                    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │  Tone                                                            │  │
│   │  How formal should the language be?                              │  │
│   │                                                                  │  │
│   │  Formal          ──────────●──────────────────   Conversational  │  │
│   │                                                                  │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │                                                                  │  │
│   │  Complexity                                                      │  │
│   │  How technical should the vocabulary be?                         │  │
│   │                                                                  │  │
│   │  Simple          ────────────────●────────────   Technical       │  │
│   │                                                                  │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │                                                                  │  │
│   │  Enthusiasm                                                      │  │
│   │  How energetic should the tone be?                               │  │
│   │                                                                  │  │
│   │  Reserved        ──────────────────●──────────   Energetic       │  │
│   │                                                                  │  │
│   ├──────────────────────────────────────────────────────────────────┤  │
│   │                                                                  │  │
│   │  Personality                                                     │  │
│   │  How distinctive should the brand voice be?                      │  │
│   │                                                                  │  │
│   │  Neutral         ────────────────────●────────   Distinctive     │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  💡 Voice Preview                                                │  │
│   │                                                                  │  │
│   │  "Based on your settings, content will sound professional yet   │  │
│   │   approachable, using moderately technical language with         │  │
│   │   noticeable energy and a distinct brand personality."           │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                                              [Cancel]  [Save Changes]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

### Brand Voice Requirements

1. **Slider Section**
   - 4 sliders, each in its own row with divider
   - Each slider has:
     - Title (bold)
     - Description (muted, smaller)
     - Left label (min value descriptor)
     - Slider (5 discrete positions: 0, 1, 2, 3, 4)
     - Right label (max value descriptor)

   | Slider | Left Label | Right Label |
   |--------|------------|-------------|
   | Tone | Formal | Conversational |
   | Complexity | Simple | Technical |
   | Enthusiasm | Reserved | Energetic |
   | Personality | Neutral | Distinctive |

2. **Slider Styling**
   - Use shadcn/ui Slider component
   - Track: grey (`#D5D7E1`)
   - Filled track: purple (`#7C21CC`)
   - Thumb: white with purple border
   - Step markers optional but nice

3. **Voice Preview Card**
   - Light purple background (`#F4E9FF`) or light grey
   - Lightbulb icon
   - Dynamic text that updates based on slider values
   - Generate preview text by mapping slider values to descriptors

4. **State Management**
   - Store: `{ tone: 0-4, complexity: 0-4, enthusiasm: 0-4, personality: 0-4 }`
   - Default all to 2 (middle)
   - Persist to localStorage

---

## Screen 3: Image Style

When "Image Style" is selected in nav, show this screen:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Image Style                                                           │
│                                                                         │
│   Choose the visual style for AI-generated images.                      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│  │
│   │   │            │  │            │  │     ✓      │  │            ││  │
│   │   │  [image]   │  │  [image]   │  │  [image]   │  │  [image]   ││  │
│   │   │            │  │            │  │            │  │            ││  │
│   │   │ Corporate  │  │    Flat    │  │ Isometric  │  │  Abstract  ││  │
│   │   └────────────┘  └────────────┘  └────────────┘  └────────────┘│  │
│   │                                                                  │  │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│  │
│   │   │            │  │            │  │            │  │            ││  │
│   │   │  [image]   │  │  [image]   │  │  [image]   │  │  [image]   ││  │
│   │   │            │  │            │  │            │  │            ││  │
│   │   │ Hand-drawn │  │   Photo    │  │ Minimalist │  │    Warm    ││  │
│   │   └────────────┘  └────────────┘  └────────────┘  └────────────┘│  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Selected: Isometric ✓                                                 │
│                                                                         │
│                                              [Cancel]  [Save Changes]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

### Image Style Requirements

1. **Style Grid**
   - 4x2 grid of style cards
   - 8 styles total:
     1. Corporate
     2. Flat
     3. Isometric
     4. Abstract
     5. Hand-drawn
     6. Photorealistic
     7. Minimalist
     8. Warm

2. **Style Card**
   - White background with border
   - Aspect ratio: roughly 4:3 or square
   - Placeholder image area (use colored gradient or placeholder image)
   - Style name below image
   - **Default**: `border: 1px solid #D5D7E1`
   - **Hover**: `border: 1px solid #7C21CC`, slight shadow/lift
   - **Selected**: `border: 2px solid #7C21CC`, checkmark badge in corner

3. **Selection Indicator**
   - Text below grid: "Selected: [Style Name] ✓"
   - Checkmark badge on selected card (top-right corner)
     - Small purple circle with white check icon

4. **State Management**
   - Store: `{ selectedStyle: 'corporate' | 'flat' | 'isometric' | ... }`
   - Default: 'flat'
   - Persist to localStorage

---

## Component Structure (additions)

src/
├── components/
│   ├── screens/
│   │   ├── CompanyInfoScreen.tsx
│   │   ├── BrandVoiceScreen.tsx
│   │   └── ImageStyleScreen.tsx
│   ├── settings/
│   │   ├── CompanyForm.tsx        # URL input + profile fields
│   │   ├── VoiceSlider.tsx        # Single slider row
│   │   ├── VoicePreview.tsx       # Dynamic preview text
│   │   ├── StyleCard.tsx          # Single style option card
│   │   └── StyleGrid.tsx          # Grid of style cards
│   └── ui/
│       ├── ColorPicker.tsx        # Color input with swatch
│       └── (shadcn components)
├── hooks/
│   ├── useCompanySettings.ts
│   ├── useVoiceSettings.ts
│   └── useStyleSettings.ts
└── lib/
    └── voiceDescriptors.ts        # Maps slider values to text

---

## Screen Layout Pattern

All three screens should follow this consistent layout:

<div className="p-8 max-w-4xl mx-auto">
  {/* Header */}
  <h1 className="text-2xl font-bold text-[#342F46] mb-2">Screen Title</h1>
  <p className="text-[#706E95] mb-8">Description text</p>

  {/* Content Card(s) */}
  <div className="bg-white rounded-2xl border border-[#D5D7E1] p-6 mb-6">
    {/* Screen-specific content */}
  </div>

  {/* Action Buttons */}
  <div className="flex justify-end gap-3">
    <Button variant="ghost">Cancel</Button>
    <Button>Save Changes</Button>
  </div>
</div>

---

## Acceptance Criteria

1. Clicking nav items switches main content to correct screen
2. Company Info: URL scan button shows loading state
3. Company Info: All fields are editable and save properly
4. Brand Voice: Sliders move smoothly with 5 discrete positions
5. Brand Voice: Preview text updates dynamically
6. Image Style: Clicking a card selects it (only one at a time)
7. Image Style: Selected card has purple border + checkmark
8. All screens: Cancel resets to last saved, Save persists to localStorage
```

### ✂️ --- CUT HERE - END OF PROMPT --- ✂️

---

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- STAGE 3: PAGES SCREEN                                                        -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

## Stage 3: Pages Screen

### ✂️ --- CUT HERE - START OF PROMPT --- ✂️

```markdown
# ContentBuilder - Stage 3: Pages Screen

## Context

Building on Stages 1-2, add the Pages screen that displays a list of saved content pages for the customer.

---

## Pages Screen Layout

When "Pages" is selected in nav, show this screen:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Pages                                            [+ Create New Page]  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │  🔍 [Search pages...                                         ]  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │  📄  Welcome Email - New Hire                              [⋮]  │  │
│   │      Created: Dec 15, 2024  •  Last edited: Dec 20, 2024        │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │  📄  Manager Nudge - Week 1 Check-in                       [⋮]  │  │
│   │      Created: Dec 10, 2024  •  Last edited: Dec 18, 2024        │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                  │  │
│   │  📄  Offboarding Survey Intro                              [⋮]  │  │
│   │      Created: Dec 5, 2024  •  Last edited: Dec 5, 2024          │  │
│   │                                                                  │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

### Empty State

When no pages exist:

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Pages                                            [+ Create New Page]  │
│                                                                         │
│                                                                         │
│                          ┌─────────────────┐                            │
│                          │                 │                            │
│                          │   [illustration │                            │
│                          │    or icon]     │                            │
│                          │                 │                            │
│                          └─────────────────┘                            │
│                                                                         │
│                          No pages yet                                   │
│                                                                         │
│                Create your first page to start                          │
│                generating content.                                      │
│                                                                         │
│                        [+ Create New Page]                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

---

## Detailed Requirements

### 1. Header Section

- Title: "Pages" (h1, bold)
- "Create New Page" button (primary, top-right)
  - `Plus` icon + text
  - Clicking navigates to the page editor (Stage 4)

### 2. Search Bar

- Full-width search input
- `Search` icon on left
- Placeholder: "Search pages..."
- Filters page list in real-time as user types
- Searches by page title

### 3. Page List

- Vertical stack of page cards
- Sorted by last edited date (most recent first)
- Each card is clickable → opens page in editor

### 4. Page Card

┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  📄  Page Title Here                                    [⋮]   │
│      Created: Dec 15, 2024  •  Last edited: Dec 20, 2024     │
│                                                               │
└───────────────────────────────────────────────────────────────┘

- **Icon**: `FileText` icon (muted color)
- **Title**: Bold, `#342F46`, truncate if too long
- **Metadata**: Muted text, smaller font
  - Format dates nicely: "Dec 15, 2024" or relative "2 days ago"
- **Menu button**: `MoreVertical` icon (kebab menu)
  - On click, show dropdown with:
    - "Edit" → opens page editor
    - "Duplicate" → creates copy with "Copy of..." prefix
    - "Delete" → confirmation dialog, then removes

**Card Styling:**
/* Default */
background: white;
border: 1px solid #D5D7E1;
border-radius: 12px;
padding: 16px 20px;
cursor: pointer;

/* Hover */
border-color: #7C21CC;
box-shadow: 0 2px 8px rgba(124, 33, 204, 0.1);

### 5. Delete Confirmation Dialog

When delete is clicked:

┌─────────────────────────────────────────┐
│                                         │
│   Delete Page                           │
│                                         │
│   Are you sure you want to delete       │
│   "Welcome Email - New Hire"?           │
│                                         │
│   This action cannot be undone.         │
│                                         │
│              [Cancel]  [Delete]         │
│                                         │
└─────────────────────────────────────────┘

- Use shadcn AlertDialog component
- "Delete" button is destructive (red)

### 6. State Management

interface Page {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  content?: {
    text: string;
    images: string[];
  };
  chatHistory?: ChatMessage[];
}

// Store in localStorage
// usePages hook provides: pages, createPage, updatePage, deletePage, duplicatePage

---

## Component Structure (additions)

src/
├── components/
│   ├── screens/
│   │   └── PagesScreen.tsx
│   ├── pages/
│   │   ├── PageCard.tsx           # Single page list item
│   │   ├── PageCardMenu.tsx       # Kebab menu dropdown
│   │   ├── EmptyPagesState.tsx    # No pages illustration
│   │   └── DeletePageDialog.tsx   # Confirmation modal
├── hooks/
│   └── usePages.ts                # CRUD operations for pages
└── types/
    └── page.ts                    # Page interface

---

## Acceptance Criteria

1. Pages list shows all saved pages sorted by last edited
2. Search filters pages by title in real-time
3. Clicking a page card will navigate to editor (Stage 4)
4. Kebab menu shows Edit, Duplicate, Delete options
5. Delete shows confirmation dialog before removing
6. Duplicate creates a copy with "Copy of..." prefix
7. Empty state shows when no pages exist
8. "Create New Page" button works (in header and empty state)
```

### ✂️ --- CUT HERE - END OF PROMPT --- ✂️

---

<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- STAGE 4: PAGE EDITOR (CHAT + PREVIEW)                                        -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

## Stage 4: Page Editor (Chat + Preview)

### ✂️ --- CUT HERE - START OF PROMPT --- ✂️

```markdown
# ContentBuilder - Stage 4: Page Editor (Chat + Preview)

## Context

The final stage! Build the main content creation interface that appears when:
- User clicks "New Page" in nav
- User clicks on an existing page from the Pages list

This is a 40/60 split view with chat on the left and live preview on the right.

---

## Page Editor Layout

┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Pages              Page: Welcome Email - New Hire   [Save]  │
├────────────────────────────────┬────────────────────────────────────────┤
│                                │                                        │
│   CHAT PANE (40%)              │   PREVIEW PANE (60%)                   │
│                                │                                        │
│                                │  ┌──────────────────────────────────┐  │
│                                │  │ TOOLBAR                          │  │
│                                │  │ [🎚️Voice▾][🎨Style▾] [Copy][⬇▾][↻]│ │
│                                │  └──────────────────────────────────┘  │
│  ┌──────────────────────────┐  │                                        │
│  │                          │  │  ┌──────────────────────────────────┐  │
│  │  🤖 AI                   │  │  │                                  │  │
│  │  What content would you  │  │  │   ENBOARDER PREVIEW              │  │
│  │  like to create today?   │  │  │                                  │  │
│  │                          │  │  │   ┌────────────────────────────┐ │  │
│  │                          │  │  │   │                            │ │  │
│  │  👤 You              3:42p│  │  │   │  Welcome to Acme Corp!    │ │  │
│  │  Create a welcome email  │  │  │   │                            │ │  │
│  │  for new software        │  │  │   │  We're thrilled to have    │ │  │
│  │  engineers joining the   │  │  │   │  you join our engineering  │ │  │
│  │  team                    │  │  │   │  team. Your journey...     │ │  │
│  │                          │  │  │   │                            │ │  │
│  │                          │  │  │   └────────────────────────────┘ │  │
│  │  🤖 AI                   │  │  │                                  │  │
│  │  Here's a warm welcome   │  │  │   ┌──────┐ ┌──────┐ ┌──────┐   │  │
│  │  email draft for your    │  │  │   │ img1 │ │ img2 │ │ img3 │   │  │
│  │  new engineers...        │  │  │   └──────┘ └──────┘ └──────┘   │  │
│  │                          │  │  │                                  │  │
│  └──────────────────────────┘  │  └──────────────────────────────────┘  │
│                                │                                        │
│  ┌──────────────────────────┐  │                                        │
│  │ [📎] [🎤]                │  │                                        │
│  │                          │  │                                        │
│  │ Type, paste URL, or drop │  │                                        │
│  │ files...                 │  │                                        │
│  │                   [Send] │  │                                        │
│  └──────────────────────────┘  │                                        │
│                                │                                        │
└────────────────────────────────┴────────────────────────────────────────┘

---

## Detailed Requirements

### 1. Page Header

- **Back button**: `ArrowLeft` icon + "Back to Pages" text
  - Returns to Pages screen
  - If unsaved changes, prompt "Discard changes?"
- **Page title**: Editable inline (click to edit)
  - Default for new page: "Untitled Page"
- **Save button**: Primary button, right side
  - Disabled if no changes
  - Shows "Saved ✓" briefly after saving

### 2. Chat Pane (Left, 40%)

#### 2.1 Messages Container

- Scrollable area
- Displays conversation history
- Auto-scrolls to bottom on new messages

#### 2.2 Message Bubbles

**AI Message:**
┌─────────────────────────────────────┐
│ 🤖 AI                               │
│                                     │
│ Message content here that can       │
│ span multiple lines and include     │
│ formatting...                       │
└─────────────────────────────────────┘

background: #F6F7F9;
border-radius: 12px 12px 12px 4px;
padding: 12px 16px;
max-width: 85%;
align-self: flex-start;

**User Message:**
┌─────────────────────────────────────┐
│                         👤 You 3:42p│
│                                     │
│ User message content here           │
└─────────────────────────────────────┘

background: #7C21CC;
color: white;
border-radius: 12px 12px 4px 12px;
padding: 12px 16px;
max-width: 85%;
align-self: flex-end;

**System Message (optional):**
         ─── URL content extracted ───

text-align: center;
color: #706E95;
font-size: 14px;

**Loading State:**
┌─────────────────────────────────────┐
│ 🤖 AI                               │
│                                     │
│ ●●●  (animated dots)                │
└─────────────────────────────────────┘

#### 2.3 Multi-Modal Input Area

**Input Container:**
┌───────────────────────────────────────┐
│ [📎] [🎤]                             │
│ ┌───────────────────────────────────┐ │
│ │                                   │ │
│ │ Type, paste URL, or drop files...│ │
│ │                                   │ │
│ └───────────────────────────────────┘ │
│                              [Send ➤] │
└───────────────────────────────────────┘

- **Attachment button** (`Paperclip`): Opens file picker
  - Accepts: .pdf, .docx, .txt, .pptx
- **Microphone button** (`Mic`): Voice input (can be placeholder/disabled for now)
- **Text area**:
  - Expandable (min 2 rows, max 6 rows)
  - Placeholder: "Type, paste URL, or drop files..."
- **Send button**: Purple, `SendHorizontal` icon
  - Disabled when input is empty

**Auto-Detection Behavior:**

When user types/pastes a URL (starts with http:// or https://):
┌───────────────────────────────────────┐
│ [📎] [🎤]                             │
│ ┌───────────────────────────────────┐ │
│ │ https://acme.com/about-us         │ │
│ └───────────────────────────────────┘ │
│ 🔗 URL detected - will extract content│
│                              [Send ➤] │
└───────────────────────────────────────┘
- Show subtle indicator below input
- Send button text could change to "Scan & Send"

**File Drop Zone:**

When dragging files over the input area:
┌───────────────────────────────────────┐
│                                       │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │                                 │  │
│  │    📄 Drop files here           │  │
│  │    PDF, DOCX, TXT, PPTX        │  │
│  │                                 │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                       │
└───────────────────────────────────────┘

border: 2px dashed #7C21CC;
background: #F4E9FF;

**Attached File Chip:**

After file is attached:
┌───────────────────────────────────────┐
│ [📎] [🎤]                             │
│                                       │
│ ┌────────────────────┐                │
│ │ 📄 report.pdf  [×] │                │
│ └────────────────────┘                │
│ ┌───────────────────────────────────┐ │
│ │ Summarize this report for new...  │ │
│ └───────────────────────────────────┘ │
│                              [Send ➤] │
└───────────────────────────────────────┘

### 3. Preview Pane (Right, 60%)

#### 3.1 Preview Toolbar

┌─────────────────────────────────────────────────────────────────┐
│ [🎚️ Voice: Professional ▾]  [🎨 Style: Flat ▾]     [Copy][⬇▾][↻]│
└─────────────────────────────────────────────────────────────────┘

**Left side - Settings quick access:**
- **Voice button**:
  - `SlidersHorizontal` icon + "Voice:" + current summary
  - Dropdown shows current slider values
  - "Edit Voice Settings" link → navigates to Brand Voice screen
- **Style button**:
  - `Palette` icon + "Style:" + selected style name
  - Dropdown shows style options (mini version of grid)
  - Clicking a style changes it immediately
  - "Edit Style Settings" link → navigates to Image Style screen

**Right side - Actions:**
- **Copy** (`Copy` icon): Copies generated text to clipboard
  - Toast: "Copied to clipboard!"
- **Export** (`Download` icon + dropdown):
  - Markdown (.md)
  - Word Document (.docx)
  - Images (.zip)
  - All Content (.zip)
- **Regenerate** (`RotateCw` icon): Re-generates content
  - If settings changed, regenerates with new settings
  - Shows loading state in preview

**Toolbar Styling:**
background: white;
border-bottom: 1px solid #D5D7E1;
padding: 12px 16px;
display: flex;
justify-content: space-between;
align-items: center;

#### 3.2 Enboarder Preview Container

Content preview styled to look like Enboarder output:

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │  Welcome to Acme Corp!                                  │   │
│   │                                                         │   │
│   │  We're thrilled to have you join our engineering team.  │   │
│   │  Your journey with us begins today, and we can't wait   │   │
│   │  to see the amazing contributions you'll make.          │   │
│   │                                                         │   │
│   │  Here's what to expect in your first week:              │   │
│   │  • Meet your buddy and team members                     │   │
│   │  • Complete your onboarding checklist                   │   │
│   │  • Set up your development environment                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐                  │
│   │           │  │           │  │           │                  │
│   │  image 1  │  │  image 2  │  │  image 3  │                  │
│   │           │  │           │  │           │                  │
│   └───────────┘  └───────────┘  └───────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

**Preview Card Styling:**
background: white;
border: 1px solid #D5D7E1;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

**Text Content:**
- Render as formatted text (basic markdown)
- Support: headers, paragraphs, bullet lists, bold

**Image Grid:**
- 1-3 images in a row
- Aspect ratio: 16:9 or 4:3
- Rounded corners (8px)
- On hover: subtle overlay with "Regenerate" button
- Placeholder images for development

#### 3.3 Empty/Loading States

**Empty State (no content yet):**
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                      [illustration]                             │
│                                                                 │
│                  Start a conversation                           │
│                  to generate content                            │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

**Loading State (generating):**
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │  ████████████████████████                               │   │
│   │  ████████████████████████████████                       │   │
│   │  ██████████████████                                     │   │
│   │                                                         │   │
│   │  (skeleton loading animation)                           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐                  │
│   │  loading  │  │  loading  │  │  loading  │                  │
│   └───────────┘  └───────────┘  └───────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

### 4. Settings Change Flow

When user changes Voice or Style from the toolbar and content exists:

1. Setting changes immediately
2. Toast appears: "Settings updated. Regenerate content with new settings?"
3. Toast has buttons: [Keep Current] [Regenerate]
4. If "Regenerate" clicked, content regenerates with new settings

---

## Component Structure (additions)

src/
├── components/
│   ├── screens/
│   │   └── PageEditorScreen.tsx    # Main editor container
│   ├── chat/
│   │   ├── ChatPane.tsx            # Chat container
│   │   ├── ChatMessages.tsx        # Message list
│   │   ├── ChatMessage.tsx         # Single message bubble
│   │   ├── ChatInput.tsx           # Multi-modal input
│   │   ├── FileDropZone.tsx        # Drag & drop overlay
│   │   └── FileChip.tsx            # Attached file indicator
│   ├── preview/
│   │   ├── PreviewPane.tsx         # Preview container
│   │   ├── PreviewToolbar.tsx      # Settings + actions bar
│   │   ├── VoiceDropdown.tsx       # Voice quick-edit dropdown
│   │   ├── StyleDropdown.tsx       # Style quick-edit dropdown
│   │   ├── ContentPreview.tsx      # Enboarder-styled content
│   │   ├── ImageGrid.tsx           # Generated images display
│   │   └── EmptyPreview.tsx        # Empty state
├── hooks/
│   ├── useChat.ts                  # Chat state & messages
│   ├── useInputDetection.ts        # URL/file detection
│   └── usePageEditor.ts            # Page editing state
└── types/
    └── chat.ts                     # Message interfaces

---

## State Management

// Chat state
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: { name: string; type: string; }[];
}

// Page editor state
interface PageEditorState {
  page: Page;
  isDirty: boolean;
  chatMessages: ChatMessage[];
  generatedContent: {
    text: string;
    images: string[];
  };
  isGenerating: boolean;
}

---

## Acceptance Criteria

1. Split pane shows chat (40%) and preview (60%)
2. Chat messages display correctly (AI left, User right)
3. Input auto-detects URLs and shows indicator
4. File drag & drop shows drop zone
5. Attached files show as removable chips
6. Toolbar shows current Voice and Style settings
7. Voice/Style dropdowns allow quick changes
8. Copy button copies text to clipboard
9. Export dropdown shows format options
10. Regenerate button triggers content refresh
11. Preview shows generated text and images
12. Empty state shows when no content generated
13. Loading skeleton shows during generation
14. Settings change prompts for regeneration
15. Page title is editable inline
16. Save button persists page to localStorage
17. Back button returns to Pages (with unsaved warning if needed)
```

### ✂️ --- CUT HERE - END OF PROMPT --- ✂️

---

## Post-Generation Checklist

After completing all 4 stages, verify:

- [ ] Navigation collapses/expands smoothly
- [ ] All nav items switch to correct screen
- [ ] Company Info saves and loads from localStorage
- [ ] Brand Voice sliders update preview text
- [ ] Image Style selection persists
- [ ] Pages list shows saved pages
- [ ] Search filters pages correctly
- [ ] Page editor shows chat and preview
- [ ] Chat input detects URLs automatically
- [ ] File drop zone appears on drag
- [ ] Toolbar actions work (Copy, Export, Regenerate)
- [ ] Settings quick-access works from toolbar
- [ ] Page saves and loads correctly

---

## Notes for Integration

After generating the UI, you'll need to connect it to the existing backend:

1. **Company Scan**: Connect to `POST /api/scrape`
2. **Text Generation**: Connect to `POST /api/generate/text` (streaming)
3. **Image Generation**: Connect to `POST /api/generate/images`
4. **File Processing**: Connect to `POST /api/process/file` (Task 6.0)
5. **Voice Transcription**: Connect to `POST /api/transcribe`

See `CLAUDE.md` for API client usage patterns.
