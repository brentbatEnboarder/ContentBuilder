# Intelligent Scraper Implementation Plan

## Status: ✅ COMPLETE

## Goal

Replace the basic single-page scraper with a multi-page intelligent scraper that:
1. Scrapes the homepage first
2. Uses Claude to identify the best pages to scrape (About, Team, Careers, Culture, Values, etc.)
3. Scrapes up to 10 pages total
4. Uses Claude to extract company info (name, industry, description, logo, colors)
5. Shows real-time progress in the UI
6. Supports "Scan More" to continue scanning additional pages

## Completed Implementation

### Backend ✅

**`/server/src/services/intelligentScraper.ts`**
- ✅ `intelligentScrape()` async generator that yields progress updates
- ✅ `ScrapeProgress` type with `result` field for final data
- ✅ Claude integration to identify pages to scrape
- ✅ Claude integration to extract company info
- ✅ Color extraction from logos/OG images
- ✅ 24-hour caching
- ✅ Cached result includes `result` in the 'complete' yield

**`/server/src/routes/scrape.ts`**
- ✅ POST `/api/scrape/intelligent` - clean SSE streaming endpoint
- ✅ Removed unnecessary `/intelligent/result` workaround endpoint

### Frontend ✅

**`/src/services/api.ts`**
- ✅ `ScrapeProgress` and `ExtractedCompanyInfo` types
- ✅ `scrapeIntelligent()` function with SSE streaming

**`/src/hooks/useCompanySettings.ts`**
- ✅ `ScanState` interface for scan progress tracking
- ✅ `scanUrl()` uses intelligent scraper with real-time progress
- ✅ `scanMore()` function for additional page scanning
- ✅ Returns `scanProgress`, `scannedPages`, `canScanMore`

**`/src/components/screens/CompanyInfoScreen.tsx`**
- ✅ Progress bar showing pages scanned
- ✅ Real-time status messages during scanning
- ✅ List of scanned pages with links after completion
- ✅ "Scan More Pages" button when more content available

---

## Previous Task Details (for reference)

### Task 1: Fix Backend Endpoint

**File:** `/server/src/routes/scrape.ts`

The `/api/scrape/intelligent` endpoint needs cleanup:

```typescript
router.post('/intelligent', async (req: Request, res: Response): Promise<void> => {
  // ... validation ...

  res.setHeader('Content-Type', 'text/event-stream');
  // ... other headers ...

  try {
    const scraper = intelligentScrape(url, maxPages, scanMore);

    for await (const progress of scraper) {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);

      // If this is the complete message, it includes the result
      if (progress.type === 'complete' && progress.result) {
        // Result is already in the progress object
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }
});
```

Also fix the cached path in `intelligentScraper.ts`:
```typescript
if (cached) {
  yield { type: 'status', message: 'Using cached results from previous scan' };
  yield { type: 'complete', message: 'Scan complete (cached)', result: cached.data };
  return cached.data;
}
```

### Task 2: Add API Client Function

**File:** `/src/services/api.ts`

Add streaming scrape function:

```typescript
export interface ScrapeProgress {
  type: 'status' | 'page_scraped' | 'analyzing' | 'extracting' | 'complete' | 'error';
  message: string;
  pageUrl?: string;
  pageTitle?: string;
  pagesScraped?: number;
  totalPages?: number;
  result?: ExtractedCompanyInfo;
}

export interface ExtractedCompanyInfo {
  name: string;
  industry: string;
  description: string;
  logo: string | null;
  colors: { primary: string; secondary: string; accent: string };
  pagesScraped: string[];
  canScanMore: boolean;
}

scrapeIntelligent: async (
  url: string,
  onProgress: (progress: ScrapeProgress) => void,
  options?: { maxPages?: number; scanMore?: boolean }
): Promise<ExtractedCompanyInfo | null> => {
  const token = await getAuthToken();

  const response = await fetch('/api/scrape/intelligent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url, ...options }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: ExtractedCompanyInfo | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split('\n\n');
    buffer = messages.pop() || '';

    for (const message of messages) {
      if (!message.trim() || message === 'data: [DONE]') continue;

      const dataMatch = message.match(/^data:\s*(.+)$/m);
      if (!dataMatch) continue;

      const data = JSON.parse(dataMatch[1]) as ScrapeProgress;
      onProgress(data);

      if (data.type === 'complete' && data.result) {
        result = data.result;
      }
    }
  }

  return result;
}
```

### Task 3: Update useCompanySettings Hook

**File:** `/src/hooks/useCompanySettings.ts`

Replace the simple `scanUrl` with the intelligent version:

```typescript
interface ScanState {
  isScanning: boolean;
  progress: ScrapeProgress | null;
  scannedPages: string[];
  canScanMore: boolean;
  error: string | null;
}

const [scanState, setScanState] = useState<ScanState>({
  isScanning: false,
  progress: null,
  scannedPages: [],
  canScanMore: false,
  error: null,
});

const scanUrl = useCallback(async () => {
  if (!draft.url) return;

  setScanState(prev => ({ ...prev, isScanning: true, error: null, progress: null }));

  try {
    const result = await apiClient.scrapeIntelligent(
      draft.url,
      (progress) => {
        setScanState(prev => ({ ...prev, progress }));
      }
    );

    if (result) {
      setDraft({
        url: draft.url,
        name: result.name,
        industry: result.industry,
        description: result.description,
        logo: result.logo,
        colors: result.colors,
      });
      setScanState(prev => ({
        ...prev,
        scannedPages: result.pagesScraped,
        canScanMore: result.canScanMore,
      }));
    }
  } catch (err) {
    setScanState(prev => ({ ...prev, error: err.message }));
  } finally {
    setScanState(prev => ({ ...prev, isScanning: false }));
  }
}, [draft.url]);

const scanMore = useCallback(async () => {
  // Similar to scanUrl but with scanMore: true
}, [draft.url]);

return {
  // ... existing returns ...
  scanProgress: scanState.progress,
  scannedPages: scanState.scannedPages,
  canScanMore: scanState.canScanMore,
  scanMore,
};
```

### Task 4: Update CompanyInfoScreen UI

**File:** `/src/components/screens/CompanyInfoScreen.tsx`

Add progress UI:

```tsx
{/* Progress Section - shown during/after scan */}
{(isScanning || scannedPages.length > 0) && (
  <div className="bg-card rounded-lg border border-border p-6 mb-6">
    <h3 className="font-medium mb-4">Scan Progress</h3>

    {isScanning && scanProgress && (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{scanProgress.message}</span>
        </div>
        {scanProgress.pagesScraped !== undefined && (
          <div className="text-sm text-muted-foreground">
            {scanProgress.pagesScraped} / {scanProgress.totalPages} pages
          </div>
        )}
      </div>
    )}

    {scannedPages.length > 0 && (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Scanned {scannedPages.length} pages:
        </p>
        <ul className="text-sm space-y-1">
          {scannedPages.map((url, i) => (
            <li key={i} className="truncate text-muted-foreground">
              ✓ {url}
            </li>
          ))}
        </ul>

        {canScanMore && !isScanning && (
          <Button variant="outline" size="sm" onClick={scanMore}>
            Scan More Pages
          </Button>
        )}
      </div>
    )}
  </div>
)}
```

---

## Testing Checklist

1. [ ] Scan a real company URL (e.g., https://enboarder.com)
2. [ ] Verify progress shows in real-time
3. [ ] Verify company name, industry, description are populated
4. [ ] Verify colors are extracted
5. [ ] Verify "Scan More" button appears and works
6. [ ] Verify 24hr caching works (second scan should be instant)
7. [ ] Test error handling (invalid URL, network error)

---

## Page Priority for Onboarding Context

Claude should prioritize these pages (in order):
1. About Us / Our Story
2. Mission / Vision / Values
3. Culture / Life at [Company]
4. Careers / Jobs / Work with Us
5. Team / Leadership / People
6. What We Do / Services / Products (brief overview only)

Claude should AVOID:
- Blog posts, news, press releases
- Case studies, testimonials
- Legal pages (privacy, terms)
- Support documentation
- Individual product detail pages
