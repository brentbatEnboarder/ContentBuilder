/**
 * Logo Search Service
 * Uses Brave Image Search API to find company logos
 *
 * Requires BRAVE_SEARCH_API_KEY environment variable
 * Get a free API key at: https://brave.com/search/api/
 */

// ============================================================================
// Types
// ============================================================================

export interface LogoCandidate {
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
  width?: number;
  height?: number;
}

export interface LogoSearchResult {
  candidates: LogoCandidate[];
  query: string;
  searchTime: number;
}

// ============================================================================
// Brave Image Search API Types
// ============================================================================

interface BraveImageResult {
  title: string;
  url: string;
  source: string;
  thumbnail: {
    src: string;
  };
  properties: {
    url: string;
    placeholder?: string;
  };
  meta_url?: {
    hostname: string;
  };
}

interface BraveImageSearchResponse {
  query: {
    original: string;
  };
  results?: BraveImageResult[];
}

// ============================================================================
// Logo Search Implementation
// ============================================================================

/**
 * Search for company logo images using Brave Image Search
 */
export async function searchForLogo(
  companyName: string,
  maxResults: number = 6
): Promise<LogoSearchResult> {
  const startTime = Date.now();
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    throw new LogoSearchError(
      'BRAVE_SEARCH_API_KEY not configured',
      'CONFIG_ERROR'
    );
  }

  // Clean up company name and create search query
  const cleanName = companyName.trim().replace(/[.,!?;:]+$/, '');
  const query = `${cleanName} logo transparent png`;

  try {
    const url = new URL('https://api.search.brave.com/res/v1/images/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', Math.min(maxResults, 20).toString());
    url.searchParams.set('safesearch', 'strict');
    url.searchParams.set('spellcheck', 'false');

    console.log(`[LogoSearch] Searching for: "${query}"`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new LogoSearchError('Invalid Brave Search API key', 'AUTH_ERROR');
      }
      if (response.status === 429) {
        throw new LogoSearchError(
          'Brave Search rate limit exceeded',
          'RATE_LIMIT'
        );
      }
      throw new LogoSearchError(
        `Brave Image Search API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data = (await response.json()) as BraveImageSearchResponse;

    // Extract and filter results
    const results = data.results || [];

    // Filter for likely logo images
    const candidates: LogoCandidate[] = results
      .filter((result) => {
        const urlLower = result.url.toLowerCase();
        const titleLower = result.title.toLowerCase();

        // Prioritize images that look like logos
        const hasLogoIndicator =
          urlLower.includes('logo') ||
          titleLower.includes('logo') ||
          urlLower.includes('brand') ||
          titleLower.includes('brand');

        // Avoid social media avatars and icons that are too small
        const isLikelyAvatar =
          urlLower.includes('profile') ||
          urlLower.includes('avatar') ||
          urlLower.includes('favicon');

        // If it's clearly a logo indicator, keep it; otherwise filter out avatars
        return hasLogoIndicator || !isLikelyAvatar;
      })
      .slice(0, maxResults)
      .map((result) => ({
        url: result.properties?.url || result.url,
        thumbnailUrl: result.thumbnail?.src || result.url,
        title: result.title || 'Logo',
        source: result.meta_url?.hostname || result.source || 'Unknown',
      }));

    const searchTime = Date.now() - startTime;
    console.log(`[LogoSearch] Found ${candidates.length} logo candidates in ${searchTime}ms`);

    return {
      candidates,
      query: data.query?.original || query,
      searchTime,
    };
  } catch (error) {
    if (error instanceof LogoSearchError) {
      throw error;
    }

    console.error('[LogoSearch] Error:', error);
    throw new LogoSearchError(
      `Logo search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED'
    );
  }
}

/**
 * Search for logo with fallback - tries multiple query variations
 */
export async function searchForLogoWithFallback(
  companyName: string,
  companyUrl?: string
): Promise<LogoSearchResult> {
  // Try primary search
  try {
    const result = await searchForLogo(companyName);
    if (result.candidates.length > 0) {
      return result;
    }
  } catch (error) {
    console.warn('[LogoSearch] Primary search failed:', error);
  }

  // Fallback: Try with domain name if provided
  if (companyUrl) {
    try {
      const domain = new URL(companyUrl).hostname.replace(/^www\./, '');
      const domainName = domain.split('.')[0];

      if (domainName.toLowerCase() !== companyName.toLowerCase()) {
        console.log(`[LogoSearch] Trying fallback search with domain: ${domainName}`);
        const result = await searchForLogo(domainName);
        if (result.candidates.length > 0) {
          return result;
        }
      }
    } catch (error) {
      console.warn('[LogoSearch] Fallback search failed:', error);
    }
  }

  // Return empty result if all searches fail
  return {
    candidates: [],
    query: companyName,
    searchTime: 0,
  };
}

// ============================================================================
// Error Class
// ============================================================================

export class LogoSearchError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'LogoSearchError';
    this.code = code;
  }
}
