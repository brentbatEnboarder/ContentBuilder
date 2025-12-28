import FirecrawlApp from '@mendable/firecrawl-js';
import { Vibrant } from 'node-vibrant/node';

export interface ScrapedColors {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
}

export interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  favicon: string | null;
  logoUrl: string | null;
}

export interface ScrapeResult {
  url: string;
  profile: string;
  metadata: ScrapedMetadata;
  colors: ScrapedColors;
  scrapedAt: string;
}

// Lazy-initialized Firecrawl client (to avoid errors during test imports)
let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawlClient(): FirecrawlApp {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new ScraperError('FIRECRAWL_API_KEY not configured', 'CONFIG_ERROR');
  }

  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }

  return firecrawlClient;
}

/**
 * Main scraping function - uses Firecrawl to fetch website and extract company profile and brand colors
 */
export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
  // Validate and normalize URL
  const normalizedUrl = normalizeUrl(url);

  // Get Firecrawl client (throws if API key not configured)
  const firecrawl = getFirecrawlClient();

  try {
    // Scrape the website using Firecrawl
    // The scrape method returns a Document directly, throws on error
    const document = await firecrawl.scrape(normalizedUrl, {
      formats: ['markdown', 'html'],
    });

    // Extract metadata from Firecrawl response
    const metadata: ScrapedMetadata = {
      title: document.metadata?.title || null,
      description: document.metadata?.description || null,
      ogTitle: document.metadata?.ogTitle || null,
      ogDescription: document.metadata?.ogDescription || null,
      ogImage: document.metadata?.ogImage || null,
      favicon: document.metadata?.favicon || null,
      logoUrl: null, // Firecrawl doesn't extract logo URL specifically
    };

    // Extract colors from the OG image using node-vibrant
    const colors = await extractImageColors(metadata.ogImage);

    // Build company profile from metadata
    const profile = buildCompanyProfile(metadata, normalizedUrl);

    return {
      url: normalizedUrl,
      profile,
      metadata,
      colors,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }
    throw new ScraperError(
      `Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SCRAPE_FAILED'
    );
  }
}

/**
 * Normalize URL - ensures https:// prefix and valid format
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  // Validate URL format
  try {
    new URL(normalized);
  } catch {
    throw new ScraperError(`Invalid URL format: ${url}`, 'INVALID_URL');
  }

  return normalized;
}

/**
 * Extract colors from images using node-vibrant
 */
async function extractImageColors(imageUrl: string | null): Promise<ScrapedColors> {
  if (!imageUrl) {
    return { primary: null, secondary: null, accent: null };
  }

  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    return {
      primary: palette.Vibrant?.hex || palette.DarkVibrant?.hex || null,
      secondary: palette.Muted?.hex || palette.DarkMuted?.hex || null,
      accent: palette.LightVibrant?.hex || palette.LightMuted?.hex || null,
    };
  } catch (error) {
    console.warn(`Failed to extract colors from image ${imageUrl}:`, error);
    return { primary: null, secondary: null, accent: null };
  }
}

/**
 * Build company profile string from metadata
 */
function buildCompanyProfile(metadata: ScrapedMetadata, url: string): string {
  const parts: string[] = [];

  // Extract company name from title or URL
  const companyName = extractCompanyName(metadata.title, url);
  if (companyName) {
    parts.push(`Company: ${companyName}`);
  }

  // Add description
  const desc = metadata.ogDescription || metadata.description;
  if (desc) {
    parts.push(`About: ${desc}`);
  }

  // Add website
  parts.push(`Website: ${url}`);

  return parts.join('\n');
}

/**
 * Extract company name from page title or URL
 */
export function extractCompanyName(title: string | null, url: string): string {
  if (title) {
    // Remove common suffixes like "| Home", "- Official Site", etc.
    const cleaned = title
      .split(/[|\-–—]/)[0]
      .replace(/home|official|website|site/gi, '')
      .trim();

    if (cleaned.length > 0 && cleaned.length < 50) {
      return cleaned;
    }
  }

  // Fall back to domain name
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Company';
  }
}

/**
 * Custom error class for scraper errors
 */
export class ScraperError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ScraperError';
    this.code = code;
  }
}
