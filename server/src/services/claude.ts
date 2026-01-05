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
  targetWordLength?: number; // Target length for generated content in words
  sourceMaterials?: SourceMaterial[];
  feedback?: string; // For regeneration with user feedback
  currentContent?: string; // Previously generated content for context
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]; // Previous messages in the chat
}

export interface GenerateContentResult {
  text: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

// Image planning types
export interface ImageRecommendation {
  id: string;
  type: 'header' | 'body';
  title: string;
  description: string;
  aspectRatio: '2:1' | '1:1' | '16:9' | '4:3' | '3:4' | '3:2';
  placement: 'top' | 'bottom';
}

export interface ImagePlanResponse {
  recommendations: ImageRecommendation[];
  message: string; // The conversational message to show in chat
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
  voiceSettings: VoiceSettings,
  targetWordLength?: number
): string {
  const voicePrompt = buildVoicePrompt(voiceSettings);

  // Build target length guidance if provided
  const lengthGuidance = targetWordLength
    ? `\n\n## Content Length Requirement
**IMPORTANT**: Generate content that is approximately **${targetWordLength} words** (±10%). This is a firm target. Stay within ${Math.round(targetWordLength * 0.9)}-${Math.round(targetWordLength * 1.1)} words. Do not significantly exceed this limit - be concise and focused rather than verbose.`
    : '';

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

## CRITICAL: Be Action-Oriented

You are a CONTENT CREATOR, not an interviewer. Your primary job is to CREATE CONTENT, not ask questions.

**When to generate content immediately (no questions):**
- The request is reasonably clear (e.g., "create a welcome email", "write an onboarding guide")
- You have enough company context from the profile above
- You can make reasonable assumptions based on the content type

**When to ask ONE round of clarifying questions:**
- The request is genuinely ambiguous (multiple very different interpretations)
- Critical details are missing that would significantly change the output

**IMPORTANT: After the user answers your questions, GENERATE THE CONTENT.**
- Do NOT ask follow-up questions after receiving answers
- Do NOT ask for more specificity - use the information provided
- If something is still unclear, make a reasonable assumption and proceed
- The user answered your questions because they want content, not more questions

## CRITICAL: Response Format

When generating publishable content (the actual content the user requested), you MUST wrap it in <content> tags like this:

<content>
# Your Content Title

Your markdown-formatted content here...
</content>

IMPORTANT:
- Only wrap the FINAL PUBLISHABLE CONTENT in <content> tags
- Do NOT wrap conversational responses, questions, or clarifications in <content> tags
- If you're asking for clarification or having a conversation, just respond normally without tags
- When you're ready to provide the actual content they can use, wrap it in <content> tags
- The content inside the tags should be well-formatted Markdown

## Content Guidelines
1. Write in Markdown format with clear headings and structure
2. Keep content concise but comprehensive
3. Use bullet points for lists and action items
4. Include calls-to-action where appropriate
5. Maintain the specified voice characteristics throughout
6. Reference company values and culture when relevant
7. Make content feel personal and welcoming${lengthGuidance}`;
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

  if (request.currentContent) {
    textContent += `\n\n## Previously Generated Content
The following content has already been generated. The user may be asking you to modify, improve, or build upon it:

<existing_content>
${request.currentContent}
</existing_content>

If the user is asking for changes (e.g., "make it shorter", "add more detail", "change the tone"), apply those changes to this existing content and output the revised version in <content> tags.`;
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
    request.voiceSettings,
    request.targetWordLength
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
    request.voiceSettings,
    request.targetWordLength
  );

  // Build message content (may include document blocks for PDFs)
  const messageContent = buildMessageContent(request);

  // Build messages array including conversation history
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history if present
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  // Add the current user message
  messages.push({ role: 'user', content: messageContent });

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
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
 * Generate a concise page title from content
 */
export async function generateTitle(content: string): Promise<string> {
  const client = getClaudeClient();

  // Truncate content if too long (we only need enough to understand the gist)
  const truncatedContent = content.slice(0, 2000);

  const systemPrompt = `You are a title generator. Given some content, generate a short, descriptive title that captures the essence of the content.

Rules:
- Keep the title under 50 characters
- Be specific and descriptive
- Don't use generic titles like "Content" or "Document"
- Don't use quotes around the title
- Just return the title, nothing else`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a title for this content:\n\n${truncatedContent}`,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return 'Untitled Page';
    }

    // Clean up the title (remove quotes if present, trim whitespace)
    let title = textContent.text.trim();
    title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    title = title.slice(0, 50); // Enforce max length

    return title || 'Untitled Page';
  } catch (error) {
    console.error('Title generation failed:', error);
    return 'Untitled Page';
  }
}

/**
 * Analyze content and recommend images
 */
export interface ImagePlanRequest {
  content: string;
  companyProfile: CompanyProfile;
  imageStyle: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  currentPlan?: ImageRecommendation[];
}

export async function analyzeContentForImages(
  request: ImagePlanRequest
): Promise<ImagePlanResponse> {
  const client = getClaudeClient();

  const systemPrompt = `You are an image planning assistant for content creation. Your job is to analyze content and recommend appropriate images.

## Company Context
${request.companyProfile.companyProfile || 'No company profile provided'}
Brand Colors: Primary ${request.companyProfile.brandColors.primary}, Secondary ${request.companyProfile.brandColors.secondary}
Image Style: ${request.imageStyle || 'corporate'}

## Your Task
Analyze the provided content and recommend images that would enhance it. You should:

1. **Almost always recommend a header image** - This goes at the top of the content and sets the visual tone.
   - Header images should use a 2:1 (panoramic) aspect ratio
   - The title should be concise (3-6 words)
   - The description should capture the essence (1 sentence)

2. **Recommend body images when appropriate** - Based on the content, you may recommend additional images.
   - Consider diagrams, illustrations, or photos that would break up the text
   - Choose appropriate aspect ratios:
     - 16:9 for wide scenes
     - 4:3 for standard images
     - 3:4 for portrait/tall content (diagrams, infographics)
     - 1:1 for icons or square content

## Response Format
You MUST respond with a JSON block inside <image-plan> tags, followed by a conversational message.

<image-plan>
[
  {
    "id": "img_1",
    "type": "header",
    "title": "Short descriptive title",
    "description": "Brief description of what the image should show",
    "aspectRatio": "2:1",
    "placement": "top"
  },
  {
    "id": "img_2",
    "type": "body",
    "title": "Another image title",
    "description": "What this image should depict",
    "aspectRatio": "16:9",
    "placement": "bottom"
  }
]
</image-plan>

After the JSON, write a friendly message summarizing your recommendations. Use a **numbered list** to present each image recommendation clearly. End by asking if the user wants to make changes or proceed.

Example format:
"I recommend the following images for your content:

1. **Header: [Title]** - [Brief description of what it will show]
2. **Body: [Title]** - [Brief description of what it will show]

Would you like to adjust any of these, or shall I go ahead and generate them?"`;

  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history if present
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  // Add the current request
  let userMessage = `Please analyze this content and recommend images:\n\n${request.content}`;

  if (request.currentPlan && request.currentPlan.length > 0) {
    userMessage += `\n\nCurrent image plan:\n${JSON.stringify(request.currentPlan, null, 2)}`;
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeError('No text in response', 'INVALID_RESPONSE');
    }

    const fullResponse = textContent.text;

    // Parse the image plan from the response
    const planMatch = fullResponse.match(/<image-plan>([\s\S]*?)<\/image-plan>/);
    let recommendations: ImageRecommendation[] = [];
    let message = fullResponse;

    if (planMatch) {
      try {
        recommendations = JSON.parse(planMatch[1].trim());
        // Remove the image-plan tags from the message
        message = fullResponse.replace(/<image-plan>[\s\S]*?<\/image-plan>/g, '').trim();
      } catch (parseError) {
        console.error('Failed to parse image plan JSON:', parseError);
        // Continue with empty recommendations
      }
    }

    return {
      recommendations,
      message,
    };
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    throw new ClaudeError(
      `Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'IMAGE_ANALYSIS_FAILED'
    );
  }
}

/**
 * Continue image planning conversation
 */
export async function continueImagePlanning(
  request: ImagePlanRequest & { userMessage: string }
): Promise<ImagePlanResponse> {
  const client = getClaudeClient();

  const systemPrompt = `You are an image planning assistant. The user is refining their image recommendations.

## Company Context
${request.companyProfile.companyProfile || 'No company profile provided'}
Brand Colors: Primary ${request.companyProfile.brandColors.primary}
Image Style: ${request.imageStyle || 'corporate'}

## Current Image Plan
${JSON.stringify(request.currentPlan || [], null, 2)}

## Content Being Illustrated
${request.content.slice(0, 2000)}

## Instructions
- If the user wants to modify images, update the plan accordingly
- If the user says "go ahead", "generate", "looks good", "yes", or similar approval, respond with the SAME plan and a confirmation message
- Always include the <image-plan> JSON block with the current/updated recommendations
- Keep aspect ratios appropriate: 2:1 for headers, others based on content needs

## Response Format
Always respond with:
1. <image-plan>[JSON array of recommendations]</image-plan>
2. A conversational message using a **numbered list** for image recommendations

When presenting updated recommendations, use this format:
"Here's the updated plan:

1. **Header: [Title]** - [Brief description]
2. **Body: [Title]** - [Brief description]

[Follow-up question or confirmation]"

If approving generation, your message should confirm you're starting generation.`;

  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  if (request.conversationHistory) {
    for (const msg of request.conversationHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: request.userMessage });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new ClaudeError('No text in response', 'INVALID_RESPONSE');
    }

    const fullResponse = textContent.text;

    // Parse the image plan
    const planMatch = fullResponse.match(/<image-plan>([\s\S]*?)<\/image-plan>/);
    let recommendations: ImageRecommendation[] = request.currentPlan || [];
    let message = fullResponse;

    if (planMatch) {
      try {
        recommendations = JSON.parse(planMatch[1].trim());
        message = fullResponse.replace(/<image-plan>[\s\S]*?<\/image-plan>/g, '').trim();
      } catch (parseError) {
        console.error('Failed to parse image plan JSON:', parseError);
      }
    }

    return {
      recommendations,
      message,
    };
  } catch (error) {
    if (error instanceof ClaudeError) {
      throw error;
    }

    throw new ClaudeError(
      `Image planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'IMAGE_PLANNING_FAILED'
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

// ============================================================================
// Tools for Claude
// ============================================================================

/**
 * Tool definition for web search
 * Allows Claude to search the web for current information
 */
export const webSearchTool: Anthropic.Tool = {
  name: 'web_search',
  description: `Search the web for current information on any topic.

Use this tool when:
- The user asks about recent events, news, or current information
- The user needs up-to-date data that may not be in your training data
- The user explicitly asks you to "search", "look up", or "find" something online
- You need to verify or update information
- The user asks about specific companies, products, or people and wants current info

Examples of when to USE this tool:
- "Search for the latest news about Tesla"
- "Look up the current CEO of Microsoft"
- "Find information about recent AI developments"
- "What's the weather in Sydney?" (redirect to search for current data)
- "Search for reviews of the iPhone 15"

Do NOT use this tool when:
- The user is asking you to create content (use your knowledge instead)
- The question is about general knowledge that doesn't need current data
- The user specifically says they don't want a web search`,
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query. Be specific and include relevant keywords for better results.',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (1-10). Defaults to 5.',
      },
    },
    required: ['query'],
  },
};

/**
 * Tool definition for URL scraping
 * Allows Claude to fetch and extract content from a specific URL
 */
export const scrapeUrlTool: Anthropic.Tool = {
  name: 'scrape_url',
  description: `Fetch and extract content from a specific webpage URL.

Use this tool when:
- The user provides a specific URL and asks you to read/analyze it
- The user says "check this link", "read this page", or "what's on this website"
- You need to get detailed content from a specific webpage
- The user wants to reference content from a particular article or page

Examples of when to USE this tool:
- "Read this article: https://example.com/article"
- "What does this page say? [URL]"
- "Summarize the content at https://..."
- "Check out this website and tell me about it"
- "Extract the main points from this URL"

Do NOT use this tool when:
- The user hasn't provided a specific URL
- The user just wants general information (use web_search instead)
- The URL appears to be a file download (PDF, etc.)`,
  input_schema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The full URL to scrape (must start with http:// or https://)',
      },
    },
    required: ['url'],
  },
};

/**
 * Tool definition for image generation
 */
export const imageGenerationTool: Anthropic.Tool = {
  name: 'generate_image',
  description: `Generate an image based on a text description using AI.

CRITICAL: ONLY use this tool when the user EXPLICITLY requests a visual output. The user must use words that clearly indicate they want an IMAGE, not text content.

REQUIRED TRIGGER WORDS (user must mention one of these):
- "image" / "picture" / "photo" / "photograph"
- "illustration" / "drawing" / "sketch"
- "diagram" / "chart" / "infographic" / "visual"
- "graphic" / "artwork" / "banner" / "icon"
- Explicitly: "draw", "illustrate", "visualize"

Examples of when to USE this tool:
- "Generate an image of a dog" (explicitly says "image")
- "Create a picture of mountains" (explicitly says "picture")
- "Draw me a team meeting" (explicitly says "draw")
- "Can you make an illustration?" (explicitly says "illustration")
- "I need a diagram showing our process" (explicitly says "diagram")

DO NOT use this tool when:
- User asks to "create a page" (page = text content, not an image)
- User asks to "make content" (content = text, not an image)
- User asks to "write about" something (write = text)
- User asks to "do" something without mentioning visuals
- User discusses images conceptually but doesn't request one
- User wants to plan multiple images (use image planning flow instead)
- The word "image/picture/illustration/diagram" is NOT explicitly in the request

When in doubt, DO NOT use this tool. Generate text content instead.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      description: {
        type: 'string',
        description: 'A detailed description of the image to generate. Be specific about subjects, style, colors, composition, and mood.',
      },
      style: {
        type: 'string',
        enum: ['corporate', 'flat', 'isometric', 'abstract', 'handdrawn', 'photorealistic', 'minimalist', 'warm'],
        description: 'The visual style for the image. Defaults to the user\'s configured style if not specified.',
      },
      aspectRatio: {
        type: 'string',
        enum: ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'],
        description: 'The aspect ratio for the image. Use 16:9 for landscapes/headers, 1:1 for square, 9:16 for portraits. Defaults to 16:9.',
      },
    },
    required: ['description'],
  },
};

/**
 * Result of a tool execution
 */
export interface ToolExecutionResult {
  toolName: string;
  toolUseId: string;
  result: {
    success: boolean;
    // Image generation results
    imageBase64?: string;
    mimeType?: string;
    // Web search results
    searchResults?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
    // URL scraping results
    scrapedContent?: {
      title: string;
      content: string;
      url: string;
    };
    // Error message
    error?: string;
  };
}

/**
 * Streaming event types when tools are involved
 */
export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_use_start'; toolName: string; toolUseId: string }
  | { type: 'tool_result'; result: ToolExecutionResult }
  | { type: 'done' }
  | { type: 'error'; error: string };

/**
 * Generate streaming content with tool support
 * This is an enhanced version of generateContentStream that can handle tool calls
 *
 * IMPORTANT: When Claude calls a tool, we execute it and then make a follow-up
 * API call with the tool result so Claude can continue generating.
 */
export async function* generateContentStreamWithTools(
  request: GenerateContentRequest,
  defaultStyleId: string = 'flat',
  onToolCall?: (toolName: string, toolInput: Record<string, unknown>) => Promise<{
    success: boolean;
    imageBase64?: string;
    mimeType?: string;
    searchResults?: Array<{ title: string; url: string; snippet: string }>;
    scrapedContent?: { title: string; content: string; url: string };
    error?: string;
  }>
): AsyncGenerator<StreamEvent, void, unknown> {
  const client = getClaudeClient();

  console.log(`[Claude API] Target word length: ${request.targetWordLength || 'not specified'}`);

  const systemPrompt = buildSystemPrompt(
    request.companyProfile,
    request.voiceSettings,
    request.targetWordLength
  );

  // Build message content for the current user message
  const messageContent = buildMessageContent(request);

  // Build messages array including conversation history
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history if present
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  }

  // Add the current user message
  messages.push({ role: 'user', content: messageContent });

  // Add tool context to system prompt
  const enhancedSystemPrompt = `${systemPrompt}

## Available Tools

### Image Generation
You have access to an image generation tool, but ONLY use it when the user EXPLICITLY asks for a visual output.
The user must use words like: "image", "picture", "photo", "illustration", "drawing", "diagram", "chart", "graphic", "visual", or verbs like "draw", "illustrate".
DO NOT use the image tool for requests like "Create a page about X" - that's text content, not an image.
Default image style: ${defaultStyleId}

### Web Search
You can search the web for current information when the user:
- Asks about recent events, news, or current data
- Explicitly asks you to "search", "look up", or "find" something online
- Needs up-to-date information that may have changed since your training

### URL Scraping
You can fetch and read content from specific URLs when the user:
- Provides a URL and asks you to read, analyze, or summarize it
- Says things like "check this link", "read this page", "what's on this website"
- Wants you to reference content from a particular webpage

When using these tools, always explain what you found to the user in a helpful way.

### IMPORTANT: Tool Usage Limits
- Limit yourself to 2-3 tool calls maximum per request
- After gathering initial information, proceed to generate content - don't keep searching for more
- If you have enough information to create useful content, do so rather than perfecting your research
- The user wants content quickly, not exhaustive research`;

  // Log the full system prompt and messages being sent
  console.log('\n' + '═'.repeat(80));
  console.log('[Claude API] SYSTEM PROMPT:');
  console.log('─'.repeat(80));
  console.log(enhancedSystemPrompt);
  console.log('─'.repeat(80));
  console.log('[Claude API] MESSAGES (' + messages.length + ' total):');
  for (const msg of messages) {
    const contentPreview = typeof msg.content === 'string'
      ? msg.content.slice(0, 200) + (msg.content.length > 200 ? '...' : '')
      : '[complex content]';
    console.log(`  [${msg.role.toUpperCase()}]: ${contentPreview}`);
  }
  console.log('═'.repeat(80) + '\n');

  // Track the conversation for potential tool continuation
  let currentMessages = [...messages];
  let continueLoop = true;
  const maxIterations = 10; // Allow more tool calls for complex research
  let iteration = 0;

  while (continueLoop && iteration < maxIterations) {
    iteration++;
    continueLoop = false; // Will be set to true if we need to continue after tool use

    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: enhancedSystemPrompt,
        messages: currentMessages,
        tools: [imageGenerationTool, webSearchTool, scrapeUrlTool],
      });

      // Collect the full response to build the assistant message
      const assistantContentBlocks: Anthropic.ContentBlock[] = [];
      const toolCalls: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];

      let currentToolUseId: string | null = null;
      let currentToolName: string | null = null;
      let toolInputJson = '';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            currentToolUseId = event.content_block.id;
            currentToolName = event.content_block.name;
            toolInputJson = '';
            yield { type: 'tool_use_start', toolName: currentToolName, toolUseId: currentToolUseId };
          } else if (event.content_block.type === 'text') {
            // Text block starting - we'll collect the text via deltas
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield { type: 'text', text: event.delta.text };
          } else if (event.delta.type === 'input_json_delta') {
            toolInputJson += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop') {
          // If we were building a tool call, save it
          if (currentToolUseId && currentToolName) {
            try {
              const toolInput = JSON.parse(toolInputJson);

              // Apply default style if not specified
              if (!toolInput.style) {
                toolInput.style = defaultStyleId;
              }
              if (!toolInput.aspectRatio) {
                toolInput.aspectRatio = '16:9';
              }

              toolCalls.push({
                id: currentToolUseId,
                name: currentToolName,
                input: toolInput,
              });
            } catch {
              console.error('[Claude] Failed to parse tool input JSON');
            }

            currentToolUseId = null;
            currentToolName = null;
            toolInputJson = '';
          }
        }
      }

      // Get the final message to extract content blocks
      const finalMessage = await stream.finalMessage();

      // If there were tool calls, execute them and continue
      if (toolCalls.length > 0 && onToolCall) {
        // Build the assistant's response with tool use blocks
        const assistantContent: Anthropic.ContentBlockParam[] = [];

        // Add any text blocks from the response
        for (const block of finalMessage.content) {
          if (block.type === 'text') {
            assistantContent.push({ type: 'text', text: block.text });
          } else if (block.type === 'tool_use') {
            assistantContent.push({
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input as Record<string, unknown>,
            });
          }
        }

        // Add assistant message with tool calls
        currentMessages.push({
          role: 'assistant',
          content: assistantContent,
        });

        // Execute all tool calls and collect results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolCall of toolCalls) {
          const result = await onToolCall(toolCall.name, toolCall.input);

          // Yield the tool result to the frontend
          yield {
            type: 'tool_result',
            result: {
              toolName: toolCall.name,
              toolUseId: toolCall.id,
              result,
            },
          };

          // Build the tool result content for Claude
          let toolResultContent: string;
          if (result.success) {
            if (result.searchResults) {
              toolResultContent = `Search results:\n${result.searchResults.map((r, i) =>
                `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`
              ).join('\n\n')}`;
            } else if (result.scrapedContent) {
              toolResultContent = `Page content from ${result.scrapedContent.url}:\n\nTitle: ${result.scrapedContent.title}\n\n${result.scrapedContent.content}`;
            } else if (result.imageBase64) {
              toolResultContent = 'Image generated successfully. The image has been displayed to the user.';
            } else {
              toolResultContent = 'Tool executed successfully.';
            }
          } else {
            toolResultContent = `Error: ${result.error || 'Unknown error'}`;
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolCall.id,
            content: toolResultContent,
          });
        }

        // Add user message with tool results
        currentMessages.push({
          role: 'user',
          content: toolResults,
        });

        // Continue the loop to get Claude's response to the tool results
        continueLoop = true;
        console.log('[Claude] Tool calls executed, continuing conversation...');
      }
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          yield { type: 'error', error: 'Rate limit exceeded. Please try again in a moment.' };
          return;
        }
        yield { type: 'error', error: `API error: ${error.message}` };
        return;
      }

      yield {
        type: 'error',
        error: `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      return;
    }
  }

  yield { type: 'done' };
}
