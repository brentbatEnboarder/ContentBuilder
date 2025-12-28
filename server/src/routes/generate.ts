import { Router, Request, Response } from 'express';
import {
  generateContent,
  generateContentStream,
  generateInterviewQuestion,
  ClaudeError,
  GenerateContentRequest,
  InterviewContext,
} from '../services/claude';

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

export default router;
