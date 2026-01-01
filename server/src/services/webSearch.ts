/**
 * Web Search Service
 * Uses Brave Search API for web searches
 *
 * Requires BRAVE_SEARCH_API_KEY environment variable
 * Get a free API key at: https://brave.com/search/api/
 */

// ============================================================================
// Types
// ============================================================================

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: SearchResult[];
  query: string;
  totalResults: number;
}

// ============================================================================
// Brave Search API Types
// ============================================================================

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  is_source_local?: boolean;
  is_source_both?: boolean;
}

interface BraveSearchResponse {
  query: {
    original: string;
    show_strict_warning: boolean;
  };
  mixed?: {
    type: string;
    main: Array<{ type: string; index: number }>;
  };
  web?: {
    results: BraveWebResult[];
  };
}

// ============================================================================
// Web Search Implementation
// ============================================================================

/**
 * Search the web using Brave Search API
 */
export async function searchWeb(
  query: string,
  maxResults: number = 5
): Promise<WebSearchResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    throw new WebSearchError(
      'BRAVE_SEARCH_API_KEY not configured. Get a free API key at https://brave.com/search/api/',
      'CONFIG_ERROR'
    );
  }

  // Clamp maxResults between 1 and 10
  const count = Math.max(1, Math.min(10, maxResults));

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', count.toString());
    url.searchParams.set('text_decorations', 'false'); // Clean text without markdown
    url.searchParams.set('safesearch', 'moderate');

    console.log(`[WebSearch] Searching for: "${query}" (max ${count} results)`);

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
        throw new WebSearchError('Invalid Brave Search API key', 'AUTH_ERROR');
      }
      if (response.status === 429) {
        throw new WebSearchError(
          'Brave Search rate limit exceeded. Please try again later.',
          'RATE_LIMIT'
        );
      }
      throw new WebSearchError(
        `Brave Search API error: ${response.status} ${response.statusText}`,
        'API_ERROR'
      );
    }

    const data = (await response.json()) as BraveSearchResponse;

    // Extract web results
    const webResults = data.web?.results || [];

    const results: SearchResult[] = webResults.slice(0, count).map((result) => ({
      title: result.title || 'Untitled',
      url: result.url,
      snippet: result.description || '',
    }));

    console.log(`[WebSearch] Found ${results.length} results for "${query}"`);

    return {
      results,
      query: data.query?.original || query,
      totalResults: results.length,
    };
  } catch (error) {
    if (error instanceof WebSearchError) {
      throw error;
    }

    console.error('[WebSearch] Error:', error);
    throw new WebSearchError(
      `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED'
    );
  }
}

/**
 * Format search results as a readable string for Claude
 */
export function formatSearchResults(response: WebSearchResponse): string {
  if (response.results.length === 0) {
    return `No results found for "${response.query}".`;
  }

  const formattedResults = response.results
    .map(
      (result, index) =>
        `${index + 1}. **${result.title}**\n   URL: ${result.url}\n   ${result.snippet}`
    )
    .join('\n\n');

  return `Search results for "${response.query}":\n\n${formattedResults}`;
}

// ============================================================================
// Error Class
// ============================================================================

export class WebSearchError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WebSearchError';
    this.code = code;
  }
}
