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
customer_settings (id, customer_id UNIQUE, company_info JSONB, voice_settings JSONB, style_settings JSONB)
pages (id, customer_id, title, content JSONB, chat_history JSONB, created_at, updated_at)
```

All tables have RLS enabled with policies scoped to `auth.uid() = created_by`.

### Frontend Hooks (React Query + Supabase)
- **`usePages.ts`** - CRUD for pages table
- **`useCompanySettings.ts`** - Company info with intelligent URL scanning, brand colors
- **`useVoiceSettings.ts`** - Voice dimension sliders (formality, humor, respect, enthusiasm)
- **`useStyleSettings.ts`** - Image style selection
- **`useChat.ts`** - Chat with streaming Claude API
- **`useImageGeneration.ts`** - Gemini image generation
- **`useImagePlanning.ts`** - Conversational image planning with AI recommendations
- **`useImageModal.ts`** - State machine for image generation modal (selection, lightbox, edit, regenerate)
- **`useContentBlocks.ts`** - Content block state with drag-drop reordering
- **`usePageEditor.ts`** - Page editing state (auto-generates titles on first save)

### Backend Services (`/server/src/services`)
- **`scraper.ts`** - Basic Firecrawl scraping (legacy)
- **`intelligentScraper.ts`** - Multi-page Claude-directed scraping with SSE streaming
- **`claude.ts`** - Claude API text generation with streaming, tools (web_search, scrape_url, generate_image)
- **`imageGen.ts`** - Gemini image generation
- **`webSearch.ts`** - Brave Search API for web search tool
- **`whisper.ts`** - OpenAI Whisper transcription
- **`fileProcessor.ts`** - PDF/DOCX/TXT/PPTX processing

### Backend Routes (`/server/src/routes`)
- **POST /api/scrape** - Basic website scraping (legacy)
- **POST /api/scrape/intelligent** - Multi-page intelligent scraping with SSE progress
- **POST /api/generate/text** - Claude text generation (supports `stream: true`)
- **POST /api/generate/title** - Generate page title from content
- **POST /api/generate/image-plan** - Analyze content and recommend images
- **POST /api/generate/image-plan/continue** - Continue image planning conversation
- **POST /api/generate/images** - Gemini image generation (parallel variations)
- **POST /api/generate/images/stream** - SSE streaming image generation (returns each image as it completes)
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
7. **File Processing** - PDF/DOCX/TXT extraction for chat attachments
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

## Coding Patterns

### Styling
- Tailwind semantic tokens: `text-foreground`, `bg-background`, `border-border`
- Never raw colors like `text-white` or `bg-black`
- Primary color: Purple (#7C21CC)

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
The intelligent scraper (`/api/scrape/intelligent`) uses SSE streaming:
1. Scrapes homepage, extracts internal links
2. Claude identifies best pages (About, Culture, Careers, Values, etc.)
3. Scrapes up to 10 relevant pages
4. Claude extracts company info + 6 brand colors
5. Real-time progress shown in UI with "Scan More" option

```tsx
await apiClient.scrapeIntelligent(
  url,
  (progress) => { /* onProgress - updates UI */ },
  { maxPages: 10, scanMore: false }
);
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

A full-screen modal experience for image generation with selection, editing, and drag-to-reorder functionality.

**Implementation Status:** Core integration complete. See `tasks/page-save-improvements.md` for known issues.

#### Completed Components (in `src/`)
| Component | File | Purpose |
|-----------|------|---------|
| Modal + Animation | `components/modals/ImageGenerationModal.tsx` | Robot painter loading, progress bar |
| Selection Grid | `components/modals/ImageSelectionGrid.tsx` | Placement groups, hover select/edit |
| Lightbox | `components/modals/ImageLightbox.tsx` | Full-screen view, keyboard nav |
| Edit Panel | `components/modals/EditImagePanel.tsx` | Reference image + prompt editing |
| Regenerate Popover | `components/modals/RegeneratePopover.tsx` | Modify prompt before regenerating |
| Draggable Image | `components/content/DraggableImageCard.tsx` | Sortable card with @dnd-kit |
| Draggable Preview | `components/content/DraggableContentPreview.tsx` | Content blocks + drag context |
| Text Block | `components/content/TextBlock.tsx` | Markdown renderer |
| Drop Zone | `components/content/DropZone.tsx` | Visual drop indicator |
| useImageModal Hook | `hooks/useImageModal.ts` | State machine for modal flow |
| Content Blocks Hook | `hooks/useContentBlocks.ts` | Block state management |
| Types | `types/content.ts`, `types/imageGeneration.ts` | All type definitions |

#### Integration Flow
1. User clicks "Generate Imagery" → AI recommends images in chat
2. User approves → `useImageModal.startGeneration()` opens modal
3. Modal shows loading animation → generates 3 variations per placement
4. User selects/skips/edits images → clicks "Apply"
5. `onImagesApplied` creates `ContentBlock[]` → renders in draggable preview

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
```

### Image Generation (Nano Banana Pro)
- **Model:** `gemini-3-pro-image-preview` (Nano Banana Pro)
- **API Timeout:** 180 seconds (image generation can take 60+ seconds)
- **Resolution:** 1K (configurable in `server/src/services/imageGen.ts`)
- **Supported Aspect Ratios:** `1:1`, `16:9`, `4:3`, `3:2`, `9:16`, `21:9`
- **Header images:** Always use `21:9` ultrawide
- **Body images:** Use AI-recommended ratio from supported list
- **Documentation:** See `3rd_Party_Docs/GEMINI_IMAGE_GENERATION_API.md`

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
| `src/hooks/useContentBlocks.ts` | Content block state with drag-drop reordering |
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
| `src/components/preview/ContentPreview.tsx` | Preview pane with markdown rendering |
| `src/components/preview/ImageCard.tsx` | Displays 3 image variations for header/body |
| `src/components/modals/` | Image generation modal components (5 files) |
| `src/components/content/` | Draggable content components (4 files) |
| `src/components/screens/PageEditorScreen.tsx` | Chat + preview split view for content creation |
| `src/components/screens/PagesScreen.tsx` | Pages grid with thumbnail cards |
| `src/components/pages/PageCard.tsx` | Thumbnail card with image preview, content stats |
| `src/components/preview/EmptyPreview.tsx` | Helpful empty state with tips |
| `src/pages/CustomerSelection.tsx` | Customer selection with logos |
| `server/src/services/claude.ts` | Claude API with content tags, image planning, generate_image tool |
| `server/src/services/imageGen.ts` | Gemini image generation + editImageWithReference |
| `server/src/services/intelligentScraper.ts` | Multi-page Claude-directed scraper |
| `IMAGE_MODAL_IMPLEMENTATION.md` | Detailed implementation guide for remaining work |
| `loveable-ai-content-generator/` | Lovable prototype repo (reference) |
