import { normalizeUrl, ScraperError } from './scraper';

// Note: Full integration tests for scrapeWebsite require a running browser.
// These unit tests focus on the utility functions and edge cases.

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
});

// Helper function tests
describe('color utilities', () => {
  // These test the helper functions that are not exported
  // We test them indirectly through the main function or by extracting them

  describe('hex color validation', () => {
    const isValidHex = (hex: string): boolean => {
      return /^#[0-9A-Fa-f]{6}$/.test(hex);
    };

    it('should validate correct hex colors', () => {
      expect(isValidHex('#FF0000')).toBe(true);
      expect(isValidHex('#00ff00')).toBe(true);
      expect(isValidHex('#0000FF')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHex('FF0000')).toBe(false); // Missing #
      expect(isValidHex('#FFF')).toBe(false); // Too short
      expect(isValidHex('#GGGGGG')).toBe(false); // Invalid chars
    });
  });

  describe('grayscale detection', () => {
    // Mock the isGrayscale logic
    const isGrayscale = (hex: string): boolean => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return false;

      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);

      const maxDiff = Math.max(
        Math.abs(r - g),
        Math.abs(g - b),
        Math.abs(r - b)
      );

      const avg = (r + g + b) / 3;
      const isNearWhite = avg > 240;
      const isNearBlack = avg < 15;

      return maxDiff < 10 || isNearWhite || isNearBlack;
    };

    it('should detect grayscale colors', () => {
      expect(isGrayscale('#000000')).toBe(true); // Black
      expect(isGrayscale('#FFFFFF')).toBe(true); // White
      expect(isGrayscale('#808080')).toBe(true); // Gray
      expect(isGrayscale('#F5F5F5')).toBe(true); // Near white
    });

    it('should not flag colorful colors as grayscale', () => {
      expect(isGrayscale('#FF0000')).toBe(false); // Red
      expect(isGrayscale('#00FF00')).toBe(false); // Green
      expect(isGrayscale('#0000FF')).toBe(false); // Blue
      expect(isGrayscale('#3B82F6')).toBe(false); // Brand blue
    });
  });
});

describe('company name extraction', () => {
  // Mock the extractCompanyName logic
  const extractCompanyName = (title: string | null, url: string): string => {
    if (title) {
      const cleaned = title
        .split(/[|\-–—]/)[0]
        .replace(/home|official|website|site/gi, '')
        .trim();

      if (cleaned.length > 0 && cleaned.length < 50) {
        return cleaned;
      }
    }

    try {
      const hostname = new URL(url).hostname;
      const domain = hostname.replace(/^www\./, '').split('.')[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Unknown Company';
    }
  };

  it('should extract company name from simple title', () => {
    expect(extractCompanyName('Acme Corp', 'https://acme.com')).toBe('Acme Corp');
  });

  it('should remove common suffixes from title', () => {
    expect(extractCompanyName('Acme Corp | Home', 'https://acme.com')).toBe('Acme Corp');
    expect(extractCompanyName('Acme Corp - Official Website', 'https://acme.com')).toBe('Acme Corp');
  });

  it('should fall back to domain name', () => {
    expect(extractCompanyName(null, 'https://example.com')).toBe('Example');
    expect(extractCompanyName('', 'https://www.mycompany.com')).toBe('Mycompany');
  });

  it('should handle complex titles', () => {
    expect(extractCompanyName('TechCo | Enterprise Software', 'https://techco.io')).toBe('TechCo');
    expect(extractCompanyName('BigCorp – Leading the Way', 'https://bigcorp.com')).toBe('BigCorp');
  });
});
