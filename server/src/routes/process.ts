/**
 * File & URL Processing Routes
 *
 * Handles:
 * - POST /api/process/file - Process uploaded files (PDF, DOCX, TXT, PPTX)
 * - POST /api/process/url - Extract content from URLs
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import FirecrawlApp from '@mendable/firecrawl-js';
import {
  processFile,
  FileProcessorError,
  SUPPORTED_MIME_TYPES,
  isSupportedMimeType,
} from '../services/fileProcessor';

const router = Router();

// ============================================================
// Multer Configuration for File Uploads
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    if (isSupportedMimeType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Supported: PDF, DOCX, TXT, PPTX`
        )
      );
    }
  },
});

// ============================================================
// Firecrawl Client (lazy-initialized)
// ============================================================

let firecrawlClient: FirecrawlApp | null = null;

function getFirecrawlClient(): FirecrawlApp {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  if (!firecrawlClient) {
    firecrawlClient = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }

  return firecrawlClient;
}

// ============================================================
// POST /api/process/file - Process Uploaded Files
// ============================================================

/**
 * Process an uploaded file and extract its content
 *
 * Request: multipart/form-data
 * - file: File (required) - The file to process
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     type: 'text' | 'document',
 *     text?: string,           // For DOCX, TXT, PPTX
 *     document?: {             // For PDF (Claude direct)
 *       mediaType: string,
 *       base64Data: string,
 *       fileName?: string
 *     },
 *     pageCount?: number,
 *     metadata?: object
 *   }
 * }
 */
router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided. Please upload a file with the field name "file".',
        code: 'NO_FILE',
      });
      return;
    }

    const { buffer, mimetype, originalname, size } = req.file;

    console.log(
      `[Process] Processing file: ${originalname} (${(size / 1024).toFixed(1)}KB, ${mimetype})`
    );

    const result = await processFile(buffer, mimetype, { fileName: originalname });

    // For text results, include a preview
    const preview =
      result.type === 'text' && result.text
        ? result.text.slice(0, 500) + (result.text.length > 500 ? '...' : '')
        : undefined;

    res.json({
      success: true,
      data: {
        ...result,
        fileName: originalname,
        fileSize: size,
        preview,
      },
    });
  } catch (error) {
    console.error('File processing error:', error);

    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          success: false,
          error: 'File too large. Maximum size is 10MB.',
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

    // Handle FileProcessor errors
    if (error instanceof FileProcessorError) {
      const statusCode =
        error.code === 'FILE_TOO_LARGE'
          ? 413
          : error.code === 'UNSUPPORTED_FORMAT'
            ? 415
            : error.code === 'EMPTY_FILE'
              ? 422
              : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    // Handle multer filter errors
    if (error instanceof Error && error.message.includes('Unsupported file type')) {
      res.status(415).json({
        success: false,
        error: error.message,
        code: 'UNSUPPORTED_FORMAT',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to process file',
      code: 'PROCESSING_FAILED',
    });
  }
});

// ============================================================
// POST /api/process/url - Extract Content from URL
// ============================================================

/**
 * Extract text content from a URL
 *
 * Request body (JSON):
 * {
 *   url: string (required) - The URL to extract content from
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     type: 'text',
 *     text: string,
 *     title?: string,
 *     description?: string,
 *     url: string
 *   }
 * }
 */
router.post('/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid URL',
        code: 'INVALID_INPUT',
      });
      return;
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        code: 'INVALID_URL',
      });
      return;
    }

    console.log(`[Process] Extracting content from URL: ${normalizedUrl}`);
    const startTime = Date.now();

    // Use Firecrawl to extract content
    const firecrawl = getFirecrawlClient();

    const document = await firecrawl.scrape(normalizedUrl, {
      formats: ['markdown'],
    });

    const markdown = document.markdown || '';

    if (!markdown.trim()) {
      res.status(422).json({
        success: false,
        error: 'No content could be extracted from this URL',
        code: 'EMPTY_CONTENT',
      });
      return;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Process] URL extraction completed in ${duration}ms, ${markdown.length} chars`
    );

    // Clean up the markdown - remove excessive whitespace
    const cleanedText = markdown
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .trim();

    res.json({
      success: true,
      data: {
        type: 'text' as const,
        text: cleanedText,
        title: document.metadata?.title || null,
        description: document.metadata?.description || null,
        url: normalizedUrl,
        preview: cleanedText.slice(0, 500) + (cleanedText.length > 500 ? '...' : ''),
      },
    });
  } catch (error) {
    console.error('URL processing error:', error);

    if (error instanceof Error && error.message.includes('FIRECRAWL_API_KEY')) {
      res.status(503).json({
        success: false,
        error: 'URL extraction service not configured',
        code: 'CONFIG_ERROR',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract content from URL',
      code: 'EXTRACTION_FAILED',
    });
  }
});

// ============================================================
// GET /api/process/supported-types - List Supported File Types
// ============================================================

router.get('/supported-types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      mimeTypes: Object.keys(SUPPORTED_MIME_TYPES),
      extensions: Object.values(SUPPORTED_MIME_TYPES),
      maxSizeBytes: 10 * 1024 * 1024,
      maxSizeMB: 10,
    },
  });
});

export default router;
