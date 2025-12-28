import OpenAI, { toFile } from 'openai';

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

export interface TranscriptionOptions {
  /** Language code (e.g., 'en', 'es'). If not specified, Whisper auto-detects. */
  language?: string;
  /** Optional prompt to guide transcription style (max 224 tokens for whisper-1) */
  prompt?: string;
  /** Response format: 'json' | 'text' | 'verbose_json' */
  responseFormat?: 'json' | 'text' | 'verbose_json';
}

// Lazy-initialized OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new WhisperError('OPENAI_API_KEY not configured', 'CONFIG_ERROR');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

/**
 * Supported audio MIME types for Whisper API
 */
export const SUPPORTED_AUDIO_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp3',
  'audio/mpeg',
  'audio/mpga',
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
];

/**
 * Map MIME type to file extension for OpenAI API
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mpga': 'mp3',
    'audio/mp4': 'mp4',
    'audio/m4a': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };

  return mimeToExt[mimeType] || 'webm';
}

/**
 * Validate audio buffer size (max 25MB for Whisper API)
 */
function validateAudioSize(buffer: Buffer): void {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  if (buffer.length > MAX_SIZE) {
    throw new WhisperError(
      `Audio file too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum is 25MB.`,
      'FILE_TOO_LARGE'
    );
  }
}

/**
 * Validate MIME type is supported
 */
function validateMimeType(mimeType: string): void {
  // Normalize MIME type (remove parameters after semicolon for checking)
  const baseMimeType = mimeType.split(';')[0].trim();
  const isSupported = SUPPORTED_AUDIO_TYPES.some(
    (type) => type === mimeType || type.startsWith(baseMimeType)
  );

  if (!isSupported) {
    throw new WhisperError(
      `Unsupported audio format: ${mimeType}. Supported: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, flac`,
      'UNSUPPORTED_FORMAT'
    );
  }
}

/**
 * Transcribe audio buffer to text using OpenAI Whisper API
 *
 * @param audioBuffer - The audio data as a Buffer
 * @param mimeType - The MIME type of the audio (e.g., 'audio/webm')
 * @param options - Optional transcription settings
 * @returns Transcription result with text and optional metadata
 *
 * @example
 * ```ts
 * const buffer = fs.readFileSync('audio.mp3');
 * const result = await transcribeAudio(buffer, 'audio/mp3');
 * console.log(result.text);
 * ```
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  // Validate inputs
  validateAudioSize(audioBuffer);
  validateMimeType(mimeType);

  const client = getOpenAIClient();
  const fileExtension = getFileExtension(mimeType);
  const filename = `audio.${fileExtension}`;

  try {
    // Create file-like object from buffer using OpenAI's toFile helper
    // This enables transcription without filesystem access (serverless-friendly)
    const file = await toFile(audioBuffer, filename, {
      type: mimeType,
    });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: options.language,
      prompt: options.prompt,
      response_format: options.responseFormat || 'json',
    });

    // Handle different response formats
    if (typeof transcription === 'string') {
      return { text: transcription };
    }

    // Type the response properly for verbose_json format
    const response = transcription as {
      text: string;
      duration?: number;
      language?: string;
    };

    return {
      text: response.text,
      duration: response.duration,
      language: response.language,
    };
  } catch (error) {
    if (error instanceof WhisperError) {
      throw error;
    }

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new WhisperError(
          'Rate limit exceeded. Please try again in a moment.',
          'RATE_LIMIT'
        );
      }
      if (error.status === 401) {
        throw new WhisperError(
          'Invalid API key. Please check your OpenAI configuration.',
          'AUTH_ERROR'
        );
      }
      if (error.status === 413) {
        throw new WhisperError(
          'Audio file too large for the API.',
          'FILE_TOO_LARGE'
        );
      }
      throw new WhisperError(
        `API error: ${error.message}`,
        'API_ERROR'
      );
    }

    throw new WhisperError(
      `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'TRANSCRIPTION_FAILED'
    );
  }
}

/**
 * Custom error class for Whisper-related errors
 */
export class WhisperError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WhisperError';
    this.code = code;
  }
}
