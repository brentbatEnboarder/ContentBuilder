/**
 * Brave Search API integration for company research
 *
 * Uses Brave Search Web API to gather additional company context
 * beyond what can be scraped from their website.
 */

export interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

export interface CompanyResearchResult {
  companyName: string;
  summary: string;
  searchResults: BraveSearchResult[];
  industry?: string;
  additionalContext?: string;
}

const BRAVE_API_BASE = 'https://api.search.brave.com/res/v1/web/search';

// Brave API response shape
interface BraveApiResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;
  };
}

/**
 * Search for company information using Brave Search API
 */
export async function searchCompanyInfo(companyName: string): Promise<CompanyResearchResult> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.warn('BRAVE_API_KEY not configured, returning empty research results');
    return {
      companyName,
      summary: '',
      searchResults: [],
    };
  }

  try {
    // Search for company overview
    const searchQuery = `${companyName} company about`;
    const response = await fetch(`${BRAVE_API_BASE}?q=${encodeURIComponent(searchQuery)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new BraveSearchError(
        `Brave Search API error: ${response.status}`,
        'API_ERROR'
      );
    }

    const data: BraveApiResponse = await response.json();
    const webResults = data.web?.results || [];

    // Extract search results
    const searchResults: BraveSearchResult[] = webResults.map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));

    // Build summary from top results
    const summary = buildCompanySummary(companyName, searchResults);

    // Try to infer industry from results
    const industry = inferIndustry(searchResults);

    return {
      companyName,
      summary,
      searchResults,
      industry,
    };
  } catch (error) {
    if (error instanceof BraveSearchError) {
      throw error;
    }
    throw new BraveSearchError(
      `Failed to search company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SEARCH_FAILED'
    );
  }
}

/**
 * Build a company summary from search results
 */
function buildCompanySummary(companyName: string, results: BraveSearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  // Combine descriptions from top results
  const descriptions = results
    .slice(0, 3)
    .map(r => r.description)
    .filter(d => d.length > 0);

  if (descriptions.length === 0) {
    return '';
  }

  // Return the most informative description (longest one typically has more context)
  return descriptions.sort((a, b) => b.length - a.length)[0];
}

/**
 * Try to infer industry from search results
 */
function inferIndustry(results: BraveSearchResult[]): string | undefined {
  const allText = results.map(r => `${r.title} ${r.description}`).join(' ').toLowerCase();

  // Industry keyword mapping
  const industryKeywords: Record<string, string[]> = {
    'Technology': ['software', 'saas', 'tech', 'ai', 'cloud', 'platform', 'app', 'digital'],
    'Finance': ['bank', 'financial', 'investment', 'insurance', 'fintech', 'trading'],
    'Healthcare': ['health', 'medical', 'pharmaceutical', 'hospital', 'clinical', 'patient'],
    'Retail': ['retail', 'shop', 'store', 'ecommerce', 'e-commerce', 'marketplace'],
    'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production'],
    'Media': ['media', 'entertainment', 'streaming', 'publishing', 'broadcast'],
    'Education': ['education', 'learning', 'university', 'school', 'training'],
    'Real Estate': ['real estate', 'property', 'housing', 'mortgage'],
    'Transportation': ['transport', 'logistics', 'shipping', 'delivery', 'freight'],
    'Energy': ['energy', 'oil', 'gas', 'renewable', 'solar', 'power'],
    'HR & Workforce': ['hr', 'human resources', 'hiring', 'recruitment', 'workforce', 'onboarding', 'employee'],
  };

  // Count keyword matches for each industry
  const scores: Record<string, number> = {};
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    scores[industry] = keywords.filter(kw => allText.includes(kw)).length;
  }

  // Return the industry with highest score (if any matches)
  const topIndustry = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .find(([, score]) => score > 0);

  return topIndustry?.[0];
}

/**
 * Search for specific company news
 */
export async function searchCompanyNews(companyName: string): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const searchQuery = `${companyName} news`;
    const response = await fetch(
      `${BRAVE_API_BASE}?q=${encodeURIComponent(searchQuery)}&count=5&freshness=pw`, // past week
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: BraveApiResponse = await response.json();
    const webResults = data.web?.results || [];

    return webResults.map((r) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
    }));
  } catch {
    return [];
  }
}

/**
 * Custom error class for Brave Search errors
 */
export class BraveSearchError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'BraveSearchError';
    this.code = code;
  }
}
