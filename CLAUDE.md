# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContentBuilder is an AI-powered content generation tool for Enboarder's Professional Services team. It generates branded text and images for employee journey workflows (onboarding, offboarding, etc.) by gathering customer context, configuring brand voice, and conducting AI interviews.

## Commands

### Development
```bash
npm run dev              # Run frontend (Vite :5173) and backend (Express :3001) concurrently
npm run dev:frontend     # Frontend only
npm run dev:server       # Backend only
```

### Build & Test
```bash
npm run build            # Build frontend (tsc + vite)
npm run build:server     # Build backend (tsc)
npm test                 # Run Jest tests (server)
npm run lint             # ESLint
npx tsc --noEmit         # Type check without emitting
```

### Server-specific (run from /server)
```bash
cd server && npm run dev           # Nodemon with ts-node
cd server && npm test              # Jest
cd server && npm run test:watch    # Jest watch mode
```

## Architecture

### Monorepo Structure
- **`/src`** - React frontend (Vite + TypeScript)
- **`/server`** - Express backend (TypeScript, separate package.json)
- **`/contentbuilder-core`** - Lovable-generated UI (separate git repo)

### Frontend (`/src`)
- **`/contexts/AuthContext.tsx`** - Supabase auth state (login, logout, session)
- **`/components/ProtectedRoute.tsx`** - Route guard with loading state
- **`/lib/supabase.ts`** - Supabase client initialization
- **`/services/api.ts`** - Axios client for backend API calls
- **`/pages/`** - Route components

### Backend (`/server/src`)
- **`index.ts`** - Express server with CORS, helmet, morgan
- **`/routes/scrape.ts`** - POST /api/scrape (website scraping with rate limiting & caching)
- **`/services/scraper.ts`** - Firecrawl-based website scraping + node-vibrant color extraction
- **`/services/braveSearch.ts`** - Company research via Brave Search API

### Key Integrations
- **Supabase** - Auth + database (project: "Prototypes", id: `gosgvisonkpkpsztbeok`)
- **Firecrawl** - Web scraping via `@mendable/firecrawl-js` (extracts metadata, handles JS rendering)
- **node-vibrant** - Color extraction from OG images
- **Brave Search** - Company research and industry inference
- **Claude API** - Text generation via `@anthropic-ai/sdk` (to be implemented)
- **OpenAI Whisper** - Speech-to-text via `openai` SDK (to be implemented)
- **NanoBanana Pro** - Image generation (to be implemented)

## Coding Patterns

### Styling
- Use Tailwind CSS semantic tokens: `text-foreground`, `bg-background`, `border-border`
- Never use raw colors like `text-white` or `bg-black`
- UI components follow shadcn/ui patterns (Radix primitives)

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)

### Auth Pattern
```tsx
import { useAuth } from '@/contexts/AuthContext';
const { user, login, logout, loading } = useAuth();
```

### API Client Pattern
```tsx
import { apiClient } from '@/services/api';
const result = await apiClient.scrape('https://example.com');
```

## Environment Variables

Required in `.env` (copy from `.env.example`):
```
# Frontend (Vite)
VITE_SUPABASE_URL=https://gosgvisonkpkpsztbeok.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Backend
FIRECRAWL_API_KEY=...          # Required for website scraping
BRAVE_API_KEY=...              # Optional for company research
ANTHROPIC_API_KEY=...          # Required for text generation
OPENAI_API_KEY=...             # Required for voice transcription
```

## Task Tracking

Active tasks are tracked in `/tasks/tasks-0001-prd-ai-content-generator.md`. Follow the task process:
1. Work one parent task at a time
2. Mark subtasks `[x]` as completed
3. Run tests before committing
4. Ask for approval before starting next parent task

## Current Status

**Completed:**
- Task 0.0: Project infrastructure & dependencies
- Task 1.0: Supabase authentication
- Task 2.0: Web scraping & company research (Firecrawl + Brave Search)

**Next:**
- Task 3.0: Claude API text generation
