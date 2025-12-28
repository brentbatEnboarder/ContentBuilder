import { Router, Request, Response } from 'express';
import { scrapeWebsite, ScrapeResult, ScraperError } from '../services/scraper';
import { searchCompanyInfo, CompanyResearchResult } from '../services/braveSearch';

const router = Router();

// ============================================================================
// In-memory cache (24 hour TTL)
// ============================================================================

interface CacheEntry {
  data: ScrapeResult & { research?: CompanyResearchResult };
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

function getCachedResult(url: string): CacheEntry['data'] | null {
  const entry = cache.get(normalizeUrlForCache(url));
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(normalizeUrlForCache(url));
    return null;
  }

  return entry.data;
}

function setCachedResult(url: string, data: CacheEntry['data']): void {
  cache.set(normalizeUrlForCache(url), { data, timestamp: Date.now() });
}

function normalizeUrlForCache(url: string): string {
  try {
    const parsed = new URL(url);
    // Normalize: remove trailing slash, lowercase hostname
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return url.toLowerCase();
  }
}

// ============================================================================
// Rate limiting (10 requests per minute per IP)
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW) {
    // New window
    rateLimits.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + RATE_LIMIT_WINDOW,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetAt: entry.windowStart + RATE_LIMIT_WINDOW,
  };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits.entries()) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW * 2) {
      rateLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// ============================================================================
// URL Validation
// ============================================================================

function validateUrl(url: unknown): { valid: boolean; error?: string; normalized?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL is too long (max 2048 characters)' };
  }

  // Add protocol if missing
  let normalized = trimmed;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  // Only allow http/https
  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only http and https protocols are allowed' };
    }

    // Block localhost and private IPs for security
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return { valid: false, error: 'Private/local URLs are not allowed' };
    }

    return { valid: true, normalized };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ============================================================================
// POST /api/scrape
// ============================================================================

/**
 * @route POST /api/scrape
 * @body { url: string, includeResearch?: boolean }
 * @returns { profile: string, colors: { primary, secondary, accent }, metadata: {...}, research?: {...} }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Get client IP for rate limiting
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(clientIp);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt / 1000));

  if (!rateLimit.allowed) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
    return;
  }

  // Validate input
  const { url, includeResearch = false } = req.body;

  const validation = validateUrl(url);
  if (!validation.valid) {
    res.status(400).json({
      error: 'Invalid URL',
      message: validation.error,
    });
    return;
  }

  const normalizedUrl = validation.normalized!;

  // Check cache
  const cached = getCachedResult(normalizedUrl);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.json({
      success: true,
      data: cached,
      cached: true,
    });
    return;
  }

  res.setHeader('X-Cache', 'MISS');

  try {
    // Scrape the website
    const scrapeResult = await scrapeWebsite(normalizedUrl);

    // Optionally fetch additional research
    let research: CompanyResearchResult | undefined;
    if (includeResearch) {
      const companyName = scrapeResult.metadata.title?.split(/[|\-–—]/)[0].trim() || '';
      if (companyName) {
        try {
          research = await searchCompanyInfo(companyName);
        } catch (e) {
          console.warn('Company research failed (continuing without):', e);
        }
      }
    }

    const result = { ...scrapeResult, research };

    // Cache the result
    setCachedResult(normalizedUrl, result);

    res.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error('Scrape error:', error);

    if (error instanceof ScraperError) {
      res.status(422).json({
        error: 'Scrape failed',
        message: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred while scraping the website',
    });
  }
});

/**
 * @route GET /api/scrape/cache/clear
 * @description Clear the URL cache (admin/debug endpoint)
 */
router.delete('/cache', (_req: Request, res: Response): void => {
  const count = cache.size;
  cache.clear();
  res.json({ success: true, cleared: count });
});

export default router;
