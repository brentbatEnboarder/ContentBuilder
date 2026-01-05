import { GoogleGenAI } from '@google/genai';

// Nano Banana Pro model - Google's advanced image generation model
// See: https://ai.google.dev/gemini-api/docs/image-generation
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

// Types for image generation
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface GenerateImagesRequest {
  contentSummary: string;
  styleId: string;
  customPrompt?: string;
  brandColors?: BrandColors;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
  count?: number; // Number of images to generate (default: 3)
}

export interface GeneratedImage {
  id: string;
  base64Data: string;
  mimeType: string;
  prompt: string;
}

export interface GenerateImagesResult {
  images: GeneratedImage[];
  styleId: string;
  promptUsed: string;
}

/**
 * Style-to-prompt mappings for image generation
 * Each style has a detailed prompt that captures the visual aesthetic
 */
export const styleToPrompt: Record<string, string> = {
  corporate:
    'Professional corporate photography style. ' +
    'Business professionals in contemporary attire. Sharp focus, high quality, polished aesthetic. ' +
    'Suitable for enterprise communications and business presentations.',

  flat:
    'Flat illustration style with bold, solid colors and clean geometric shapes. ' +
    'Minimalist design with no gradients or shadows. Simple, friendly characters with expressive poses. ' +
    'Modern vector art aesthetic, suitable for tech and startup branding.',

  isometric:
    'Isometric 3D illustration style with precise geometric perspective. ' +
    'Clean lines, vibrant colors, and playful depth. Objects and scenes rendered from a 45-degree angle. ' +
    'Technical yet approachable aesthetic, perfect for explaining concepts and processes.',

  abstract:
    'Abstract geometric art with dynamic shapes and bold color combinations. ' +
    'Modern art aesthetic with intentional asymmetry. ' +
    'Energetic and creative visual style suitable for innovation and creativity themes.',

  handdrawn:
    'Hand-drawn sketch style with organic, imperfect lines. ' +
    'Warm, approachable aesthetic like notebook doodles or whiteboard illustrations. ' +
    'Casual and friendly feel with slight texture and pencil-like strokes.',

  photorealistic:
    'Photorealistic high-resolution image with exceptional detail and natural lighting. ' +
    'Lifelike textures, accurate shadows, and professional composition. ' +
    'Suitable for product showcases and realistic scene depictions.',

  minimalist:
    'Minimalist design with maximum negative space and essential elements only. ' +
    'Clean, uncluttered composition with subtle color palette. ' +
    'Elegant simplicity that focuses attention on key subjects.',

  warm:
    'Warm and friendly illustration style with soft, inviting colors. ' +
    'Gentle gradients, rounded shapes, and approachable characters. ' +
    'Cozy aesthetic with pastel tones and welcoming atmosphere. ' +
    'Perfect for human-centered content and emotional storytelling.',
};

// Lazy-initialized Gemini client
let genaiClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI {
  if (!process.env.GOOGLE_API_KEY) {
    throw new ImageGenError('GOOGLE_API_KEY not configured', 'CONFIG_ERROR');
  }

  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  return genaiClient;
}

/**
 * Build the complete image prompt from content, style, brand colors, and custom additions
 */
export function buildImagePrompt(
  contentSummary: string,
  styleId: string,
  brandColors?: BrandColors,
  customPrompt?: string
): string {
  const stylePrompt = styleToPrompt[styleId] || styleToPrompt.flat;

  let prompt = `Create an image for the following content:\n\n"${contentSummary}"\n\n`;
  prompt += `Visual Style: ${stylePrompt}\n\n`;

  if (brandColors) {
    prompt += `Brand Colors: Use these colors as the primary palette:\n`;
    prompt += `- Primary: ${brandColors.primary}\n`;
    if (brandColors.secondary) {
      prompt += `- Secondary: ${brandColors.secondary}\n`;
    }
    if (brandColors.accent) {
      prompt += `- Accent: ${brandColors.accent}\n`;
    }
    prompt += '\n';
  }

  if (customPrompt && customPrompt.trim()) {
    prompt += `Additional requirements: ${customPrompt.trim()}\n\n`;
  }

  prompt +=
    'The image should be suitable for professional employee communications ' +
    '(onboarding, internal announcements, etc.). ' +
    'Ensure the image is appropriate for a workplace context.';

  return prompt;
}

/**
 * Generate a unique ID for images
 */
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a single image variation
 * Internal helper for parallel generation
 */
async function generateSingleVariation(
  client: GoogleGenAI,
  prompt: string,
  variationIndex: number,
  totalCount: number,
  aspectRatio: string
): Promise<GeneratedImage> {
  // Add variation instruction for non-first images
  const variedPrompt =
    variationIndex === 0
      ? prompt
      : `${prompt}\n\nThis is variation ${variationIndex + 1} of ${totalCount}. Create a distinctly different composition while maintaining the same style and theme.`;

  console.log(`[ImageGen] Starting image ${variationIndex + 1}/${totalCount}...`);
  const startTime = Date.now();

  const response = await client.models.generateContent({
    model: IMAGE_MODEL,
    contents: variedPrompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: '1K',
      },
    },
  });

  // Extract image from response
  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new ImageGenError(
      `No content in response for image ${variationIndex + 1}`,
      'INVALID_RESPONSE'
    );
  }

  // Find the image part in the response
  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      const duration = Date.now() - startTime;
      console.log(`[ImageGen] Completed image ${variationIndex + 1}/${totalCount} in ${duration}ms`);
      return {
        id: generateImageId(),
        base64Data: part.inlineData.data as string,
        mimeType: part.inlineData.mimeType || 'image/png',
        prompt: variedPrompt,
      };
    }
  }

  throw new ImageGenError(
    `No image data in response for image ${variationIndex + 1}`,
    'INVALID_RESPONSE'
  );
}

/**
 * Generate images using Gemini's image generation API (Nano Banana)
 * Now generates all variations in parallel for faster results
 */
export async function generateImages(
  request: GenerateImagesRequest
): Promise<GenerateImagesResult> {
  const client = getGenAIClient();
  const count = request.count || 3;
  const aspectRatio = request.aspectRatio || '16:9';

  const prompt = buildImagePrompt(
    request.contentSummary,
    request.styleId,
    request.brandColors,
    request.customPrompt
  );

  console.log('[ImageGen] Base prompt:');
  console.log('─'.repeat(60));
  console.log(prompt);
  console.log('─'.repeat(60));
  console.log(`[ImageGen] Generating ${count} images in PARALLEL...`);
  const overallStartTime = Date.now();

  try {
    // Generate all variations in parallel using Promise.all
    const imagePromises = Array.from({ length: count }, (_, i) =>
      generateSingleVariation(client, prompt, i, count, aspectRatio)
    );

    // Wait for all images to complete (or fail)
    const results = await Promise.allSettled(imagePromises);

    // Collect successful images
    const images: GeneratedImage[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        images.push(result.value);
      } else {
        const errorMsg = result.reason instanceof Error
          ? result.reason.message
          : 'Unknown error';
        errors.push(`Image ${index + 1}: ${errorMsg}`);
        console.error(`[ImageGen] Failed to generate image ${index + 1}:`, errorMsg);
      }
    });

    const overallDuration = Date.now() - overallStartTime;
    console.log(`[ImageGen] Completed ${images.length}/${count} images in ${overallDuration}ms (parallel)`);

    if (images.length === 0) {
      throw new ImageGenError(
        `No images were generated. Errors: ${errors.join('; ')}`,
        'GENERATION_FAILED'
      );
    }

    return {
      images,
      styleId: request.styleId,
      promptUsed: prompt,
    };
  } catch (error) {
    if (error instanceof ImageGenError) {
      throw error;
    }

    // Handle specific API errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      throw new ImageGenError(
        'Rate limit exceeded. Please try again in a moment.',
        'RATE_LIMIT'
      );
    }

    if (errorMessage.includes('401') || errorMessage.includes('auth')) {
      throw new ImageGenError(
        'Invalid API key. Please check your configuration.',
        'AUTH_ERROR'
      );
    }

    if (
      errorMessage.includes('safety') ||
      errorMessage.includes('blocked') ||
      errorMessage.includes('inappropriate')
    ) {
      throw new ImageGenError(
        'Image generation was blocked due to content safety filters. Please try a different prompt.',
        'CONTENT_FILTERED'
      );
    }

    throw new ImageGenError(
      `Failed to generate images: ${errorMessage}`,
      'GENERATION_FAILED'
    );
  }
}

/**
 * Streaming image event types for SSE
 */
export interface ImageStreamEvent {
  type: 'image' | 'complete' | 'error';
  variationIndex?: number;
  totalCount?: number;
  image?: GeneratedImage;
  error?: string;
  duration?: number;
}

/**
 * Generate images with streaming - yields each image as it completes
 * Uses a queue-based approach to avoid Promise.race index tracking issues
 */
export async function* generateImagesStreaming(
  request: GenerateImagesRequest
): AsyncGenerator<ImageStreamEvent> {
  const client = getGenAIClient();
  const count = request.count || 3;
  const aspectRatio = request.aspectRatio || '16:9';

  const prompt = buildImagePrompt(
    request.contentSummary,
    request.styleId,
    request.brandColors,
    request.customPrompt
  );

  console.log('[ImageGen] Streaming mode - Base prompt:');
  console.log('─'.repeat(60));
  console.log(prompt);
  console.log('─'.repeat(60));
  console.log(`[ImageGen] Generating ${count} images in PARALLEL with streaming...`);
  const overallStartTime = Date.now();

  // Use a queue-based approach: each promise pushes its result to a queue when done
  // This avoids the Promise.race index tracking issues
  type QueueItem = { index: number; image: GeneratedImage | null; error: string | null };
  const resultQueue: QueueItem[] = [];
  let resolveWaiting: (() => void) | null = null;

  // Track completion
  const yieldedIndices = new Set<number>();
  let completedCount = 0;

  // Start all image generations in parallel
  // Each one pushes to the queue when done
  const imagePromises = Array.from({ length: count }, async (_, i) => {
    try {
      console.log(`[ImageGen] Starting variation ${i + 1}/${count}...`);
      const image = await generateSingleVariation(client, prompt, i, count, aspectRatio);
      resultQueue.push({ index: i, image, error: null });
      console.log(`[ImageGen] Variation ${i + 1}/${count} completed, queued for streaming`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      resultQueue.push({ index: i, image: null, error: errorMsg });
      console.error(`[ImageGen] Variation ${i + 1}/${count} failed:`, errorMsg);
    }
    // Notify the generator that a result is available
    if (resolveWaiting) {
      resolveWaiting();
      resolveWaiting = null;
    }
  });

  // Yield results as they arrive in the queue
  while (completedCount < count) {
    // Wait for a result if queue is empty
    while (resultQueue.length === 0) {
      await new Promise<void>((resolve) => {
        resolveWaiting = resolve;
      });
    }

    // Process all available results
    while (resultQueue.length > 0) {
      const result = resultQueue.shift()!;
      completedCount++;

      if (result.image) {
        yieldedIndices.add(result.index);
        console.log(`[ImageGen] Yielding image ${result.index + 1}/${count}`);
        yield {
          type: 'image',
          variationIndex: result.index,
          totalCount: count,
          image: result.image,
        };
      } else {
        console.error(`[ImageGen] Yielding error for image ${result.index + 1}/${count}:`, result.error);
        yield {
          type: 'error',
          variationIndex: result.index,
          totalCount: count,
          error: result.error || 'Image generation failed',
        };
      }
    }
  }

  // Wait for all promises to complete (they should all be done by now)
  await Promise.allSettled(imagePromises);

  const overallDuration = Date.now() - overallStartTime;
  console.log(`[ImageGen] Streaming complete: ${yieldedIndices.size}/${count} images in ${overallDuration}ms`);

  yield {
    type: 'complete',
    totalCount: count,
    duration: overallDuration,
  };
}

/**
 * Regenerate a single image with an optional modified prompt
 */
export async function regenerateSingleImage(
  originalPrompt: string,
  modifiedPrompt?: string,
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:2' = '16:9'
): Promise<GeneratedImage> {
  const client = getGenAIClient();

  const prompt = modifiedPrompt || originalPrompt;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Nano Banana Pro - advanced professional image generation
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '2K',
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new ImageGenError('No content in response', 'INVALID_RESPONSE');
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return {
          id: generateImageId(),
          base64Data: part.inlineData.data as string,
          mimeType: part.inlineData.mimeType || 'image/png',
          prompt,
        };
      }
    }

    throw new ImageGenError('No image in response', 'INVALID_RESPONSE');
  } catch (error) {
    if (error instanceof ImageGenError) {
      throw error;
    }

    throw new ImageGenError(
      `Failed to regenerate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'REGENERATION_FAILED'
    );
  }
}

/**
 * Edit an image using a reference image and an edit prompt
 * Uses Gemini's vision capabilities to understand the reference and generate a modified version
 */
export async function editImageWithReference(
  referenceImageBase64: string,
  editPrompt: string,
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:2' | '21:9' | '9:16' = '16:9',
  placementType: 'header' | 'body' | 'footer' = 'body'
): Promise<GeneratedImage> {
  const client = getGenAIClient();

  // Build the edit prompt with context
  const fullPrompt = `Based on the reference image provided, create a new image with the following modifications:

${editPrompt}

Important guidelines:
- Maintain the overall theme and context of the original image
- Apply the requested modifications while keeping the image professional
- The image should be suitable for workplace communications
- This is a ${placementType} image, so adjust the composition appropriately`;

  console.log('[ImageGen] Edit prompt:');
  console.log('─'.repeat(60));
  console.log(fullPrompt);
  console.log('─'.repeat(60));

  try {
    // Gemini's native image editing: pass reference image with edit instructions
    const response = await client.models.generateContent({
      model: IMAGE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: fullPrompt,
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: referenceImageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '1K',
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new ImageGenError('No content in edit response', 'INVALID_RESPONSE');
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return {
          id: generateImageId(),
          base64Data: part.inlineData.data as string,
          mimeType: part.inlineData.mimeType || 'image/png',
          prompt: editPrompt,
        };
      }
    }

    throw new ImageGenError('No image in edit response', 'INVALID_RESPONSE');
  } catch (error) {
    if (error instanceof ImageGenError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
      throw new ImageGenError(
        'Image editing was blocked due to content safety filters. Please try a different prompt.',
        'CONTENT_FILTERED'
      );
    }

    throw new ImageGenError(
      `Failed to edit image: ${errorMessage}`,
      'EDIT_FAILED'
    );
  }
}

/**
 * Custom error class for image generation errors
 */
export class ImageGenError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ImageGenError';
    this.code = code;
  }
}
