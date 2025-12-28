import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  transcribeAudio,
  WhisperError,
  SUPPORTED_AUDIO_TYPES,
} from '../services/whisper';

const router = Router();

// Configure multer for memory storage (no disk writes, serverless-friendly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max (Whisper API limit)
  },
  fileFilter: (_req, file, cb) => {
    // Validate MIME type
    const isSupported = SUPPORTED_AUDIO_TYPES.some(
      (type) =>
        type === file.mimetype || type.startsWith(file.mimetype.split(';')[0])
    );

    if (!isSupported) {
      cb(
        new Error(
          `Unsupported audio format: ${file.mimetype}. Supported: mp3, mp4, mpeg, m4a, wav, webm, ogg, flac`
        )
      );
      return;
    }

    cb(null, true);
  },
});

/**
 * POST /api/transcribe
 * Transcribe audio to text using OpenAI Whisper
 *
 * Request: multipart/form-data
 * - audio: File (required) - The audio file to transcribe
 * - language: string (optional) - Language code (e.g., 'en', 'es')
 * - prompt: string (optional) - Prompt to guide transcription style
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     text: string,
 *     duration?: number,
 *     language?: string
 *   }
 * }
 */
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    // Check if file was provided
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No audio file provided. Please upload an audio file with the field name "audio".',
        code: 'NO_FILE',
      });
      return;
    }

    const { buffer, mimetype, size } = req.file;
    const { language, prompt } = req.body;

    console.log(
      `[Transcribe] Processing ${(size / 1024).toFixed(1)}KB audio file (${mimetype})`
    );
    const startTime = Date.now();

    const result = await transcribeAudio(buffer, mimetype, {
      language,
      prompt,
      responseFormat: 'verbose_json', // Get duration and language info
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Transcribe] Completed in ${duration}ms, text length: ${result.text.length} chars`
    );

    res.json({
      success: true,
      data: {
        text: result.text,
        duration: result.duration,
        language: result.language,
      },
    });
  } catch (error) {
    console.error('Transcription error:', error);

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          success: false,
          error: 'Audio file too large. Maximum size is 25MB.',
          code: 'FILE_TOO_LARGE',
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: `Upload error: ${error.message}`,
        code: 'UPLOAD_ERROR',
      });
      return;
    }

    // Handle Whisper service errors
    if (error instanceof WhisperError) {
      const statusCode =
        error.code === 'RATE_LIMIT'
          ? 429
          : error.code === 'AUTH_ERROR'
            ? 401
            : error.code === 'CONFIG_ERROR'
              ? 503
              : error.code === 'FILE_TOO_LARGE'
                ? 413
                : error.code === 'UNSUPPORTED_FORMAT'
                  ? 415
                  : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    // Handle multer filter errors (custom error messages)
    if (error instanceof Error && error.message.includes('Unsupported audio')) {
      res.status(415).json({
        success: false,
        error: error.message,
        code: 'UNSUPPORTED_FORMAT',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      code: 'TRANSCRIPTION_FAILED',
    });
  }
});

/**
 * POST /api/transcribe/base64
 * Transcribe base64-encoded audio to text
 *
 * Request body (JSON):
 * {
 *   audioData: string (required) - Base64-encoded audio data
 *   mimeType: string (required) - MIME type of the audio (e.g., 'audio/webm')
 *   language?: string - Language code
 *   prompt?: string - Prompt to guide transcription
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     text: string,
 *     duration?: number,
 *     language?: string
 *   }
 * }
 */
router.post('/base64', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType, language, prompt } = req.body;

    // Validate required fields
    if (!audioData || typeof audioData !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid audioData. Please provide base64-encoded audio.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    if (!mimeType || typeof mimeType !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid mimeType. Please specify the audio MIME type.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    // Decode base64 to buffer
    const buffer = Buffer.from(audioData, 'base64');

    console.log(
      `[Transcribe] Processing ${(buffer.length / 1024).toFixed(1)}KB base64 audio (${mimeType})`
    );
    const startTime = Date.now();

    const result = await transcribeAudio(buffer, mimeType, {
      language,
      prompt,
      responseFormat: 'verbose_json',
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Transcribe] Completed in ${duration}ms, text length: ${result.text.length} chars`
    );

    res.json({
      success: true,
      data: {
        text: result.text,
        duration: result.duration,
        language: result.language,
      },
    });
  } catch (error) {
    console.error('Base64 transcription error:', error);

    if (error instanceof WhisperError) {
      const statusCode =
        error.code === 'RATE_LIMIT'
          ? 429
          : error.code === 'AUTH_ERROR'
            ? 401
            : error.code === 'CONFIG_ERROR'
              ? 503
              : error.code === 'FILE_TOO_LARGE'
                ? 413
                : error.code === 'UNSUPPORTED_FORMAT'
                  ? 415
                  : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      code: 'TRANSCRIPTION_FAILED',
    });
  }
});

export default router;
