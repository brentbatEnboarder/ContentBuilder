import JSZip from 'jszip';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  AlignmentType,
} from 'docx';
import type { ContentBlock } from '@/types/content';

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length
}

/**
 * Extract image data from a base64 data URL or fetch from URL
 */
async function getImageBlob(imageUrl: string): Promise<{ blob: Blob; extension: string } | null> {
  try {
    if (imageUrl.startsWith('data:')) {
      // Base64 data URL - extract the data
      const [header, base64Data] = imageUrl.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const extension = mimeType.split('/')[1] || 'png';

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      return { blob, extension };
    } else {
      // Remote URL - fetch it
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const blob = await response.blob();
      const mimeType = blob.type || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';

      return { blob, extension };
    }
  } catch (error) {
    console.error('Failed to get image blob:', error);
    return null;
  }
}

/**
 * Download a single file
 */
function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extract text content from content blocks
 */
function extractMarkdownContent(blocks: ContentBlock[]): string {
  return blocks
    .filter((block): block is ContentBlock & { type: 'text' } => block.type === 'text')
    .map((block) => block.content)
    .join('\n\n');
}

/**
 * Extract image blocks from content blocks
 */
function extractImageBlocks(blocks: ContentBlock[]): Array<ContentBlock & { type: 'image' }> {
  return blocks.filter(
    (block): block is ContentBlock & { type: 'image' } => block.type === 'image'
  );
}

/**
 * Download content as Markdown file
 */
export function downloadAsMarkdown(blocks: ContentBlock[], pageTitle: string): void {
  const content = extractMarkdownContent(blocks);
  const filename = `${sanitizeFilename(pageTitle || 'content')}.md`;
  downloadFile(content, filename, 'text/markdown');
}

/**
 * Download only images as ZIP
 */
export async function downloadImagesAsZip(
  blocks: ContentBlock[],
  pageTitle: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const imageBlocks = extractImageBlocks(blocks);

  if (imageBlocks.length === 0) {
    throw new Error('No images to download');
  }

  const zip = new JSZip();
  const imagesFolder = zip.folder('images');

  if (!imagesFolder) {
    throw new Error('Failed to create images folder');
  }

  let processed = 0;
  const total = imageBlocks.length;

  for (const block of imageBlocks) {
    const imageData = await getImageBlob(block.imageUrl);
    if (imageData) {
      const imageName = `${block.placementType}_${block.id}.${imageData.extension}`;
      imagesFolder.file(imageName, imageData.blob);
    }
    processed++;
    onProgress?.(Math.round((processed / total) * 100));
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${sanitizeFilename(pageTitle || 'images')}_images.zip`;
  downloadFile(zipBlob, filename, 'application/zip');
}

/**
 * Download all content (markdown + images) as ZIP
 */
export async function downloadAllAsZip(
  blocks: ContentBlock[],
  pageTitle: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const zip = new JSZip();
  const sanitizedTitle = sanitizeFilename(pageTitle || 'content');

  // Add markdown content
  const markdownContent = extractMarkdownContent(blocks);
  if (markdownContent) {
    zip.file(`${sanitizedTitle}.md`, markdownContent);
  }

  // Add images
  const imageBlocks = extractImageBlocks(blocks);

  if (imageBlocks.length > 0) {
    const imagesFolder = zip.folder('images');

    if (imagesFolder) {
      let processed = 0;
      const total = imageBlocks.length;

      for (const block of imageBlocks) {
        const imageData = await getImageBlob(block.imageUrl);
        if (imageData) {
          const imageName = `${block.placementType}_${block.id}.${imageData.extension}`;
          imagesFolder.file(imageName, imageData.blob);
        }
        processed++;
        onProgress?.(Math.round((processed / (total + 1)) * 100)); // +1 for markdown
      }
    }
  }

  onProgress?.(100);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `${sanitizedTitle}.zip`;
  downloadFile(zipBlob, filename, 'application/zip');
}

/**
 * Convert base64 data URL to Uint8Array for docx ImageRun
 */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64Data = dataUrl.split(',')[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parse inline markdown formatting (bold, italic) into TextRuns
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];

  // Regex to match bold (**text** or __text__) and italic (*text* or _text_)
  // Process in order: bold first, then italic
  const boldItalicRegex = /(\*\*\*|___)(.+?)\1|(\*\*|__)(.+?)\3|(\*|_)(.+?)\5/g;

  let lastIndex = 0;
  let match;

  while ((match = boldItalicRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
    }

    // Determine formatting
    if (match[1]) {
      // Bold + Italic (*** or ___)
      runs.push(new TextRun({ text: match[2], bold: true, italics: true }));
    } else if (match[3]) {
      // Bold (** or __)
      runs.push(new TextRun({ text: match[4], bold: true }));
    } else if (match[5]) {
      // Italic (* or _)
      runs.push(new TextRun({ text: match[6], italics: true }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex) }));
  }

  // If no formatting found, return the whole text
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return runs;
}

/**
 * Parse markdown content into docx paragraphs
 */
function parseMarkdownToParagraphs(markdown: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const lines = markdown.split('\n');

  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      listItems.forEach((item) => {
        paragraphs.push(
          new Paragraph({
            children: parseInlineFormatting(item),
            bullet: { level: 0 },
          })
        );
      });
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines (but flush lists)
    if (!trimmedLine) {
      flushList();
      continue;
    }

    // Check for headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];

      const headingLevel = level === 1 ? HeadingLevel.HEADING_1
        : level === 2 ? HeadingLevel.HEADING_2
        : level === 3 ? HeadingLevel.HEADING_3
        : level === 4 ? HeadingLevel.HEADING_4
        : level === 5 ? HeadingLevel.HEADING_5
        : HeadingLevel.HEADING_6;

      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          heading: headingLevel,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }

    // Check for unordered list items
    const ulMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      listItems.push(ulMatch[1]);
      continue;
    }

    // Check for ordered list items
    const olMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      listItems.push(olMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    paragraphs.push(
      new Paragraph({
        children: parseInlineFormatting(trimmedLine),
        spacing: { after: 200 },
      })
    );
  }

  // Flush any remaining list items
  flushList();

  return paragraphs;
}

/**
 * Get image dimensions based on aspect ratio
 * Returns width and height in EMUs (English Metric Units) - Word's internal unit
 * 1 inch = 914400 EMUs
 * Max width ~6 inches for letter paper with margins
 * Max height ~8 inches to leave room for page content
 */
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  const emuPerInch = 914400;
  const maxWidthInches = 6;
  const maxHeightInches = 8;
  const maxWidthEMU = maxWidthInches * emuPerInch;
  const maxHeightEMU = maxHeightInches * emuPerInch;

  const ratioMap: Record<string, number> = {
    '21:9': 21 / 9,
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '3:2': 3 / 2,
    '1:1': 1,
    '9:16': 9 / 16,
  };

  const ratio = ratioMap[aspectRatio] || 16 / 9;

  let width: number;
  let height: number;

  if (ratio >= 1) {
    // Landscape or square: constrain by width
    width = maxWidthEMU;
    height = Math.round(width / ratio);

    // If height exceeds max, scale down
    if (height > maxHeightEMU) {
      height = maxHeightEMU;
      width = Math.round(height * ratio);
    }
  } else {
    // Portrait: constrain by height first to prevent distortion
    height = maxHeightEMU;
    width = Math.round(height * ratio);

    // If width exceeds max, scale down
    if (width > maxWidthEMU) {
      width = maxWidthEMU;
      height = Math.round(width / ratio);
    }
  }

  return { width, height };
}

/**
 * Download content as Word document (.docx)
 */
export async function downloadAsWord(
  blocks: ContentBlock[],
  pageTitle: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const children: Paragraph[] = [];

  // Add title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: pageTitle || 'Untitled', bold: true, size: 48 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  let processed = 0;
  const total = blocks.length;

  for (const block of blocks) {
    if (block.type === 'text') {
      // Parse markdown and add paragraphs
      const textParagraphs = parseMarkdownToParagraphs(block.content);
      children.push(...textParagraphs);
    } else if (block.type === 'image') {
      try {
        // Convert image to Uint8Array
        const imageData = base64ToUint8Array(block.imageUrl);
        const dimensions = getImageDimensions(block.aspectRatio);

        // Add image paragraph
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageData,
                transformation: {
                  width: dimensions.width / 9525, // Convert EMU to points
                  height: dimensions.height / 9525,
                },
                type: 'png',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );

        // Add alt text caption if present
        if (block.altText) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: block.altText, italics: true, size: 20 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            })
          );
        }
      } catch (error) {
        console.error('Failed to add image to Word document:', error);
        // Add placeholder text for failed image
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '[Image could not be embedded]', italics: true })],
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

    processed++;
    onProgress?.(Math.round((processed / total) * 100));
  }

  // Create the document
  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(pageTitle || 'content')}.docx`;
  downloadFile(blob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/**
 * Legacy support: Create content blocks from text and image URLs
 */
export function createBlocksFromLegacyContent(
  text: string,
  images: string[]
): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  if (text) {
    blocks.push({
      type: 'text',
      id: 'text-main',
      content: text,
    });
  }

  images.forEach((imageUrl, index) => {
    blocks.push({
      type: 'image',
      id: `img-${index}`,
      imageUrl,
      aspectRatio: '16:9',
      placementType: 'body',
    });
  });

  return blocks;
}
