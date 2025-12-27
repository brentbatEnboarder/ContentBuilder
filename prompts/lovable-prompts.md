# ContentBuilder - Lovable AI Prompts

## How to Use This Document

This document contains **6 separate prompts**. Each prompt is clearly marked with:
- A big header (e.g., "PROMPT 1")
- Start marker: `=== COPY BELOW THIS LINE ===`
- End marker: `=== COPY ABOVE THIS LINE ===`

**Instructions:**
1. Find the prompt you want (1 through 6)
2. Copy everything between the START and END markers
3. Paste into Lovable
4. Work through prompts in order (1 → 2 → 3 → 4 → 5 → 6)

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 1: Foundation, Layout & Authentication
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** Login page, main app shell, sidebar, header, protected routes

=== COPY BELOW THIS LINE ===

Create the foundational layout and authentication system for ContentBuilder, an internal tool for Enboarder's Professional Services team.

## Tech Stack
- React with TypeScript
- Tailwind CSS
- Font: Roboto (primary), Inter (secondary)
- Design Theme: Light, professional, clean - NO dark mode, NO glassmorphism

## Enboarder Brand Colors (use these EXACTLY)

Primary Brand:
- brand-primary: #7C21CC (purple - main buttons, links, accents)
- brand-hover: #68009F (darker purple for hover states)
- brand-focus: #9F42F1 (focus rings)
- brand-light: #DCB6FF (light purple for tags, badges)
- brand-subtle: #F4E9FF (very light purple backgrounds)

Neutrals:
- grey-50: #F6F7F9 (page background)
- grey-100: #EFF0F4 (card backgrounds)
- grey-200: #D5D7E1 (borders, dividers)
- grey-300: #AEB0C5 (placeholder text)
- grey-400: #706E95 (secondary text, labels)
- grey-900: #342F46 (primary text, headings)
- white: #FFFFFF (card backgrounds)

## What to Build

### 1. Login Page (route: /login)
- Full-height centered layout with #F6F7F9 background
- White card (max-width 400px) containing:
  - "ContentBuilder" text in brand purple (#7C21CC) as logo
  - Tagline: "AI-Powered Content Generation" in #706E95
  - Email input field with label
  - Password input field with label
  - "Sign In" button (full width, #7C21CC background, white text)
  - "Remember me" checkbox

Input styling:
- White background, 1px border #D5D7E1
- Border-radius: 8px, Height: 40px
- Focus: 1px border #9F42F1 with 2px box-shadow #DCB6FF
- Placeholder color: #AEB0C5

Button styling:
- Background: #7C21CC, Hover: #68009F
- Border-radius: 8px, Height: 40px
- Font: 16px medium weight, white text

### 2. Main App Layout (protected, redirect here after login)
Header bar:
- White background, subtle bottom border
- Left: "ContentBuilder" in brand purple
- Right: User email + "Sign Out" button (ghost style, #706E95 text)
- Height: 64px, Padding: 0 24px

Sidebar (left):
- Width: 280px, white background, right border #D5D7E1
- Header: "SAVED PAGES" with count badge
- Empty list area (placeholder for now)
- "Export All" button at bottom

Main content area (right):
- Flexible width, #F6F7F9 background, 32px padding
- Scrollable
- For now, show placeholder: "Select a workflow step to begin"

### 3. Authentication
- If not logged in → redirect to /login
- If logged in and on /login → redirect to main app
- Use mock auth state for now (no real Supabase yet)
- Show loading state during auth check

=== COPY ABOVE THIS LINE ===

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 2: Customer Setup & Brand Colors
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** Website URL input, company profile display, brand color pickers

=== COPY BELOW THIS LINE ===

Add the Customer Setup section to ContentBuilder. This is Step 1 of the workflow where consultants enter a customer's website URL and configure brand colors.

This builds on the existing app with login page and main layout.

## What to Build

### 1. Customer Setup Card
Replace the placeholder in main content with:
- White card with 24px padding, 16px border-radius, border #D5D7E1
- Header: "Step 1: Customer Setup" - 20px font, medium weight, #342F46
- Max-width 800px, centered

### 2. Website URL Section
Inside the card:
- Label: "Customer Website" in #706E95, 14px
- URL input (full width) with placeholder "https://company.com"
- "Scan Website" button (purple, with globe or search icon)
- Helper text below: "We'll gather company info and detect brand colors"
- Button loading state: spinner + "Scanning..."

### 3. Company Profile Area
Below URL section:
- Collapsible section with "Company Profile" header and chevron
- When expanded: textarea showing AI-generated company summary
- "Edit" button to make it editable
- Placeholder: "Company profile will appear here after scanning..."
- Read-only state: #F6F7F9 background
- Editing state: white background

### 4. Brand Colors Section
Label: "Brand Colors"

Three color inputs in a row (stack vertically on mobile):

Primary Color (Required):
- Label: "Primary"
- Color swatch preview (40x40px square, rounded)
- Hex input field (#RRGGBB format, monospace font)
- Color picker button
- Default: #7C21CC

Secondary Color (Optional):
- Same layout as Primary
- Label: "Secondary" with "Optional" badge
- Default: empty

Accent Color (Optional):
- Same layout
- Label: "Accent" with "Optional" badge
- Default: empty

Color input pattern:
- Show color swatch, hex text input, and native color picker side by side
- Validate hex format, show error if invalid
- After scan: show "Auto-detected from website" indicator

### 5. Mock Behavior
When "Scan Website" is clicked:
- Show loading state for 2 seconds
- Then populate with mock data:

Mock company profile:
"Acme Corp is a leading provider of enterprise software solutions, serving Fortune 500 companies since 2010. Their culture emphasizes innovation, collaboration, and work-life balance. Core values include transparency, customer obsession, and continuous learning."

Mock brand colors:
- Primary: #3B82F6
- Secondary: #10B981
- Accent: #F59E0B

=== COPY ABOVE THIS LINE ===

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 3: Brand Voice Sliders
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** 4-dimension voice sliders with real-time sample communications

=== COPY BELOW THIS LINE ===

Create Brand Voice Sliders for ContentBuilder. This lets users define their brand's communication style using four dimensions. It's Step 2 of the workflow, appearing below Customer Setup.

## The Four Voice Dimensions

Each uses a 5-point scale (0-4), defaulting to 2 (balanced):

1. **Formal ↔ Casual** - How professional vs. conversational
2. **Serious ↔ Funny** - Use of humor and levity
3. **Respectful ↔ Irreverent** - Attitude toward conventions
4. **Matter-of-fact ↔ Enthusiastic** - Energy and emotional expression

Value labels for each position:

Formality: Very Formal (0), Somewhat Formal (1), Balanced (2), Somewhat Casual (3), Very Casual (4)

Humor: Very Serious (0), Mostly Serious (1), Balanced (2), Somewhat Funny (3), Very Funny (4)

Respect: Very Respectful (0), Mostly Respectful (1), Balanced (2), Somewhat Irreverent (3), Very Irreverent (4)

Enthusiasm: Very Matter-of-fact (0), Somewhat Matter-of-fact (1), Balanced (2), Somewhat Enthusiastic (3), Very Enthusiastic (4)

## What to Build

### 1. Voice Settings Card
- White card below Customer Setup (same styling)
- Header: "Step 2: Brand Voice Settings"
- Subheader: "Move each slider to define how your content should sound" in #706E95

### 2. Each Slider Row
For each of the 4 dimensions:

Header row:
- Left: Dimension name (e.g., "Formal ↔ Casual") in #342F46, 16px medium
- Right: Current value label (e.g., "Somewhat Casual") in #7C21CC

Custom slider:
- Track: 8px height, rounded
- Filled portion: #7C21CC (purple)
- Unfilled: #D5D7E1 (grey)
- Thumb: 24px circle, #7C21CC, white 3px border, subtle shadow
- 5 discrete snap positions

Labels below slider:
- Left extreme label (e.g., "Formal") in #706E95, 14px
- Right extreme label (e.g., "Casual") in #706E95, 14px

Spacing: 32px between slider groups

### 3. Info Box (appears when any slider moves)
- Light purple background #FAF5FF, border #E9D5FF
- Info icon in #9333EA
- Shows: Dimension name + current value label
- Description explaining what this setting means
- Example box (white background) with sample HR text in italics

Example for Formality at value 3 (Somewhat Casual):
- Description: "Conversational and friendly. Uses contractions freely. Feels like talking to a colleague."
- Example: "Hey team! Review season's coming up next month. You'll get an invite to grab a time that works for you."

### 4. Sample Communications Section
Below sliders, show 4 sample message cards that update in real-time:

Header: "Sample Communications"
Subheader: "See how your voice settings would sound in real HR messages"

Four cards:
1. Welcome Message - New hire first day email
2. Benefits Reminder - Open enrollment deadline
3. Policy Update - Remote work policy change
4. Performance Review - Quarterly review invitation

Each card:
- Purple badge with scenario type
- Context line in grey
- White box with the generated sample text

The samples must regenerate dynamically as sliders move. Use conditional logic based on slider values to vary greetings, tone, humor, etc.

### 5. Sample Generation Logic

For Welcome Message, vary based on settings:
- formality <= 1: "Dear [Name]," / formality >= 3: "Hey [Name]!"
- enthusiasm >= 3: "We're thrilled to have you!" / enthusiasm < 2: "Welcome to the team."
- humor >= 3: Add "(Don't worry, we kept the paperwork to a minimum!)"

Apply similar logic to all four samples so they feel distinctly different at different slider positions.

=== COPY ABOVE THIS LINE ===

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 4: Image Style Selector
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** 8-style image preset grid with selection UI

=== COPY BELOW THIS LINE ===

Create an Image Style Selector for ContentBuilder. This lets users choose a visual style for AI-generated images. Add this within or after the Step 2 card (Brand Voice Settings).

## Available Styles (8 presets)

1. Corporate Photography - Professional stock photos, business settings
2. Flat Illustration - Modern, colorful 2D illustrations
3. Isometric - 3D-style isometric graphics
4. Abstract Geometric - Abstract shapes and patterns
5. Hand-drawn Sketch - Casual hand-drawn style
6. Photorealistic - High-quality realistic imagery
7. Minimalist - Clean, simple, lots of whitespace
8. Warm & Friendly - Soft colors, approachable, people-focused

## What to Build

### 1. Image Style Section
- Section header: "Image Style" in #342F46, 16px medium
- Subheader: "Choose a visual style for generated images" in #706E95

### 2. Style Grid
Responsive grid:
- Desktop: 4 columns
- Tablet: 3 columns
- Mobile: 2 columns
- Gap: 16px

### 3. Each Style Card
Thumbnail area:
- Aspect ratio 4:3 (e.g., 160x120)
- Rounded corners 8px
- For now, use colored placeholder backgrounds with an icon:
  - Corporate Photography: #E0E7FF bg, camera icon, #4F46E5
  - Flat Illustration: #FEF3C7 bg, palette icon, #D97706
  - Isometric: #DBEAFE bg, cube icon, #2563EB
  - Abstract Geometric: #FCE7F3 bg, shapes icon, #DB2777
  - Hand-drawn: #D1FAE5 bg, pencil icon, #059669
  - Photorealistic: #E5E7EB bg, image icon, #374151
  - Minimalist: #F9FAFB bg, minus icon, #6B7280
  - Warm & Friendly: #FEE2E2 bg, heart icon, #DC2626

Style name: Below thumbnail, centered, #342F46, 14px medium

Selection states:
- Unselected: transparent border
- Hover: #DCB6FF border, slight lift
- Selected: #7C21CC border, #FAF5FF background, checkmark badge

Checkmark badge (selected only):
- 20px purple circle in top-right corner
- White checkmark inside

### 4. Custom Prompt Input
Below the grid:
- Label: "Custom additions (optional)" in #706E95
- Text input: "Add specific instructions for image generation..."
- Helper: "e.g., 'include diverse people', 'use company logo colors'"

### 5. Default Selection
Pre-select "Flat Illustration" as the default style.

=== COPY ABOVE THIS LINE ===

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 5: AI Interview & Content Generation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** Page objective input, source uploads, AI chat, generated content display

=== COPY BELOW THIS LINE ===

Create the content generation interface for ContentBuilder. This is Step 3 where users describe what content they need, optionally provide source materials, and receive AI-generated text and images.

## What to Build

### 1. Page Generation Card
- New white card (same styling as previous steps)
- Header: "Step 3: Generate Content"
- Full width within main content area

### 2. Page Objective Input
- Label: "What should this page accomplish?" in #706E95
- Large textarea (min 3 rows, auto-expand to 6)
- Placeholder: "Describe the purpose of this content page. For example: 'Welcome message for new engineering hires that introduces our team culture and first-week expectations.'"
- Character count in bottom-right corner

### 3. Source Material Section
Label: "Source Material (Optional)"

Two inputs side by side (stack on mobile):

File Upload:
- Dashed border box, #F6F7F9 background
- Upload icon + "Drop files here or click to browse"
- "PDF, DOCX, TXT, PNG, JPG, PPTX (max 10MB)"
- Show uploaded files as removable chips
- Support multiple files

URL Input:
- Text input with placeholder "Enter URL"
- "Add" button next to it
- Show added URLs as removable list items

### 4. Generate Button
- Large primary button: "Generate Content"
- Full width on mobile, auto-width on desktop
- Disabled until objective has content
- Loading: spinner + "Generating..."

### 5. AI Interview Section (conditional)
Shows when AI needs more info. For now, make it toggleable for testing.

- Section header: "AI Interview" with pulsing dot indicator
- Chat interface:
  - AI messages: left-aligned, #F6F7F9 background, rounded
  - User messages: right-aligned, #FAF5FF background
- Input area at bottom:
  - Text input field
  - Microphone button (right side)
  - Send button

Microphone button states:
- Idle: grey (#F6F7F9 bg, #706E95 icon)
- Recording: red, pulsing animation
- Transcribing: spinner

### 6. Generated Content Display
Shows after generation completes:

Text Content:
- Header: "Generated Text" with copy icon
- White box with generated text (render as formatted content)
- "Copy to Clipboard" button - show success message on click
- Feedback input: "Request changes..." with "Regenerate" button
- Toggle to make text directly editable

Image Content:
- Header: "Generated Images"
- Grid of 3 images (3 cols desktop, 1 col mobile)
- Each image:
  - Preview (16:9 aspect ratio)
  - "Select" button below
  - Selected: purple border + checkmark
- Below grid:
  - "Regenerate All" button (secondary)
  - "Edit prompt..." input field
  - "Download Selected" button (primary, disabled until selection)

### 7. Page Actions
At bottom:
- "Save Page" button (primary)
- "New Page" button (secondary)
- If unsaved content exists, "New Page" shows confirmation

### 8. Mock Data
Use placeholder content for now:

Mock generated text:
"# Welcome to Acme Corp!

We're thrilled to have you join our engineering team!

## Your First Week
During your first week, you'll:
- Meet your team and buddy
- Set up your development environment
- Complete onboarding modules
- Have a 1:1 with your manager

## Our Culture
At Acme, we believe in..."

Mock images: Use 3 different colored placeholder boxes (like the style selector thumbnails)

=== COPY ABOVE THIS LINE ===

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT 6: Page Management & Export
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**What this builds:** Sidebar page list, save/load pages, export functionality

=== COPY BELOW THIS LINE ===

Complete the page management system in ContentBuilder's sidebar. This enables saving pages, navigating between them, and exporting all content.

## What to Build

### 1. Saved Pages List
In the sidebar, implement:
- Header: "SAVED PAGES" with count badge (e.g., shows "3")
- List of saved page items showing:
  - Page title (truncated to ~30 chars)
  - Small thumbnail of selected image (40x40, if any)
  - Timestamp or "Page 1", "Page 2" etc.
- Click a page to view it
- Active page: purple left border (#7C21CC), #FAF5FF background
- Hover: #F6F7F9 background

### 2. Page Item Menu
Each item shows "..." button on hover with dropdown:
- View - Shows saved page content
- Edit - Re-enters generation flow
- Delete - Removes with confirmation dialog

### 3. Viewing a Saved Page
When a saved page is selected, main content shows:
- Page title/objective
- Generated text (rendered, read-only)
- Selected image (large preview)
- "Copy Text" button
- "Download Image" button
- "Edit Page" button
- "Back to New Page" button

### 4. Export All
"Export All" button at sidebar bottom opens modal:

Modal contents:
- Title: "Export All Pages"
- Text format dropdown: Markdown (.md) or Word (.docx)
- Checkbox: "Include images" (default checked)
- File naming preview: "ContentBuilder-Export-[date]"
- "Export" and "Cancel" buttons

On export: trigger browser download (can be mocked/simplified)

### 5. Empty State
When no pages saved, show in sidebar:
- Folder/document icon
- "No pages saved yet"
- "Generate and save content to see it here"

### 6. Unsaved Changes Warning
When user has unsaved content and tries to:
- Leave the app
- Start new page
- View different saved page

Show confirmation dialog:
- Title: "Unsaved Changes"
- Message: "You have unsaved content. Save it before continuing?"
- Buttons: "Save & Continue", "Discard", "Cancel"

### 7. Data Persistence
- Save pages to localStorage
- Load on app start
- Key: "contentbuilder-pages"

Page data structure:
- id: unique string
- title: from objective (first line or auto)
- objective: full text
- generatedText: the AI output
- selectedImageUrl: chosen image
- allImageUrls: all 3 options
- createdAt: timestamp
- updatedAt: timestamp

=== COPY ABOVE THIS LINE ===

---

# Summary

| Prompt | What It Builds |
|--------|----------------|
| 1 | Login, app shell, sidebar layout |
| 2 | URL scanner, company profile, color pickers |
| 3 | 4 voice sliders with live samples |
| 4 | 8-style image selector grid |
| 5 | Chat interface, content generation display |
| 6 | Save/load pages, export all |

**Work through these in order.** Test each one before moving to the next.

**After Lovable:** You'll still need to:
- Connect real Supabase auth
- Wire up actual AI APIs (Claude, NanoBanana, Whisper)
- Add real web scraping
- Replace placeholder images
- Add proper error handling
