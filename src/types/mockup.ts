/**
 * Types for device mockup generation feature
 */

export interface MockupTemplate {
  id: string;
  name: string;
  imagePath: string;
  description: string;
}

export interface MockupResult {
  id: string;
  imageUrl: string; // data URL
  templateId: string;
}

export interface MockupGenerationRequest {
  mockupTemplateBase64: string;
  contentScreenshotBase64: string;
  templateName: string;
}

export interface MockupGenerationResponse {
  success: boolean;
  data?: {
    images: Array<{
      id: string;
      base64Data: string;
      mimeType: string;
    }>;
  };
  error?: string;
}

// The 5 available mockup templates
export const MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: 'mock1',
    name: 'Office Desk',
    imagePath: '/Mock1.png',
    description: 'Hand holding phone at a professional desk setting',
  },
  {
    id: 'mock2',
    name: 'Coffee Shop',
    imagePath: '/Mock2.png',
    description: 'Hand holding phone at a cozy cafe',
  },
  {
    id: 'mock3',
    name: 'City Night',
    imagePath: '/Mock3.png',
    description: 'Two hands holding phone with city bokeh lights',
  },
  {
    id: 'mock4',
    name: 'Floating Pro',
    imagePath: '/Mock4.png',
    description: 'Professional floating phone on gradient background',
  },
  {
    id: 'mock5',
    name: 'Purple Glow',
    imagePath: '/Mock5.png',
    description: 'Floating phone with purple ambient lighting',
  },
];

// iPhone screen aspect ratio (19.5:9 = approximately 2.167:1)
export const IPHONE_ASPECT_RATIO = 19.5 / 9;

// Typical iPhone screen dimensions for rendering
export const IPHONE_SCREEN_WIDTH = 390;
export const IPHONE_SCREEN_HEIGHT = Math.round(390 * IPHONE_ASPECT_RATIO); // ~845px
