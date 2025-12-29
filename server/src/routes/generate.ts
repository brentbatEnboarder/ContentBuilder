import { Router, Request, Response } from 'express';
import {
  generateContent,
  generateContentStream,
  generateInterviewQuestion,
  generateTitle,
  analyzeContentForImages,
  continueImagePlanning,
  ClaudeError,
  GenerateContentRequest,
  InterviewContext,
  ImagePlanRequest,
  ImageRecommendation,
} from '../services/claude';
import {
  generateImages,
  regenerateSingleImage,
  ImageGenError,
  GenerateImagesRequest,
} from '../services/imageGen';

const router = Router();

/**
 * POST /api/generate/text
 * Generate content using Claude API
 *
 * Request body:
 * {
 *   objective: string,
 *   companyProfile: {
 *     websiteUrl: string,
 *     companyProfile: string,
 *     brandColors: { primary, secondary, accent }
 *   },
 *   voiceSettings: { formality, humor, respect, enthusiasm },
 *   imageStyle?: string,
 *   sourceMaterials?: string[],
 *   feedback?: string,
 *   stream?: boolean
 * }
 */
router.post('/text', async (req: Request, res: Response) => {
  try {
    const {
      objective,
      companyProfile,
      voiceSettings,
      imageStyle,
      sourceMaterials,
      feedback,
      stream = false,
      currentContent,
    } = req.body;

    // Validate required fields
    if (!objective || typeof objective !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid objective',
      });
      return;
    }

    if (!companyProfile || typeof companyProfile !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid companyProfile',
      });
      return;
    }

    if (!voiceSettings || typeof voiceSettings !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid voiceSettings',
      });
      return;
    }

    // Validate voice settings values (0-4)
    const voiceKeys = ['formality', 'humor', 'respect', 'enthusiasm'];
    for (const key of voiceKeys) {
      const value = voiceSettings[key];
      if (typeof value !== 'number' || value < 0 || value > 4) {
        res.status(400).json({
          success: false,
          error: `Invalid voice setting: ${key} must be a number between 0 and 4`,
        });
        return;
      }
    }

    const request: GenerateContentRequest = {
      objective,
      companyProfile: {
        websiteUrl: companyProfile.websiteUrl || '',
        companyProfile: companyProfile.companyProfile || '',
        brandColors: {
          primary: companyProfile.brandColors?.primary || '#7C21CC',
          secondary: companyProfile.brandColors?.secondary || '',
          accent: companyProfile.brandColors?.accent || '',
        },
      },
      voiceSettings: {
        formality: voiceSettings.formality,
        humor: voiceSettings.humor,
        respect: voiceSettings.respect,
        enthusiasm: voiceSettings.enthusiasm,
      },
      imageStyle,
      sourceMaterials,
      feedback,
      currentContent,
    };

    // Handle streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      try {
        for await (const chunk of generateContentStream(request)) {
          // Send SSE format
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        const errorMessage =
          streamError instanceof ClaudeError
            ? streamError.message
            : 'Stream failed';
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
      return;
    }

    // Non-streaming response
    const result = await generateContent(request);

    res.json({
      success: true,
      data: {
        text: result.text,
        tokensUsed: result.tokensUsed,
      },
    });
  } catch (error) {
    console.error('Generate text error:', error);

    if (error instanceof ClaudeError) {
      const statusCode =
        error.code === 'RATE_LIMIT'
          ? 429
          : error.code === 'AUTH_ERROR'
            ? 401
            : error.code === 'CONFIG_ERROR'
              ? 503
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
      error: 'Failed to generate content',
    });
  }
});

/**
 * POST /api/generate/interview
 * Generate AI interview follow-up questions
 *
 * Request body:
 * {
 *   objective: string,
 *   companyProfile: { ... },
 *   voiceSettings: { ... },
 *   conversationHistory: [{ role: 'user' | 'assistant', content: string }]
 * }
 */
router.post('/interview', async (req: Request, res: Response) => {
  try {
    const { objective, companyProfile, voiceSettings, conversationHistory } =
      req.body;

    // Validate required fields
    if (!objective || typeof objective !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid objective',
      });
      return;
    }

    const context: InterviewContext = {
      objective,
      companyProfile: {
        websiteUrl: companyProfile?.websiteUrl || '',
        companyProfile: companyProfile?.companyProfile || '',
        brandColors: {
          primary: companyProfile?.brandColors?.primary || '#7C21CC',
          secondary: companyProfile?.brandColors?.secondary || '',
          accent: companyProfile?.brandColors?.accent || '',
        },
      },
      voiceSettings: voiceSettings || {
        formality: 2,
        humor: 2,
        respect: 2,
        enthusiasm: 2,
      },
      conversationHistory: conversationHistory || [],
    };

    const response = await generateInterviewQuestion(context);

    res.json({
      success: true,
      data: {
        message: response,
      },
    });
  } catch (error) {
    console.error('Interview generation error:', error);

    if (error instanceof ClaudeError) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate interview response',
    });
  }
});

/**
 * POST /api/generate/title
 * Generate a page title from content
 *
 * Request body:
 * {
 *   content: string
 * }
 */
router.post('/title', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid content',
      });
      return;
    }

    const title = await generateTitle(content);

    res.json({
      success: true,
      data: { title },
    });
  } catch (error) {
    console.error('Generate title error:', error);

    if (error instanceof ClaudeError) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate title',
    });
  }
});

/**
 * POST /api/generate/image-plan
 * Analyze content and recommend images
 *
 * Request body:
 * {
 *   content: string,
 *   companyProfile: { websiteUrl, companyProfile, brandColors },
 *   imageStyle: string,
 *   conversationHistory?: [{ role, content }],
 *   currentPlan?: ImageRecommendation[]
 * }
 */
router.post('/image-plan', async (req: Request, res: Response) => {
  try {
    const { content, companyProfile, imageStyle, conversationHistory, currentPlan } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid content',
      });
      return;
    }

    const request: ImagePlanRequest = {
      content,
      companyProfile: companyProfile || {
        websiteUrl: '',
        companyProfile: '',
        brandColors: { primary: '#7C21CC', secondary: '', accent: '' },
      },
      imageStyle: imageStyle || 'corporate',
      conversationHistory,
      currentPlan,
    };

    const result = await analyzeContentForImages(request);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Image plan error:', error);

    if (error instanceof ClaudeError) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to analyze content for images',
    });
  }
});

/**
 * POST /api/generate/image-plan/continue
 * Continue image planning conversation
 *
 * Request body:
 * {
 *   content: string,
 *   companyProfile: { ... },
 *   imageStyle: string,
 *   conversationHistory: [{ role, content }],
 *   currentPlan: ImageRecommendation[],
 *   userMessage: string
 * }
 */
router.post('/image-plan/continue', async (req: Request, res: Response) => {
  try {
    const { content, companyProfile, imageStyle, conversationHistory, currentPlan, userMessage } =
      req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid content',
      });
      return;
    }

    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid userMessage',
      });
      return;
    }

    const result = await continueImagePlanning({
      content,
      companyProfile: companyProfile || {
        websiteUrl: '',
        companyProfile: '',
        brandColors: { primary: '#7C21CC', secondary: '', accent: '' },
      },
      imageStyle: imageStyle || 'corporate',
      conversationHistory: conversationHistory || [],
      currentPlan: currentPlan || [],
      userMessage,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Image plan continue error:', error);

    if (error instanceof ClaudeError) {
      res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to continue image planning',
    });
  }
});

/**
 * POST /api/generate/images
 * Generate images using Nano Banana Pro (Gemini Image API)
 *
 * Request body:
 * {
 *   contentSummary: string,
 *   styleId: string,
 *   customPrompt?: string,
 *   brandColors?: { primary, secondary, accent },
 *   aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2',
 *   count?: number (default: 3)
 * }
 */
router.post('/images', async (req: Request, res: Response) => {
  try {
    const {
      contentSummary,
      styleId,
      customPrompt,
      brandColors,
      aspectRatio,
      count,
    } = req.body;

    // Validate required fields
    if (!contentSummary || typeof contentSummary !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid contentSummary',
      });
      return;
    }

    if (!styleId || typeof styleId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid styleId',
      });
      return;
    }

    // Validate styleId is one of the known styles
    const validStyles = [
      'corporate',
      'flat',
      'isometric',
      'abstract',
      'handdrawn',
      'photorealistic',
      'minimalist',
      'warm',
    ];
    if (!validStyles.includes(styleId)) {
      res.status(400).json({
        success: false,
        error: `Invalid styleId. Must be one of: ${validStyles.join(', ')}`,
      });
      return;
    }

    // Validate aspectRatio if provided
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      res.status(400).json({
        success: false,
        error: `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`,
      });
      return;
    }

    // Validate count if provided
    if (count !== undefined && (typeof count !== 'number' || count < 1 || count > 5)) {
      res.status(400).json({
        success: false,
        error: 'Invalid count. Must be a number between 1 and 5',
      });
      return;
    }

    const request: GenerateImagesRequest = {
      contentSummary,
      styleId,
      customPrompt,
      brandColors: brandColors
        ? {
            primary: brandColors.primary || '#7C21CC',
            secondary: brandColors.secondary || '',
            accent: brandColors.accent || '',
          }
        : undefined,
      aspectRatio: aspectRatio as '1:1' | '16:9' | '4:3' | '3:2' | undefined,
      count: count || 3,
    };

    console.log(
      `[ImageGen] Generating ${request.count} images with style: ${styleId}`
    );
    const startTime = Date.now();

    const result = await generateImages(request);

    const duration = Date.now() - startTime;
    console.log(
      `[ImageGen] Generated ${result.images.length} images in ${duration}ms`
    );

    res.json({
      success: true,
      data: {
        images: result.images.map((img) => ({
          id: img.id,
          base64Data: img.base64Data,
          mimeType: img.mimeType,
        })),
        styleId: result.styleId,
        count: result.images.length,
      },
    });
  } catch (error) {
    console.error('Generate images error:', error);

    if (error instanceof ImageGenError) {
      const statusCode =
        error.code === 'RATE_LIMIT'
          ? 429
          : error.code === 'AUTH_ERROR'
            ? 401
            : error.code === 'CONFIG_ERROR'
              ? 503
              : error.code === 'CONTENT_FILTERED'
                ? 422
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
      error: 'Failed to generate images',
    });
  }
});

/**
 * POST /api/generate/images/regenerate
 * Regenerate a single image with optional prompt modifications
 *
 * Request body:
 * {
 *   originalPrompt: string,
 *   modifiedPrompt?: string,
 *   aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2'
 * }
 */
router.post('/images/regenerate', async (req: Request, res: Response) => {
  try {
    const { originalPrompt, modifiedPrompt, aspectRatio } = req.body;

    if (!originalPrompt || typeof originalPrompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid originalPrompt',
      });
      return;
    }

    // Validate aspectRatio if provided
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      res.status(400).json({
        success: false,
        error: `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`,
      });
      return;
    }

    console.log('[ImageGen] Regenerating single image');
    const startTime = Date.now();

    const image = await regenerateSingleImage(
      originalPrompt,
      modifiedPrompt,
      aspectRatio as '1:1' | '16:9' | '4:3' | '3:2' | undefined
    );

    const duration = Date.now() - startTime;
    console.log(`[ImageGen] Regenerated image in ${duration}ms`);

    res.json({
      success: true,
      data: {
        id: image.id,
        base64Data: image.base64Data,
        mimeType: image.mimeType,
      },
    });
  } catch (error) {
    console.error('Regenerate image error:', error);

    if (error instanceof ImageGenError) {
      const statusCode =
        error.code === 'RATE_LIMIT'
          ? 429
          : error.code === 'AUTH_ERROR'
            ? 401
            : error.code === 'CONFIG_ERROR'
              ? 503
              : error.code === 'CONTENT_FILTERED'
                ? 422
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
      error: 'Failed to regenerate image',
    });
  }
});

export default router;
