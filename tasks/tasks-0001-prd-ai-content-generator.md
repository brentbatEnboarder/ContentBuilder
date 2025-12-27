# Tasks for PRD: AI Content Generator (ContentBuilder)

## Current State Assessment

The Lovable-generated codebase (`contentbuilder-core/`) provides a complete UI foundation:

**Already Built (UI Complete, Mock Data):**
- Login page with mock localStorage auth
- Customer setup (URL input, company profile, brand color pickers)
- Brand voice sliders (4 dimensions with sample communications)
- Image style selector (8 style grid)
- Content generator (objective input, source material upload)
- AI interview chat interface with mock voice recording
- Generated text/images display with copy/download
- Page management (save, view, edit, delete with localStorage)
- Export modal UI

**Needs Real Implementation:**
- Project infrastructure and dependencies
- Supabase authentication (replace mock auth)
- Web scraping & company research APIs
- Claude API for text generation
- NanoBanana API for image generation
- Whisper API for voice transcription
- File processing (PDF, DOCX parsing)
- Real export functionality

---

## Relevant Files

### Infrastructure & Configuration ✅
- `contentbuilder-core/.gitignore` - Git ignore patterns for Node.js, env files, build artifacts ✅
- `contentbuilder-core/.github/workflows/ci.yml` - GitHub Actions CI/CD pipeline ✅
- `contentbuilder-core/.env.example` - Template for all required environment variables ✅
- `contentbuilder-core/package.json` - Updated with all dependencies and scripts ✅
- `contentbuilder-core/server/` - New Express.js backend directory ✅
- `contentbuilder-core/server/src/index.ts` - Express server entry point ✅
- `contentbuilder-core/server/tsconfig.json` - TypeScript config for backend ✅
- `contentbuilder-core/server/package.json` - Backend dependencies (Express, Anthropic, OpenAI, Firecrawl) ✅
- `contentbuilder-core/server/jest.config.js` - Jest testing configuration ✅
- `contentbuilder-core/src/services/api.ts` - Frontend API client for backend calls ✅

### Authentication
- `contentbuilder-core/src/lib/supabase.ts` - Supabase client configuration
- `contentbuilder-core/src/contexts/AuthContext.tsx` - Update to use Supabase Auth
- `contentbuilder-core/src/components/ProtectedRoute.tsx` - Update for Supabase session check

### Backend Services
- `contentbuilder-core/server/services/scraper.ts` - Website scraping and color extraction
- `contentbuilder-core/server/services/scraper.test.ts` - Tests for scraper service
- `contentbuilder-core/server/services/claude.ts` - Claude API integration for text generation
- `contentbuilder-core/server/services/claude.test.ts` - Tests for Claude service
- `contentbuilder-core/server/services/imageGen.ts` - NanoBanana image generation
- `contentbuilder-core/server/services/imageGen.test.ts` - Tests for image generation
- `contentbuilder-core/server/services/whisper.ts` - OpenAI Whisper transcription
- `contentbuilder-core/server/services/whisper.test.ts` - Tests for Whisper service
- `contentbuilder-core/server/services/fileProcessor.ts` - PDF, DOCX, TXT parsing
- `contentbuilder-core/server/services/fileProcessor.test.ts` - Tests for file processor
- `contentbuilder-core/server/services/export.ts` - Export to Markdown, DOCX, ZIP
- `contentbuilder-core/server/services/export.test.ts` - Tests for export service

### API Routes
- `contentbuilder-core/server/routes/scrape.ts` - POST /api/scrape endpoint
- `contentbuilder-core/server/routes/generate.ts` - POST /api/generate/text, /api/generate/images
- `contentbuilder-core/server/routes/transcribe.ts` - POST /api/transcribe endpoint
- `contentbuilder-core/server/routes/process.ts` - POST /api/process/file, /api/process/url
- `contentbuilder-core/server/routes/export.ts` - GET /api/export/:format endpoint

### Frontend Updates
- `contentbuilder-core/src/services/api.ts` - API client for backend calls
- `contentbuilder-core/src/hooks/useAudioRecorder.ts` - MediaRecorder hook for voice input
- `contentbuilder-core/src/hooks/useAudioRecorder.test.ts` - Tests for audio recorder
- `contentbuilder-core/src/pages/Settings.tsx` - Update to call real scrape API
- `contentbuilder-core/src/components/content-generator/ContentGenerator.tsx` - Update for real generation
- `contentbuilder-core/src/components/content-generator/AIInterview.tsx` - Update for real voice input
- `contentbuilder-core/src/components/content-generator/SourceMaterial.tsx` - Update for real file upload
- `contentbuilder-core/src/components/sidebar/ExportModal.tsx` - Update for real exports

### Notes

- The existing Lovable codebase follows patterns documented in `CODING_GUIDE.md`
- Use semantic tokens for all colors (never raw colors like `text-white`)
- Follow component class patterns: `.btn-primary`, `.btn-ghost`, `.input-field`, `.card-elevated`
- All new services should be in `server/services/` directory
- Backend API routes will be in `server/routes/` directory using Express.js
- Unit tests should be colocated with source files (e.g., `scraper.test.ts` next to `scraper.ts`)
- Use `npm test` or `npx jest [optional/path/to/test/file]` to run tests
- Frontend dev server runs on port 5173 (Vite default)
- Backend dev server should run on port 3001

---

## Tasks

- [x] 0.0 Project Infrastructure & Dependencies Setup
  *Set up the complete development environment including GitHub repository integration, CI/CD pipeline, install all required dependencies, configure the Node.js backend, and establish environment variables for all API integrations.*

  - [x] 0.1 Verify git is initialized in contentbuilder-core and update `.gitignore` with comprehensive patterns (node_modules, .env, dist, .DS_Store, coverage, etc.)
  - [x] 0.2 Create GitHub repository for the project (if not exists) and push initial codebase
  - [x] 0.3 Create `.github/workflows/ci.yml` with GitHub Actions workflow for: lint, type-check, test, and build on push/PR
  - [x] 0.4 Configure GitHub branch protection rules for `main` branch (require PR reviews, passing CI) *(Manual: Settings > Branches)*
  - [x] 0.5 Set up GitHub repository secrets for all API keys (SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, BRAVE_API_KEY, NANOBANANA_API_KEY) *(Manual: Settings > Secrets)*
  - [x] 0.6 Create `.env.example` file documenting all required environment variables with placeholder values
  - [x] 0.7 Install frontend dependencies: `@supabase/supabase-js`, `axios` (auth-helpers-react deprecated, using core SDK)
  - [x] 0.8 Create `server/` directory structure: `server/index.ts`, `server/routes/`, `server/services/`, `server/middleware/`
  - [x] 0.9 Initialize `server/package.json` with backend dependencies: `express`, `cors`, `dotenv`, `helmet`, `morgan`, `multer`, `@mendable/firecrawl-js`
  - [x] 0.10 Install backend dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/cors`, `@types/node`
  - [x] 0.11 Create `server/tsconfig.json` with Node.js TypeScript configuration
  - [x] 0.12 Create basic Express server in `server/src/index.ts` with CORS, JSON parsing, and health check endpoint
  - [x] 0.13 Add `concurrently` to run frontend and backend dev servers together with single `npm run dev` command
  - [x] 0.14 Configure ESLint for backend TypeScript files *(uses root eslint.config.js)*
  - [x] 0.15 Set up Jest for backend unit testing with `server/jest.config.js`
  - [x] 0.16 Create `src/services/api.ts` with axios/fetch wrapper for calling backend APIs
  - [x] 0.17 Test infrastructure by running `npm run dev` and verifying both servers start

- [ ] 1.0 Set up Supabase Authentication
  *Replace mock localStorage auth with real Supabase Auth. Implement email/password authentication, session management, and protected route logic.*

  - [ ] 1.1 Create Supabase project at supabase.com and enable Email/Password auth provider
  - [ ] 1.2 Copy Supabase project URL and anon key to `.env` file
  - [ ] 1.3 Create `src/lib/supabase.ts` with Supabase client initialization using environment variables
  - [ ] 1.4 Update `AuthContext.tsx` to import and use Supabase client instead of localStorage
  - [ ] 1.5 Replace mock `login()` function with `supabase.auth.signInWithPassword()`
  - [ ] 1.6 Replace mock `logout()` function with `supabase.auth.signOut()`
  - [ ] 1.7 Add `useEffect` to listen for auth state changes with `supabase.auth.onAuthStateChange()`
  - [ ] 1.8 Update `user` state to use Supabase User type and extract email/metadata
  - [ ] 1.9 Update `ProtectedRoute.tsx` to check `supabase.auth.getSession()` for valid session
  - [ ] 1.10 Add loading state while checking initial session on app load
  - [ ] 1.11 Implement proper error messages for invalid credentials, network errors
  - [ ] 1.12 Add "Forgot Password" flow using `supabase.auth.resetPasswordForEmail()` (optional, can be deferred)
  - [ ] 1.13 Test complete auth flow: login, session persistence on refresh, logout

- [ ] 2.0 Implement Web Scraping & Company Research Service
  *Create backend service to scrape customer websites for company information and auto-detect brand colors. Integrate with Brave Search API for company research.*

  - [ ] 2.1 Install scraping dependencies in server: `cheerio`, `puppeteer` (or `playwright`), `color-thief-node`
  - [ ] 2.2 Create `server/services/scraper.ts` with main `scrapeWebsite(url: string)` function
  - [ ] 2.3 Implement HTML fetching with proper headers (User-Agent) and timeout handling
  - [ ] 2.4 Extract page title, meta description, and Open Graph data from HTML
  - [ ] 2.5 Implement CSS color extraction: parse stylesheets for primary/brand colors
  - [ ] 2.6 Implement image-based color extraction using color-thief on logo/hero images
  - [ ] 2.7 Create `server/services/braveSearch.ts` for company research API calls
  - [ ] 2.8 Implement `searchCompanyInfo(companyName: string)` to get company background
  - [ ] 2.9 Create `server/routes/scrape.ts` with POST `/api/scrape` endpoint
  - [ ] 2.10 Endpoint should accept `{ url: string }` and return `{ profile: string, colors: { primary, secondary, accent } }`
  - [ ] 2.11 Add input validation: URL format validation, allowed protocols (http/https only)
  - [ ] 2.12 Implement rate limiting middleware to prevent abuse (e.g., 10 requests/minute per IP)
  - [ ] 2.13 Add caching layer (in-memory or Redis) to avoid re-scraping same URLs within 24 hours
  - [ ] 2.14 Update `Settings.tsx` to call `/api/scrape` instead of using mock data
  - [ ] 2.15 Update loading states and error handling in frontend for real API calls
  - [ ] 2.16 Write unit tests for scraper service with mocked HTTP responses

- [ ] 3.0 Integrate Claude API for Text Generation
  *Connect to Claude API for AI-powered content generation. Use customer context, brand voice settings, and page objectives to generate personalized content.*

  - [ ] 3.1 Install Anthropic SDK in server: `@anthropic-ai/sdk`
  - [ ] 3.2 Create `server/services/claude.ts` with Claude client initialization
  - [ ] 3.3 Design system prompt template that incorporates company profile and brand context
  - [ ] 3.4 Create `buildVoicePrompt()` function to convert voice slider values (0-4) to natural language instructions
  - [ ] 3.5 Create `generateContent()` function accepting objective, context, voice settings, and source materials
  - [ ] 3.6 Implement proper message formatting for Claude API (system, user, assistant roles)
  - [ ] 3.7 Create `server/routes/generate.ts` with POST `/api/generate/text` endpoint
  - [ ] 3.8 Endpoint should accept `{ objective, companyProfile, voiceSettings, imageStyle, sourceMaterials }`
  - [ ] 3.9 Implement streaming response using Claude's streaming API for real-time text display
  - [ ] 3.10 Update frontend `ContentGenerator.tsx` to call `/api/generate/text` API
  - [ ] 3.11 Implement streaming text display in `GeneratedText.tsx` component
  - [ ] 3.12 Create `generateInterviewQuestion()` function for AI interview follow-up questions
  - [ ] 3.13 Update `AIInterview.tsx` to use real Claude responses instead of mock messages
  - [ ] 3.14 Implement content regeneration: POST `/api/generate/text` with feedback parameter
  - [ ] 3.15 Add error handling for API rate limits, token limits, and network failures
  - [ ] 3.16 Write unit tests for prompt building and voice settings conversion

- [ ] 4.0 Integrate NanoBanana API for Image Generation
  *Connect to NanoBanana Pro API for AI image generation. Apply selected image style presets and custom prompts to generate relevant visuals.*

  - [ ] 4.1 Research NanoBanana Pro API documentation and authentication method
  - [ ] 4.2 Create `server/services/imageGen.ts` with API client setup
  - [ ] 4.3 Create `styleToPrompt` mapping object converting style IDs to detailed image prompts
  - [ ] 4.4 Implement `generateImages()` function accepting content summary, style, and custom additions
  - [ ] 4.5 Build image prompt that combines: content context + style preset + brand colors + custom prompt
  - [ ] 4.6 Add POST `/api/generate/images` endpoint to `server/routes/generate.ts`
  - [ ] 4.7 Endpoint should accept `{ contentSummary, styleId, customPrompt, brandColors }` and return 3 image URLs
  - [ ] 4.8 Implement image storage: save generated images to Supabase Storage bucket
  - [ ] 4.9 Create Supabase Storage bucket "generated-images" with public read access
  - [ ] 4.10 Update `GeneratedImages.tsx` to display real images from API response
  - [ ] 4.11 Implement image regeneration with modified prompts
  - [ ] 4.12 Add progress indicator during image generation (can take 10-30 seconds)
  - [ ] 4.13 Implement single image regeneration (regenerate just one of the 3 images)
  - [ ] 4.14 Add error handling for generation failures, inappropriate content filters
  - [ ] 4.15 Write unit tests for prompt building logic

- [ ] 5.0 Implement Voice Input with Whisper API
  *Add real audio recording using MediaRecorder API and integrate OpenAI Whisper for speech-to-text transcription in the AI interview flow.*

  - [ ] 5.1 Install OpenAI SDK in server: `openai`
  - [ ] 5.2 Create `src/hooks/useAudioRecorder.ts` custom hook for audio recording
  - [ ] 5.3 Implement `startRecording()` using `navigator.mediaDevices.getUserMedia()` and MediaRecorder
  - [ ] 5.4 Implement `stopRecording()` that returns audio Blob
  - [ ] 5.5 Add recording state management: idle, recording, processing
  - [ ] 5.6 Implement audio level visualization (optional: show waveform during recording)
  - [ ] 5.7 Create `server/services/whisper.ts` with OpenAI Whisper client
  - [ ] 5.8 Implement `transcribeAudio(audioBuffer: Buffer)` function using Whisper API
  - [ ] 5.9 Create `server/routes/transcribe.ts` with POST `/api/transcribe` endpoint
  - [ ] 5.10 Configure `multer` middleware to handle audio file uploads (multipart/form-data)
  - [ ] 5.11 Endpoint should accept audio file and return `{ text: string, confidence?: number }`
  - [ ] 5.12 Update `AIInterview.tsx` to use `useAudioRecorder` hook for real recording
  - [ ] 5.13 Send recorded audio to `/api/transcribe` and insert result into chat input
  - [ ] 5.14 Add visual feedback: pulsing red indicator during recording, spinner during transcription
  - [ ] 5.15 Handle microphone permission denial with user-friendly error message
  - [ ] 5.16 Add audio format handling: convert webm to mp3/wav if needed for Whisper compatibility
  - [ ] 5.17 Write unit tests for audio recorder hook (mock MediaRecorder)

- [ ] 6.0 Implement File Processing & URL Content Extraction
  *Add support for parsing uploaded files (PDF, DOCX, TXT, PPTX) and extracting content from provided URLs as source material for generation.*

  - [ ] 6.1 Install file processing dependencies: `pdf-parse`, `mammoth`, `pptx-parser` (or similar)
  - [ ] 6.2 Create `server/services/fileProcessor.ts` with unified file processing interface
  - [ ] 6.3 Implement `processPDF(buffer: Buffer): Promise<string>` using pdf-parse
  - [ ] 6.4 Implement `processDOCX(buffer: Buffer): Promise<string>` using mammoth
  - [ ] 6.5 Implement `processTXT(buffer: Buffer): Promise<string>` with encoding detection
  - [ ] 6.6 Implement `processPPTX(buffer: Buffer): Promise<string>` extracting slide text
  - [ ] 6.7 Create main `processFile(buffer, mimeType)` function that routes to correct processor
  - [ ] 6.8 Create `server/routes/process.ts` with POST `/api/process/file` endpoint
  - [ ] 6.9 Configure multer for file uploads with size limit (10MB) and allowed MIME types
  - [ ] 6.10 Implement `extractURLContent(url: string)` using cheerio to get main article text
  - [ ] 6.11 Add POST `/api/process/url` endpoint accepting `{ url: string }`
  - [ ] 6.12 Implement content cleaning: remove boilerplate, ads, navigation from extracted text
  - [ ] 6.13 Update `SourceMaterial.tsx` to upload files to `/api/process/file` endpoint
  - [ ] 6.14 Store processed text in component state for inclusion in generation request
  - [ ] 6.15 Update URL input to call `/api/process/url` and display extracted content preview
  - [ ] 6.16 Add file type validation in frontend before upload (show error for unsupported types)
  - [ ] 6.17 Implement loading states for file processing (can take a few seconds for large PDFs)
  - [ ] 6.18 Write unit tests for each file processor with sample files

- [ ] 7.0 Complete Export & Download Functionality
  *Implement real file downloads for generated content. Support Markdown/DOCX text export and ZIP archives for images.*

  - [ ] 7.1 Install export dependencies: `docx` (for Word docs), `archiver` (for ZIP files)
  - [ ] 7.2 Create `server/services/export.ts` with export service
  - [ ] 7.3 Implement `exportToMarkdown(pages: SavedPage[])` returning Markdown string
  - [ ] 7.4 Implement `exportToDocx(pages: SavedPage[])` returning DOCX buffer using `docx` library
  - [ ] 7.5 Implement `exportImages(imageUrls: string[])` that downloads images and creates ZIP
  - [ ] 7.6 Implement `exportAll(pages, format, includeImages)` combining text and images
  - [ ] 7.7 Create `server/routes/export.ts` with GET `/api/export` endpoint
  - [ ] 7.8 Endpoint should accept query params: `format` (md|docx), `includeImages` (boolean), `pageIds` (comma-separated)
  - [ ] 7.9 Set proper Content-Disposition headers for file download with appropriate filename
  - [ ] 7.10 Update `ExportModal.tsx` to call export API and trigger browser download
  - [ ] 7.11 Implement "Copy to Clipboard" for generated text in `GeneratedText.tsx` (already partially done, verify works)
  - [ ] 7.12 Implement individual image download in `GeneratedImages.tsx`
  - [ ] 7.13 Add "Download Selected Image" functionality for chosen image
  - [ ] 7.14 Add progress indicator for large exports (multiple pages with images)
  - [ ] 7.15 Handle export errors gracefully with user-friendly messages
  - [ ] 7.16 Write unit tests for Markdown and DOCX generation

---

## Dependency Installation Summary

### Frontend (`contentbuilder-core/package.json`)
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-react axios
```

### Backend (`contentbuilder-core/server/package.json`)
```bash
# Production dependencies
npm install express cors dotenv helmet morgan multer @anthropic-ai/sdk openai cheerio puppeteer color-thief-node pdf-parse mammoth docx archiver

# Dev dependencies
npm install -D typescript ts-node nodemon @types/express @types/cors @types/node @types/multer jest ts-jest @types/jest
```

### Root (`contentbuilder-core/package.json` scripts)
```bash
npm install -D concurrently
```

---

## Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NANOBANANA_API_KEY=your-key

# Search
BRAVE_API_KEY=your-brave-api-key

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] User can log in with email/password via Supabase
- [ ] Session persists across page refreshes
- [ ] Website URL scan returns real company info and colors
- [ ] Brand voice sliders affect generated content tone
- [ ] Content generation produces relevant, styled text
- [ ] AI interview responds contextually to user input
- [ ] Voice recording transcribes speech accurately
- [ ] File uploads (PDF, DOCX) extract text content
- [ ] URL content extraction works for article pages
- [ ] Images generate matching selected style
- [ ] Export produces valid Markdown/DOCX files
- [ ] All pages save and load from localStorage correctly
- [ ] CI/CD pipeline runs on every push
