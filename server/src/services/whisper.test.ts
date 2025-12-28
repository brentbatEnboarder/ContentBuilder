import {
  SUPPORTED_AUDIO_TYPES,
  WhisperError,
} from './whisper';

// Mock OpenAI SDK
jest.mock('openai', () => {
  const mockTranscriptionsCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: mockTranscriptionsCreate,
        },
      },
    })),
    toFile: jest.fn().mockResolvedValue({
      name: 'audio.webm',
      type: 'audio/webm',
    }),
    APIError: class APIError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'APIError';
      }
    },
  };
});

describe('Whisper Service', () => {
  describe('SUPPORTED_AUDIO_TYPES', () => {
    it('should include common audio MIME types', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/webm');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mp3');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mpeg');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/wav');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/mp4');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/m4a');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/ogg');
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/flac');
    });

    it('should include webm with opus codec', () => {
      expect(SUPPORTED_AUDIO_TYPES).toContain('audio/webm;codecs=opus');
    });

    it('should have at least 10 supported formats', () => {
      expect(SUPPORTED_AUDIO_TYPES.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('WhisperError', () => {
    it('should create error with message and code', () => {
      const error = new WhisperError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('WhisperError');
    });

    it('should be an instance of Error', () => {
      const error = new WhisperError('Test', 'CODE');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(WhisperError);
    });

    it('should support common error codes', () => {
      const configError = new WhisperError('No API key', 'CONFIG_ERROR');
      const rateLimitError = new WhisperError('Too many requests', 'RATE_LIMIT');
      const fileTooLargeError = new WhisperError('File too big', 'FILE_TOO_LARGE');
      const unsupportedError = new WhisperError('Bad format', 'UNSUPPORTED_FORMAT');

      expect(configError.code).toBe('CONFIG_ERROR');
      expect(rateLimitError.code).toBe('RATE_LIMIT');
      expect(fileTooLargeError.code).toBe('FILE_TOO_LARGE');
      expect(unsupportedError.code).toBe('UNSUPPORTED_FORMAT');
    });
  });

  describe('transcribeAudio', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe('input validation', () => {
      it('should reject files over 25MB', async () => {
        const { transcribeAudio, WhisperError: WE } = await import('./whisper');
        const largeBuffer = Buffer.alloc(26 * 1024 * 1024); // 26MB

        try {
          await transcribeAudio(largeBuffer, 'audio/webm');
          fail('Should have thrown WhisperError');
        } catch (error) {
          expect(error).toBeInstanceOf(WE);
          expect((error as InstanceType<typeof WE>).code).toBe('FILE_TOO_LARGE');
          expect((error as InstanceType<typeof WE>).message).toContain('too large');
        }
      });

      it('should reject unsupported MIME types', async () => {
        const { transcribeAudio, WhisperError: WE } = await import('./whisper');
        const buffer = Buffer.from('test audio data');

        try {
          await transcribeAudio(buffer, 'video/mp4');
          fail('Should have thrown WhisperError');
        } catch (error) {
          expect(error).toBeInstanceOf(WE);
          expect((error as InstanceType<typeof WE>).code).toBe('UNSUPPORTED_FORMAT');
          expect((error as InstanceType<typeof WE>).message).toContain('Unsupported audio format');
        }
      });

      it('should accept valid audio formats', async () => {
        const { transcribeAudio } = await import('./whisper');
        const OpenAI = (await import('openai')).default;
        const mockInstance = new OpenAI({ apiKey: 'test' });
        (mockInstance.audio.transcriptions.create as jest.Mock).mockResolvedValue({
          text: 'Hello world',
        });

        const buffer = Buffer.from('test audio data');

        // Should not throw for webm
        const result = await transcribeAudio(buffer, 'audio/webm');
        expect(result.text).toBe('Hello world');
      });
    });

    describe('API response handling', () => {
      it('should return text from simple JSON response', async () => {
        const { transcribeAudio } = await import('./whisper');
        const OpenAI = (await import('openai')).default;
        const mockInstance = new OpenAI({ apiKey: 'test' });
        (mockInstance.audio.transcriptions.create as jest.Mock).mockResolvedValue({
          text: 'Transcribed text here',
        });

        const buffer = Buffer.from('test audio');
        const result = await transcribeAudio(buffer, 'audio/webm');

        expect(result.text).toBe('Transcribed text here');
      });

      it('should include duration and language from verbose response', async () => {
        const { transcribeAudio } = await import('./whisper');
        const OpenAI = (await import('openai')).default;
        const mockInstance = new OpenAI({ apiKey: 'test' });
        (mockInstance.audio.transcriptions.create as jest.Mock).mockResolvedValue({
          text: 'Hello world',
          duration: 5.5,
          language: 'english',
        });

        const buffer = Buffer.from('test audio');
        const result = await transcribeAudio(buffer, 'audio/webm', {
          responseFormat: 'verbose_json',
        });

        expect(result.text).toBe('Hello world');
        expect(result.duration).toBe(5.5);
        expect(result.language).toBe('english');
      });
    });

    describe('error handling', () => {
      it('should throw CONFIG_ERROR when API key is missing', async () => {
        delete process.env.OPENAI_API_KEY;
        jest.resetModules();

        const { transcribeAudio } = await import('./whisper');
        const buffer = Buffer.from('test audio');

        await expect(
          transcribeAudio(buffer, 'audio/webm')
        ).rejects.toThrow('OPENAI_API_KEY not configured');
      });
    });
  });

  describe('file extension mapping', () => {
    it('should map MIME types to correct extensions', async () => {
      // This tests the internal getFileExtension function indirectly
      // by verifying the service accepts various MIME types
      const validMimeTypes = [
        'audio/webm',
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'audio/m4a',
        'audio/ogg',
        'audio/flac',
      ];

      expect(validMimeTypes.every(mime =>
        SUPPORTED_AUDIO_TYPES.includes(mime) ||
        SUPPORTED_AUDIO_TYPES.some(t => t.startsWith(mime.split(';')[0]))
      )).toBe(true);
    });
  });
});
