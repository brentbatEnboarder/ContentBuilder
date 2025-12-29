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
- **`usePageEditor.ts`** - Page editing state

### Backend Services (`/server/src/services`)
- **`scraper.ts`** - Basic Firecrawl scraping (legacy)
- **`intelligentScraper.ts`** - Multi-page Claude-directed scraping with SSE streaming
- **`claude.ts`** - Claude API text generation with streaming
- **`imageGen.ts`** - Gemini image generation
- **`whisper.ts`** - OpenAI Whisper transcription
- **`fileProcessor.ts`** - PDF/DOCX/TXT/PPTX processing

### Backend Routes (`/server/src/routes`)
- **POST /api/scrape** - Basic website scraping (legacy)
- **POST /api/scrape/intelligent** - Multi-page intelligent scraping with SSE progress
- **POST /api/generate/text** - Claude text generation (supports `stream: true`)
- **POST /api/generate/images** - Gemini image generation
- **POST /api/transcribe** - Whisper transcription
- **POST /api/process/file** - File content extraction

## Current Implementation Status

### Completed ✅
1. **Supabase Setup** - Tables, RLS, auth
2. **Backend Auth** - JWT middleware on all /api/* routes
3. **Frontend UI** - All screens working (Company, Voice, Visual Style, Pages, PageEditor)
4. **Hook Migration** - All hooks use Supabase + React Query (not localStorage)
5. **Chat Integration** - Real Claude API with SSE streaming
6. **Image Generation** - Real Gemini API, auto-generates after text
7. **File Processing** - PDF/DOCX/TXT extraction for chat attachments
8. **Error Handling** - Loading states, toast notifications on all screens
9. **Intelligent Scraper** - Multi-page Claude-directed website scanning with real-time progress
10. **Brand Colors** - 6-color palette (primary, secondary, accent, textColor, buttonBg, buttonFg) auto-extracted

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
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=...
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
  (error) => { /* onError */ }
);
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

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root with QueryClient, routes |
| `src/hooks/useChat.ts` | Chat with streaming Claude API |
| `src/hooks/useCompanySettings.ts` | Company settings + intelligent URL scanning |
| `src/services/api.ts` | API client with JWT interceptor + streaming |
| `src/components/screens/CompanyInfoScreen.tsx` | Company info form with scan progress UI |
| `src/components/screens/ImageStyleScreen.tsx` | Brand colors + image style selection |
| `server/src/services/intelligentScraper.ts` | Multi-page Claude-directed scraper |
| `server/src/routes/scrape.ts` | Scraping endpoints (basic + intelligent) |
