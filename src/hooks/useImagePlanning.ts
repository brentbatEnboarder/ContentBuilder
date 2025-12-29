import { useState, useCallback } from 'react';
import { apiClient, ImageRecommendation, CompanyProfile } from '@/services/api';
import { useCompanySettings } from './useCompanySettings';
import { useStyleSettings } from './useStyleSettings';

export type ImagePlanningState = 'none' | 'planning' | 'generating' | 'complete';

export interface GeneratedImageSet {
  recommendationId: string;
  type: 'header' | 'body';
  title: string;
  aspectRatio: string;
  placement: 'top' | 'bottom';
  images: string[]; // base64 data URLs
}

export const useImagePlanning = () => {
  const { settings: companySettings } = useCompanySettings();
  const { settings: styleSettings } = useStyleSettings();

  const [state, setState] = useState<ImagePlanningState>('none');
  const [currentPlan, setCurrentPlan] = useState<ImageRecommendation[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  const buildCompanyProfile = useCallback((): CompanyProfile => ({
    websiteUrl: companySettings.url || '',
    companyProfile: `${companySettings.name}${companySettings.industry ? ` - ${companySettings.industry}` : ''}. ${companySettings.description}`,
    brandColors: {
      primary: companySettings.colors.primary,
      secondary: companySettings.colors.secondary,
      accent: companySettings.colors.accent,
    },
  }), [companySettings]);

  /**
   * Start image planning - analyze content and get initial recommendations
   * Returns the AI's message to display in chat
   */
  const startPlanning = useCallback(async (content: string): Promise<string | null> => {
    setState('planning');
    setError(null);
    setConversationHistory([]);
    setCurrentPlan([]);

    try {
      const result = await apiClient.getImagePlan({
        content,
        companyProfile: buildCompanyProfile(),
        imageStyle: styleSettings.selectedStyle,
      });

      setCurrentPlan(result.recommendations);
      setConversationHistory([
        { role: 'user', content: 'Please analyze this content and recommend images.' },
        { role: 'assistant', content: result.message },
      ]);

      return result.message;
    } catch (err) {
      console.error('Failed to start image planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
      setState('none');
      return null;
    }
  }, [buildCompanyProfile, styleSettings.selectedStyle]);

  /**
   * Send a message to continue the planning conversation
   * Returns { message, isApproval } - message is AI response, isApproval indicates if user approved
   */
  const sendPlanMessage = useCallback(async (
    content: string,
    userMessage: string
  ): Promise<{ message: string; isApproval: boolean } | null> => {
    setError(null);

    // Check for approval phrases
    const approvalPhrases = [
      'go ahead',
      'generate',
      'looks good',
      'yes',
      'proceed',
      'do it',
      'create them',
      'make them',
      'start generating',
      "let's do it",
      'approved',
      'perfect',
      'great',
      'ok',
      'okay',
    ];

    const isApproval = approvalPhrases.some((phrase) =>
      userMessage.toLowerCase().includes(phrase)
    );

    try {
      const result = await apiClient.continueImagePlan({
        content,
        companyProfile: buildCompanyProfile(),
        imageStyle: styleSettings.selectedStyle,
        conversationHistory,
        currentPlan,
        userMessage,
      });

      setCurrentPlan(result.recommendations);
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: result.message },
      ]);

      return { message: result.message, isApproval };
    } catch (err) {
      console.error('Failed to continue image planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to continue planning');
      return null;
    }
  }, [buildCompanyProfile, styleSettings.selectedStyle, conversationHistory, currentPlan]);

  /**
   * Generate all images based on the current plan
   * Returns the generated image sets
   */
  const generateImages = useCallback(async (content: string): Promise<GeneratedImageSet[]> => {
    if (currentPlan.length === 0) {
      setError('No images to generate');
      return [];
    }

    setState('generating');
    setError(null);

    const generated: GeneratedImageSet[] = [];

    try {
      // Generate images for each recommendation
      for (const rec of currentPlan) {
        // Build a detailed prompt from the recommendation
        const prompt = `${rec.description}. Style: ${styleSettings.selectedStyle}. Brand colors: ${companySettings.colors.primary}.`;

        // Map 2:1 to 16:9 since API doesn't support 2:1 directly
        const apiAspectRatio = rec.aspectRatio === '2:1' ? '16:9' :
          rec.aspectRatio === '3:4' ? '4:3' : // API might not support 3:4
          rec.aspectRatio as '1:1' | '16:9' | '4:3' | '3:2';

        const result = await apiClient.generateImages({
          contentSummary: prompt,
          styleId: styleSettings.selectedStyle,
          brandColors: {
            primary: companySettings.colors.primary,
            secondary: companySettings.colors.secondary,
            accent: companySettings.colors.accent,
          },
          aspectRatio: apiAspectRatio,
          count: 3,
        });

        if (result.success && result.data) {
          generated.push({
            recommendationId: rec.id,
            type: rec.type,
            title: rec.title,
            aspectRatio: rec.aspectRatio,
            placement: rec.placement,
            images: result.data.images.map(
              (img) => `data:${img.mimeType};base64,${img.base64Data}`
            ),
          });
        }
      }

      setGeneratedImages(generated);
      setState('complete');
      return generated;
    } catch (err) {
      console.error('Failed to generate images:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
      setState('planning'); // Go back to planning state on error
      return [];
    }
  }, [currentPlan, styleSettings.selectedStyle, companySettings.colors]);

  /**
   * Reset the image planning state
   */
  const reset = useCallback(() => {
    setState('none');
    setCurrentPlan([]);
    setConversationHistory([]);
    setGeneratedImages([]);
    setError(null);
  }, []);

  return {
    state,
    currentPlan,
    conversationHistory,
    generatedImages,
    error,
    isPlanning: state === 'planning',
    isGenerating: state === 'generating',
    isComplete: state === 'complete',
    startPlanning,
    sendPlanMessage,
    generateImages,
    reset,
  };
};
