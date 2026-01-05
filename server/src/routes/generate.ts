import { Router, Request, Response } from 'express';
import {
  generateContent,
  generateContentStream,
  generateContentStreamWithTools,
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
  generateImagesStreaming,
  regenerateSingleImage,
  editImageWithReference,
  ImageGenError,
  GenerateImagesRequest,
  buildImagePrompt,
} from '../services/imageGen';
import { searchWeb, formatSearchResults, WebSearchError } from '../services/webSearch';
import { scrapeWebsite, ScraperError } from '../services/scraper';

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
      targetWordLength,
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

    // Log the incoming chat message
    console.log('\n' + '═'.repeat(60));
    console.log('[Chat] IMAGE STYLE FROM REQUEST:', imageStyle || '(not provided, will use flat)');
    const conversationHistory = req.body.conversationHistory;
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('[Chat] CONVERSATION HISTORY (' + conversationHistory.length + ' messages):');
      for (const msg of conversationHistory) {
        console.log(`  [${msg.role.toUpperCase()}]: ${msg.content.slice(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
      }
      console.log('─'.repeat(60));
    }
    console.log('[Chat] USER MESSAGE:');
    console.log('─'.repeat(60));
    console.log(objective);
    console.log('─'.repeat(60));
    if (currentContent) {
      console.log('[Chat] Has existing content:', currentContent.slice(0, 100) + '...');
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
      targetWordLength,
      sourceMaterials,
      feedback,
      currentContent,
      conversationHistory,
    };

    // Handle streaming response
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Check if tools should be enabled (default: true for chat)
      const enableTools = req.body.enableTools !== false;

      try {
        if (enableTools) {
          // Use enhanced streaming with tool support
          const defaultStyleId = imageStyle || 'flat';
          const brandColors = {
            primary: companyProfile.brandColors?.primary || '#7C21CC',
            secondary: companyProfile.brandColors?.secondary || '',
            accent: companyProfile.brandColors?.accent || '',
          };

          // Tool execution handler
          const handleToolCall = async (
            toolName: string,
            toolInput: Record<string, unknown>
          ): Promise<{
            success: boolean;
            imageBase64?: string;
            mimeType?: string;
            searchResults?: Array<{ title: string; url: string; snippet: string }>;
            scrapedContent?: { title: string; content: string; url: string };
            error?: string;
          }> => {
            // Handle image generation tool
            if (toolName === 'generate_image') {
              try {
                console.log('[ToolCall] generate_image:', toolInput);

                const imageRequest: GenerateImagesRequest = {
                  contentSummary: toolInput.description as string,
                  styleId: (toolInput.style as string) || defaultStyleId,
                  brandColors,
                  aspectRatio: (toolInput.aspectRatio as '1:1' | '16:9' | '4:3' | '3:2') || '16:9',
                  count: 1, // Only generate 1 image for inline requests
                };

                const result = await generateImages(imageRequest);

                if (result.images.length > 0) {
                  return {
                    success: true,
                    imageBase64: result.images[0].base64Data,
                    mimeType: result.images[0].mimeType,
                  };
                }

                return {
                  success: false,
                  error: 'No image generated',
                };
              } catch (imgError) {
                console.error('[ToolCall] Image generation failed:', imgError);
                return {
                  success: false,
                  error: imgError instanceof Error ? imgError.message : 'Image generation failed',
                };
              }
            }

            // Handle web search tool
            if (toolName === 'web_search') {
              try {
                const query = toolInput.query as string;
                const maxResults = (toolInput.maxResults as number) || 5;
                console.log('[ToolCall] web_search:', { query, maxResults });

                const searchResponse = await searchWeb(query, maxResults);

                return {
                  success: true,
                  searchResults: searchResponse.results,
                };
              } catch (searchError) {
                console.error('[ToolCall] Web search failed:', searchError);
                return {
                  success: false,
                  error: searchError instanceof WebSearchError
                    ? searchError.message
                    : 'Web search failed',
                };
              }
            }

            // Handle URL scraping tool
            if (toolName === 'scrape_url') {
              try {
                const url = toolInput.url as string;
                console.log('[ToolCall] scrape_url:', { url });

                const scrapeResult = await scrapeWebsite(url);

                return {
                  success: true,
                  scrapedContent: {
                    title: scrapeResult.metadata.title || 'Untitled Page',
                    content: scrapeResult.profile,
                    url: scrapeResult.url,
                  },
                };
              } catch (scrapeError) {
                console.error('[ToolCall] URL scraping failed:', scrapeError);
                return {
                  success: false,
                  error: scrapeError instanceof ScraperError
                    ? scrapeError.message
                    : 'URL scraping failed',
                };
              }
            }

            return {
              success: false,
              error: `Unknown tool: ${toolName}`,
            };
          };

          let fullResponseText = '';

          for await (const event of generateContentStreamWithTools(
            request,
            defaultStyleId,
            handleToolCall
          )) {
            switch (event.type) {
              case 'text':
                fullResponseText += event.text;
                res.write(`data: ${JSON.stringify({ text: event.text })}\n\n`);
                break;
              case 'tool_use_start':
                // Log tool invocation
                console.log('[Chat] TOOL CALL:', event.toolName, '(id:', event.toolUseId + ')');
                // Notify frontend that we're generating an image
                res.write(
                  `data: ${JSON.stringify({
                    toolStart: {
                      name: event.toolName,
                      id: event.toolUseId,
                    },
                  })}\n\n`
                );
                break;
              case 'tool_result':
                // Log tool result
                console.log('[Chat] TOOL RESULT:', event.result.toolName,
                  event.result.result.success ? 'SUCCESS' : 'FAILED: ' + event.result.result.error);
                // Send the generated image to the frontend
                res.write(
                  `data: ${JSON.stringify({
                    toolResult: event.result,
                  })}\n\n`
                );
                break;
              case 'error':
                console.log('[Chat] STREAM ERROR:', event.error);
                res.write(`data: ${JSON.stringify({ error: event.error })}\n\n`);
                break;
              case 'done':
                // Log the full response
                console.log('\n[Chat] ASSISTANT RESPONSE:');
                console.log('─'.repeat(60));
                console.log(fullResponseText || '(no text response)');
                console.log('═'.repeat(60) + '\n');
                break;
            }
          }
        } else {
          // Use basic streaming without tools
          let fullResponseText = '';
          for await (const chunk of generateContentStream(request)) {
            fullResponseText += chunk;
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
          // Log the full response
          console.log('\n[Chat] ASSISTANT RESPONSE:');
          console.log('─'.repeat(60));
          console.log(fullResponseText || '(no text response)');
          console.log('═'.repeat(60) + '\n');
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
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'];
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
 * POST /api/generate/images/stream
 * Generate images with SSE streaming - returns each image as it completes
 * This provides faster perceived performance by showing images as they're ready
 *
 * Request body: Same as /api/generate/images
 * Response: SSE stream with events:
 *   - { type: 'image', variationIndex, totalCount, image: { id, base64Data, mimeType } }
 *   - { type: 'error', variationIndex, error }
 *   - { type: 'complete', totalCount, duration }
 */
router.post('/images/stream', async (req: Request, res: Response) => {
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

    // Validate styleId
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
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      res.status(400).json({
        success: false,
        error: `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`,
      });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

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
      `[ImageGen] SSE Stream: Generating ${request.count} images with style: ${styleId}`
    );
    const startTime = Date.now();

    // Stream images as they complete
    for await (const event of generateImagesStreaming(request)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const duration = Date.now() - startTime;
    console.log(`[ImageGen] SSE Stream: Complete in ${duration}ms`);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Generate images stream error:', error);

    // If headers haven't been sent, we can send an error response
    if (!res.headersSent) {
      if (error instanceof ImageGenError) {
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
        error: 'Failed to generate images',
      });
      return;
    }

    // If headers were sent, send error via SSE
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
    res.end();
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
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'];
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

/**
 * POST /api/generate/images/edit
 * Edit a single image using a reference image and an edit prompt
 *
 * Request body:
 * {
 *   referenceImage: string,  // base64 data (without data URL prefix)
 *   editPrompt: string,
 *   aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '21:9' | '9:16',
 *   placementType?: 'header' | 'body' | 'footer'
 * }
 */
router.post('/images/edit', async (req: Request, res: Response) => {
  try {
    const { referenceImage, editPrompt, aspectRatio, placementType } = req.body;

    if (!referenceImage || typeof referenceImage !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid referenceImage (base64 data required)',
      });
      return;
    }

    if (!editPrompt || typeof editPrompt !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid editPrompt',
      });
      return;
    }

    // Validate aspectRatio if provided
    const validAspectRatios = ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      res.status(400).json({
        success: false,
        error: `Invalid aspectRatio. Must be one of: ${validAspectRatios.join(', ')}`,
      });
      return;
    }

    // Validate placementType if provided
    const validPlacementTypes = ['header', 'body', 'footer'];
    if (placementType && !validPlacementTypes.includes(placementType)) {
      res.status(400).json({
        success: false,
        error: `Invalid placementType. Must be one of: ${validPlacementTypes.join(', ')}`,
      });
      return;
    }

    console.log('[ImageGen] Editing image with reference');
    console.log(`[ImageGen] Edit prompt: ${editPrompt.substring(0, 100)}...`);
    const startTime = Date.now();

    // Strip data URL prefix if present
    const base64Data = referenceImage.replace(/^data:image\/\w+;base64,/, '');

    const image = await editImageWithReference(
      base64Data,
      editPrompt,
      aspectRatio as '1:1' | '16:9' | '4:3' | '3:2' | '21:9' | '9:16' | undefined,
      placementType as 'header' | 'body' | 'footer' | undefined
    );

    const duration = Date.now() - startTime;
    console.log(`[ImageGen] Edited image in ${duration}ms`);

    res.json({
      success: true,
      data: {
        id: image.id,
        base64Data: image.base64Data,
        mimeType: image.mimeType,
      },
    });
  } catch (error) {
    console.error('Edit image error:', error);

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
      error: 'Failed to edit image',
    });
  }
});

export default router;
