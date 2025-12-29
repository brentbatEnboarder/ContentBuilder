import axios from 'axios';
import { supabase } from '@/lib/supabase';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.warn('Failed to get auth session:', error);
    return null;
  }
};

// Add auth token to all axios requests
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API request unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Types
// ============================================================================

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface CompanyProfile {
  websiteUrl?: string;
  companyProfile?: string;
  brandColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
}

export interface VoiceSettings {
  formality: number;
  humor: number;
  respect: number;
  enthusiasm: number;
}

export interface GenerateTextRequest {
  objective: string;
  companyProfile: CompanyProfile;
  voiceSettings: VoiceSettings;
  imageStyle?: string;
  sourceMaterials?: string[];
  feedback?: string;
  stream?: boolean;
  currentContent?: string;
}

export interface GenerateTextResponse {
  success: boolean;
  data?: {
    text: string;
    tokensUsed?: number;
  };
  error?: string;
}

export interface GenerateImagesRequest {
  contentSummary: string;
  styleId: string;
  customPrompt?: string;
  brandColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
  count?: number;
}

export interface GeneratedImage {
  id: string;
  base64Data: string;
  mimeType: string;
}

export interface GenerateImagesResponse {
  success: boolean;
  data?: {
    images: GeneratedImage[];
    styleId: string;
    count: number;
  };
  error?: string;
}

export interface ProcessedFileResult {
  success: boolean;
  data: {
    type: 'text' | 'document';
    text?: string;
    document?: {
      mediaType: string;
      base64Data: string;
      fileName?: string;
    };
    fileName?: string;
    fileSize?: number;
    pageCount?: number;
    preview?: string;
    metadata?: Record<string, string>;
  };
}

export interface ProcessedUrlResult {
  success: boolean;
  data: {
    type: 'text';
    text: string;
    title?: string;
    description?: string;
    url: string;
    preview?: string;
  };
}

// ============================================================================
// Intelligent Scraper Types
// ============================================================================

export interface ScrapeProgress {
  type: 'status' | 'page_scraped' | 'analyzing' | 'extracting' | 'complete' | 'error';
  message: string;
  pageUrl?: string;
  pageTitle?: string;
  pagesScraped?: number;
  totalPages?: number;
  result?: ExtractedCompanyInfo;
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  buttonBg: string;
  buttonFg: string;
}

export interface ExtractedCompanyInfo {
  name: string;
  industry: string;
  description: string;
  logo: string | null;
  colors: BrandColors;
  pagesScraped: string[];
  scrapedAt: string;
  canScanMore: boolean;
  remainingLinks: string[];
}

// ============================================================================
// API Client
// ============================================================================

export const apiClient = {
  health: async (): Promise<HealthResponse> => {
    const { data } = await api.get<HealthResponse>('/health');
    return data;
  },

  scrape: async (url: string) => {
    const { data } = await api.post('/scrape', { url });
    return data;
  },

  /**
   * Generate text content (non-streaming)
   */
  generateText: async (params: GenerateTextRequest): Promise<GenerateTextResponse> => {
    const { data } = await api.post('/generate/text', { ...params, stream: false });
    return data;
  },

  /**
   * Generate text content with SSE streaming
   * Uses native fetch instead of axios for proper stream handling
   */
  generateTextStream: async (
    params: Omit<GenerateTextRequest, 'stream'>,
    onChunk: (text: string) => void,
    onComplete: (fullText: string) => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    const token = await getAuthToken();
    let fullText = '';

    try {
      const response = await fetch('/api/generate/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...params, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (each ends with \n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          // Parse SSE format: "data: {...}"
          const dataMatch = message.match(/^data:\s*(.+)$/m);
          if (!dataMatch) continue;

          const dataStr = dataMatch[1].trim();
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.text) {
              fullText += data.text;
              onChunk(data.text);
            }
          } catch (parseError) {
            // Skip malformed JSON
            console.warn('Failed to parse SSE message:', dataStr);
          }
        }
      }

      onComplete(fullText);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  },

  /**
   * Generate images using Gemini
   */
  generateImages: async (params: GenerateImagesRequest): Promise<GenerateImagesResponse> => {
    const { data } = await api.post('/generate/images', params);
    return data;
  },

  /**
   * Regenerate a single image
   */
  regenerateImage: async (params: {
    originalPrompt: string;
    modifiedPrompt?: string;
    aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2';
  }): Promise<{ success: boolean; data?: GeneratedImage; error?: string }> => {
    const { data } = await api.post('/generate/images/regenerate', params);
    return data;
  },

  transcribe: async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const { data } = await api.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },

  /**
   * Process an uploaded file (PDF, DOCX, TXT, PPTX)
   */
  processFile: async (file: File): Promise<ProcessedFileResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<ProcessedFileResult>('/process/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  },

  /**
   * Extract content from a URL
   */
  processUrl: async (url: string): Promise<ProcessedUrlResult> => {
    const { data } = await api.post<ProcessedUrlResult>('/process/url', { url });
    return data;
  },

  /**
   * Get supported file types
   */
  getSupportedTypes: async () => {
    const { data } = await api.get('/process/supported-types');
    return data;
  },

  /**
   * Intelligent multi-page scraping with Claude analysis (SSE streaming)
   * Returns company info extracted from multiple relevant pages
   */
  scrapeIntelligent: async (
    url: string,
    onProgress: (progress: ScrapeProgress) => void,
    options?: { maxPages?: number; scanMore?: boolean }
  ): Promise<ExtractedCompanyInfo | null> => {
    const token = await getAuthToken();

    const response = await fetch('/api/scrape/intelligent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ url, ...options }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: ExtractedCompanyInfo | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages (each ends with \n\n)
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer

      for (const message of messages) {
        if (!message.trim() || message.trim() === 'data: [DONE]') continue;

        // Parse SSE format: "data: {...}"
        const dataMatch = message.match(/^data:\s*(.+)$/m);
        if (!dataMatch) continue;

        try {
          const data = JSON.parse(dataMatch[1]) as ScrapeProgress;
          onProgress(data);

          // Capture result from complete message
          if (data.type === 'complete' && data.result) {
            result = data.result;
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE message:', dataMatch[1]);
        }
      }
    }

    return result;
  },
};

export default apiClient;
