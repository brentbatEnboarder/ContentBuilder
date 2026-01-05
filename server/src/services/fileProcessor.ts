/**
 * File Processing Service
 *
 * Handles extraction of text content from various file formats:
 * - PDF: Returns base64 data for Claude to read directly (no extraction needed)
 * - DOCX: Uses mammoth for Word document parsing
 * - TXT: Direct text extraction with encoding detection
 * - PPTX: Extracts text from PowerPoint XML structure
 * - XLSX: Converts spreadsheets to markdown tables
 */

import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// ============================================================
// Types & Interfaces
// ============================================================

/**
 * Result from processing a file
 * Either contains extracted text OR document data for direct LLM consumption
 */
export interface ProcessedFile {
  /** The type of result */
  type: 'text' | 'document';
  /** Extracted text content (for DOCX, TXT, PPTX, XLSX) */
  text?: string;
  /** Document data for direct LLM consumption (for PDF) */
  document?: {
    mediaType: string;
    base64Data: string;
    fileName?: string;
  };
  /** Number of pages/slides if applicable */
  pageCount?: number;
  /** Additional metadata */
  metadata?: Record<string, string>;
  /** True if content was truncated due to length */
  wasTruncated?: boolean;
  /** Original character count before truncation */
  originalLength?: number;
}

export interface ProcessFileOptions {
  /** Original filename (used for PDFs sent to Claude) */
  fileName?: string;
}

export type FileProcessorErrorCode =
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'PROCESSING_FAILED';

export class FileProcessorError extends Error {
  constructor(
    message: string,
    public code: FileProcessorErrorCode,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FileProcessorError';
  }
}

// Supported MIME types
export const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/markdown': 'txt', // Markdown files use same processor as plain text
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
} as const;

export type SupportedMimeType = keyof typeof SUPPORTED_MIME_TYPES;

// Max file size: 10MB (Claude's limit for documents is 32MB, but we'll keep 10MB for UX)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================
// PDF Processing (Claude Direct)
// ============================================================

/**
 * Process PDF for direct Claude consumption
 * Instead of extracting text, we return base64 data for Claude to read natively
 * Claude can see the actual formatting, layout, and even images in the PDF
 */
export async function processPDF(
  buffer: Buffer,
  options: ProcessFileOptions = {}
): Promise<ProcessedFile> {
  // Convert to base64 for Claude's document API
  const base64Data = buffer.toString('base64');

  return {
    type: 'document',
    document: {
      mediaType: 'application/pdf',
      base64Data,
      fileName: options.fileName,
    },
    metadata: {
      sizeBytes: String(buffer.length),
      sizeKB: String((buffer.length / 1024).toFixed(1)),
    },
  };
}

// ============================================================
// DOCX Processing (mammoth)
// ============================================================

/**
 * Process DOCX using mammoth library
 * Extracts raw text content from Word documents
 */
export async function processDOCX(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value.trim();

    if (!text) {
      throw new FileProcessorError(
        'DOCX document appears to be empty',
        'EMPTY_FILE'
      );
    }

    // Log any warnings (e.g., unsupported features)
    if (result.messages.length > 0) {
      console.log(
        '[FileProcessor] DOCX warnings:',
        result.messages.map((m) => m.message).join(', ')
      );
    }

    const warnings = result.messages.map((m) => m.message).join('; ');
    return {
      type: 'text',
      text,
      metadata: warnings ? { warnings } : undefined,
    };
  } catch (error) {
    if (error instanceof FileProcessorError) {
      throw error;
    }

    console.error('DOCX processing error:', error);
    throw new FileProcessorError(
      `Failed to process DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PROCESSING_FAILED',
      error
    );
  }
}

// ============================================================
// TXT Processing
// ============================================================

/**
 * Process plain text files
 * Handles UTF-8 and attempts to detect other encodings
 */
export async function processTXT(buffer: Buffer): Promise<ProcessedFile> {
  try {
    // Try UTF-8 first (most common)
    let text = buffer.toString('utf-8');

    // Remove BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    text = text.trim();

    if (!text) {
      throw new FileProcessorError('Text file appears to be empty', 'EMPTY_FILE');
    }

    return {
      type: 'text',
      text,
      metadata: {
        encoding: 'utf-8',
        byteLength: String(buffer.length),
      },
    };
  } catch (error) {
    if (error instanceof FileProcessorError) {
      throw error;
    }

    console.error('TXT processing error:', error);
    throw new FileProcessorError(
      `Failed to process TXT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PROCESSING_FAILED',
      error
    );
  }
}

// ============================================================
// PPTX Processing
// ============================================================

/**
 * Process PPTX by extracting text from XML slides
 * PPTX files are ZIP archives containing XML content
 */
export async function processPPTX(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const zip = await JSZip.loadAsync(buffer);

    const textParts: string[] = [];
    let slideCount = 0;

    // Find all slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        // Sort numerically by slide number
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    for (const slidePath of slideFiles) {
      const slideXml = await zip.files[slidePath].async('string');
      const slideText = extractTextFromPptxXml(slideXml);

      if (slideText.trim()) {
        slideCount++;
        textParts.push(`--- Slide ${slideCount} ---\n${slideText.trim()}`);
      }
    }

    // Also extract from slide notes if present
    const noteFiles = Object.keys(zip.files).filter((name) =>
      name.match(/^ppt\/notesSlides\/notesSlide\d+\.xml$/)
    );

    if (noteFiles.length > 0) {
      const noteTexts: string[] = [];

      for (const notePath of noteFiles) {
        const noteXml = await zip.files[notePath].async('string');
        const noteText = extractTextFromPptxXml(noteXml);
        if (noteText.trim()) {
          noteTexts.push(noteText.trim());
        }
      }

      if (noteTexts.length > 0) {
        textParts.push('\n--- Speaker Notes ---\n' + noteTexts.join('\n\n'));
      }
    }

    const text = textParts.join('\n\n');

    if (!text.trim()) {
      throw new FileProcessorError(
        'PPTX presentation appears to be empty or contains only images',
        'EMPTY_FILE'
      );
    }

    return {
      type: 'text',
      text: text.trim(),
      pageCount: slideCount,
      metadata: {
        slideCount: String(slideCount),
        hasNotes: String(noteFiles.length > 0),
      },
    };
  } catch (error) {
    if (error instanceof FileProcessorError) {
      throw error;
    }

    console.error('PPTX processing error:', error);
    throw new FileProcessorError(
      `Failed to process PPTX: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PROCESSING_FAILED',
      error
    );
  }
}

/**
 * Extract text content from PPTX XML
 * Looks for <a:t> elements which contain text runs
 */
function extractTextFromPptxXml(xml: string): string {
  const textParts: string[] = [];

  // Match all <a:t>...</a:t> text elements
  const textMatches = xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g);

  for (const match of textMatches) {
    const text = match[1].trim();
    if (text) {
      textParts.push(text);
    }
  }

  // Join with spaces, but detect paragraph breaks
  // In PPTX, <a:p> elements typically indicate paragraphs
  let result = textParts.join(' ');

  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

// ============================================================
// XLSX Processing (SheetJS)
// ============================================================

// Limits for XLSX processing
const XLSX_MAX_ROWS_PER_SHEET = 100;
const XLSX_MAX_COLUMNS = 20;

/**
 * Process XLSX by converting sheets to markdown tables
 * Limits rows and columns to prevent huge context usage
 */
export async function processXLSX(buffer: Buffer): Promise<ProcessedFile> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const textParts: string[] = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];

      // Convert to array of arrays
      const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
      });

      if (data.length === 0) continue;

      // Limit rows and columns
      const limitedData = data.slice(0, XLSX_MAX_ROWS_PER_SHEET);
      const truncatedRows = data.length > XLSX_MAX_ROWS_PER_SHEET;

      // Get headers (first row)
      const headers = (limitedData[0] || []).slice(0, XLSX_MAX_COLUMNS).map(String);
      const truncatedCols = (limitedData[0]?.length || 0) > XLSX_MAX_COLUMNS;

      if (headers.length === 0) continue;

      let tableMarkdown = `### Sheet: ${sheetName}\n\n`;

      // Header row
      tableMarkdown += '| ' + headers.join(' | ') + ' |\n';
      tableMarkdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

      // Data rows
      for (let i = 1; i < limitedData.length; i++) {
        const row = (limitedData[i] || []).slice(0, XLSX_MAX_COLUMNS).map((cell) =>
          String(cell ?? '')
            .replace(/\|/g, '\\|')
            .replace(/\n/g, ' ')
        );
        // Pad row if shorter than headers
        while (row.length < headers.length) row.push('');
        tableMarkdown += '| ' + row.join(' | ') + ' |\n';
        totalRows++;
      }

      // Add truncation notices
      if (truncatedRows || truncatedCols) {
        const notices: string[] = [];
        if (truncatedRows) notices.push(`${data.length - XLSX_MAX_ROWS_PER_SHEET} rows omitted`);
        if (truncatedCols) notices.push(`columns limited to ${XLSX_MAX_COLUMNS}`);
        tableMarkdown += `\n*Note: ${notices.join(', ')}*\n`;
      }

      textParts.push(tableMarkdown);
    }

    const text = textParts.join('\n\n');

    if (!text.trim()) {
      throw new FileProcessorError('XLSX spreadsheet appears to be empty', 'EMPTY_FILE');
    }

    return {
      type: 'text',
      text: text.trim(),
      metadata: {
        sheetCount: String(workbook.SheetNames.length),
        totalDataRows: String(totalRows),
      },
    };
  } catch (error) {
    if (error instanceof FileProcessorError) throw error;

    console.error('XLSX processing error:', error);
    throw new FileProcessorError(
      `Failed to process XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PROCESSING_FAILED',
      error
    );
  }
}

// ============================================================
// Content Truncation
// ============================================================

// Max content size for AI context (about 50K chars)
const MAX_CONTENT_CHARS = 50000;
const TRUNCATION_MESSAGE = '\n\n[... Content truncated due to length ...]';

/**
 * Truncate text content if too long, preserving word boundaries
 */
function truncateContent(text: string): {
  text: string;
  wasTruncated: boolean;
  originalLength: number;
} {
  const originalLength = text.length;

  if (originalLength <= MAX_CONTENT_CHARS) {
    return { text, wasTruncated: false, originalLength };
  }

  // Find last space before the limit to avoid cutting words
  let truncateAt = MAX_CONTENT_CHARS - TRUNCATION_MESSAGE.length;
  const lastSpace = text.lastIndexOf(' ', truncateAt);
  if (lastSpace > truncateAt - 1000) {
    truncateAt = lastSpace;
  }

  return {
    text: text.slice(0, truncateAt) + TRUNCATION_MESSAGE,
    wasTruncated: true,
    originalLength,
  };
}

// ============================================================
// Main Processing Function
// ============================================================

/**
 * Process a file buffer based on its MIME type
 * Routes to the appropriate processor for each file type
 *
 * - PDF: Returns document data for Claude to read directly
 * - DOCX/TXT/PPTX: Returns extracted text
 */
export async function processFile(
  buffer: Buffer,
  mimeType: string,
  options: ProcessFileOptions = {}
): Promise<ProcessedFile> {
  // Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new FileProcessorError(
      `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Validate empty file
  if (buffer.length === 0) {
    throw new FileProcessorError('File is empty', 'EMPTY_FILE');
  }

  // Route to appropriate processor
  const fileType = SUPPORTED_MIME_TYPES[mimeType as SupportedMimeType];

  if (!fileType) {
    throw new FileProcessorError(
      `Unsupported file type: ${mimeType}. Supported types: PDF, DOCX, TXT, PPTX, XLSX`,
      'UNSUPPORTED_FORMAT'
    );
  }

  console.log(
    `[FileProcessor] Processing ${fileType.toUpperCase()} file (${(buffer.length / 1024).toFixed(1)}KB)`
  );
  const startTime = Date.now();

  let result: ProcessedFile;

  switch (fileType) {
    case 'pdf':
      result = await processPDF(buffer, options);
      break;
    case 'docx':
      result = await processDOCX(buffer);
      break;
    case 'txt':
      result = await processTXT(buffer);
      break;
    case 'pptx':
      result = await processPPTX(buffer);
      break;
    case 'xlsx':
      result = await processXLSX(buffer);
      break;
    default:
      throw new FileProcessorError(
        `No processor available for type: ${fileType}`,
        'UNSUPPORTED_FORMAT'
      );
  }

  // Apply truncation for text results to stay within AI context limits
  if (result.type === 'text' && result.text) {
    const { text, wasTruncated, originalLength } = truncateContent(result.text);
    result.text = text;
    result.wasTruncated = wasTruncated;
    result.originalLength = originalLength;

    if (wasTruncated) {
      console.log(
        `[FileProcessor] Content truncated: ${originalLength.toLocaleString()} -> ${text.length.toLocaleString()} chars`
      );
    }
  }

  const duration = Date.now() - startTime;
  const sizeInfo =
    result.type === 'text'
      ? `extracted ${result.text?.length || 0} chars${result.wasTruncated ? ' (truncated)' : ''}`
      : `prepared ${(buffer.length / 1024).toFixed(1)}KB for Claude`;
  console.log(`[FileProcessor] Completed in ${duration}ms, ${sizeInfo}`);

  return result;
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in SUPPORTED_MIME_TYPES;
}

/**
 * Get file extension for a MIME type
 */
export function getExtensionForMimeType(mimeType: string): string | null {
  return SUPPORTED_MIME_TYPES[mimeType as SupportedMimeType] || null;
}
