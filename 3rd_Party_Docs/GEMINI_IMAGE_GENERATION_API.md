# Gemini Image Generation API (Nano Banana Pro)

> **Last Updated:** December 2024
> **Model Used:** `gemini-3-pro-image-preview` (Nano Banana Pro)
> **API Type:** Google Generative AI SDK

## Overview

ContentBuilder uses the Gemini 3 Pro Image model (codename "Nano Banana Pro") for AI image generation. This model supports text-to-image generation, image editing, and multi-turn conversations.

## Official Documentation

- [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Imagen 3 Documentation](https://ai.google.dev/gemini-api/docs/imagen)
- [Vertex AI Image Generation](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/overview)

## Authentication

```typescript
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
```

**Environment Variable:** `GOOGLE_API_KEY`

## Available Models

| Model ID | Codename | Description |
|----------|----------|-------------|
| `gemini-2.5-flash-image` | Nano Banana | Fast, cost-effective image generation |
| `gemini-3-pro-image-preview` | Nano Banana Pro | Advanced professional image generation |
| `imagen-3.0-generate-002` | Imagen 3 | High-quality standalone image generation |

## API Request Format

### generateContent Endpoint

```typescript
const response = await client.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: promptText,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: '16:9',
      imageSize: '2K',
    },
  },
});
```

### REST Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Header: x-goog-api-key: $GEMINI_API_KEY
```

## Configuration Parameters

### imageConfig Options

| Parameter | Type | Values | Default | Description |
|-----------|------|--------|---------|-------------|
| `aspectRatio` | string | See below | `1:1` | Output image aspect ratio |
| `imageSize` | string | `1K`, `2K`, `4K` | `1K` | Output image resolution |

### Supported Aspect Ratios

| Ratio | Use Case |
|-------|----------|
| `1:1` | Square - social media posts, avatars |
| `2:3` | Portrait - posters |
| `3:2` | Landscape - photography standard |
| `3:4` | Portrait - tablets, print |
| `4:3` | Fullscreen - presentations |
| `4:5` | Portrait - Instagram |
| `5:4` | Landscape - print |
| `9:16` | Tall portrait - mobile stories |
| `16:9` | Widescreen - headers, banners |
| `21:9` | Ultrawide - cinematic |

### responseModalities

```typescript
responseModalities: ['TEXT', 'IMAGE']  // Can return both text and images
responseModalities: ['IMAGE']          // Image-only response
```

## Response Format

```typescript
interface Response {
  candidates: [{
    content: {
      parts: [
        { text?: string },
        {
          inlineData?: {
            mimeType: string;  // e.g., "image/png"
            data: string;      // base64-encoded image data
          }
        }
      ]
    }
  }]
}
```

### Extracting Images

```typescript
const candidate = response.candidates?.[0];
for (const part of candidate.content.parts) {
  if (part.inlineData) {
    const { mimeType, data } = part.inlineData;
    // data is base64-encoded image
  }
}
```

## Imagen 3 Specific Parameters

When using `imagen-3.0-generate-002` with `generate_images()`:

| Parameter | Type | Values | Default | Description |
|-----------|------|--------|---------|-------------|
| `number_of_images` | int | 1-4 | 4 | Number of images to generate |
| `image_size` | string | `1K`, `2K` | `1K` | Resolution |
| `aspect_ratio` | string | `1:1`, `3:4`, `4:3`, `9:16`, `16:9` | `1:1` | Aspect ratio |
| `person_generation` | string | `dont_allow`, `allow_adult`, `allow_all` | `allow_adult` | People in images |

```python
# Python example
response = client.models.generate_images(
    model='imagen-3.0-generate-002',
    prompt='Robot holding a red skateboard',
    config=types.GenerateImagesConfig(
        number_of_images=4,
        aspect_ratio='16:9',
        person_generation='allow_adult'
    )
)
```

## Best Practices for Prompts

### Structure

```
[Subject] + [Style] + [Composition] + [Lighting] + [Color palette]
```

### Example Prompt

```
Professional corporate photograph of diverse team collaborating in modern office.
Style: Corporate photography, clean and professional.
Composition: Wide shot showing full scene.
Lighting: Natural light from large windows, soft and even.
Colors: Incorporate brand colors #7C21CC (purple) and white.
```

### Tips

1. **Be specific** - Describe exactly what you want to see
2. **Include style keywords** - "corporate", "flat illustration", "photorealistic"
3. **Mention brand colors** - Include hex codes for consistency
4. **Specify composition** - "wide shot", "close-up", "centered"
5. **Define lighting** - "natural light", "studio lighting", "soft"

## Limitations

- **Prompt length:** Maximum 480 tokens
- **Language:** English prompts only (for Imagen 3)
- **Rate limits:** Standard API rate limits apply
- **Watermarks:** All images include invisible SynthID watermark
- **People:** Celebrity generation not allowed
- **Content:** Subject to Google's content policies

## Error Handling

Common error scenarios:

| Error | Cause | Solution |
|-------|-------|----------|
| `GOOGLE_API_KEY not configured` | Missing env var | Set `GOOGLE_API_KEY` in `.env` |
| `No content in response` | Safety filter blocked | Adjust prompt, avoid sensitive content |
| `Rate limit exceeded` | Too many requests | Implement backoff, reduce frequency |
| `Invalid aspectRatio` | Unsupported ratio | Use supported ratios from list above |

## Current Implementation

**File:** `server/src/services/imageGen.ts`

```typescript
const response = await client.models.generateContent({
  model: 'gemini-3-pro-image-preview',
  contents: variedPrompt,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: aspectRatio,  // Passed from request
      imageSize: '2K',           // Fixed at 2K resolution
    },
  },
});
```

## Pricing

- **Gemini Image Models:** Pricing varies by model and usage
- **Imagen 3:** ~$0.03 per image

## Migration Notes

Google recommends migrating to Imagen 4 GA models by November 30, 2025:
- `imagen-4.0-generate-001`
- `imagen-4.0-ultra-generate-001`
- `imagen-4.0-fast-generate-001`

## References

- [Google AI for Developers - Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google AI for Developers - Imagen](https://ai.google.dev/gemini-api/docs/imagen)
- [Vertex AI Image Generation Overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Imagen API Reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api)
- [Google Developers Blog - Imagen 3](https://developers.googleblog.com/en/imagen-3-arrives-in-the-gemini-api/)
