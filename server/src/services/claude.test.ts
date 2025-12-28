import { buildVoicePrompt, buildSystemPrompt, ClaudeError } from './claude';
import type { VoiceSettings, CompanyProfile } from './claude';

describe('Claude Service', () => {
  describe('buildVoicePrompt', () => {
    it('should build voice prompt with balanced settings (all 2s)', () => {
      const settings: VoiceSettings = {
        formality: 2,
        humor: 2,
        respect: 2,
        enthusiasm: 2,
      };

      const result = buildVoicePrompt(settings);

      expect(result).toContain('Brand Voice Guidelines');
      expect(result).toContain('Balanced');
      expect(result).toContain('A blend of professional and conversational');
      expect(result).toContain('Professional with light moments');
      expect(result).toContain('Respects norms but willing to be direct');
      expect(result).toContain('Warm but measured');
    });

    it('should build voice prompt with formal/serious settings', () => {
      const settings: VoiceSettings = {
        formality: 0,
        humor: 0,
        respect: 0,
        enthusiasm: 0,
      };

      const result = buildVoicePrompt(settings);

      expect(result).toContain('Very Formal');
      expect(result).toContain('Very Serious');
      expect(result).toContain('Very Respectful');
      expect(result).toContain('Very Matter-of-fact');
      expect(result).toContain('Highly professional and polished');
      expect(result).toContain('Strictly business');
    });

    it('should build voice prompt with casual/fun settings', () => {
      const settings: VoiceSettings = {
        formality: 4,
        humor: 4,
        respect: 4,
        enthusiasm: 4,
      };

      const result = buildVoicePrompt(settings);

      expect(result).toContain('Very Casual');
      expect(result).toContain('Very Funny');
      expect(result).toContain('Very Irreverent');
      expect(result).toContain('Very Enthusiastic');
      expect(result).toContain('like chatting with a friend');
      expect(result).toContain('Fun and entertaining');
    });

    it('should handle mixed settings', () => {
      const settings: VoiceSettings = {
        formality: 1, // Somewhat Formal
        humor: 3, // Somewhat Funny
        respect: 2, // Balanced
        enthusiasm: 4, // Very Enthusiastic
      };

      const result = buildVoicePrompt(settings);

      expect(result).toContain('Somewhat Formal');
      expect(result).toContain('Somewhat Funny');
      expect(result).toContain('Balanced');
      expect(result).toContain('Very Enthusiastic');
    });
  });

  describe('buildSystemPrompt', () => {
    const mockCompanyProfile: CompanyProfile = {
      websiteUrl: 'https://example.com',
      companyProfile:
        'Company: Example Corp\nAbout: A leading tech company\nWebsite: https://example.com',
      brandColors: {
        primary: '#7C21CC',
        secondary: '#4A90D9',
        accent: '#F5A623',
      },
    };

    const defaultVoiceSettings: VoiceSettings = {
      formality: 2,
      humor: 2,
      respect: 2,
      enthusiasm: 2,
    };

    it('should include company profile in system prompt', () => {
      const result = buildSystemPrompt(mockCompanyProfile, defaultVoiceSettings);

      expect(result).toContain('Example Corp');
      expect(result).toContain('https://example.com');
    });

    it('should include brand colors in system prompt', () => {
      const result = buildSystemPrompt(mockCompanyProfile, defaultVoiceSettings);

      expect(result).toContain('#7C21CC');
      expect(result).toContain('#4A90D9');
      expect(result).toContain('#F5A623');
    });

    it('should include voice guidelines in system prompt', () => {
      const result = buildSystemPrompt(mockCompanyProfile, defaultVoiceSettings);

      expect(result).toContain('Brand Voice Guidelines');
      expect(result).toContain('Formal ↔ Casual');
      expect(result).toContain('Serious ↔ Funny');
    });

    it('should include content guidelines', () => {
      const result = buildSystemPrompt(mockCompanyProfile, defaultVoiceSettings);

      expect(result).toContain('Write in Markdown format');
      expect(result).toContain('concise but comprehensive');
      expect(result).toContain('calls-to-action');
    });

    it('should include Enboarder context', () => {
      const result = buildSystemPrompt(mockCompanyProfile, defaultVoiceSettings);

      expect(result).toContain('Enboarder');
      expect(result).toContain('employee journey content');
    });

    it('should handle missing company profile gracefully', () => {
      const emptyProfile: CompanyProfile = {
        websiteUrl: '',
        companyProfile: '',
        brandColors: { primary: '', secondary: '', accent: '' },
      };

      const result = buildSystemPrompt(emptyProfile, defaultVoiceSettings);

      expect(result).toContain('No company profile provided');
      expect(result).toContain('Not specified');
    });
  });

  describe('ClaudeError', () => {
    it('should create error with code', () => {
      const error = new ClaudeError('Test error message', 'TEST_CODE');

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ClaudeError');
    });

    it('should be an instance of Error', () => {
      const error = new ClaudeError('Test', 'CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ClaudeError);
    });
  });

  describe('Voice Settings Edge Cases', () => {
    it('should handle boundary values (0 and 4)', () => {
      const lowSettings: VoiceSettings = {
        formality: 0,
        humor: 0,
        respect: 0,
        enthusiasm: 0,
      };

      const highSettings: VoiceSettings = {
        formality: 4,
        humor: 4,
        respect: 4,
        enthusiasm: 4,
      };

      const lowResult = buildVoicePrompt(lowSettings);
      const highResult = buildVoicePrompt(highSettings);

      // Low should have formal language
      expect(lowResult).toContain('Very Formal');
      expect(lowResult).toContain('Highly professional');

      // High should have casual language
      expect(highResult).toContain('Very Casual');
      expect(highResult).toContain('relaxed and informal');
    });

    it('should include all four voice dimensions', () => {
      const settings: VoiceSettings = {
        formality: 2,
        humor: 2,
        respect: 2,
        enthusiasm: 2,
      };

      const result = buildVoicePrompt(settings);

      expect(result).toContain('Formal ↔ Casual');
      expect(result).toContain('Serious ↔ Funny');
      expect(result).toContain('Respectful ↔ Irreverent');
      expect(result).toContain('Matter-of-fact ↔ Enthusiastic');
    });
  });
});
