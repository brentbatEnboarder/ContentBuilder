import { useState, useCallback, useMemo } from 'react';
import { apiClient } from '../services/api';
import type {
  ImagePlacement,
  GenerationProgress,
  LightboxImage,
  EditingImage,
  ImageModalState,
} from '../types/imageGeneration';
import type { ContentBlock, AspectRatio } from '../types/content';

interface UseImageModalOptions {
  onImagesApplied?: (blocks: ContentBlock[]) => void;
}

interface ImageRecommendation {
  id: string;
  type: 'header' | 'body';
  title: string;
  description: string;
  aspectRatio: string;
}

export function useImageModal(options: UseImageModalOptions = {}) {
  // Modal state machine
  const [modalState, setModalState] = useState<ImageModalState>('closed');
  const [placements, setPlacements] = useState<ImagePlacement[]>([]);
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [skippedPlacements, setSkippedPlacements] = useState<Set<string>>(new Set());
  const [currentStyleId, setCurrentStyleId] = useState<string>('flat');
  const [isGeneratingMore, setIsGeneratingMore] = useState(false); // Background generation in progress
  const [progress, setProgress] = useState<GenerationProgress>({
    currentPlacement: 'header',
    completedImages: 0,
    totalImages: 0,
    message: 'Starting...',
    percent: 0,
  });

  // Lightbox state
  const [currentLightboxId, setCurrentLightboxId] = useState<string | null>(null);

  // Edit panel state
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  // Regenerate popover state
  const [regenerateData, setRegenerateData] = useState<{
    placementId: string;
    anchorRect: DOMRect | null;
  } | null>(null);

  // Flatten images for lightbox navigation
  const lightboxImages = useMemo<LightboxImage[]>(() => {
    return placements.flatMap((placement) =>
      placement.images.map((img, idx) => ({
        id: img.id,
        url: img.url,
        placementId: placement.id,
        placementType: placement.type,
        variationIndex: idx,
        variationTotal: placement.images.length,
      }))
    );
  }, [placements]);

  // Start image generation from recommendations
  const startGeneration = useCallback(
    async (
      recommendations: ImageRecommendation[],
      styleId: string,
      brandColors?: { primary: string; secondary?: string; accent?: string }
    ) => {
      setModalState('generating');
      setCurrentStyleId(styleId);
      setIsGeneratingMore(true);
      const totalImages = recommendations.length * 3;

      // Initialize placements with loading state
      const initialPlacements: ImagePlacement[] = recommendations.map((rec) => ({
        id: rec.id,
        type: rec.type,
        description: rec.description,
        aspectRatio: (rec.type === 'header' ? '21:9' : rec.aspectRatio || '16:9') as AspectRatio,
        images: [
          { id: `${rec.id}-0`, url: '', isLoading: true },
          { id: `${rec.id}-1`, url: '', isLoading: true },
          { id: `${rec.id}-2`, url: '', isLoading: true },
        ],
      }));
      setPlacements(initialPlacements);
      setSelectedImages({});
      setSkippedPlacements(new Set());

      let completedCount = 0;
      let firstBatchComplete = false;

      // Generate images for each placement sequentially
      for (const [idx, rec] of recommendations.entries()) {
        const remainingPlacements = recommendations.length - idx;
        setProgress({
          currentPlacement: rec.type,
          completedImages: completedCount,
          totalImages,
          message: firstBatchComplete
            ? `Generating ${remainingPlacements} more image${remainingPlacements > 1 ? 's' : ''}...`
            : `Generating ${rec.type} image...`,
          percent: Math.round((completedCount / totalImages) * 100),
        });

        try {
          const response = await apiClient.generateImages({
            contentSummary: rec.description,
            styleId,
            brandColors,
            aspectRatio: (rec.type === 'header' ? '21:9' : rec.aspectRatio) as AspectRatio,
            count: 3,
          });

          if (response.success && response.data) {
            // Convert base64 to data URLs
            const images = response.data.images.map((img, i) => ({
              id: `${rec.id}-${i}`,
              url: `data:${img.mimeType};base64,${img.base64Data}`,
              isLoading: false,
              prompt: rec.description,
            }));

            setPlacements((prev) =>
              prev.map((p, i) => (i === idx ? { ...p, images } : p))
            );

            // Auto-select the first image for each placement
            setSelectedImages((prev) => ({
              ...prev,
              [rec.id]: `${rec.id}-0`,
            }));

            // After first successful batch, switch to selecting mode so user can interact
            if (!firstBatchComplete) {
              firstBatchComplete = true;
              setModalState('selecting');
            }
          }
        } catch (error) {
          console.error(`Failed to generate images for ${rec.id}:`, error);
          // Mark images as failed (keep loading false but empty URL)
          setPlacements((prev) =>
            prev.map((p, i) =>
              i === idx
                ? { ...p, images: p.images.map((img) => ({ ...img, isLoading: false })) }
                : p
            )
          );

          // Even on error, switch to selecting mode so user can see what happened
          if (!firstBatchComplete) {
            firstBatchComplete = true;
            setModalState('selecting');
          }
        }

        completedCount += 3;
      }

      setProgress({
        currentPlacement: 'body',
        completedImages: totalImages,
        totalImages,
        message: 'All images complete!',
        percent: 100,
      });

      setIsGeneratingMore(false);
    },
    []
  );

  // Select an image for a placement
  const selectImage = useCallback((placementId: string, imageId: string) => {
    setSelectedImages((prev) => ({ ...prev, [placementId]: imageId }));
    // If this placement was skipped, unskip it
    setSkippedPlacements((prev) => {
      if (prev.has(placementId)) {
        const newSet = new Set(prev);
        newSet.delete(placementId);
        return newSet;
      }
      return prev;
    });
  }, []);

  // Skip/unskip a placement
  const skipPlacement = useCallback((placementId: string, skip: boolean) => {
    setSkippedPlacements((prev) => {
      const newSet = new Set(prev);
      if (skip) {
        newSet.add(placementId);
      } else {
        newSet.delete(placementId);
      }
      return newSet;
    });
  }, []);

  // Open lightbox (placementId kept for interface consistency)
  const openLightbox = useCallback((_placementId: string, imageId: string) => {
    setCurrentLightboxId(imageId);
    setModalState('lightbox');
  }, []);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setCurrentLightboxId(null);
    setModalState('selecting');
  }, []);

  // Navigate in lightbox
  const navigateLightbox = useCallback((imageId: string) => {
    setCurrentLightboxId(imageId);
  }, []);

  // Open edit panel
  const openEdit = useCallback(
    (imageId: string, placementId: string) => {
      const placement = placements.find((p) => p.id === placementId);
      const image = placement?.images.find((img) => img.id === imageId);
      if (placement && image) {
        setEditingImage({
          id: image.id,
          url: image.url,
          placementId: placement.id,
          placementType: placement.type,
        });
        setModalState('editing');
      }
    },
    [placements]
  );

  // Submit edit
  const submitEdit = useCallback(
    async (imageId: string, placementId: string, editPrompt: string) => {
      const placement = placements.find((p) => p.id === placementId);
      const image = placement?.images.find((img) => img.id === imageId);
      if (!placement || !image) return;

      setIsEditLoading(true);
      setEditError(undefined);

      try {
        const response = await apiClient.editImage({
          referenceImage: image.url,
          editPrompt,
          aspectRatio: placement.aspectRatio,
          placementType: placement.type,
        });

        if (response.success && response.data) {
          const newUrl = `data:${response.data.mimeType};base64,${response.data.base64Data}`;

          // Update the image in placements
          setPlacements((prev) =>
            prev.map((p) =>
              p.id === placementId
                ? {
                    ...p,
                    images: p.images.map((img) =>
                      img.id === imageId ? { ...img, url: newUrl } : img
                    ),
                  }
                : p
            )
          );

          closeEdit();
        } else {
          setEditError(response.error || 'Failed to edit image');
        }
      } catch (error) {
        setEditError('Failed to edit image. Please try again.');
      } finally {
        setIsEditLoading(false);
      }
    },
    [placements]
  );

  // Close edit panel
  const closeEdit = useCallback(() => {
    setEditingImage(null);
    setEditError(undefined);
    setModalState('selecting');
  }, []);

  // Open regenerate popover
  const openRegenerate = useCallback((placementId: string, anchorRect: DOMRect | null) => {
    setRegenerateData({ placementId, anchorRect });
  }, []);

  // Regenerate placement images
  const regeneratePlacement = useCallback(
    async (placementId: string, newPrompt: string) => {
      const placement = placements.find((p) => p.id === placementId);
      if (!placement) return;

      // Set images to loading
      setPlacements((prev) =>
        prev.map((p) =>
          p.id === placementId
            ? { ...p, images: p.images.map((img) => ({ ...img, isLoading: true, url: '' })) }
            : p
        )
      );
      setRegenerateData(null);

      try {
        const response = await apiClient.generateImages({
          contentSummary: newPrompt,
          styleId: currentStyleId,
          aspectRatio: placement.aspectRatio,
          count: 3,
        });

        if (response.success && response.data) {
          const images = response.data.images.map((img, i) => ({
            id: `${placementId}-${i}-${Date.now()}`,
            url: `data:${img.mimeType};base64,${img.base64Data}`,
            isLoading: false,
            prompt: newPrompt,
          }));

          setPlacements((prev) =>
            prev.map((p) => (p.id === placementId ? { ...p, description: newPrompt, images } : p))
          );

          // Auto-select the first regenerated image
          setSelectedImages((prev) => ({
            ...prev,
            [placementId]: images[0].id,
          }));
        }
      } catch (error) {
        console.error('Failed to regenerate:', error);
        // Reset loading state
        setPlacements((prev) =>
          prev.map((p) =>
            p.id === placementId
              ? { ...p, images: p.images.map((img) => ({ ...img, isLoading: false })) }
              : p
          )
        );
      }
    },
    [placements, currentStyleId]
  );

  // Close regenerate popover
  const closeRegenerate = useCallback(() => {
    setRegenerateData(null);
  }, []);

  // Apply selected images to content blocks
  const applyImages = useCallback((): ContentBlock[] => {
    const imageBlocks: ContentBlock[] = [];

    for (const placement of placements) {
      if (skippedPlacements.has(placement.id)) continue;

      const selectedImageId = selectedImages[placement.id];
      const selectedImage = placement.images.find((img) => img.id === selectedImageId);

      if (selectedImage && selectedImage.url) {
        imageBlocks.push({
          type: 'image',
          id: `block-${placement.id}`,
          imageUrl: selectedImage.url,
          aspectRatio: placement.aspectRatio,
          placementType: placement.type,
          altText: placement.description,
        });
      }
    }

    options.onImagesApplied?.(imageBlocks);
    closeModal();
    return imageBlocks;
  }, [placements, selectedImages, skippedPlacements, options]);

  // Close modal and reset all state
  const closeModal = useCallback(() => {
    setModalState('closed');
    setPlacements([]);
    setSelectedImages({});
    setSkippedPlacements(new Set());
    setCurrentLightboxId(null);
    setEditingImage(null);
    setRegenerateData(null);
    setIsGeneratingMore(false);
    setProgress({
      currentPlacement: 'header',
      completedImages: 0,
      totalImages: 0,
      message: 'Starting...',
      percent: 0,
    });
  }, []);

  // Check if we can apply (at least one non-skipped placement with a selection)
  const canApply = useMemo(() => {
    return placements.some((p) => {
      if (skippedPlacements.has(p.id)) return false;
      const selectedId = selectedImages[p.id];
      const selectedImage = p.images.find((img) => img.id === selectedId);
      return selectedImage && selectedImage.url;
    });
  }, [placements, selectedImages, skippedPlacements]);

  return {
    // State
    modalState,
    isOpen: modalState !== 'closed',
    isLoading: modalState === 'generating',
    isGeneratingMore, // True while background generation continues after first batch
    placements,
    selectedImages,
    skippedPlacements,
    progress,
    lightboxImages,
    currentLightboxId,
    editingImage,
    isEditLoading,
    editError,
    regenerateData,
    canApply,

    // Actions
    startGeneration,
    selectImage,
    skipPlacement,
    openLightbox,
    closeLightbox,
    navigateLightbox,
    openEdit,
    submitEdit,
    closeEdit,
    openRegenerate,
    regeneratePlacement,
    closeRegenerate,
    applyImages,
    closeModal,
  };
}
