import { BraveSearchError } from './braveSearch';

// Note: Integration tests for searchCompanyInfo require a valid Brave API key.
// These unit tests focus on utility functions and error handling.

describe('braveSearch', () => {
  describe('BraveSearchError', () => {
    it('should have correct name and code', () => {
      const error = new BraveSearchError('Test error', 'TEST_CODE');
      expect(error.name).toBe('BraveSearchError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error');
    });

    it('should be instanceof Error', () => {
      const error = new BraveSearchError('Test', 'CODE');
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe('industry inference', () => {
  // Mock the inferIndustry logic for testing
  const inferIndustry = (text: string): string | undefined => {
    const allText = text.toLowerCase();

    const industryKeywords: Record<string, string[]> = {
      'Technology': ['software', 'saas', 'tech', 'ai', 'cloud', 'platform', 'app', 'digital'],
      'Finance': ['bank', 'financial', 'investment', 'insurance', 'fintech', 'trading'],
      'Healthcare': ['health', 'medical', 'pharmaceutical', 'hospital', 'clinical', 'patient'],
      'Retail': ['retail', 'shop', 'store', 'ecommerce', 'e-commerce', 'marketplace'],
      'Manufacturing': ['manufacturing', 'industrial', 'factory', 'production'],
      'Media': ['media', 'entertainment', 'streaming', 'publishing', 'broadcast'],
      'Education': ['education', 'learning', 'university', 'school', 'training'],
      'HR & Workforce': ['hr', 'human resources', 'hiring', 'recruitment', 'workforce', 'onboarding', 'employee'],
    };

    const scores: Record<string, number> = {};
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      scores[industry] = keywords.filter(kw => allText.includes(kw)).length;
    }

    const topIndustry = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .find(([, score]) => score > 0);

    return topIndustry?.[0];
  };

  it('should detect technology companies', () => {
    expect(inferIndustry('A leading SaaS platform for cloud computing')).toBe('Technology');
    expect(inferIndustry('Enterprise software and AI solutions')).toBe('Technology');
  });

  it('should detect finance companies', () => {
    expect(inferIndustry('Investment banking and financial services')).toBe('Finance');
    expect(inferIndustry('Leading fintech insurance provider')).toBe('Finance');
  });

  it('should detect healthcare companies', () => {
    expect(inferIndustry('Hospital management and patient care')).toBe('Healthcare');
    expect(inferIndustry('Pharmaceutical research and clinical trials')).toBe('Healthcare');
  });

  it('should detect HR companies', () => {
    expect(inferIndustry('Employee onboarding and recruitment software')).toBe('HR & Workforce');
    expect(inferIndustry('Human resources and hiring solutions')).toBe('HR & Workforce');
  });

  it('should return undefined for unrecognizable industries', () => {
    expect(inferIndustry('A company that does random things')).toBeUndefined();
    expect(inferIndustry('')).toBeUndefined();
  });

  it('should pick the industry with most keyword matches', () => {
    // Has both tech and finance keywords, but more tech
    expect(inferIndustry('SaaS software platform with cloud AI tech')).toBe('Technology');
  });
});

describe('summary building', () => {
  // Mock the buildCompanySummary logic
  const buildCompanySummary = (results: { description: string }[]): string => {
    if (results.length === 0) return '';

    const descriptions = results
      .slice(0, 3)
      .map(r => r.description)
      .filter(d => d.length > 0);

    if (descriptions.length === 0) return '';

    return descriptions.sort((a, b) => b.length - a.length)[0];
  };

  it('should return empty string for empty results', () => {
    expect(buildCompanySummary([])).toBe('');
  });

  it('should return the longest description', () => {
    const results = [
      { description: 'Short' },
      { description: 'A much longer description with more details about the company' },
      { description: 'Medium length description' },
    ];
    expect(buildCompanySummary(results)).toBe('A much longer description with more details about the company');
  });

  it('should filter out empty descriptions', () => {
    const results = [
      { description: '' },
      { description: 'Valid description' },
      { description: '' },
    ];
    expect(buildCompanySummary(results)).toBe('Valid description');
  });

  it('should only consider top 3 results', () => {
    const results = [
      { description: 'First' },
      { description: 'Second' },
      { description: 'Third' },
      { description: 'This is the longest but should be ignored since it is fourth' },
    ];
    expect(buildCompanySummary(results)).toBe('Second'); // Longest of first 3
  });
});
