import {
  buildImagePrompt,
  styleToPrompt,
  ImageGenError,
} from './imageGen';

describe('imageGen service', () => {
  describe('styleToPrompt', () => {
    it('should have all 8 image styles defined', () => {
      const expectedStyles = [
        'corporate',
        'flat',
        'isometric',
        'abstract',
        'handdrawn',
        'photorealistic',
        'minimalist',
        'infographic',
      ];

      expect(Object.keys(styleToPrompt)).toHaveLength(8);
      expectedStyles.forEach((style) => {
        expect(styleToPrompt[style]).toBeDefined();
        expect(typeof styleToPrompt[style]).toBe('string');
        expect(styleToPrompt[style].length).toBeGreaterThan(50);
      });
    });

    it('should have descriptive prompts for each style', () => {
      // Corporate should mention professional/business
      expect(styleToPrompt.corporate.toLowerCase()).toMatch(
        /professional|corporate|business/
      );

      // Flat should mention illustration/vector
      expect(styleToPrompt.flat.toLowerCase()).toMatch(
        /flat|illustration|vector|geometric/
      );

      // Isometric should mention 3D/perspective
      expect(styleToPrompt.isometric.toLowerCase()).toMatch(
        /isometric|3d|perspective|angle/
      );

      // Abstract should mention geometric/shapes
      expect(styleToPrompt.abstract.toLowerCase()).toMatch(
        /abstract|geometric|shapes/
      );

      // Handdrawn should mention sketch/drawn
      expect(styleToPrompt.handdrawn.toLowerCase()).toMatch(
        /hand-drawn|sketch|doodle|pencil/
      );

      // Photorealistic should mention realistic/photo
      expect(styleToPrompt.photorealistic.toLowerCase()).toMatch(
        /photorealistic|realistic|lifelike/
      );

      // Minimalist should mention minimal/simple
      expect(styleToPrompt.minimalist.toLowerCase()).toMatch(
        /minimalist|minimal|simple|clean/
      );

      // Infographic should mention data/diagram/visual
      expect(styleToPrompt.infographic.toLowerCase()).toMatch(
        /infographic|data|diagram|icon|chart/
      );
    });
  });

  describe('buildImagePrompt', () => {
    const contentSummary = 'Welcome new employees to our team';

    it('should build a basic prompt with content and style', () => {
      const prompt = buildImagePrompt(contentSummary, 'flat');

      expect(prompt).toContain(contentSummary);
      expect(prompt).toContain('Visual Style:');
      expect(prompt).toContain(styleToPrompt.flat);
      expect(prompt).toContain('employee communications');
    });

    it('should include brand colors when provided', () => {
      const brandColors = {
        primary: '#7C21CC',
        secondary: '#00A3E0',
        accent: '#FF6B35',
      };

      const prompt = buildImagePrompt(
        contentSummary,
        'corporate',
        brandColors
      );

      expect(prompt).toContain('Brand Colors:');
      expect(prompt).toContain('#7C21CC');
      expect(prompt).toContain('#00A3E0');
      expect(prompt).toContain('#FF6B35');
    });

    it('should include custom prompt when provided', () => {
      const customPrompt = 'include diverse people working together';

      const prompt = buildImagePrompt(
        contentSummary,
        'infographic',
        undefined,
        customPrompt
      );

      expect(prompt).toContain('Additional requirements:');
      expect(prompt).toContain(customPrompt);
    });

    it('should handle all parameters together', () => {
      const brandColors = {
        primary: '#123456',
        secondary: '',
        accent: '#ABCDEF',
      };
      const customPrompt = 'show office environment';

      const prompt = buildImagePrompt(
        contentSummary,
        'isometric',
        brandColors,
        customPrompt
      );

      expect(prompt).toContain(contentSummary);
      expect(prompt).toContain(styleToPrompt.isometric);
      expect(prompt).toContain('#123456');
      expect(prompt).toContain('#ABCDEF');
      expect(prompt).toContain('show office environment');
    });

    it('should use flat style as fallback for unknown style', () => {
      const prompt = buildImagePrompt(contentSummary, 'unknown-style');

      expect(prompt).toContain(styleToPrompt.flat);
    });

    it('should not include secondary color if empty', () => {
      const brandColors = {
        primary: '#123456',
        secondary: '',
        accent: '',
      };

      const prompt = buildImagePrompt(
        contentSummary,
        'flat',
        brandColors
      );

      expect(prompt).toContain('#123456');
      // Should not have empty secondary/accent lines
      expect(prompt).not.toContain('Secondary: \n');
      expect(prompt).not.toContain('Accent: \n');
    });

    it('should trim custom prompt whitespace', () => {
      const customPrompt = '   add some trees   ';

      const prompt = buildImagePrompt(
        contentSummary,
        'infographic',
        undefined,
        customPrompt
      );

      expect(prompt).toContain('Additional requirements: add some trees');
    });

    it('should not include custom prompt section if empty', () => {
      const prompt = buildImagePrompt(
        contentSummary,
        'flat',
        undefined,
        '   '
      );

      expect(prompt).not.toContain('Additional requirements:');
    });
  });

  describe('ImageGenError', () => {
    it('should create error with message and code', () => {
      const error = new ImageGenError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ImageGenError');
      expect(error instanceof Error).toBe(true);
    });

    it('should have correct error codes for different scenarios', () => {
      const configError = new ImageGenError('Config missing', 'CONFIG_ERROR');
      const rateLimit = new ImageGenError('Too many requests', 'RATE_LIMIT');
      const authError = new ImageGenError('Invalid key', 'AUTH_ERROR');
      const contentFiltered = new ImageGenError(
        'Content blocked',
        'CONTENT_FILTERED'
      );

      expect(configError.code).toBe('CONFIG_ERROR');
      expect(rateLimit.code).toBe('RATE_LIMIT');
      expect(authError.code).toBe('AUTH_ERROR');
      expect(contentFiltered.code).toBe('CONTENT_FILTERED');
    });
  });
});
