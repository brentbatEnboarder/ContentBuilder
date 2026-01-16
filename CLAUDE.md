# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

ContentBuilder is an AI-powered content generation tool for Enboarder's Professional Services team. It generates branded text and images for employee journey workflows by gathering customer context, configuring brand voice, and conducting AI interviews.

**Multi-Customer Architecture:** PS users log in, select a customer (or create one), and all data (pages, brand settings, voice) is scoped to that customer.

## Commands

```bash
# Development (user manages servers - do not start/manage them)
npm run dev              # Frontend (Vite :5173) + backend (Express :3001)
npm run dev:frontend     # Frontend only
npm run dev:server       # Backend only

# Build & Test
npm run build:all        # Build frontend + backend (production)
npm test                 # Jest tests (server)
npm run lint             # ESLint
npx tsc --noEmit         # Type check
```

## Architecture

### Monorepo Structure
- **`/src`** - React frontend (Vite + TypeScript)
- **`/server`** - Express backend (TypeScript, separate package.json)

### Supabase
- **Project ID:** `qobjinzombhqfnzepgvz`
- **Region:** ap-southeast-1

### Database Schema
```sql
customers (id, name, created_by, created_at, updated_at)
customer_settings (id, customer_id UNIQUE, company_info JSONB, voice_settings JSONB, style_settings JSONB, onboarding_completed BOOLEAN)
pages (id, customer_id, title, content JSONB, chat_history JSONB, created_at, updated_at)
usage_events (id, user_id, event_type, customer_id, page_id, metadata JSONB, created_at)
```
All tables have RLS enabled with policies scoped to `auth.uid() = created_by`.
Usage events: users can insert own events; service role has full access for admin queries.

### Key Frontend Hooks
- `useChat.ts` - Chat with streaming Claude API, content tag parsing, inline images
- `useCompanySettings.ts` - Company info with intelligent URL scanning, brand colors
- `useImagePlanning.ts` - Conversational image planning with AI recommendations
- `useImageModal.ts` - State machine for image generation modal
- `useContentBlocks.ts` - Content block state for image storage
- `usePageEditor.ts` - Page editing with auto title generation
- `useMockupGenerator.ts` - Device mockup generation
- `useAdmin.ts` - Admin access check (email whitelist)

### Key Backend Services (`/server/src/services`)
- `claude.ts` - Claude API with streaming, tools (web_search, scrape_url, generate_image)
- `imageGen.ts` - Gemini image generation (2K resolution, parallel variations)
- `intelligentScraper.ts` - Multi-page Claude-directed scraping with SSE + logo search
- `fileProcessor.ts` - PDF/DOCX/TXT/MD/PPTX/XLSX processing (50K char limit)

### Key API Routes (`/server/src/routes`)
- `POST /api/scrape/intelligent` - Multi-page intelligent scraping with SSE
- `POST /api/generate/text` - Claude text generation (supports streaming)
- `POST /api/generate/images` - Gemini image generation
- `POST /api/generate/images/stream` - SSE streaming image generation
- `POST /api/generate/mockup` - Device mockup generation
- `GET /api/image-proxy` - CORS proxy for external images (no auth)
- `GET /api/admin/usage` - Usage analytics (admin only)

## Environment Variables

```bash
SUPABASE_URL=https://qobjinzombhqfnzepgvz.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=https://qobjinzombhqfnzepgvz.supabase.co
VITE_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...        # Gemini image generation
FIRECRAWL_API_KEY=...
BRAVE_SEARCH_API_KEY=...  # Web search tool
```

## Deployment (Railway)

- **Production URL:** `https://acg.up.railway.app`
- **Config:** `railway.json` (build: `npm run build:all`, start: `npm run start`)
- **Note:** Build scripts use explicit `./node_modules/.bin/` paths for Nixpacks compatibility

Express serves both API (`/api/*`) and static frontend (`/dist`) with SPA fallback.

## Coding Patterns

### Styling
- Use Tailwind semantic tokens: `text-foreground`, `bg-background`, `border-border`
- Never raw colors like `text-white` or `bg-black`
- **Colors:** Purple (#7C21CC) for AI, Coral (#fc7361) for CTAs, Teal (#5dedd7) for positive actions
- **Extended palette:** `bg-coral`, `bg-teal`, `bg-golden`, `bg-magenta`, `bg-sky`, `bg-mint`

### Hooks Pattern
```tsx
const { settings, hasChanges, isSaving, save, cancel } = useVoiceSettings();
// All hooks expose: isLoading, isSaving, error, hasChanges
// All save functions are async and should be awaited
```

### Content Tags Pattern
Claude wraps publishable content in `<content>` tags:
- Conversational responses appear in chat
- Content inside `<content>...</content>` streams to preview pane
- `currentContent` prop passes existing content for follow-up edits

### API Streaming Pattern
```tsx
await apiClient.generateTextStream(
  request,
  (chunk) => { /* onChunk */ },
  (fullText) => { /* onComplete */ },
  (error) => { /* onError */ },
  (toolName, toolId) => { /* onToolStart */ },
  (toolResult) => { /* onToolResult */ }
);
```

### Tool Call Continuation
When Claude calls tools (web_search, scrape_url, generate_image), backend must:
1. Execute tool → yield `tool_result` event to frontend
2. Build `tool_result` message for Claude
3. Make follow-up API call with tool results
4. Loop until no more tool calls (max 10 iterations)

### SSE Buffer Handling
Always process remaining buffer after stream ends:
```typescript
while (true) {
  const { done, value } = await reader.read();
  if (value) buffer += decoder.decode(value, { stream: true });
  if (done) break;
}
// IMPORTANT: Process remaining buffer
if (buffer.trim()) { /* handle final event */ }
```

### Header Actions Context
```tsx
useRegisterHeaderActions(hasChanges, isSaving, handleSave, handleCancel, { onBack, pageTitle });
```
**Important:** Callbacks stored in refs (not state) to prevent stale closures.

## Key Types

```typescript
type ContentBlock =
  | { type: 'text'; id: string; content: string; }
  | { type: 'image'; id: string; imageUrl: string; aspectRatio: AspectRatio; placementType: PlacementType; altText?: string; };

type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:2' | '9:16';
type PlacementType = 'header' | 'body' | 'footer';
```

## Image Generation

- **Model:** `gemini-3-pro-image-preview` (Nano Banana Pro)
- **Resolution:** 2K (~2048px)
- **Timeout:** 180 seconds
- **Header images:** Always `21:9` ultrawide
- **Parallel generation:** 3 variations per placement, all placements concurrent

## Device Mockups

5 templates in `/public/` (Mock1-5.png). Flow:
1. Frontend captures content at 1170×2532 (iPhone resolution)
2. Template + screenshot sent to Gemini
3. Returns composite with realistic screen reflections

## File Upload

Supported: PDF, DOCX, TXT, MD, PPTX, XLSX (max 10MB, 50K chars)
- PDFs use Claude's native document API
- Other formats extract text content

## Onboarding Wizard

4-step flow for new customers: Company Info → Brand Voice → Visual Style → First Page
- `OnboardingContext` tracks state
- `onboarding_completed` boolean in `customer_settings`

## Admin & Usage Tracking

- **Admin access:** Email whitelist in `useAdmin.ts` and `server/src/routes/admin.ts`
- **Current admins:** `brent@enboarder.com`
- **Usage events tracked:** `user_login`, `customer_selected`, `page_created`
- **Logging service:** `src/services/usageLogger.ts` (fire-and-forget pattern)
- **Admin dashboard:** Shows stats, 7-day activity, recent events table

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useChat.ts` | Chat with streaming, content tags, inline images |
| `src/hooks/useImagePlanning.ts` | Image planning state machine |
| `src/hooks/useImageModal.ts` | Image generation modal |
| `src/hooks/usePageEditor.ts` | Page editing, auto titles |
| `src/hooks/useAdmin.ts` | Admin access check |
| `src/services/api.ts` | API client with JWT + streaming |
| `src/services/usageLogger.ts` | Usage event logging |
| `src/types/content.ts` | ContentBlock types |
| `server/src/services/claude.ts` | Claude API with tools |
| `server/src/services/imageGen.ts` | Gemini image generation |
| `server/src/services/intelligentScraper.ts` | Website scraping |
| `server/src/routes/admin.ts` | Admin API endpoints |
