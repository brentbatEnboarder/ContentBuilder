# PRD: AI Content Generator for Enboarder

**Document ID:** 0001-prd-ai-content-generator
**Created:** December 27, 2025
**Last Updated:** December 27, 2025
**Status:** Draft
**Version:** 1.4

---

## 1. Introduction/Overview

### The Problem

Enboarder's Professional Services team regularly engages with customers to help them implement employee journey workflows (onboarding, offboarding, transitions, etc.). A significant bottleneck in this process is **content creation**. Customer content often exists in scattered, hard-to-use formats:

- Buried in various internal documents (PDFs, Word docs, presentations)
- Scattered across company websites
- Living only in the heads of key stakeholders
- Not formatted or structured for easy import into Enboarder's Content Module

This makes workflow implementation time-consuming and heavily dependent on customer availability to provide and format content.

### The Solution

**ContentBuilder** is an AI-powered utility tool for Enboarder's Professional Services consultants. It accelerates content creation by:

1. **Gathering context** about the customer (via website scraping and web research)
2. **Establishing brand voice** through configurable tone sliders
3. **Conducting AI-assisted interviews** to extract content from stakeholders
4. **Generating text and images** that match the customer's brand and objectives
5. **Enabling rapid iteration** through feedback-driven editing

The generated content (text and images) can then be easily copied/downloaded and pasted into Enboarder's workflow builder.

### Target Users

**Primary:** Enboarder Professional Services Consultants who engage with customers during workflow implementation.

**Secondary:** Customer stakeholders who participate in content interviews and provide feedback.

---

## 2. Goals

| Goal | Description | Measurable Outcome |
|------|-------------|-------------------|
| **Reduce content creation time** | Accelerate the time it takes to create content pages for Enboarder workflows | 50% reduction in time spent on content creation per implementation |
| **Increase PS team capacity** | Enable consultants to handle more implementations by reducing per-customer effort | Track implementations per consultant before/after |
| **Improve content quality** | Generate on-brand, polished content that requires minimal editing | Customer satisfaction and feedback ratings |
| **Simplify content extraction** | Make it easy to gather information from customers who have scattered content | Qualitative feedback from PS team |

---

## 3. User Stories

### Setup & Context Gathering

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-01 | As a PS consultant, I want to enter a customer's website URL so that the system can automatically gather information about their company, brand, and culture. | - URL input field<br>- System scrapes website content<br>- System performs supplementary web search<br>- Company profile summary is generated and displayed |
| US-02 | As a PS consultant, I want to configure brand voice settings using sliders so that all generated content matches the customer's tone. | - 4 voice dimension sliders (Formality, Humor, Respect, Enthusiasm)<br>- Real-time preview of voice settings<br>- Settings can be adjusted at any time |
| US-03 | As a PS consultant, I want to select a default image style from preset options so that generated images are visually consistent. | - Menu of pre-defined image style options<br>- Style selection persists across page generation<br>- Style can be changed at any time |
| US-25 | As a PS consultant, I want to capture the customer's brand colors (as hex values) so that generated images can incorporate their visual identity. | - Input fields for primary, secondary, and accent colors<br>- Hex color format (#RRGGBB)<br>- Color picker UI for easy selection<br>- Colors passed to image generation prompts |

### Content Generation

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-04 | As a PS consultant, I want to describe the objective of a content page so that the AI understands what to generate. | - Text field for page objective/description<br>- Clear prompts guiding what information is needed |
| US-05 | As a PS consultant, I want to upload files (PDFs, docs, images) to provide source material so that the AI can use this content. | - File upload component supporting common formats<br>- Files are processed and content extracted<br>- AI references uploaded content in generation |
| US-06 | As a PS consultant, I want to enter a URL as source material so that the AI can use web content. | - URL input field<br>- System fetches and processes URL content<br>- AI references URL content in generation |
| US-07 | As a PS consultant, I want the AI to interview me (or the customer) if more information is needed so that we can fill gaps in content. | - AI detects when insufficient information exists<br>- Conversational interview mode is triggered<br>- Questions are contextual and specific<br>- Interview continues until sufficient information gathered |

### Voice Input

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-14 | As a PS consultant, I want to speak my responses instead of typing so that I can have a more natural conversation with customers present. | - Microphone button visible in chat interface<br>- Press-to-record or toggle recording<br>- Audio is transcribed to text in real-time<br>- Transcribed text appears in input field for review before sending |
| US-15 | As a PS consultant, I want to see my transcribed speech before it's sent so that I can correct any transcription errors. | - Transcribed text is editable<br>- Clear visual indicator that transcription is complete<br>- Option to re-record if needed |
| US-16 | As a PS consultant, I want clear visual feedback when the system is listening so that I know when to speak. | - Recording indicator (pulsing icon, color change)<br>- Audio level visualization (optional)<br>- Clear start/stop states |
| US-08 | As a PS consultant, I want the system to generate text content for a page so that I have ready-to-use copy. | - Text is generated based on objective, context, and brand voice<br>- Text is displayed in an editable format<br>- Text can be copied to clipboard |
| US-09 | As a PS consultant, I want the system to generate 3 image alternatives for a page so that I can choose the best option. | - 3 different images are generated per request<br>- Images match the selected style and page context<br>- Images are displayed for comparison |

### Iteration & Export

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-10 | As a PS consultant, I want to provide feedback on generated content so that I can quickly refine it. | - Feedback input field for text<br>- AI regenerates based on feedback<br>- Edit history is maintained |
| US-11 | As a PS consultant, I want to choose one of the 3 generated images, regenerate all, or edit via prompt so that I get the right visual. | - Select button for each image<br>- "Regenerate All" button<br>- Prompt field for guided edits to images |
| US-12 | As a PS consultant, I want to download images and copy text so that I can easily transfer them into Enboarder. | - Download button for images<br>- Copy to clipboard button for text<br>- Clear visual confirmation of actions |
| US-13 | As a PS consultant, I want to adjust brand voice or image style mid-session so that I can respond to customer feedback. | - Voice sliders accessible at any time<br>- Image style menu accessible at any time<br>- Changes apply to new generations |

### Page Management

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-17 | As a PS consultant, I want to save a completed page so that I can preserve my work before moving to the next page. | - "Save Page" button visible after content generation<br>- Page is saved with title, text, and selected image<br>- Visual confirmation of save |
| US-18 | As a PS consultant, I want to create a new page after saving so that I can generate content for multiple pages in one session. | - "New Page" button available after save<br>- New page starts fresh but retains customer context and settings<br>- Previous pages remain accessible |
| US-19 | As a PS consultant, I want to see a list of all saved pages in the current session so that I can navigate between them. | - Sidebar or panel showing saved pages<br>- Pages listed by title/objective<br>- Click to view saved page content |
| US-20 | As a PS consultant, I want to export all saved pages at once so that I can download everything for a customer in one action. | - "Export All" button in page list<br>- Downloads all text as single document or ZIP<br>- Downloads all images in organized folder/ZIP |

### Authentication

| ID | User Story | Acceptance Criteria |
|----|-----------|-------------------|
| US-21 | As a PS consultant, I want to log in with my Enboarder credentials so that only authorized team members can access the tool. | - Login page with email/password fields<br>- Secure authentication via Supabase<br>- Redirect to main app after successful login |
| US-22 | As a PS consultant, I want to stay logged in across browser sessions so that I don't have to re-authenticate every time. | - Persistent session tokens<br>- Automatic session refresh<br>- Session expires after extended inactivity (e.g., 7 days) |
| US-23 | As a PS consultant, I want to log out when I'm done so that my session is secured on shared devices. | - Logout button visible in header/menu<br>- Session cleared on logout<br>- Redirect to login page |
| US-24 | As an admin, I want to manage which users can access ContentBuilder so that only PS team members have access. | - User management via Supabase dashboard<br>- Ability to add/remove authorized users<br>- Email-based invitations (optional) |

---

## 4. Functional Requirements

### 4.1 Customer Context Setup

| ID | Requirement |
|----|-------------|
| FR-01 | The system must accept a customer website URL and scrape relevant content (about page, careers, company info, key messages). |
| FR-02 | The system must perform a web search for supplementary information about the customer (news, culture, values, industry). |
| FR-03 | The system must generate and display a customer profile summary based on gathered information. |
| FR-04 | The system must allow the PS consultant to edit/enhance the customer profile manually. |
| FR-64 | The system must provide input fields for capturing customer brand colors:<br>- **Primary color** (required)<br>- **Secondary color** (optional)<br>- **Accent color** (optional) |
| FR-65 | The system must store brand colors in hex format (#RRGGBB). |
| FR-66 | The system must provide a color picker UI component for each color field (in addition to manual hex entry). |
| FR-67 | The system must validate hex color input format and display a color preview swatch. |
| FR-68 | The system must include brand colors in image generation prompts where applicable (especially for diagrams, illustrations, and branded graphics). |
| FR-69 | The system must attempt to auto-detect brand colors from the customer's website during scraping (user can override). |

### 4.2 Brand Voice Configuration

| ID | Requirement |
|----|-------------|
| FR-05 | The system must provide 4 brand voice sliders with the following dimensions:<br>- **Formal ↔ Casual** (0-4 scale)<br>- **Serious ↔ Funny** (0-4 scale)<br>- **Respectful ↔ Irreverent** (0-4 scale)<br>- **Matter-of-fact ↔ Enthusiastic** (0-4 scale) |
| FR-06 | The system must display real-time examples showing how voice settings affect generated content (per the brand voice slider spec). |
| FR-07 | The system must persist voice settings across the session and apply them to all generated content. |
| FR-08 | The system must allow voice settings to be modified at any time during the session. |

### 4.3 Image Style Configuration

| ID | Requirement |
|----|-------------|
| FR-09 | The system must provide a menu of pre-defined image styles (style list to be provided separately). |
| FR-10 | The system must display **thumbnail image previews** for each style to aid selection. |
| FR-11 | The system must persist the selected image style across page generations. |
| FR-12 | The system must allow image style to be changed at any time. |
| FR-13 | The system must allow typed prompt additions to modify the base image style. |

### 4.4 Page Content Generation

| ID | Requirement |
|----|-------------|
| FR-14 | The system must accept a page objective/description from the user. |
| FR-15 | The system must accept file uploads as source material (supported formats: PDF, DOCX, TXT, PNG, JPG, PPTX). **Max file size: 10MB.** |
| FR-16 | The system must accept URLs as source material and fetch/process the content. |
| FR-17 | The system must analyze available information and determine if sufficient context exists for generation. |
| FR-18 | If insufficient information exists, the system must initiate an AI-driven interview to gather required details. |
| FR-19 | The interview must ask contextual, specific questions relevant to the page objective. |
| FR-20 | The interview must continue until the AI determines sufficient information has been gathered. |
| FR-21 | The system must generate text content that:<br>- Matches the configured brand voice settings<br>- Incorporates customer context (company info, industry, culture)<br>- Addresses the stated page objective<br>- Uses information from uploaded files/URLs<br>- Uses information gathered from the interview |
| FR-22 | The system must generate 3 alternative images that:<br>- Match the configured image style<br>- Are contextually relevant to the page content<br>- Reflect the customer's brand/industry where appropriate |

### 4.5 Feedback & Iteration

| ID | Requirement |
|----|-------------|
| FR-23 | The system must accept text feedback on generated content. |
| FR-24 | The system must regenerate text content based on feedback while maintaining brand voice. |
| FR-25 | The system must allow users to select one of the 3 generated images as the final choice. |
| FR-26 | The system must provide a "Regenerate All" option for images. |
| FR-27 | The system must accept prompt-based edits to images (e.g., "make the background blue", "add more people"). |
| FR-28 | The system must apply prompt-based edits to selected image(s). |

### 4.6 Export

| ID | Requirement |
|----|-------------|
| FR-29 | The system must provide a "Copy to Clipboard" function for generated text. |
| FR-30 | The system must provide a "Download" function for generated/selected images. |
| FR-31 | The system must support common image formats for download (PNG, JPG). |
| FR-32 | The system must provide visual confirmation when copy/download actions complete. |

### 4.7 Session & Page Management

| ID | Requirement |
|----|-------------|
| FR-33 | The system must maintain session state for customer context, voice settings, image style, and generated content. |
| FR-34 | The system must support generating multiple pages within a single session. |
| FR-35 | The system must allow starting a new page while retaining customer context and settings. |
| FR-36 | The system must provide a "Save Page" action that stores the current page's title, objective, text content, and selected image to the session. |
| FR-37 | The system must display a sidebar/panel showing all saved pages in the current session with their titles. |
| FR-38 | The system must allow users to click on a saved page to view its content (read-only or editable). |
| FR-39 | The system must provide a "New Page" action that clears the current page workspace while preserving saved pages and settings. |
| FR-40 | The system must prompt users to save unsaved work before creating a new page (if content has been generated). |
| FR-41 | The system must provide an "Export All" action that downloads all saved pages as:<br>- A combined text document (Markdown or DOCX) with all page content<br>- A ZIP file containing all selected images, named by page title |
| FR-42 | The system must allow individual page deletion from the saved pages list. |
| FR-43 | The system must display a page count indicator (e.g., "3 pages saved"). |

### 4.9 Voice Input (Speech-to-Text)

| ID | Requirement |
|----|-------------|
| FR-44 | The system must provide a microphone button in the chat/interview interface to initiate voice recording. |
| FR-45 | The system must capture audio from the user's microphone using the browser's MediaRecorder API. |
| FR-46 | The system must send captured audio to OpenAI's Whisper API for transcription. |
| FR-47 | The system must display the transcribed text in the input field before submission, allowing the user to review and edit. |
| FR-48 | The system must provide clear visual feedback during recording states:<br>- Idle (microphone available)<br>- Recording (pulsing indicator, red color)<br>- Processing (transcription in progress) |
| FR-49 | The system must support both "push-to-talk" (hold button) and "toggle" (click to start/stop) recording modes. |
| FR-50 | The system must handle microphone permission requests gracefully, with clear messaging if permission is denied. |
| FR-51 | The system must automatically stop recording after a configurable maximum duration (default: 60 seconds) to prevent excessive API usage. |
| FR-52 | The system must display an error message if transcription fails, with option to retry or type manually. |

### 4.10 Authentication (Supabase)

| ID | Requirement |
|----|-------------|
| FR-53 | The system must integrate with Supabase Auth for user authentication. |
| FR-54 | The system must display a login page for unauthenticated users with email and password fields. |
| FR-55 | The system must validate credentials against Supabase Auth and return appropriate error messages for invalid login attempts. |
| FR-56 | The system must redirect authenticated users to the main application after successful login. |
| FR-57 | The system must protect all application routes, redirecting unauthenticated users to the login page. |
| FR-58 | The system must maintain user sessions using Supabase session tokens stored in secure cookies or local storage. |
| FR-59 | The system must automatically refresh session tokens before expiration to maintain seamless user experience. |
| FR-60 | The system must provide a logout function that clears the session and redirects to the login page. |
| FR-61 | The system must display the logged-in user's email or name in the application header. |
| FR-62 | The system must support "Remember Me" functionality for persistent sessions (configurable duration, default 7 days). |
| FR-63 | The system must handle session expiration gracefully, prompting re-authentication without losing unsaved work where possible. |

---

## 5. Non-Goals (Out of Scope)

| Item | Reason |
|------|--------|
| **Direct Enboarder integration** | This is a utility tool; content is exported via copy/paste and download. No API integration with Enboarder platform. |
| **Workflow generation** | This tool generates individual content pages, not entire workflows or sequences. |
| **Content storage/history** | No persistent database of generated content across sessions. |
| **Multi-user collaboration** | Single-user tool; no real-time collaboration features. |
| **Mobile optimization** | Desktop-focused tool matching the workflow builder context. Tablet support is acceptable. |
| **Offline functionality** | Requires internet for AI models and web scraping. |
| **Custom AI model training** | Uses existing models (Claude, Gemini); no fine-tuning or customer-specific training. |

---

## 6. Design Considerations

### 6.1 User Interface

The interface should follow a clear, wizard-like flow with a sidebar for page management:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTENTBUILDER                                     │
├───────────────────┬─────────────────────────────────────────────────────────┤
│  SAVED PAGES (3)  │  STEP 1: CUSTOMER SETUP                                 │
│  ───────────────  │  ┌────────────────────────────────────────────────────┐ │
│  ☑ Welcome Page   │  │ Customer Website URL: [__________________] [Scan] │ │
│  ☑ Day 1 Guide    │  │                                                    │ │
│  ☑ Team Intro     │  │ Company Profile: [Generated summary here...]       │ │
│  ───────────────  │  │                                                    │ │
│  [Export All]     │  │ Brand Colors:                                      │ │
│                   │  │ Primary:   [■] #3B82F6  [🎨]                       │ │
│                   │  │ Secondary: [■] #10B981  [🎨]                       │ │
│                   │  │ Accent:    [■] #F59E0B  [🎨]                       │ │
│                   │  └────────────────────────────────────────────────────┘ │
│                   │  STEP 2: BRAND SETTINGS                                 │
│                   │  ┌────────────────────────────────────────────────────┐ │
│                   │  │ Voice:                      Image Style:            │ │
│                   │  │ Formal ●─────○ Casual      [Corporate Photo ▼]     │ │
│                   │  │ Serious ○──●─── Funny                               │ │
│                   │  │ Respectful ○─●── Irreverent                         │ │
│                   │  │ Matter-of-fact ●○ Enthusiastic                      │ │
│                   │  └────────────────────────────────────────────────────┘ │
│                   │                                                          │
│                   │  STEP 3: PAGE GENERATION                                │
│                   │  ┌────────────────────────────────────────────────────┐ │
│                   │  │ Page Objective: [What should this page accomplish?]│ │
│                   │  │                                                     │ │
│                   │  │ Source Material:                                    │ │
│                   │  │ [Upload Files] [Enter URL]                          │ │
│                   │  │                                                     │ │
│                   │  │ ─── AI INTERVIEW (if needed) ───                   │ │
│                   │  │ AI: "What specific information should new hires..." │ │
│                   │  │ You: [Response input________________] [🎤 Voice]   │ │
│                   │  │      ↑ Transcribed text appears here                │ │
│                   │  │                                                     │ │
│                   │  │ ─── GENERATED CONTENT ───                          │ │
│                   │  │ TEXT:                                               │ │
│                   │  │ ┌──────────────────────────────────────────────┐   │ │
│                   │  │ │ Welcome to Acme Corp! We're thrilled to...  │   │ │
│                   │  │ │ [Copy] [Regenerate with feedback: ________] │   │ │
│                   │  │ └──────────────────────────────────────────────┘   │ │
│                   │  │                                                     │ │
│                   │  │ IMAGES:                                             │ │
│                   │  │ ┌──────┐ ┌──────┐ ┌──────┐                         │ │
│                   │  │ │ Img1 │ │ Img2 │ │ Img3 │  [Regenerate All]       │ │
│                   │  │ │[Pick]│ │[Pick]│ │[Pick]│  [Edit: __________]     │ │
│                   │  │ └──────┘ └──────┘ └──────┘  [Download Selected]    │ │
│                   │  │                                                     │ │
│                   │  │ [💾 Save Page]  [+ New Page]                       │ │
│                   │  └────────────────────────────────────────────────────┘ │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

### 6.2 Voice Input UI

The voice input button appears next to the text input field during interviews:

```
┌─────────────────────────────────────────────────────────────┐
│  AI: "What key information should new employees know        │
│       about your company culture?"                          │
│                                                              │
│  ┌───────────────────────────────────────────┐  ┌────────┐ │
│  │ [Transcribed or typed response here...]   │  │ 🎤     │ │
│  │                                           │  │        │ │
│  └───────────────────────────────────────────┘  └────────┘ │
│                                          [Send]             │
│                                                              │
│  Recording states:                                          │
│  🎤 = Ready (gray)                                          │
│  🔴 = Recording (pulsing red)                               │
│  ⏳ = Transcribing (spinning)                               │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Brand Voice Sliders

Follow the detailed specification in `0007-brand-voice-sliders-spec2.md`:

- **4 dimensions:** Formality, Humor, Respect, Enthusiasm
- **5-point scale (0-4)** per dimension
- **Real-time examples** showing how settings affect content
- **Visual feedback** with colored sliders and info boxes
- **JSON export** of settings for debugging/reference

### 6.4 Image Style Presets

Suggested initial presets (can be refined):

| Style Name | Description |
|------------|-------------|
| Corporate Photography | Professional stock photo style, business settings |
| Flat Illustration | Modern, colorful 2D illustrations |
| Isometric | 3D-style isometric graphics |
| Abstract Geometric | Abstract shapes and patterns |
| Hand-drawn Sketch | Casual, hand-drawn illustration style |
| Photorealistic | High-quality, realistic imagery |
| Minimalist | Clean, simple, lots of whitespace |
| Warm & Friendly | Soft colors, approachable imagery |

---

## 7. Technical Considerations

### 7.1 AI Models

| Component | Model | Notes |
|-----------|-------|-------|
| **Text Generation & Conversation** | Anthropic Claude Opus 4.5 | Primary AI for all text tasks: interviews, content generation, feedback processing |
| **Image Generation** | NanoBanana Pro | Img2Img pipeline with style presets. Supports prompt-based styling with strength/guidance controls. See `/Context/0067-Nano Banana implementation` |
| **Speech-to-Text** | OpenAI Whisper (small) | Via API for transcribing voice input. English only. "Small" model for optimal accuracy/latency balance |

### 7.2 Architecture Overview

```
                              ┌─────────────────────┐
                              │      VERCEL         │
                              │  (Hosting/CDN)      │
                              └──────────┬──────────┘
                                         │
┌────────────────────────────────────────┴────────────────────────────────────┐
│                          NEXT.JS APPLICATION                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND (React)                                │ │
│  │  - Login/Authentication UI        - Voice Recording (MediaRecorder)    │ │
│  │  - Brand Voice Sliders            - Content Display & Export           │ │
│  │  - Image Style Selector           - Page Management (save, navigate)   │ │
│  │  - Chat/Interview Interface                                            │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      API ROUTES (Serverless)                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │ Web Scraper  │  │ Claude API   │  │ NanoBanana   │                  │ │
│  │  │ (Cheerio/    │  │ Integration  │  │ Pro API      │                  │ │
│  │  │  Puppeteer)  │  │ (Text Gen)   │  │ (Image Gen)  │                  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │ Brave Search │  │ File Parser  │  │ OpenAI       │                  │ │
│  │  │ API          │  │ (PDF, DOCX)  │  │ Whisper API  │                  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (Cloud)                                   │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │         Supabase Auth           │  │       PostgreSQL Database        │  │
│  │  - Email/Password auth          │  │  - User profiles                 │  │
│  │  - Session management           │  │  - Customer contexts             │  │
│  │  - User management (dashboard)  │  │  - Saved pages (optional)        │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **React Frontend** | Familiar technology, good component ecosystem, matches brand voice slider spec |
| **Next.js Backend** | API routes, server-side functionality, seamless Vercel deployment |
| **Vercel Hosting** | Native Next.js support, easy deployment, serverless functions, edge caching |
| **Supabase (Cloud)** | Authentication + PostgreSQL database. Managed service with excellent Next.js integration, built-in user management dashboard, real-time capabilities if needed later |
| **Session State in Memory** | Single-user sessions; working content state managed client-side with React context (persisted data via Supabase) |

### 7.4 External API Dependencies

| Service | Purpose | Fallback |
|---------|---------|----------|
| Supabase (Cloud) | Authentication + Database | None (required for access and data) |
| Anthropic Claude API | Text generation, conversation | None (core functionality) |
| NanoBanana Pro API | Image generation (Img2Img with style presets) | None (core functionality) |
| OpenAI Whisper API | Speech-to-text transcription (English, "small" model) | Manual text entry (keyboard input) |
| Brave Search API | Company research and supplementary info | Manual entry of company info |
| Web scraping (Cheerio/Puppeteer) | Customer website data extraction | Manual entry of company info |

### 7.5 Security Considerations

| Concern | Mitigation |
|---------|------------|
| Unauthorized access | Supabase Auth with email/password; all routes protected; session validation on each request |
| API Key exposure | Keys stored server-side only, never exposed to client |
| Customer data handling | No persistent storage; data only exists in session |
| Session security | Secure cookies, HTTPS only, automatic token refresh, configurable session expiry |
| Rate limiting | Implement sensible limits on API calls per session |
| Input sanitization | Validate and sanitize all user inputs, especially URLs |

---

## 8. Success Metrics

### 8.1 Primary Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Content creation time reduction** | 50% reduction vs. manual creation | Time tracking before/after tool adoption |
| **PS consultant adoption** | 80% of PS team using tool within 1 month | Usage tracking |
| **Content quality satisfaction** | 4+ out of 5 rating from PS team | Survey after each implementation |

### 8.2 Secondary Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Customer feedback** | Positive reaction to generated content | Qualitative feedback captured separately |
| **Iteration cycles** | Avg. <3 revisions per page | Track regeneration counts |
| **Pages per session** | Support 5+ pages per customer session | System usage data |

---

## 9. Open Questions

| ID | Question | Status | Resolution |
|----|----------|--------|------------|
| OQ-01 | What specific image style presets should be included? | **Resolved** | Style list to be provided later. Implementation must support **thumbnail image previews** for each style to aid selection. |
| OQ-02 | Should we support batch generation (multiple pages at once) or only one at a time? | **Resolved** | **Single page only.** No batch generation. |
| OQ-03 | What file size limits should apply to uploads? | **Resolved** | **10MB per file.** |
| OQ-04 | Should there be a way to save/load customer profiles for repeat customers? | **Resolved** | **Out of scope initially.** May add in future version. |
| OQ-05 | Which image generation model to use? | **Resolved** | **NanoBanana Pro** - Img2Img pipeline with style presets. See `/Context/0067-Nano Banana implementation` for API details. |
| OQ-06 | Should the interview be with the consultant only, or can customer stakeholders participate directly? | **Resolved** | **Either consultant or customer** can participate in interviews. |
| OQ-07 | What web search API to use for company research? | **Resolved** | **Brave Search API** (recommended) - Good balance of quality, pricing, and privacy. Alternative: SerpAPI if more comprehensive results needed. |
| OQ-08 | Should voice input support multiple languages or English only? | **Resolved** | **English only.** Simplifies implementation and matches PS team's primary use case. |
| OQ-09 | What is the preferred Whisper model size? | **Resolved** | **Whisper "small"** - Good accuracy/latency balance for real-time transcription. |
| OQ-10 | Should pages be auto-saved or require explicit save action? | **Resolved** | **Explicit save.** User must click "Save Page" to preserve content. |

---

## 10. Appendices

### Appendix A: Enboarder Content Module Context

The generated content will be used in Enboarder's **Content Module**, which:

- Presents content to workflow participants (new hires, managers, etc.)
- Supports text, images, and videos
- Is the most commonly used module in Enboarder workflows
- Displays content at specific points in the employee journey (triggered by key dates)

### Appendix B: Brand Voice Dimensions Reference

From Nielsen Norman Group research, the 4 dimensions are:

1. **Formal ↔ Casual**: How professional vs. conversational
2. **Serious ↔ Funny**: Use of humor and levity
3. **Respectful ↔ Irreverent**: Attitude toward conventions and authority
4. **Matter-of-fact ↔ Enthusiastic**: Energy level and emotional expression

See full specification in `/Context/0007-brand-voice-sliders-spec2.md`.

### Appendix C: Typical Enboarder Workflow Journeys

Content generated by this tool may support:

- Onboarding (pre-boarding through first 90 days)
- Offboarding (exit workflows)
- Learning journeys
- Promotions and role changes
- Internal moves (department/office transfers)
- Parental leave (departure and return)

---

*This PRD was generated based on stakeholder input and will be refined through implementation.*
