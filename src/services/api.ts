import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export const apiClient = {
  health: async (): Promise<HealthResponse> => {
    const { data } = await api.get<HealthResponse>('/health');
    return data;
  },

  scrape: async (url: string) => {
    const { data } = await api.post('/scrape', { url });
    return data;
  },

  generateText: async (params: {
    objective: string;
    companyProfile: string;
    voiceSettings: Record<string, number>;
  }) => {
    const { data } = await api.post('/generate/text', params);
    return data;
  },

  generateImages: async (params: {
    contentSummary: string;
    styleId: string;
    customPrompt?: string;
  }) => {
    const { data } = await api.post('/generate/images', params);
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
};

export default apiClient;
