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
    'Professional corporate photography style. Clean, modern office environment with natural lighting. ' +
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
    'Overlapping circles, triangles, and organic forms. Modern art aesthetic with intentional asymmetry. ' +
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
 * Generate images using Gemini's image generation API (Nano Banana)
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

  const images: GeneratedImage[] = [];

  try {
    // Generate multiple images (each API call generates one image)
    // We generate them sequentially to avoid rate limiting
    for (let i = 0; i < count; i++) {
      // Add variation to each image prompt
      const variedPrompt =
        i === 0
          ? prompt
          : `${prompt}\n\nThis is variation ${i + 1} of ${count}. Create a distinctly different composition while maintaining the same style and theme.`;

      const response = await client.models.generateContent({
        model: IMAGE_MODEL,
        contents: variedPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: '2K',
          },
        },
      });

      // Extract image from response
      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new ImageGenError(
          `No content in response for image ${i + 1}`,
          'INVALID_RESPONSE'
        );
      }

      // Find the image part in the response
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          images.push({
            id: generateImageId(),
            base64Data: part.inlineData.data as string,
            mimeType: part.inlineData.mimeType || 'image/png',
            prompt: variedPrompt,
          });
          break;
        }
      }
    }

    if (images.length === 0) {
      throw new ImageGenError(
        'No images were generated',
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
