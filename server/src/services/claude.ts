import Anthropic from '@anthropic-ai/sdk';
import { voiceDimensions } from './voiceData';

// Types matching frontend SettingsContext
export interface VoiceSettings {
  formality: number; // 0-4: Very Formal → Very Casual
  humor: number; // 0-4: Very Serious → Very Funny
  respect: number; // 0-4: Very Respectful → Very Irreverent
  enthusiasm: number; // 0-4: Very Matter-of-fact → Very Enthusiastic
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface CompanyProfile {
  websiteUrl: string;
  companyProfile: string;
  brandColors: BrandColors;
}

/**
 * Source material can be either text or a document (PDF)
 */
export interface SourceMaterial {
  type: 'text' | 'document';
  /** Text content (for DOCX, TXT, PPTX extracted text) */
  text?: string;
  /** Document data for Claude's document API (for PDFs) */
  document?: {
    mediaType: string;
    base64Data: string;
    fileName?: string;
  };
  /** Optional name/title for the source */
  name?: string;
}

export interface GenerateContentRequest {
  objective: string;
  companyProfile: CompanyProfile;
  voiceSettings: VoiceSettings;
  imageStyle?: string;
  sourceMaterials?: SourceMaterial[];
  feedback?: string; // For regeneration with user feedback
}

export interface GenerateContentResult {
  text: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface InterviewContext {
  objective: string;
  companyProfile: CompanyProfile;
  voiceSettings: VoiceSettings;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

// Lazy-initialized Claude client
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ClaudeError('ANTHROPIC_API_KEY not configured', 'CONFIG_ERROR');
  }

  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return claudeClient;
}

/**
 * Convert voice slider values (0-4) to natural language descriptions
 */
export function buildVoicePrompt(settings: VoiceSettings): string {
  const voiceInstructions: string[] = [];

  for (const dimension of voiceDimensions) {
    const value = settings[dimension.id as keyof VoiceSettings];
    const label = dimension.valueLabels[value];
    const description = dimension.descriptions[value];

    voiceInstructions.push(`**${dimension.name}**: ${label}\n${description}`);
  }

  return `## Brand Voice Guidelines

The content should follow these voice characteristics:

${voiceInstructions.join('\n\n')}`;
}

/**
 * Build the system prompt that incorporates company profile and brand context
 */
export function buildSystemPrompt(
  companyProfile: CompanyProfile,
  voiceSettings: VoiceSettings
): string {
  const voicePrompt = buildVoicePrompt(voiceSettings);

  return `You are an expert content writer for Enboarder, a platform that creates employee journey content (onboarding, offboarding, transitions, etc.).

## Your Role
You create branded, personalized content for employee communications. Your content should be clear, engaging, and aligned with the company's brand voice.

## Company Context
${companyProfile.companyProfile || 'No company profile provided.'}
Website: ${companyProfile.websiteUrl || 'Not specified'}

## Brand Colors (for reference)
- Primary: ${companyProfile.brandColors.primary || '#7C21CC'}
- Secondary: ${companyProfile.brandColors.secondary || 'Not specified'}
- Accent: ${companyProfile.brandColors.accent || 'Not specified'}

${voicePrompt}

## Content Guidelines
1. Write in Markdown format with clear headings and structure
2. Keep content concise but comprehensive
3. Use bullet points for lists and action items
4. Include calls-to-action where appropriate
5. Maintain the specified voice characteristics throughout
6. Reference company values and culture when relevant
7. Make content feel personal and welcoming`;
}

/**
 * Build user message content blocks from source materials
 * Returns an array of content blocks for Claude's API
 */
function buildMessageContent(
  request: GenerateContentRequest
): Anthropic.ContentBlockParam[] {
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  // Start with the main request text
  let textContent = `## Content Request

**Objective:** ${request.objective}`;

  if (request.imageStyle) {
    textContent += `\n\n## Image Style Preference
The accompanying images will use a "${request.imageStyle}" style. Keep this in mind when describing visual elements.`;
  }

  if (request.feedback) {
    textContent += `\n\n## User Feedback
Please revise the content based on this feedback: ${request.feedback}`;
  }

  // Handle source materials
  if (request.sourceMaterials && request.sourceMaterials.length > 0) {
    textContent += '\n\n## Source Materials\nUse the following reference materials to inform the content:\n';

    // Add text for each source material
    for (let i = 0; i < request.sourceMaterials.length; i++) {
      const source = request.sourceMaterials[i];
      const sourceName = source.name || `Source ${i + 1}`;

      if (source.type === 'text' && source.text) {
        // Text-based source material (DOCX, TXT, PPTX)
        textContent += `\n### ${sourceName}\n${source.text}\n`;
      } else if (source.type === 'document' && source.document) {
        // Document reference - will be added as a separate block
        textContent += `\n### ${sourceName}\n[See attached document: ${source.document.fileName || 'document.pdf'}]\n`;
      }
    }
  }

  textContent += '\n\nPlease generate the requested content following all guidelines.';

  // Add the main text block first
  contentBlocks.push({ type: 'text', text: textContent });

  // Add document blocks for PDFs
  if (request.sourceMaterials) {
    for (const source of request.sourceMaterials) {
      if (source.type === 'document' && source.document) {
        contentBlocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: source.document.mediaType as 'application/pdf',
            data: source.document.base64Data,
          },
        });
      }
    }
  }

  return contentBlocks;
}

/**
 * Main content generation function
 */
export async function generateContent(
  request: GenerateContentRequest
): Promise<GenerateContentResult> {
  const client = getClaudeClient();

  const systemPrompt = buildSystemPrompt(
    request.companyProfile,
    request.voiceSettings
  );

  // Build message content (may include document blocks for PDFs)
  const messageContent = buildMessageContent(request);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeError('No text content in response', 'INVALID_RESPONSE');
    }

    return {
      text: textContent.text,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    // Handle specific Anthropic errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new ClaudeError(
          'Rate limit exceeded. Please try again in a moment.',
          'RATE_LIMIT'
        );
      }
      if (error.status === 401) {
        throw new ClaudeError(
          'Invalid API key. Please check your configuration.',
          'AUTH_ERROR'
        );
      }
      throw new ClaudeError(
        `API error: ${error.message}`,
        'API_ERROR'
      );
    }

    throw new ClaudeError(
      `Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'GENERATION_FAILED'
    );
  }
}

/**
 * Generate streaming content response
 */
export async function* generateContentStream(
  request: GenerateContentRequest
): AsyncGenerator<string, void, unknown> {
  const client = getClaudeClient();

  const systemPrompt = buildSystemPrompt(
    request.companyProfile,
    request.voiceSettings
  );

  // Build message content (may include document blocks for PDFs)
  const messageContent = buildMessageContent(request);

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new ClaudeError(
          'Rate limit exceeded. Please try again in a moment.',
          'RATE_LIMIT'
        );
      }
      throw new ClaudeError(`API error: ${error.message}`, 'API_ERROR');
    }

    throw new ClaudeError(
      `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'STREAM_FAILED'
    );
  }
}

/**
 * Generate AI interview follow-up questions
 */
export async function generateInterviewQuestion(
  context: InterviewContext
): Promise<string> {
  const client = getClaudeClient();

  const systemPrompt = `You are a helpful AI assistant conducting a brief interview to gather information for content generation.

## Context
The user wants to create content with this objective: ${context.objective}

## Company Information
${context.companyProfile.companyProfile || 'Not provided'}

## Your Role
Ask 1-2 clarifying questions to better understand what the user wants. Focus on:
- Specific tone preferences
- Key information to include or exclude
- Target audience details
- Any specific examples or references they want

Keep questions conversational and concise. Don't ask more than 2 questions at once.`;

  const messages: Anthropic.MessageParam[] = context.conversationHistory.map(
    (msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })
  );

  // Add initial greeting if no history
  if (messages.length === 0) {
    return "I'd like to ask a few questions to help create the best content for you. What specific tone would you like - should it feel more corporate and polished, or casual and friendly?";
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeError('No text in response', 'INVALID_RESPONSE');
    }

    return textContent.text;
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    throw new ClaudeError(
      `Interview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'INTERVIEW_FAILED'
    );
  }
}

/**
 * Custom error class for Claude-related errors
 */
export class ClaudeError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ClaudeError';
    this.code = code;
  }
}
