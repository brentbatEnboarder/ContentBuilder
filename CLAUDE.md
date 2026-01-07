# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContentBuilder is an AI-powered content generation tool for Enboarder's Professional Services team. It generates branded text and images for employee journey workflows (onboarding, offboarding, etc.) by gathering customer context, configuring brand voice, and conducting AI interviews.

**Multi-Customer Architecture:** PS users log in, select a customer (or create one), and all data (pages, brand settings, voice) is scoped to that customer. To switch customers, users must log out and log back in.

## Commands

### Development
```bash
npm run dev              # Run frontend (Vite :5173) and backend (Express :3001) concurrently
npm run dev:frontend     # Frontend only
npm run dev:server       # Backend only
```

**Note:** The user manages dev servers in their own terminal window. Do not start or manage servers.

### Build & Test
```bash
npm run build            # Build frontend (tsc + vite)
npm run build:server     # Build backend (tsc)
npm run build:all        # Build both frontend and backend (for production)
npm run start            # Start production server (serves frontend + API)
npm test                 # Run Jest tests (server)
npm run lint             # ESLint
npx tsc --noEmit         # Type check without emitting
```

## Architecture

### Monorepo Structure
- **`/src`** - React frontend (Vite + TypeScript)
- **`/server`** - Express backend (TypeScript, separate package.json)

### Supabase Project
- **Project:** "AI Content Generator"
- **ID:** `qobjinzombhqfnzepgvz`
- **Region:** ap-southeast-1

### Database Schema

```sql
customers (id, name, created_by, created_at, updated_at)
customer_settings (id, customer_id UNIQUE, company_info JSONB, voice_settings JSONB, style_settings JSONB, onboarding_completed BOOLEAN)
pages (id, customer_id, title, content JSONB, chat_history JSONB, created_at, updated_at)
```

All tables have RLS enabled with policies scoped to `auth.uid() = created_by`.

### Frontend Hooks (React Query + Supabase)
- **`usePages.ts`** - CRUD for pages table
- **`useCompanySettings.ts`** - Company info with intelligent URL scanning, brand colors, logo candidates
- **`useVoiceSettings.ts`** - Voice dimension sliders (formality, humor, respect, enthusiasm)
- **`useStyleSettings.ts`** - Image style selection + target word length (auto-saves)
- **`useChat.ts`** - Chat with streaming Claude API
- **`useImageGeneration.ts`** - Gemini image generation
- **`useImagePlanning.ts`** - Conversational image planning with AI recommendations
- **`useImageModal.ts`** - State machine for image generation modal (selection, lightbox, edit, regenerate)
- **`useContentBlocks.ts`** - Content block state for image storage
- **`usePageEditor.ts`** - Page editing state (auto-generates titles on first save)
- **`useOnboardingHeaderActions.ts`** - Wraps header actions for onboarding wizard flow
- **`useMockupGenerator.ts`** - Device mockup generation with screenshot capture, template selection, and Gemini compositing

### Backend Services (`/server/src/services`)
- **`scraper.ts`** - Basic Firecrawl scraping (legacy)
- **`intelligentScraper.ts`** - Multi-page Claude-directed scraping with SSE streaming + parallel logo search
- **`logoSearch.ts`** - Brave Image Search API for company logo discovery
- **`claude.ts`** - Claude API text generation with streaming, tools (web_search, scrape_url, generate_image)
- **`imageGen.ts`** - Gemini image generation
- **`webSearch.ts`** - Brave Search API for web search tool
- **`whisper.ts`** - OpenAI Whisper transcription
- **`fileProcessor.ts`** - PDF/DOCX/TXT/MD/PPTX/XLSX processing with 50K char truncation

### Backend Routes (`/server/src/routes`)
- **POST /api/scrape** - Basic website scraping (legacy)
- **POST /api/scrape/intelligent** - Multi-page intelligent scraping with SSE progress
- **GET /api/image-proxy** - Proxy external images to bypass CORS (public, no auth required)
- **POST /api/generate/text** - Claude text generation (supports `stream: true`)
- **POST /api/generate/title** - Generate page title from content
- **POST /api/generate/image-plan** - Analyze content and recommend images
- **POST /api/generate/image-plan/continue** - Continue image planning conversation
- **POST /api/generate/images** - Gemini image generation (parallel variations)
- **POST /api/generate/images/stream** - SSE streaming image generation (returns each image as it completes)
- **POST /api/generate/mockup** - Generate device mockup (single image, 16:9) from template + content screenshot
- **POST /api/transcribe** - Whisper transcription
- **POST /api/process/file** - File content extraction

## Current Implementation Status

### Completed ✅
1. **Supabase Setup** - Tables, RLS, auth
2. **Backend Auth** - JWT middleware on all /api/* routes
3. **Frontend UI** - All screens working (Company, Voice, Visual Style, Pages, PageEditor)
4. **Hook Migration** - All hooks use Supabase + React Query (not localStorage)
5. **Chat Integration** - Real Claude API with SSE streaming
6. **Image Generation** - Real Gemini API with conversational planning
7. **File Processing** - PDF/DOCX/TXT/MD/PPTX/XLSX extraction for chat attachments with 50K char truncation
8. **Error Handling** - Loading states, toast notifications on all screens
9. **Intelligent Scraper** - Multi-page Claude-directed website scanning with real-time progress
10. **Brand Colors** - 6-color palette (primary, secondary, accent, textColor, buttonBg, buttonFg) auto-extracted
11. **Image Style Tiles** - Visual Style screen shows sample images for each of 8 styles
12. **Top Header Bar** - Unified header with logo, page title/subtitle, and action buttons
13. **Content Tags** - AI wraps publishable content in `<content>` tags, displayed in preview pane
14. **Chat Styling** - Enboarder avatar (#7C21CC), light purple AI bubbles (#e0c4f4), markdown support
15. **Conversational Editing** - Current content passed to AI for follow-up modifications
16. **Customer Selection UI** - Shows customer logos (from company_info) in selection cards
17. **Auto Page Titles** - AI generates descriptive titles immediately when content is generated (updates title bar in real-time)
18. **Image Planning** - Conversational flow: AI recommends images → user modifies via chat → approves → generates
19. **Image Cards** - Header images at top, body images at bottom of preview, 3 variations each
20. **Progressive Image Loading** - Images display immediately as they complete, with background progress bar for remaining
21. **Inline Image Generation Tool** - Claude can generate images via tool call when user asks naturally (e.g., "generate an image of a dog")
22. **Inline Image Actions** - Hover over chat images to Select (add to content) or Edit (modify with reference image)
23. **Conversation History** - Chat maintains full conversation context so Claude remembers previous exchanges
24. **Chat Logging** - Full conversation transcripts logged to backend for debugging
25. **Parallel Image Generation** - All image variations and placements generate simultaneously (~3x faster)
26. **SSE Image Streaming** - Images appear one-by-one as they complete via Server-Sent Events
27. **Claude API Logging** - Full system prompts and messages logged to backend console for debugging
28. **Compact Chat Input** - Style dropdown + Generate Imagery above input; +/mic/send buttons embedded in input box
29. **Word Count Display** - Preview toolbar shows word count next to brand voice dropdown
30. **Content Block Persistence** - Full ContentBlock[] with placement info saved to database, header images restore correctly
31. **Image Planning Approval Button** - "Generate Images" button appears after AI recommendations (alternative to typing "go ahead")
32. **Improved Image Planning Format** - AI recommendations use numbered lists with bold headers for better readability
33. **Image Modal Style Dropdown** - Each placement group has its own style dropdown next to "Regenerate All"
34. **Stricter Image Tool Triggers** - Claude only invokes generate_image when user explicitly mentions image/picture/diagram/etc.
35. **Web Search Tool** - Claude can search the web for current information when user asks (uses Brave Search API)
36. **URL Scraping Tool** - Claude can fetch and read content from specific URLs when user provides a link
37. **Login Screen Redesign** - Split layout with dark left panel (logo, title, form) and hero image on right
38. **Google Authentication** - OAuth login via Supabase with "Continue with Google" button
39. **Pages Grid Redesign** - Pinterest-style grid layout with thumbnail cards showing header images, content previews, word/image counts
40. **Tool Call Continuation** - Fixed critical bug where tool results (web_search, scrape_url) weren't sent back to Claude for continuation
41. **Tool Execution Indicators** - Chat shows spinners with contextual messages ("Searching the web...", "Reading webpage...", "Generating image...")
42. **Empty Preview Redesign** - Helpful empty state with CSS illustration, tip cards, and arrow pointing to chat
43. **Chat UI Polish** - Enhanced chat bubbles with shadows, semantic purple colors, and elevated input area with focus states
44. **Consistent Card Pattern** - All settings screens use unified card design with gradient headers, icons, and shadows
45. **Left Navigation Redesign** - Section labels (Setup/Content), active state left accent bar, polished user menu with gradient avatar
46. **User Chat Bubbles** - Gradient slate background, User icon avatar (distinct from AI's Enboarder icon)
47. **Content Preview Card** - Header with FileText icon, "Generated Content" label, Sparkles accent
48. **Company Info Screen Polish** - Website Scanner card, Scan Progress with green accents, improved logo placeholder
49. **Brand Voice Screen Redesign** - Side-by-side layout (sliders left, live preview right), 4-column voice profile summary
50. **Image Style Screen Redesign** - 6-column color picker row, style cards with descriptions and hover zoom effect
51. **Image Generation Modal** - Centered robot painter animation fix
52. **Favicon & PWA Support** - Complete favicon set (SVG, ICO, PNG, Apple touch icon) + web manifest
53. **Login Image WebP Optimization** - 1.2MB PNG → 73KB WebP (94% reduction) with `<picture>` fallback
54. **SSE Buffer Fix** - Process remaining buffer after stream ends (fixes missing 3rd image)
55. **Dropdown Immediate Feedback** - StyleDropdown uses local state for instant UI updates
56. **Enhanced Scraper** - Uses Firecrawl v2 map() for URL discovery, 20 pages, prioritizes careers/team pages
57. **Logo Detection** - Extracts og:image from homepage metadata as logo fallback
58. **Customer Search** - Search bar on customer selection page (appears with 4+ customers)
59. **Customer Delete** - Delete customers with confirmation dialog (cascades to settings/pages)
60. **Markdown Descriptions** - Company description renders markdown, with Edit button for changes
61. **Logo Editor** - Click logo to upload file or enter URL, with preview and remove options
62. **Inactive Profile State** - Company Profile card greyed out until scan completes
63. **Onboarding Wizard** - 4-step wizard for new customers (Company Info → Brand Voice → Visual Style → First Page)
64. **Personalized Onboarding** - Greets user by first name ("Hi Brent!") extracted from Google OAuth profile
65. **Wizard Progress Indicators** - Progress dots in banner, checkmarks in left nav for completed steps
66. **Logo Image Search** - Parallel Brave Image Search for company logos during website scan
67. **Logo Picker Modal** - Shows up to 6 logo candidates found online, click to select
68. **Enhanced Content Extraction** - 2000-4000 word descriptions with verbatim content preservation
69. **Parallel Page Scraping** - 5 concurrent Firecrawl requests (matches plan limit), ~4x faster scraping
70. **Image Proxy Endpoint** - `/api/image-proxy` bypasses CORS for external logo thumbnails
71. **Streaming Extraction** - Claude Sonnet extraction with progress indicator (switched from Haiku for better quality)
72. **Immediate Logo Display** - Logo appears during scan before extraction completes
73. **Logo Priority Change** - Brave search result used first, og:image as fallback only
74. **URL Prioritization** - Scraper sorts URLs by relevance (careers/about/team first) before 100-URL limit
75. **Sibling Domain Support** - Scraper includes URLs from related domains (e.g., .co.nz accepts .com.au)
76. **HTTP/HTTPS Normalization** - Scraper compares hostnames not origins (fixes Firecrawl http:// URLs)
77. **JSON Sanitization** - Extraction handles unescaped newlines in Claude's JSON responses
78. **Description Word Count** - Company description shows word count badge, updates during streaming
79. **Wizard Banner Save Button** - "Save & Next" button moved from header to wizard banner during onboarding
80. **Step 1 Mandatory Scan** - "Save & Next" hidden on Company Info until scan completes
81. **Brand Voice 50/50 Layout** - Voice dimensions and live preview now equal width columns
82. **Live Preview Enhancement** - Example text larger and bold with quotation marks
83. **Target Word Length Control** - User-configurable target (default 300 words) with ±25% Shorter/Longer 3D buttons, auto-saves per customer
84. **Preview Toolbar Redesign** - Word count pill, compact 3D target controls aligned with input, 3D regenerate button moved left
85. **Extended Brand Color Palette** - Added coral (#fc7361), teal (#5dedd7), golden (#ffc820), magenta, sky, mint to CSS/Tailwind design system
86. **Page Editor Styling Refresh** - Coral CTAs (Generate Imagery), teal Regenerate button, purple Send, reduced purple overuse
87. **Stricter Target Word Length** - Prompt now enforces ±10% range (e.g., 450-550 for 500 target) instead of soft guidance
88. **Regenerate Button Fix** - Now regenerates text content instead of triggering image generation flow
89. **Style Dropdown Fix** - Fixed stale closure bug where changing style didn't update for image generation
90. **Image Streaming Rewrite** - Queue-based approach fixes missing images in parallel generation
91. **Page Save Spinner** - Shows "Saving..." spinner in header when saving pages
92. **Google OAuth Only** - Email/password login disabled, Google OAuth is the only sign-in method
93. **Infographic Image Style** - Replaced "Warm" style with "Infographic" for data visualization, diagrams, and icons
94. **Customer Selection Toolbar** - Sticky toolbar anchored below header, doesn't scroll with customer list
95. **Tab Stability Fix** - Disabled React Query refetchOnWindowFocus/refetchOnReconnect to prevent disrupting scans
96. **Existing Customer Navigation** - Selecting existing customer lands on Pages screen instead of Company Info
97. **Page Editor Key Fix** - Added React keys to force remount when switching between new/existing pages
98. **Word Count Contrast** - Added darker teal-text color variant (35% lightness) for better readability
99. **File Upload Fix** - Fixed critical bug where file content never reached Claude (only metadata was passed)
100. **Excel Support** - Added XLSX processing with markdown table output (max 100 rows, 20 columns per sheet)
101. **Content Truncation** - Files over 50K chars truncated with toast warning to user
102. **SourceMaterial Type Fix** - Frontend now sends proper SourceMaterial objects (type, text, document, name) instead of strings
103. **Markdown File Support** - Added .md file support using text/markdown MIME type
104. **Full-Pane Drag-Drop** - Drop zone now covers entire ChatPane with overlay, not just input box
105. **Document-Level Drop Prevention** - Browser no longer opens files dropped anywhere on page
106. **Aspect Ratio Normalization** - Frontend normalizes AI-recommended aspect ratios (e.g., `2:1` → `21:9`) to valid API values, fixing image generation failures
107. **Simplified Inline Editing** - ContentPreview now has built-in click-to-edit functionality (hover shows "Click to edit", click opens markdown textarea, Esc cancels, click outside saves). Removed drag-drop content blocks in favor of simpler direct text editing.
108. **Device Mockup Generator** - Generate phone mockups by compositing content onto device templates. Creates mobile-width render at iPhone resolution (1170×2532), sends to Gemini with detailed prompt for realistic screen reflections. 5 templates available. Results modal with hover edit/delete actions, PNG/JPEG download.
109. **Image Block Hover Actions** - Header and body images in preview pane show edit/delete buttons on hover. Edit opens InlineImageEditModal, delete removes from content blocks.
110. **Mockup Text Weight Fix** - Mobile render uses font-weight 300 for body text with antialiased smoothing, preventing heavy/bold appearance in device mockups.
111. **2K Image Resolution** - All Gemini image generation upgraded from 1K to 2K (~2048px) for sharper images.
112. **Image Planning Conversation Fix** - Prefill technique forces Claude to output `<image-plan>` JSON tags. React state timing fix ensures fresh recommendations are used when generating (not stale state).
113. **Mockup Download Fix** - Fixed download buttons by converting base64 data URLs directly to Blob instead of using fetch() which fails for large images. Added toast notifications for success/error feedback.
114. **Word Export Aspect Ratio Fix** - Fixed vertical image distortion by reading actual image dimensions instead of relying on stored aspect ratio. Now preserves original aspect ratio for all images.

## Environment Variables

Required in `.env`:
```bash
SUPABASE_URL=https://qobjinzombhqfnzepgvz.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://qobjinzombhqfnzepgvz.supabase.co
VITE_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...       # Google Gemini API key for image generation (Nano Banana Pro)
FIRECRAWL_API_KEY=...
BRAVE_SEARCH_API_KEY=... # Brave Search API key for web search (get free key at https://brave.com/search/api/)
```

## Deployment (Railway)

The app is deployed to Railway as a single service that serves both the Express API and the static frontend.

### Configuration
- **Config file:** `railway.json` defines build and deploy commands
- **Build command:** `npm run build:all` (builds frontend + backend)
- **Start command:** `npm run start` (runs Express server)
- **Node version:** Node 20+ required (set via `engines` in package.json, deploys as Node 24)
- **Production URL:** `https://acg.up.railway.app`

### Build Script Paths
Build scripts use explicit `./node_modules/.bin/` paths because Nixpacks doesn't add `node_modules/.bin` to PATH during the build step:
```json
"build": "./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build"
```

### Content Security Policy (CSP)
The Express server configures CSP via Helmet to allow Supabase and Google OAuth:
```typescript
// server/src/index.ts
contentSecurityPolicy: {
  directives: {
    connectSrc: [
      "'self'",
      "https://qobjinzombhqfnzepgvz.supabase.co",
      "wss://qobjinzombhqfnzepgvz.supabase.co",
      "https://accounts.google.com",
    ],
    frameSrc: ["'self'", "https://accounts.google.com"],
  },
}
```

### How Production Serving Works
In production (`NODE_ENV=production`), the Express server:
1. Serves the API routes at `/api/*`
2. Serves static files from `/dist` (frontend build)
3. Falls back to `index.html` for SPA routing (all non-API routes)

**Important:** Express 5 changed wildcard routing. Use `app.use()` for catch-all middleware instead of `app.get('*', ...)` which fails with path-to-regexp v8+.

### Environment Variables (Railway)
All env vars must be set in Railway's Variables tab before building (VITE_ vars are baked into the frontend at build time):
```
NODE_ENV=production
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY
FIRECRAWL_API_KEY, BRAVE_SEARCH_API_KEY
```

### Supabase Auth Redirect URLs
Add these to Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://acg.up.railway.app`
- Redirect URLs: `http://localhost:5173/**`, `https://acg.up.railway.app/**`

### Google OAuth Configuration
In Google Cloud Console OAuth 2.0 credentials:
- **Authorized JavaScript origins:** `https://acg.up.railway.app`
- **Authorized redirect URIs:** `https://qobjinzombhqfnzepgvz.supabase.co/auth/v1/callback`

## Coding Patterns

### Styling
- Tailwind semantic tokens: `text-foreground`, `bg-background`, `border-border`
- Never raw colors like `text-white` or `bg-black`
- **Primary colors:** Purple (#7C21CC) for AI/branding, Coral (#fc7361) for CTAs, Teal (#5dedd7) for positive actions
- **Extended palette:** `bg-coral`, `bg-teal`, `bg-golden`, `bg-magenta`, `bg-sky`, `bg-mint` (defined in index.css + tailwind.config.ts)
- **Button hierarchy:** Coral for primary CTAs, Teal for regenerate/refresh, Purple for AI-related (send), Slate for neutral

### Hooks Pattern
```tsx
const { settings, hasChanges, isSaving, save, cancel } = useVoiceSettings();
// All hooks expose: isLoading, isSaving, error, hasChanges
// All save functions are async and should be awaited
```

### API Streaming Pattern
```tsx
await apiClient.generateTextStream(
  request,
  (chunk) => { /* onChunk */ },
  (fullText) => { /* onComplete */ },
  (error) => { /* onError */ },
  (toolName, toolId) => { /* onToolStart - optional */ },
  (toolResult) => { /* onToolResult - optional */ }
);
```

### Conversation History
Chat maintains full conversation context so Claude remembers previous exchanges:
- Frontend (`useChat.ts`) builds conversation history from previous messages
- Backend passes history to Claude API as multi-turn messages
- Enables follow-up questions and iterative content refinement

### Inline Image Generation Tool
Claude has a `generate_image` tool it can invoke during natural conversation:
```
User: "Generate an image of a happy dog"
Claude: [uses generate_image tool] → Image appears inline in chat
```

Defined in `server/src/services/claude.ts` as `imageGenerationTool`. The tool:
- Uses the customer's configured image style by default
- Generates a single image (vs. 3 variations for planned images)
- Displays inline in the chat message with click-to-expand lightbox
- **Only triggers when user explicitly mentions**: image, picture, photo, illustration, drawing, diagram, chart, graphic, visual
- **Does NOT trigger for**: "create a page", "make content", "do a page on X" (these create text content)

### Inline Image Actions
When hovering over generated images in chat, action buttons appear:
- **Select**: Adds image to content blocks (appears in preview pane)
- **Edit**: Opens modal to modify image with reference + prompt
- **Expand**: Full-screen lightbox view

The Edit modal (`InlineImageEditModal.tsx`) uses Gemini's vision capabilities:
1. Shows reference image thumbnail on left
2. Chat-style input for edit instructions on right
3. Suggestion chips for common modifications
4. Edited image appears in chat, can then be selected

### File Upload Architecture
File attachments flow through the system as follows:

1. **ChatInput.tsx** - User attaches files via button or drag-drop
   - Stores `FileAttachment` metadata (id, name, type, size) for UI display
   - Stores actual `File` objects in a `Map<string, File>` keyed by attachment ID
   - Exposes `addFiles()` via `forwardRef` for parent drop zone

2. **ChatPane.tsx** - Full-pane drag-drop zone
   - Handles drag events over entire chat area
   - Calls `chatInputRef.addFiles()` when files dropped
   - Shows overlay during drag

3. **PageEditorScreen.tsx** - Routes to correct handler
   - If `files` array present: calls `sendMessageWithFiles(message, files)`
   - Otherwise: calls `sendMessage(message, attachments)` (no file content)

4. **useChat.ts `sendMessageWithFiles()`** - Processes files
   - Calls `apiClient.processFile(file)` for each file
   - Builds `SourceMaterial[]` objects: `{ type: 'text'|'document', text?, document?, name }`
   - Shows toast warning if file was truncated
   - Sends to backend with `sourceMaterials` in request

5. **Backend `fileProcessor.ts`** - Extracts content
   - PDF: Returns base64 for Claude's native document API
   - DOCX/TXT/MD/PPTX/XLSX: Extracts text content
   - Truncates text > 50K chars

6. **Backend `claude.ts`** - Builds Claude request
   - Text sources embedded in prompt under "## Source Materials"
   - PDFs added as separate document content blocks

**Supported file types:** PDF, DOCX, TXT, MD, PPTX, XLSX (max 10MB each)

### Chat Logging
Full conversation transcripts are logged to the backend console for debugging:
```
════════════════════════════════════════════════════════════
[Chat] CONVERSATION HISTORY (2 messages):
  [ASSISTANT]: I'd love to help create...
  [USER]: emphasize growth, normal tone...
────────────────────────────────────────────────────────────
[Chat] USER MESSAGE:
────────────────────────────────────────────────────────────
can we create a founding story page
────────────────────────────────────────────────────────────
[Chat] TOOL CALL: generate_image (id: toolu_123...)
[Chat] TOOL RESULT: generate_image SUCCESS

[Chat] ASSISTANT RESPONSE:
────────────────────────────────────────────────────────────
Here's your image!
════════════════════════════════════════════════════════════
```

### Intelligent Scraper
The intelligent scraper (`/api/scrape/intelligent`) uses SSE streaming with optimized parallelization:

**Phase 1-2: URL Discovery + Homepage**
1. Uses Firecrawl `map()` to discover ALL URLs on the site (up to 200, including from sitemap)
2. **Parallel logo search** starts immediately using Brave Image Search API
3. Scrapes homepage for og:image fallback

**Phase 3: Page Identification**
4. Claude identifies best pages prioritizing: Careers, About Us, Team/People, Culture, Values

**Phase 4: Parallel Page Scraping**
5. Scrapes up to 20 relevant pages with **5 concurrent requests** (matches Firecrawl plan)
6. ~4x faster than sequential scraping

**Phase 5a: Immediate Logo Display**
7. Logo search completes → `logo_found` event sent immediately
8. **Logo priority**: Brave search result first, og:image fallback only if no Brave results
9. Frontend displays logo before extraction completes

**Phase 5b: Streaming Extraction**
10. Uses **Claude Sonnet** (better quality than Haiku for long-form content)
11. `extraction_chunk` events stream as Claude generates
12. Frontend shows progress indicator with live word count during extraction
13. Extracts comprehensive company info (**1500-2500 words**, markdown formatted) + 6 brand colors
14. JSON sanitization handles unescaped newlines in markdown content

**SSE Event Types:**
```
status → page_scraped (x20) → logo_found → extracting → extraction_chunk (many) → complete
```

The page identification prompt emphasizes career-related pages with many URL variations:
- `/careers`, `/jobs`, `/work-with-us`, `/join-us`, `/opportunities`, `/join-our-team`
- `/work-here`, `/employment`, `/openings`, `/positions`, `/vacancies`, `/hiring`
- `/life-at-[company]`, `/working-at-[company]`

```tsx
await apiClient.scrapeIntelligent(
  url,
  (progress) => {
    // Handle logo_found - update logo immediately
    if (progress.type === 'logo_found' && progress.logo) {
      setLogo(progress.logo);
    }
    // Handle extraction_chunk - show streaming text
    if (progress.type === 'extraction_chunk' && progress.chunk) {
      appendToDescription(progress.chunk);
    }
  },
  { maxPages: 20, scanMore: false }
);
// Returns: { ..., logo, logoCandidates: LogoCandidate[] }
```

### Brand Colors
Stored in `company_info.colors` with 6 properties:
- `primary` - Main brand color (logo, headers, CTAs)
- `secondary` - Supporting color (backgrounds, sections)
- `accent` - Highlight color (links, hover states)
- `textColor` - Primary text color
- `buttonBg` - Button background
- `buttonFg` - Button foreground/text

Displayed on **Visual Style** screen alongside image style selection.

### Image Styles
8 image styles available for AI-generated content, defined in `server/src/services/imageGen.ts`:
- **Corporate** - Professional photography, business attire
- **Flat** - Bold colors, geometric shapes, vector art
- **Isometric** - 3D perspective, 45-degree angle illustrations
- **Abstract** - Dynamic shapes, bold colors, modern art
- **Hand-drawn** - Sketch style, notebook doodles, pencil strokes
- **Photorealistic** - High-res photos, natural lighting
- **Minimalist** - Maximum negative space, subtle palette
- **Warm** - Soft colors, rounded shapes, cozy aesthetic

Sample images stored in `/public/styles/` (400×300 optimized JPGs with lazy loading).

### Onboarding Wizard
New customers go through a 4-step wizard before accessing the full app:

**Steps:**
1. **Company Info** - "Hi {firstName}! Let's scan your customer's website..."
2. **Brand Voice** - "Set your customer's brand voice..."
3. **Visual Style** - "Choose branding colors and image styles..."
4. **First Page** - "You're all set! Let's create your first piece of content."

**Components:**
- `OnboardingContext` - Tracks `currentStep`, `completedSteps`, `isOnboarding` state
- `WizardBanner` - Progress dots, step info, Back button, "Save & Next" button (appears below TopHeader)
- `useOnboardingHeaderActions` - Wraps save to advance through wizard, accepts `canProceed` parameter

**Behavior:**
- `onboarding_completed` boolean in `customer_settings` table
- Existing customers auto-marked as completed
- "Save & Next" button appears in wizard banner (not header) during onboarding
- **Step 1 (Company Info)**: Button hidden until website scan completes (mandatory)
- **Steps 2-3**: Button always visible (no mandatory changes required)
- Left nav shows checkmarks on completed steps, disables future steps
- After step 3, marks `onboarding_completed = true` and opens page editor

```tsx
const { isOnboarding, currentStep, nextStep, firstName } = useOnboarding();
// firstName extracted from user.user_metadata.full_name (Google OAuth)
```

### Header Actions Context
Screens register save/cancel actions with the unified TopHeader via `HeaderActionsContext`:

```tsx
useRegisterHeaderActions(
  hasChanges,
  isSaving,
  handleSave,
  handleCancel,
  { onBack, pageTitle, showSaved } // Optional for page editor
);
```

The TopHeader automatically shows:
- Logo (left) or Back button for page editor
- Page title + subtitle (center)
- Save/Cancel buttons (right) when `hasChanges` is true

**Important:** Callbacks are stored in refs (not state) to prevent stale closure bugs. Display state (hasChanges, isSaving) triggers re-renders; callbacks are always accessed fresh from refs.

### Content Tags Pattern
Claude wraps publishable content in `<content>` tags:
- Conversational responses (questions, clarifications) appear in chat
- Content inside `<content>...</content>` tags streams to the preview pane
- `useChat` parses responses and routes content appropriately
- `currentContent` prop passes existing content back to AI for follow-up edits

### Chat Styling
- **AI Avatar**: Purple circle (`bg-primary`) with white Enboarder icon, shadow
- **AI Bubble**: Semantic purple (`bg-primary/15 border-primary/10`), rounded-2xl with shadow
- **User Avatar**: Slate gradient (`from-slate-600 to-slate-800`) with User icon from Lucide
- **User Bubble**: Slate gradient (`from-slate-100 to-slate-200`), rounded-2xl with shadow, dark mode support
- **Hover effects**: Bubbles elevate on hover (`hover:shadow-md`)
- **Input area**: Gradient background, elevated input box with focus glow
- **Markdown**: Both chat and preview pane support full markdown via react-markdown

### Tool Call Continuation Pattern
When Claude calls tools (web_search, scrape_url, generate_image), the backend must send results back to Claude:

```typescript
// In generateContentStreamWithTools():
// 1. Claude calls tool → yield tool_use_start event
// 2. Execute tool → yield tool_result event to frontend
// 3. Build tool_result message for Claude
// 4. Make follow-up API call with tool results
// 5. Claude continues generating with the information
// 6. Loop until no more tool calls (max 10 iterations)
```

The `activeTool` property on `ChatMessage` tracks which tool is running:
- `web_search` → "Searching the web..."
- `scrape_url` → "Reading webpage..."
- `generate_image` → "Generating image..."

Tool usage is limited to 2-3 calls per request to prevent over-researching.

### Chat Input Layout
Compact layout with all controls in one area:
```
┌─────────────────────────────────────┐
│  [Style: Flat ▼]  [Generate Imagery] │  ← Above input
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Type, paste URL, or drop files │ │
│ │                                 │ │
│ │ [+]                     [🎤][➤]│ │  ← Embedded buttons
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```
- **Style dropdown**: Quick style selection for image generation
- **Generate Imagery**: Triggers image planning flow (greyed out until content exists)
- **Plus (+)**: Attach files (PDF, DOCX, TXT, PPTX)
- **Mic**: Voice input (coming soon)
- **Send**: Submit message

### Image Planning Flow
When user clicks "Generate Imagery" button:
1. AI analyzes content and recommends images (inline in chat as numbered list)
2. Recommendations include: title, description, placement (header/body), aspect ratio
3. A purple "Generate Images" button appears below recommendations
4. User can modify via conversation ("make the header more abstract", "add a diagram")
5. User clicks "Generate Images" button OR types "go ahead" / "looks good" / etc.
6. Header images (21:9 ultrawide) appear above content in preview
7. Body images use AI-recommended aspect ratio, appear below content, each with 3 variations stacked

```tsx
// useImagePlanning hook
const { startPlanning, sendPlanMessage, generateImages } = useImagePlanning();

// Start planning
const aiMessage = await startPlanning(content);

// Continue conversation
const result = await sendPlanMessage(content, userMessage);
if (result.isApproval) {
  const images = await generateImages(content);
}
```

The AI responds with structured `<image-plan>` JSON tags that are parsed to extract recommendations.

### Image Generation Modal (Phases 7-9 Complete)

A full-screen modal experience for image generation with selection and editing functionality.

**Implementation Status:** Core integration complete. See `tasks/page-save-improvements.md` for known issues.

#### Completed Components (in `src/`)
| Component | File | Purpose |
|-----------|------|---------|
| Modal + Animation | `components/modals/ImageGenerationModal.tsx` | Robot painter loading, progress bar |
| Selection Grid | `components/modals/ImageSelectionGrid.tsx` | Placement groups, hover select/edit |
| Lightbox | `components/modals/ImageLightbox.tsx` | Full-screen view, keyboard nav |
| Edit Panel | `components/modals/EditImagePanel.tsx` | Reference image + prompt editing |
| Regenerate Popover | `components/modals/RegeneratePopover.tsx` | Modify prompt before regenerating |
| Content Preview | `components/preview/ContentPreview.tsx` | Markdown display with inline editing |
| useImageModal Hook | `hooks/useImageModal.ts` | State machine for modal flow |
| Content Blocks Hook | `hooks/useContentBlocks.ts` | Block state management (images only) |
| Types | `types/content.ts`, `types/imageGeneration.ts` | All type definitions |

#### Integration Flow
1. User clicks "Generate Imagery" → AI recommends images in chat
2. User approves → `useImageModal.startGeneration()` opens modal
3. Modal shows loading animation → generates 3 variations per placement
4. User selects/skips/edits images → clicks "Apply"
5. `onImagesApplied` stores images in `ContentBlock[]`

#### Remaining Work (Phase 10 - Polish)
- Test edge cases and error handling
- Accessibility improvements
- Performance optimization for large images

#### Backend Additions
- `POST /api/generate/images/edit` - Edit image with reference + prompt
- `editImageWithReference()` in `server/src/services/imageGen.ts`
- `editImage()` in `src/services/api.ts`

#### Content Block Types
```typescript
type ContentBlock =
  | { type: 'text'; id: string; content: string; }
  | { type: 'image'; id: string; imageUrl: string; aspectRatio: AspectRatio; placementType: PlacementType; altText?: string; };

type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:2' | '9:16';
type PlacementType = 'header' | 'body' | 'footer';
```

#### Dependencies Added
```bash
npm install framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install html2canvas  # For device mockup screenshot capture
```

### Image Generation (Nano Banana Pro)
- **Model:** `gemini-3-pro-image-preview` (Nano Banana Pro)
- **API Timeout:** 180 seconds (image generation can take 60+ seconds)
- **Resolution:** 2K (~2048px, configurable in `server/src/services/imageGen.ts`)
- **Supported Aspect Ratios:** `1:1`, `16:9`, `4:3`, `3:2`, `9:16`, `21:9`
- **Header images:** Always use `21:9` ultrawide
- **Body images:** Use AI-recommended ratio from supported list
- **Documentation:** See `3rd_Party_Docs/GEMINI_IMAGE_GENERATION_API.md`

### Device Mockup Generator

Generate professional device mockups by compositing content onto phone templates with realistic screen reflections.

**Flow:**
1. User clicks Mockup button (Smartphone icon) in preview toolbar
2. MockupSelectionModal opens - user selects from 5 device templates
3. Frontend creates a mobile-width render (1170×2532 iPhone resolution) of the content
4. Template + content screenshot sent to Gemini for compositing
5. Single mockup returned with realistic screen reflections matching the scene
6. MockupResultsModal shows result with lightbox, edit/delete hover actions, PNG/JPEG download

**Mockup Templates (in `/public/`):**
- `Mock1.png` - Office Desk (hand holding phone)
- `Mock2.png` - Coffee Shop (hand holding phone with coffee)
- `Mock3.png` - City Night (two hands, bokeh lights)
- `Mock4.png` - Floating Pro (gradient background)
- `Mock5.png` - Purple Glow (floating with ambient light)

**Mobile Content Render:**
- Output: 1170×2532px (iPhone 14/15 native resolution)
- Renders at 390px logical width with 3x scale for retina quality
- Creates hidden DOM element, renders header image + formatted text, captures with html2canvas
- Text reflows naturally for mobile width (not scaled-down desktop)

**Mockup Prompt (emphasizes realistic reflections):**
The Gemini prompt specifically instructs:
- Add subtle screen reflections matching the environment (windows, lamps, ambient light)
- Semi-transparent reflections that let content show through
- Match reflection intensity to ambient lighting
- Color temperature matching between screen and environment
- Goal: "looks like an actual photograph, not a digital composite"

**Hover Actions on Generated Mockups:**
- **Edit** (pencil) - Opens InlineImageEditModal to modify with a prompt
- **Delete** (trash) - Removes the mockup from results

**Key Files:**
- `src/types/mockup.ts` - Types for templates, results, API
- `src/hooks/useMockupGenerator.ts` - State machine with `captureContent()`, `generateMockup()`, `openEdit()`, `submitEdit()`, `deleteMockup()`
- `src/components/modals/MockupSelectionModal.tsx` - Template picker grid
- `src/components/modals/MockupResultsModal.tsx` - Results with hover actions, lightbox, download buttons
- `server/src/services/imageGen.ts` - `generateMockup()` function
- `server/src/routes/generate.ts` - `POST /api/generate/mockup` endpoint

**Backend Config:**
- JSON body limit: 50MB (in `server/src/index.ts`) to handle base64 images
- Output aspect ratio: 16:9 (landscape mockup images)
- Single image generation (not 3 variations) for faster results

### Parallel Image Generation
Image generation uses a two-level parallelization strategy for maximum speed:

1. **Backend (`imageGen.ts`)**: `generateImages()` uses `Promise.all()` to generate all 3 variations simultaneously
2. **Frontend (`useImageModal.ts`)**: All placement requests launch in parallel, updating UI as each completes

```typescript
// Backend: generateImagesStreaming() yields images as they complete
for await (const event of generateImagesStreaming(request)) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Frontend: generateImagesStream() with callbacks
apiClient.generateImagesStream(
  params,
  (image, index, total) => { /* onImage - update UI immediately */ },
  (duration) => { /* onComplete */ },
  (error, index) => { /* onError */ }
);
```

**Performance improvement**: 3 placements × 3 variations went from ~3 minutes (sequential) to ~30 seconds (parallel).

### SSE Stream Buffer Handling
When parsing SSE streams, always process remaining buffer after the stream ends:
```typescript
// In api.ts generateImagesStream()
while (true) {
  const { done, value } = await reader.read();
  if (value) buffer += decoder.decode(value, { stream: true });
  // Process complete messages...
  if (done) break;
}
// IMPORTANT: Process any remaining data in buffer after stream ends
if (buffer.trim()) {
  // Parse and handle final event
}
```
This fixes issues where the last SSE event gets stuck in the buffer if not followed by `\n\n`.

### Dropdown Immediate Feedback Pattern
For dropdowns that trigger async saves, use local state for immediate UI feedback:
```typescript
const [localValue, setLocalValue] = useState(settings.value);

useEffect(() => {
  setLocalValue(settings.value); // Sync when server state changes
}, [settings.value]);

const handleSelect = (value) => {
  setLocalValue(value);  // Immediate UI update
  selectValue(value);    // Update hook state
  save();                // Trigger async save
};
```
This ensures the first click registers visually without waiting for React Query cache updates.

### Claude API Logging
Full system prompts and messages are logged to the backend console:
```
════════════════════════════════════════════════════════════════════════════════
[Claude API] SYSTEM PROMPT:
────────────────────────────────────────────────────────────────────────────────
You are an expert content writer for Enboarder...
## Company Context
...
## Brand Voice Guidelines
...
────────────────────────────────────────────────────────────────────────────────
[Claude API] MESSAGES (2 total):
  [ASSISTANT]: What content would you like to create today?...
  [USER]: ## Content Request...
════════════════════════════════════════════════════════════════════════════════
```

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root with QueryClient, routes |
| `src/hooks/useChat.ts` | Chat with streaming Claude API, content tag parsing, conversation history, inline images |
| `src/hooks/useCompanySettings.ts` | Company settings + intelligent URL scanning |
| `src/hooks/useImagePlanning.ts` | Conversational image planning state machine |
| `src/hooks/useImageModal.ts` | Image generation modal state machine |
| `src/hooks/useContentBlocks.ts` | Content block state for image storage |
| `src/hooks/usePageEditor.ts` | Page editing with auto title generation |
| `tasks/page-save-improvements.md` | Known issues and future work for page saving |
| `src/services/api.ts` | API client with JWT interceptor + streaming |
| `src/types/content.ts` | ContentBlock, AspectRatio, PlacementType types |
| `src/types/imageGeneration.ts` | ImagePlacement, GenerationProgress, LightboxImage types |
| `src/contexts/HeaderActionsContext.tsx` | Header action registration for save/cancel buttons |
| `src/components/layout/TopHeader.tsx` | Unified header with logo, title, actions |
| `src/components/layout/LeftNav.tsx` | Left sidebar navigation |
| `src/components/chat/ChatMessage.tsx` | Chat bubble with markdown support, inline image hover actions |
| `src/components/chat/ChatInput.tsx` | Chat input with embedded style dropdown, generate imagery, +/mic/send |
| `src/components/modals/InlineImageEditModal.tsx` | Edit images with reference + prompt |
| `src/components/preview/ContentPreview.tsx` | Markdown preview with click-to-edit inline editing |
| `src/components/preview/ImageCard.tsx` | Displays 3 image variations for header/body |
| `src/components/modals/` | Image generation modal components (5 files) |
| `src/components/screens/PageEditorScreen.tsx` | Chat + preview split view for content creation |
| `src/components/screens/PagesScreen.tsx` | Pages grid with thumbnail cards |
| `src/components/pages/PageCard.tsx` | Thumbnail card with image preview, content stats |
| `src/components/preview/EmptyPreview.tsx` | Helpful empty state with tips |
| `src/pages/CustomerSelection.tsx` | Customer selection with logos |
| `src/contexts/OnboardingContext.tsx` | Onboarding wizard state, step tracking, first name extraction |
| `src/components/onboarding/WizardBanner.tsx` | Progress dots banner with personalized greeting |
| `src/hooks/useOnboardingHeaderActions.ts` | Wraps save to advance through wizard |
| `src/hooks/useMockupGenerator.ts` | Device mockup generation state machine |
| `src/types/mockup.ts` | MockupTemplate, MockupResult types |
| `src/components/modals/MockupSelectionModal.tsx` | Template picker modal |
| `src/components/modals/MockupResultsModal.tsx` | Results modal with lightbox + download |
| `server/src/services/claude.ts` | Claude API with content tags, image planning, generate_image tool |
| `server/src/services/imageGen.ts` | Gemini image generation + editImageWithReference |
| `server/src/services/intelligentScraper.ts` | Multi-page Claude-directed scraper + parallel logo search |
| `server/src/services/logoSearch.ts` | Brave Image Search API for logo discovery |
| `railway.json` | Railway deployment configuration (build/start commands) |
| `IMAGE_MODAL_IMPLEMENTATION.md` | Detailed implementation guide for remaining work |
| `loveable-ai-content-generator/` | Lovable prototype repo (reference) |
