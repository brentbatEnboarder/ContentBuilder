import { normalizeUrl, extractCompanyName, ScraperError } from './scraper';

describe('scraper', () => {
  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
    });

    it('should preserve http:// if specified', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should preserve https:// if specified', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
    });

    it('should throw ScraperError for invalid URLs', () => {
      expect(() => normalizeUrl('')).toThrow(ScraperError);
      expect(() => normalizeUrl('not a valid url at all :::')).toThrow(ScraperError);
    });

    it('should handle URLs with paths and query strings', () => {
      expect(normalizeUrl('example.com/page?foo=bar')).toBe('https://example.com/page?foo=bar');
    });

    it('should handle URLs with ports', () => {
      expect(normalizeUrl('example.com:8080')).toBe('https://example.com:8080');
    });
  });

  describe('ScraperError', () => {
    it('should have correct name and code', () => {
      const error = new ScraperError('Test error', 'TEST_CODE');
      expect(error.name).toBe('ScraperError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error');
    });

    it('should be instanceof Error', () => {
      const error = new ScraperError('Test', 'CODE');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('extractCompanyName', () => {
    it('should extract company name from simple title', () => {
      expect(extractCompanyName('Acme Corp', 'https://acme.com')).toBe('Acme Corp');
    });

    it('should remove common suffixes from title', () => {
      expect(extractCompanyName('Acme Corp | Home', 'https://acme.com')).toBe('Acme Corp');
      expect(extractCompanyName('Acme Corp - Official Website', 'https://acme.com')).toBe('Acme Corp');
    });

    it('should fall back to domain name when title is null', () => {
      expect(extractCompanyName(null, 'https://example.com')).toBe('Example');
      expect(extractCompanyName(null, 'https://www.mycompany.com')).toBe('Mycompany');
    });

    it('should fall back to domain name when title is empty', () => {
      expect(extractCompanyName('', 'https://example.com')).toBe('Example');
    });

    it('should handle complex titles', () => {
      expect(extractCompanyName('TechCo | Enterprise Software', 'https://techco.io')).toBe('TechCo');
      expect(extractCompanyName('BigCorp – Leading the Way', 'https://bigcorp.com')).toBe('BigCorp');
    });

    it('should handle titles with em-dash separators', () => {
      expect(extractCompanyName('Company Name — Tagline', 'https://company.com')).toBe('Company Name');
    });

    it('should return Unknown Company for invalid URL', () => {
      expect(extractCompanyName(null, 'invalid')).toBe('Unknown Company');
    });
  });
});
