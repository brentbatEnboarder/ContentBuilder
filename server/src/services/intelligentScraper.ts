import Firecrawl from '@mendable/firecrawl-js';
import Anthropic from '@anthropic-ai/sdk';
import { Vibrant } from 'node-vibrant/node';

// ============================================================================
// Types
// ============================================================================

export interface ScrapeProgress {
  type: 'status' | 'page_scraped' | 'analyzing' | 'extracting' | 'complete' | 'error';
  message: string;
  pageUrl?: string;
  pageTitle?: string;
  pagesScraped?: number;
  totalPages?: number;
  result?: ExtractedCompanyInfo; // Included in 'complete' type
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  buttonBg: string;
  buttonFg: string;
}

export interface ExtractedCompanyInfo {
  name: string;
  industry: string;
  description: string;
  logo: string | null;
  colors: BrandColors;
  pagesScraped: string[];
  scrapedAt: string;
  canScanMore: boolean;
  remainingLinks: string[];
}

interface PageToScrape {
  url: string;
  reason: string;
  priority: number;
}

interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  logo?: string | null; // Logo or og:image from metadata
}

// ============================================================================
// Clients (lazy initialization)
// ============================================================================

let firecrawlClient: Firecrawl | null = null;
let anthropicClient: Anthropic | null = null;

function getFirecrawlClient(): Firecrawl {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }
  if (!firecrawlClient) {
    firecrawlClient = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
  }
  return firecrawlClient;
}

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// ============================================================================
// Cache (24 hour TTL)
// ============================================================================

interface CacheEntry {
  data: ExtractedCompanyInfo;
  timestamp: number;
  allScrapedContent: string; // Store for "scan more" functionality
  remainingLinks: string[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCached(url: string): CacheEntry | null {
  const normalized = normalizeUrl(url);
  const entry = cache.get(normalized);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(normalized);
    return null;
  }
  return entry;
}

function setCache(url: string, data: ExtractedCompanyInfo, allContent: string, remainingLinks: string[]): void {
  cache.set(normalizeUrl(url), {
    data,
    timestamp: Date.now(),
    allScrapedContent: allContent,
    remainingLinks,
  });
}

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return normalized.toLowerCase();
  }
}

// ============================================================================
// Main Intelligent Scraper
// ============================================================================

export async function* intelligentScrape(
  url: string,
  maxPages: number = 20,
  scanMore: boolean = false
): AsyncGenerator<ScrapeProgress, ExtractedCompanyInfo, undefined> {
  const normalizedUrl = normalizeUrl(url);
  const baseUrl = new URL(normalizedUrl).origin;

  // Check cache (unless scanning more)
  if (!scanMore) {
    const cached = getCached(url);
    if (cached) {
      yield { type: 'status', message: 'Using cached results from previous scan' };
      yield { type: 'complete', message: 'Scan complete (cached)', result: cached.data };
      return cached.data;
    }
  }

  const firecrawl = getFirecrawlClient();
  const claude = getAnthropicClient();
  const scrapedPages: ScrapedPage[] = [];
  let allLinks: string[] = [];
  let homepageLogo: string | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 1: Map the entire site to discover ALL URLs (including from sitemap)
  // ─────────────────────────────────────────────────────────────────────────
  yield { type: 'status', message: 'Mapping website structure...', pagesScraped: 0, totalPages: maxPages };

  try {
    // Use map() to discover all URLs - this checks sitemap.xml and crawls for links
    const mapResult = await firecrawl.map(normalizedUrl, {
      limit: 200, // Get up to 200 URLs for Claude to choose from
      includeSubdomains: false,
    });

    // Extract URLs from map result
    if (mapResult.links && Array.isArray(mapResult.links)) {
      allLinks = mapResult.links
        .map((link: string | { url: string }) => typeof link === 'string' ? link : link.url)
        .filter((link: string) => {
          try {
            const linkUrl = new URL(link, baseUrl);
            // Only keep internal links
            return linkUrl.origin === baseUrl;
          } catch {
            return false;
          }
        });

      console.log(`[Scraper] Map discovered ${allLinks.length} URLs on the site`);

      // Log any careers-related URLs found
      const careerUrls = allLinks.filter((url: string) => {
        const lower = url.toLowerCase();
        return lower.includes('career') || lower.includes('job') || lower.includes('work-with') ||
               lower.includes('join-us') || lower.includes('hiring') || lower.includes('opportunities');
      });
      if (careerUrls.length > 0) {
        console.log(`[Scraper] Found ${careerUrls.length} career-related URLs:`, careerUrls);
      }
    }
  } catch (error) {
    console.warn(`[Scraper] Map failed, falling back to homepage links:`, error);
    // Continue - we'll get links from homepage scrape as fallback
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 2: Scrape the homepage for content and logo
  // ─────────────────────────────────────────────────────────────────────────
  yield { type: 'status', message: 'Scanning homepage...', pagesScraped: 0, totalPages: maxPages };

  try {
    const homepageDoc = await firecrawl.scrape(normalizedUrl, {
      formats: ['markdown', 'links'],
    });

    const homepageContent = homepageDoc.markdown || '';
    const homepageTitle = homepageDoc.metadata?.title || 'Homepage';

    // Extract logo from metadata (og:image, favicon, or logo)
    const metadata = homepageDoc.metadata as {
      ogImage?: string;
      favicon?: string;
      logo?: string;
      title?: string;
    } | undefined;

    homepageLogo = metadata?.ogImage || metadata?.logo || null;

    // Log what we found for debugging
    if (homepageLogo) {
      console.log(`[Scraper] Found logo/ogImage from homepage: ${homepageLogo}`);
    } else if (metadata?.favicon) {
      console.log(`[Scraper] Found favicon (backup): ${metadata.favicon}`);
    }

    // If map failed, use homepage links as fallback
    if (allLinks.length === 0 && homepageDoc.links) {
      console.log(`[Scraper] Using homepage links as fallback`);
      allLinks = (homepageDoc.links || [])
        .filter((link: string) => {
          try {
            const linkUrl = new URL(link, baseUrl);
            return linkUrl.origin === baseUrl;
          } catch {
            return false;
          }
        })
        .map((link: string) => {
          try {
            return new URL(link, baseUrl).href;
          } catch {
            return link;
          }
        });
    }

    scrapedPages.push({
      url: normalizedUrl,
      title: homepageTitle,
      content: homepageContent,
      logo: homepageLogo,
    });

    yield {
      type: 'page_scraped',
      message: `Scanned: ${homepageTitle}`,
      pageUrl: normalizedUrl,
      pageTitle: homepageTitle,
      pagesScraped: 1,
      totalPages: maxPages,
    };

  } catch (error) {
    yield { type: 'error', message: `Failed to scan homepage: ${error}` };
    throw error;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 3: Ask Claude to identify best pages to scrape from mapped URLs
  // ─────────────────────────────────────────────────────────────────────────
  yield { type: 'analyzing', message: 'Analyzing site structure...' };

  const pagesToScrape = await identifyPagesToScrape(
    claude,
    scrapedPages[0].content,
    allLinks,
    maxPages - 1 // Already scraped homepage
  );

  yield {
    type: 'status',
    message: `Found ${pagesToScrape.length} relevant pages to scan`,
    pagesScraped: 1,
    totalPages: Math.min(maxPages, pagesToScrape.length + 1),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 4: Scrape the identified pages
  // ─────────────────────────────────────────────────────────────────────────
  const scrapedUrls = new Set([normalizedUrl]);

  for (let i = 0; i < pagesToScrape.length && scrapedPages.length < maxPages; i++) {
    const page = pagesToScrape[i];

    // Skip if already scraped
    if (scrapedUrls.has(page.url)) continue;
    scrapedUrls.add(page.url);

    yield {
      type: 'status',
      message: `Scanning: ${page.reason}`,
      pageUrl: page.url,
      pagesScraped: scrapedPages.length,
      totalPages: Math.min(maxPages, pagesToScrape.length + 1),
    };

    try {
      const doc = await firecrawl.scrape(page.url, {
        formats: ['markdown'],
      });

      const pageContent = doc.markdown || '';
      const pageTitle = doc.metadata?.title || page.reason;

      scrapedPages.push({
        url: page.url,
        title: pageTitle,
        content: pageContent,
      });

      yield {
        type: 'page_scraped',
        message: `Scanned: ${pageTitle}`,
        pageUrl: page.url,
        pageTitle: pageTitle,
        pagesScraped: scrapedPages.length,
        totalPages: Math.min(maxPages, pagesToScrape.length + 1),
      };

    } catch (error) {
      console.warn(`Failed to scrape ${page.url}:`, error);
      // Continue with other pages
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 5: Extract company information with Claude
  // ─────────────────────────────────────────────────────────────────────────
  yield { type: 'extracting', message: 'Extracting company information...' };

  const allContent = scrapedPages
    .map((p) => `=== ${p.title} (${p.url}) ===\n${p.content}`)
    .join('\n\n');

  const extractedInfo = await extractCompanyInfo(claude, allContent, normalizedUrl);

  // Use homepage logo/ogImage as fallback if Claude didn't find one
  const finalLogo = extractedInfo.logo || homepageLogo;
  if (finalLogo && !extractedInfo.logo) {
    console.log(`[Scraper] Using homepage og:image as logo fallback: ${finalLogo}`);
  }

  // Try to extract colors from any logo or OG image found
  const colors = await tryExtractColors(scrapedPages, finalLogo);

  // Calculate remaining links for "scan more"
  const remainingLinks = pagesToScrape
    .slice(scrapedPages.length - 1)
    .map((p) => p.url)
    .filter((url) => !scrapedUrls.has(url));

  // Build final colors with smart defaults
  const suggestedColors = extractedInfo.suggestedColors;
  const primaryColor = colors.primary || suggestedColors.primary || '#7C21CC';
  const secondaryColor = colors.secondary || suggestedColors.secondary || '#342F46';

  const result: ExtractedCompanyInfo = {
    name: extractedInfo.name,
    industry: extractedInfo.industry,
    description: extractedInfo.description,
    logo: finalLogo,
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      accent: colors.accent || suggestedColors.accent || '#008161',
      textColor: suggestedColors.textColor || '#1a1a1a',
      buttonBg: suggestedColors.buttonBg || primaryColor,
      buttonFg: suggestedColors.buttonFg || '#FFFFFF',
    },
    pagesScraped: scrapedPages.map((p) => p.url),
    scrapedAt: new Date().toISOString(),
    canScanMore: remainingLinks.length > 0 || allLinks.length > scrapedPages.length,
    remainingLinks,
  };

  // Cache the result
  setCache(url, result, allContent, remainingLinks);

  yield { type: 'complete', message: `Scan complete! Analyzed ${scrapedPages.length} pages.`, result };

  return result;
}

// ============================================================================
// Claude: Identify pages to scrape
// ============================================================================

async function identifyPagesToScrape(
  claude: Anthropic,
  homepageContent: string,
  links: string[],
  maxPages: number
): Promise<PageToScrape[]> {
  // Deduplicate and clean links
  const uniqueLinks = [...new Set(links)]
    .filter((link) => {
      const lower = link.toLowerCase();
      // Filter out common non-content pages
      return !lower.includes('login') &&
             !lower.includes('signup') &&
             !lower.includes('sign-up') &&
             !lower.includes('register') &&
             !lower.includes('cart') &&
             !lower.includes('checkout') &&
             !lower.includes('privacy') &&
             !lower.includes('terms') &&
             !lower.includes('cookie') &&
             !lower.includes('/cdn-cgi/') &&
             !lower.includes('.pdf') &&
             !lower.includes('.jpg') &&
             !lower.includes('.png');
    })
    .slice(0, 100); // Limit to 100 links for Claude

  const prompt = `You are analyzing a company website to gather comprehensive information for employee onboarding content generation.

Here is the homepage content:
<homepage>
${homepageContent.slice(0, 15000)}
</homepage>

Here are the available links on the site:
<links>
${uniqueLinks.join('\n')}
</links>

Your task: Select up to ${maxPages} pages that would be MOST valuable for understanding:

**HIGHEST PRIORITY (priority 9-10) - ALWAYS include if available:**
- Careers pages (often /careers, /jobs, /work-with-us, /join-us, /opportunities, /join-our-team)
- About Us pages (often /about, /about-us, /our-story, /who-we-are, /company)
- Team/People pages (often /team, /people, /our-team, /leadership, /our-people, /meet-the-team)
- Culture pages (often /culture, /life-at, /working-here, /our-culture, /benefits)
- Values pages (often /values, /our-values, /mission, /what-we-stand-for)

**HIGH PRIORITY (priority 7-8):**
- Mission/Vision pages
- History/Story pages (often /history, /our-history, /our-journey)
- Why work here pages
- Employee benefits/perks pages
- Diversity & Inclusion pages

**MEDIUM PRIORITY (priority 5-6):**
- Products/Services overview (main page, not individual products)
- Customers/Industries served (overview only)

AVOID pages like:
- Blog posts, news articles, press releases (except "press room" landing pages)
- Individual case studies and testimonials
- Legal pages (privacy, terms, cookies)
- Support/help documentation
- Individual product detail pages
- Login/signup pages
- Shopping cart or e-commerce pages
- Social media links

IMPORTANT: Look for variations of career-related URLs - companies use many different naming conventions:
- /careers, /career, /jobs, /job, /work-with-us, /join-us, /join, /opportunities
- /work-here, /employment, /openings, /positions, /vacancies, /hiring
- /life-at-[company], /working-at-[company]

Return a JSON array of objects with:
- "url": the full URL
- "reason": short description (e.g., "About Us page", "Careers & Culture page")
- "priority": 1-10 (10 = highest priority)

Sort by priority descending. Include as many relevant pages as possible up to the limit.

Return ONLY the JSON array, no other text.`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    // Parse JSON response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const pages: PageToScrape[] = JSON.parse(jsonMatch[0]);
    return pages.sort((a, b) => b.priority - a.priority);

  } catch (error) {
    console.error('Failed to identify pages:', error);
    return [];
  }
}

// ============================================================================
// Claude: Extract company information
// ============================================================================

interface ClaudeExtraction {
  name: string;
  industry: string;
  description: string;
  logo: string | null;
  suggestedColors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
    textColor: string | null;
    buttonBg: string | null;
    buttonFg: string | null;
  };
}

async function extractCompanyInfo(
  claude: Anthropic,
  allContent: string,
  url: string
): Promise<ClaudeExtraction> {
  const prompt = `You are extracting comprehensive company information from website content for an employee onboarding content generation tool. This information will be used to create personalized onboarding content, so be thorough.

<website_content>
${allContent.slice(0, 80000)}
</website_content>

Extract the following information and return as JSON:

1. "name": The official company name (not taglines)

2. "industry": The industry/sector they operate in (be specific, e.g., "HR Technology / Employee Experience Software" not just "Technology")

3. "description": A COMPREHENSIVE description that will help generate excellent onboarding content. This should be 800-2500 words and cover:

   **Company Overview:**
   - What the company does and who they serve
   - Their products or services and how they work
   - Their market position and what makes them unique
   - Company size, locations, or global presence if mentioned

   **Mission, Vision & Values:**
   - Their stated mission or purpose
   - Core values and what they mean in practice
   - Any guiding principles or beliefs

   **Culture & Workplace:**
   - Company culture characteristics
   - What it's like to work there
   - Team dynamics and collaboration style
   - Work environment (remote, hybrid, in-office)
   - Employee benefits, perks, or programs mentioned
   - Diversity, equity, and inclusion initiatives

   **People & Leadership:**
   - Leadership team and their backgrounds
   - Founder story if available
   - Team composition or structure
   - Notable people or roles mentioned

   **Career & Growth:**
   - Career development opportunities
   - Learning and development programs
   - Why people join or stay at the company
   - Employee testimonials or quotes if available

   **History & Achievements:**
   - Company founding story
   - Key milestones or growth
   - Awards, recognition, or achievements
   - Future direction or goals

   Format the description using **markdown**:
   - Use ## headings to separate major sections (Company Overview, Culture, Career, etc.)
   - Use **bold** for emphasis on key terms, values, and programs
   - Use bullet points for lists of values, benefits, or features
   - Use > blockquotes for employee testimonials or mission statements
   - Include specific details: names, numbers, quotes, and concrete examples
   - Avoid generic statements like "they care about their employees" - quote specific programs instead

4. "logo": If you find a logo URL in the content, include it. Otherwise null.

5. "suggestedColors": An object with brand colors (all as hex codes, or null if not found):
   - "primary": The main brand color (often used in logo, headers, CTAs)
   - "secondary": Supporting brand color (often used for backgrounds, sections)
   - "accent": Highlight/accent color (often used for links, hover states, emphasis)
   - "textColor": Primary text color (usually dark gray or black, e.g., #1a1a1a, #333333)
   - "buttonBg": Button background color (often same as primary, or a variation)
   - "buttonFg": Button text/foreground color (usually white #FFFFFF or dark for contrast)

   Look for explicit brand guidelines, CSS color values, or infer from the overall design.

Return ONLY valid JSON, no other text.`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000, // Increased for comprehensive descriptions (800-2500 words)
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return getDefaultExtraction(url);
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultExtraction(url);
    }

    const extracted = JSON.parse(jsonMatch[0]);
    const colors = extracted.suggestedColors || {};
    return {
      name: extracted.name || extractNameFromUrl(url),
      industry: extracted.industry || '',
      description: extracted.description || '',
      logo: extracted.logo || null,
      suggestedColors: {
        primary: colors.primary || null,
        secondary: colors.secondary || null,
        accent: colors.accent || null,
        textColor: colors.textColor || null,
        buttonBg: colors.buttonBg || null,
        buttonFg: colors.buttonFg || null,
      },
    };

  } catch (error) {
    console.error('Failed to extract company info:', error);
    return getDefaultExtraction(url);
  }
}

function getDefaultExtraction(url: string): ClaudeExtraction {
  return {
    name: extractNameFromUrl(url),
    industry: '',
    description: '',
    logo: null,
    suggestedColors: {
      primary: null,
      secondary: null,
      accent: null,
      textColor: null,
      buttonBg: null,
      buttonFg: null,
    },
  };
}

function extractNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Company';
  }
}

// ============================================================================
// Color extraction from images
// ============================================================================

async function tryExtractColors(
  pages: ScrapedPage[],
  logoUrl: string | null
): Promise<{ primary: string | null; secondary: string | null; accent: string | null }> {
  // Try logo first
  if (logoUrl) {
    try {
      const palette = await Vibrant.from(logoUrl).getPalette();
      return {
        primary: palette.Vibrant?.hex || palette.DarkVibrant?.hex || null,
        secondary: palette.Muted?.hex || palette.DarkMuted?.hex || null,
        accent: palette.LightVibrant?.hex || palette.LightMuted?.hex || null,
      };
    } catch {
      // Continue to try OG image
    }
  }

  // Try to find OG image in content
  for (const page of pages) {
    const ogMatch = page.content.match(/og:image['"]\s*content=['"](https?:\/\/[^'"]+)/i);
    if (ogMatch) {
      try {
        const palette = await Vibrant.from(ogMatch[1]).getPalette();
        return {
          primary: palette.Vibrant?.hex || palette.DarkVibrant?.hex || null,
          secondary: palette.Muted?.hex || palette.DarkMuted?.hex || null,
          accent: palette.LightVibrant?.hex || palette.LightMuted?.hex || null,
        };
      } catch {
        continue;
      }
    }
  }

  return { primary: null, secondary: null, accent: null };
}

// ============================================================================
// Scan More functionality
// ============================================================================

export async function* scanMorePages(
  url: string,
  maxPages: number = 20
): AsyncGenerator<ScrapeProgress, ExtractedCompanyInfo, undefined> {
  const cached = getCached(url);
  if (!cached) {
    // No cache, do full scan
    yield* intelligentScrape(url, maxPages, false);
    return getCached(url)!.data;
  }

  // Continue from where we left off
  yield* intelligentScrape(url, maxPages, true);
  return getCached(url)!.data;
}
