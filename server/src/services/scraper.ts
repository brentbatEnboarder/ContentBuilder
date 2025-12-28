import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
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

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT = 30000;

/**
 * Main scraping function - fetches website and extracts company profile and brand colors
 */
export async function scrapeWebsite(url: string): Promise<ScrapeResult> {
  // Validate and normalize URL
  const normalizedUrl = normalizeUrl(url);

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: DEFAULT_TIMEOUT
    });

    // Wait a bit for JS to render
    await page.waitForTimeout(2000);

    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract metadata
    const metadata = extractMetadata($, normalizedUrl);

    // Extract colors from CSS
    const cssColors = await extractCssColors(page);

    // Extract colors from images (logo/hero)
    const imageColors = await extractImageColors(metadata.logoUrl || metadata.ogImage, normalizedUrl);

    // Merge color sources (prefer CSS colors, fall back to image colors)
    const colors = mergeColors(cssColors, imageColors);

    // Build company profile from metadata
    const profile = buildCompanyProfile(metadata, normalizedUrl);

    await browser.close();

    return {
      url: normalizedUrl,
      profile,
      metadata,
      colors,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (browser) {
      await browser.close();
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
 * Extract metadata from HTML using Cheerio
 */
function extractMetadata($: cheerio.CheerioAPI, baseUrl: string): ScrapedMetadata {
  const title = $('title').text().trim() || null;
  const description = $('meta[name="description"]').attr('content')?.trim() || null;
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || null;
  const ogImage = resolveUrl($('meta[property="og:image"]').attr('content'), baseUrl);

  // Find favicon
  const faviconHref = $('link[rel="icon"]').attr('href') ||
                      $('link[rel="shortcut icon"]').attr('href') ||
                      '/favicon.ico';
  const favicon = resolveUrl(faviconHref, baseUrl);

  // Try to find logo
  const logoUrl = findLogoUrl($, baseUrl);

  return { title, description, ogTitle, ogDescription, ogImage, favicon, logoUrl };
}

/**
 * Find logo URL from common patterns
 */
function findLogoUrl($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Common logo selectors
  const logoSelectors = [
    'img[class*="logo"]',
    'img[id*="logo"]',
    'img[alt*="logo" i]',
    'a[class*="logo"] img',
    'header img:first-of-type',
    '.header img:first-of-type',
    '#header img:first-of-type',
    'nav img:first-of-type',
  ];

  for (const selector of logoSelectors) {
    const logoSrc = $(selector).first().attr('src');
    if (logoSrc) {
      return resolveUrl(logoSrc, baseUrl);
    }
  }

  return null;
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string | undefined, baseUrl: string): string | null {
  if (!url) return null;

  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Extract colors from CSS computed styles
 */
async function extractCssColors(page: Page): Promise<Partial<ScrapedColors>> {
  const colors = await page.evaluate(() => {
    const extractedColors: string[] = [];

    // Get computed styles from key elements
    const elements = [
      document.querySelector('header'),
      document.querySelector('nav'),
      document.querySelector('.header'),
      document.querySelector('#header'),
      document.querySelector('a'),
      document.querySelector('button'),
      document.querySelector('.btn'),
      document.querySelector('.button'),
    ].filter(Boolean) as HTMLElement[];

    for (const el of elements) {
      const styles = window.getComputedStyle(el);
      const bgColor = styles.backgroundColor;
      const color = styles.color;

      // Filter out transparent and common defaults
      if (bgColor && !bgColor.includes('rgba(0, 0, 0, 0)') && bgColor !== 'transparent') {
        extractedColors.push(bgColor);
      }
      if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgb(255, 255, 255)') {
        extractedColors.push(color);
      }
    }

    // Also check CSS custom properties on :root
    const rootStyles = window.getComputedStyle(document.documentElement);
    const cssVarNames = ['--primary', '--secondary', '--accent', '--brand', '--main-color'];
    for (const varName of cssVarNames) {
      const value = rootStyles.getPropertyValue(varName).trim();
      if (value) {
        extractedColors.push(value);
      }
    }

    return extractedColors;
  });

  // Deduplicate and convert to hex
  const hexColors = [...new Set(colors)]
    .map(rgbToHex)
    .filter((c): c is string => c !== null)
    .filter(c => !isGrayscale(c));

  return {
    primary: hexColors[0] || null,
    secondary: hexColors[1] || null,
    accent: hexColors[2] || null,
  };
}

/**
 * Extract colors from images using node-vibrant
 */
async function extractImageColors(imageUrl: string | null, baseUrl: string): Promise<Partial<ScrapedColors>> {
  if (!imageUrl) return {};

  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    return {
      primary: palette.Vibrant?.hex || palette.DarkVibrant?.hex || null,
      secondary: palette.Muted?.hex || palette.DarkMuted?.hex || null,
      accent: palette.LightVibrant?.hex || palette.LightMuted?.hex || null,
    };
  } catch (error) {
    console.warn(`Failed to extract colors from image ${imageUrl}:`, error);
    return {};
  }
}

/**
 * Merge color sources, preferring CSS colors
 */
function mergeColors(
  cssColors: Partial<ScrapedColors>,
  imageColors: Partial<ScrapedColors>
): ScrapedColors {
  return {
    primary: cssColors.primary || imageColors.primary || null,
    secondary: cssColors.secondary || imageColors.secondary || null,
    accent: cssColors.accent || imageColors.accent || null,
  };
}

/**
 * Convert RGB color string to hex
 */
function rgbToHex(rgb: string): string | null {
  // Handle hex format already
  if (rgb.startsWith('#')) {
    return rgb.toUpperCase();
  }

  // Parse rgb/rgba format
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;

  const [, r, g, b] = match.map(Number);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check if a hex color is grayscale (black/white/gray)
 */
function isGrayscale(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  // Check if all channels are similar (grayscale)
  const maxDiff = Math.max(
    Math.abs(rgb.r - rgb.g),
    Math.abs(rgb.g - rgb.b),
    Math.abs(rgb.r - rgb.b)
  );

  // Also check for near-white or near-black
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  const isNearWhite = avg > 240;
  const isNearBlack = avg < 15;

  return maxDiff < 10 || isNearWhite || isNearBlack;
}

/**
 * Convert hex to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
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
function extractCompanyName(title: string | null, url: string): string {
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
