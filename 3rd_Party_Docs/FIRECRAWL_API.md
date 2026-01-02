# Firecrawl API Documentation

Reference: https://docs.firecrawl.dev

## Overview

Firecrawl provides three main endpoints for web data extraction:
1. **Scrape** - Extract content from a single URL
2. **Map** - Discover all URLs on a website quickly
3. **Crawl** - Recursively scrape multiple pages

## Scrape Endpoint (`/scrape`)

Converts a single web page into clean, structured data.

### Request
```typescript
const result = await firecrawl.scrape(url, {
  formats: ['markdown', 'links', 'metadata'],
  // Optional parameters:
  actions: [...],           // Page interactions before scraping
  location: { country: 'US' },
  maxAge: 0,               // Cache freshness (0 = fresh)
});
```

### Supported Formats
- `markdown` - Clean markdown for LLM consumption
- `html` - Full page markup
- `raw_html` - Unmodified source
- `links` - All links extracted from page
- `screenshot` - Page screenshot
- `json` - Structured data extraction with schema
- `metadata` - Page metadata (title, og:image, etc.)
- `branding` - Brand identity info (logo, colors, fonts)
- `summary` - Condensed content

### Response
```typescript
{
  success: true,
  data: {
    markdown: "...",
    links: ["https://..."],
    metadata: {
      title: "Page Title",
      description: "...",
      ogImage: "https://...",
      favicon: "https://...",
      // ... other metadata
    }
  }
}
```

### Key Limitation
**Only scrapes ONE page** - links are extracted but not followed.

---

## Map Endpoint (`/map`)

Discovers and returns all URLs on a website quickly. **Best for URL discovery before selective scraping.**

### Request
```typescript
const result = await firecrawl.map(url, {
  limit: 100,              // Max links to return
  sitemap: 'include',      // Include sitemap URLs
  search: 'careers',       // Filter by keyword relevance
  location: { country: 'US' },
});
```

### Response
```typescript
{
  success: true,
  links: [
    {
      url: "https://example.com/careers",
      title: "Careers",           // Optional
      description: "Join us..."   // Optional
    }
  ]
}
```

### Key Features
- **Fast** - Prioritizes speed over completeness
- **Search filter** - Returns results ordered by relevance to search term
- **Sitemap inclusion** - Can include URLs from sitemap.xml

### Use Cases
- Pre-discovery before selective scraping
- Finding specific page types (careers, about, etc.)
- Allowing users to select pages to scrape

---

## Crawl Endpoint (`/crawl`)

Recursively crawls and scrapes an entire website or section.

### Request
```typescript
// Start crawl (async)
const { id } = await firecrawl.crawl(url, {
  limit: 20,                    // Max pages to crawl
  maxDepth: 3,                  // Link depth
  crawlEntireDomain: false,     // Stay within URL path
  allowSubdomains: false,       // Include subdomains
  scrapeOptions: {
    formats: ['markdown'],
  },
});

// Poll for results
const status = await firecrawl.checkCrawlStatus(id);
```

### Response
```typescript
{
  success: true,
  status: "completed",  // or "scraping", "failed"
  total: 20,
  completed: 20,
  data: [
    {
      markdown: "...",
      metadata: { title: "...", ... },
      url: "https://..."
    }
  ]
}
```

### Key Features
- **Recursive** - Automatically follows links
- **Async** - Returns job ID for polling
- **WebSocket** - Real-time updates available
- **Webhooks** - Event notifications

### Use Cases
- Full site archival
- Comprehensive content extraction
- When you need ALL pages

---

## Recommended Approach for ContentBuilder

### Current Problem
We use `scrape()` on homepage to get links, then individually scrape selected pages. But:
1. Homepage may not link to all important pages (careers pages often in footer/nav)
2. JavaScript-rendered navigation may not be fully captured
3. We're missing pages that aren't directly linked from homepage

### Recommended Solution

**Use Map + Scrape pattern:**

```typescript
// Step 1: Discover ALL URLs with map (fast)
const mapResult = await firecrawl.map(url, {
  limit: 200,
  sitemap: 'include',
});

// Step 2: Use Claude to prioritize URLs from full list
const prioritizedUrls = await selectBestUrls(mapResult.links);

// Step 3: Scrape selected pages individually
for (const pageUrl of prioritizedUrls) {
  const page = await firecrawl.scrape(pageUrl, {
    formats: ['markdown'],
  });
}
```

### Benefits
- Map discovers pages from sitemap (careers pages often listed)
- Map is fast (doesn't scrape content)
- Full URL list gives Claude better options to choose from
- Can filter map results with `search` parameter for targeted discovery

---

## SDK Installation

```bash
npm install @mendable/firecrawl-js
```

```typescript
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});
```

## Rate Limits & Pricing
- Free tier: Limited requests
- Paid plans: Higher limits, priority processing
- Credits consumed per page scraped/mapped
