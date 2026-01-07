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
  const [isPlanningLoading, setIsPlanningLoading] = useState(false); // Loading during planning conversation
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
    setIsPlanningLoading(true);
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
    } finally {
      setIsPlanningLoading(false);
    }
  }, [buildCompanyProfile, styleSettings.selectedStyle]);

  /**
   * Send a message to continue the planning conversation
   * Returns { message, isApproval, recommendations } - recommendations is the UPDATED plan
   * IMPORTANT: Always use the returned recommendations, not getRecommendationsForModal(),
   * because React state updates are async and may not be reflected immediately.
   */
  const sendPlanMessage = useCallback(async (
    content: string,
    userMessage: string
  ): Promise<{ message: string; isApproval: boolean; recommendations: ImageRecommendation[] } | null> => {
    setError(null);
    setIsPlanningLoading(true);

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

      // Return the fresh recommendations directly - don't rely on state which updates async
      const formattedRecommendations = result.recommendations.map((rec) => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        aspectRatio: rec.aspectRatio,
        placement: rec.placement,
      }));

      return { message: result.message, isApproval, recommendations: formattedRecommendations };
    } catch (err) {
      console.error('Failed to continue image planning:', err);
      setError(err instanceof Error ? err.message : 'Failed to continue planning');
      return null;
    } finally {
      setIsPlanningLoading(false);
    }
  }, [buildCompanyProfile, styleSettings.selectedStyle, conversationHistory, currentPlan]);

  /**
   * Generate all images based on the current plan
   * Returns the generated image sets
   */
  const generateImages = useCallback(async (_content: string): Promise<GeneratedImageSet[]> => {
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

        // Header images always use 21:9 ultrawide
        // Body images use AI-recommended aspect ratio (mapped to valid API values)
        let apiAspectRatio: '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '21:9';
        if (rec.type === 'header') {
          apiAspectRatio = '21:9';
        } else {
          // Map any legacy ratios to valid API values
          const ratioMap: Record<string, '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '21:9'> = {
            '2:1': '16:9',
            '3:4': '4:3',
          };
          apiAspectRatio = ratioMap[rec.aspectRatio] || (rec.aspectRatio as '1:1' | '16:9' | '4:3' | '3:2' | '9:16' | '21:9');
        }

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
    } catch (err: unknown) {
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
    setIsPlanningLoading(false);
    setCurrentPlan([]);
    setConversationHistory([]);
    setGeneratedImages([]);
    setError(null);
  }, []);

  /**
   * Get the prompt/description for a specific recommendation
   * Useful for the regenerate popover to show current prompt
   */
  const getPromptForRecommendation = useCallback(
    (recId: string): string => {
      const rec = currentPlan.find((r) => r.id === recId);
      return rec?.description || '';
    },
    [currentPlan]
  );

  /**
   * Get recommendations formatted for useImageModal
   * Maps the currentPlan to the format expected by startGeneration
   */
  const getRecommendationsForModal = useCallback(() => {
    return currentPlan.map((rec) => ({
      id: rec.id,
      type: rec.type,
      title: rec.title,
      description: rec.description,
      aspectRatio: rec.aspectRatio,
    }));
  }, [currentPlan]);

  return {
    state,
    currentPlan,
    conversationHistory,
    generatedImages,
    error,
    isPlanning: state === 'planning',
    isPlanningLoading, // True only during active API calls in planning phase
    isGenerating: state === 'generating',
    isComplete: state === 'complete',
    startPlanning,
    sendPlanMessage,
    generateImages,
    reset,
    getPromptForRecommendation,
    getRecommendationsForModal,
  };
};
