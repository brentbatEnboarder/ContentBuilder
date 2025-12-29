import { useState, useCallback } from 'react';
import { apiClient, GeneratedImage } from '@/services/api';
import { useStyleSettings } from './useStyleSettings';
import { useCompanySettings } from './useCompanySettings';

interface UseImageGenerationOptions {
  onImagesGenerated?: (images: string[]) => void;
}

export const useImageGeneration = ({ onImagesGenerated }: UseImageGenerationOptions = {}) => {
  const { settings: styleSettings } = useStyleSettings();
  const { settings: companySettings } = useCompanySettings();

  const [images, setImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert base64 image data to a data URL for display
   */
  const toDataUrl = (image: GeneratedImage): string => {
    return `data:${image.mimeType};base64,${image.base64Data}`;
  };

  /**
   * Extract a content summary from text (first ~500 chars or first paragraph)
   */
  const extractSummary = (text: string): string => {
    // Get first paragraph or first 500 characters
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph.length <= 500) {
      return firstParagraph;
    }
    return text.substring(0, 500) + '...';
  };

  /**
   * Generate images based on content text
   */
  const generateImages = useCallback(
    async (contentText: string, count: number = 3): Promise<string[]> => {
      if (!contentText.trim()) {
        setError('No content to generate images for');
        return [];
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await apiClient.generateImages({
          contentSummary: extractSummary(contentText),
          styleId: styleSettings.selectedStyle,
          brandColors: {
            primary: companySettings.colors.primary,
            secondary: companySettings.colors.secondary,
            accent: companySettings.colors.accent,
          },
          count,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to generate images');
        }

        const imageUrls = response.data.images.map(toDataUrl);
        setImages(imageUrls);

        if (onImagesGenerated) {
          onImagesGenerated(imageUrls);
        }

        return imageUrls;
      } catch (err) {
        console.error('Image generation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate images';
        setError(errorMessage);
        return [];
      } finally {
        setIsGenerating(false);
      }
    },
    [styleSettings.selectedStyle, companySettings.colors, onImagesGenerated]
  );

  /**
   * Regenerate a single image at a specific index
   */
  const regenerateImage = useCallback(
    async (index: number, originalPrompt?: string): Promise<string | null> => {
      if (index < 0 || index >= images.length) {
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        // If we have an original prompt, use it; otherwise generate a new image
        const response = await apiClient.regenerateImage({
          originalPrompt: originalPrompt || `Image ${index + 1} for content`,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to regenerate image');
        }

        const newImageUrl = toDataUrl(response.data);

        // Update the image at the specified index
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = newImageUrl;
          return updated;
        });

        return newImageUrl;
      } catch (err) {
        console.error('Image regeneration error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate image';
        setError(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [images.length]
  );

  /**
   * Clear all images
   */
  const clearImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return {
    images,
    isGenerating,
    error,
    generateImages,
    regenerateImage,
    clearImages,
    setImages,
  };
};
