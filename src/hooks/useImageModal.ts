import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { apiClient } from '../services/api';
import type {
  ImagePlacement,
  GenerationProgress,
  LightboxImage,
  EditingImage,
  ImageModalState,
} from '../types/imageGeneration';
import type { ContentBlock, AspectRatio } from '../types/content';

// ============================================================================
// Draft persistence for tab switching
// ============================================================================

const DRAFT_KEY = 'contentbuilder_image_modal_draft';
const DRAFT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes (image generation sessions are shorter)

interface ImageModalDraft {
  modalState: ImageModalState;
  placements: ImagePlacement[];
  selectedImages: Record<string, string>;
  skippedPlacements: string[];
  currentStyleId: string;
  progress: GenerationProgress;
  savedAt: number;
}

function loadImageModalDraft(): ImageModalDraft | null {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const draft = JSON.parse(saved) as ImageModalDraft;
    // Check expiry
    if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
      sessionStorage.removeItem(DRAFT_KEY);
      return null;
    }
    // Only restore if modal was actively in use
    if (draft.modalState === 'closed' || draft.placements.length === 0) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveImageModalDraft(draft: ImageModalDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

function clearImageModalDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore errors
  }
}

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

// Valid aspect ratios accepted by the image generation API
const VALID_ASPECT_RATIOS = ['1:1', '16:9', '4:3', '3:2', '9:16', '21:9'] as const;

/**
 * Normalize aspect ratio from AI recommendations to valid API values.
 * The AI may return values like '2:1' or '3:4' which the API doesn't accept.
 */
function normalizeAspectRatio(ratio: string | undefined, placementType: 'header' | 'body'): AspectRatio {
  // Headers always use ultrawide
  if (placementType === 'header') {
    return '21:9';
  }

  // If no ratio provided, default to 16:9
  if (!ratio) {
    return '16:9';
  }

  // If already valid, return as-is
  if (VALID_ASPECT_RATIOS.includes(ratio as typeof VALID_ASPECT_RATIOS[number])) {
    return ratio as AspectRatio;
  }

  // Map AI's non-standard ratios to valid ones
  const ratioMap: Record<string, AspectRatio> = {
    '2:1': '21:9',   // Ultrawide
    '3:4': '4:3',    // Flip to landscape (or could use 9:16 for portrait)
  };

  return ratioMap[ratio] || '16:9';
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

  // Track if we've restored from draft to prevent loops
  const hasRestoredRef = useRef(false);

  // Restore state from draft on mount (handles tab switching)
  useEffect(() => {
    if (hasRestoredRef.current) return;

    const draft = loadImageModalDraft();
    if (draft) {
      console.log('[useImageModal] Restoring draft from tab switch', {
        modalState: draft.modalState,
        placementCount: draft.placements.length,
        savedAt: new Date(draft.savedAt).toISOString(),
      });

      hasRestoredRef.current = true;
      setModalState(draft.modalState);
      setPlacements(draft.placements);
      setSelectedImages(draft.selectedImages);
      setSkippedPlacements(new Set(draft.skippedPlacements));
      setCurrentStyleId(draft.currentStyleId);
      setProgress(draft.progress);
    }
  }, []);

  // Auto-save draft when state changes (for tab switch protection)
  useEffect(() => {
    // Only save if modal is open and we have placements
    if (modalState === 'closed' || placements.length === 0) return;

    const draft: ImageModalDraft = {
      modalState,
      placements,
      selectedImages,
      skippedPlacements: Array.from(skippedPlacements),
      currentStyleId,
      progress,
      savedAt: Date.now(),
    };

    saveImageModalDraft(draft);
    console.log('[useImageModal] Draft saved', {
      modalState,
      placementCount: placements.length,
    });
  }, [modalState, placements, selectedImages, skippedPlacements, currentStyleId, progress]);

  // Save draft immediately when tab is hidden (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && modalState !== 'closed' && placements.length > 0) {
        const draft: ImageModalDraft = {
          modalState,
          placements,
          selectedImages,
          skippedPlacements: Array.from(skippedPlacements),
          currentStyleId,
          progress,
          savedAt: Date.now(),
        };

        saveImageModalDraft(draft);
        console.log('[useImageModal] Draft saved on tab hide', {
          modalState,
          placementCount: placements.length,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [modalState, placements, selectedImages, skippedPlacements, currentStyleId, progress]);

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
  // Now launches ALL placement requests in parallel for maximum speed
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
        aspectRatio: normalizeAspectRatio(rec.aspectRatio, rec.type),
        images: [
          { id: `${rec.id}-0`, url: '', isLoading: true },
          { id: `${rec.id}-1`, url: '', isLoading: true },
          { id: `${rec.id}-2`, url: '', isLoading: true },
        ],
      }));
      setPlacements(initialPlacements);
      setSelectedImages({});
      setSkippedPlacements(new Set());

      // Track completion for progress updates
      let completedCount = 0;
      let firstBatchComplete = false;

      setProgress({
        currentPlacement: 'header',
        completedImages: 0,
        totalImages,
        message: `Generating ${recommendations.length} images in parallel...`,
        percent: 0,
      });

      console.log(`[ImageModal] Starting PARALLEL generation for ${recommendations.length} placements`);
      const startTime = Date.now();

      // Create a streaming promise for each placement - all run in parallel
      // Uses SSE streaming to show each image as soon as it's ready
      const placementPromises = recommendations.map(async (rec) => {
        let placementImagesCompleted = 0;

        return new Promise<{ success: boolean; recId: string; error?: string }>((resolve) => {
          apiClient.generateImagesStream(
            {
              contentSummary: rec.description,
              styleId,
              brandColors,
              aspectRatio: normalizeAspectRatio(rec.aspectRatio, rec.type),
              count: 3,
            },
            // onImage - called for each image as it completes
            (image, variationIndex, _totalCount) => {
              const imageUrl = `data:${image.mimeType};base64,${image.base64Data}`;

              // Update this specific image slot immediately
              setPlacements((prev) =>
                prev.map((p) => {
                  if (p.id !== rec.id) return p;
                  const newImages = [...p.images];
                  newImages[variationIndex] = {
                    id: `${rec.id}-${variationIndex}`,
                    url: imageUrl,
                    isLoading: false,
                    prompt: rec.description,
                  };
                  return { ...p, images: newImages };
                })
              );

              placementImagesCompleted++;
              completedCount++;

              // Auto-select the first image when it arrives
              if (variationIndex === 0) {
                setSelectedImages((prev) => ({
                  ...prev,
                  [rec.id]: `${rec.id}-0`,
                }));
              }

              // Update progress
              const remainingImages = totalImages - completedCount;
              setProgress({
                currentPlacement: rec.type,
                completedImages: completedCount,
                totalImages,
                message: remainingImages > 0
                  ? `${remainingImages} image${remainingImages > 1 ? 's' : ''} remaining...`
                  : 'Finishing up...',
                percent: Math.round((completedCount / totalImages) * 100),
              });

              // After first image arrives, switch to selecting mode
              if (!firstBatchComplete) {
                firstBatchComplete = true;
                setModalState('selecting');
                console.log(`[ImageModal] First image arrived, switching to selecting mode`);
              }
            },
            // onComplete - called when all images for this placement are done
            (_duration) => {
              resolve({ success: placementImagesCompleted > 0, recId: rec.id });
            },
            // onError - called on errors
            (error, variationIndex) => {
              console.error(`Failed to generate image for ${rec.id}:`, error);

              if (variationIndex !== undefined) {
                // Mark specific image as failed
                setPlacements((prev) =>
                  prev.map((p) => {
                    if (p.id !== rec.id) return p;
                    const newImages = [...p.images];
                    newImages[variationIndex] = {
                      ...newImages[variationIndex],
                      isLoading: false,
                    };
                    return { ...p, images: newImages };
                  })
                );
                completedCount++;
              } else {
                // Mark all images as failed
                setPlacements((prev) =>
                  prev.map((p) =>
                    p.id === rec.id
                      ? { ...p, images: p.images.map((img) => ({ ...img, isLoading: false })) }
                      : p
                  )
                );
                completedCount += 3;
              }

              setProgress((prev) => ({
                ...prev,
                completedImages: completedCount,
                percent: Math.round((completedCount / totalImages) * 100),
              }));

              // Even on error, switch to selecting mode
              if (!firstBatchComplete) {
                firstBatchComplete = true;
                setModalState('selecting');
              }

              resolve({ success: false, recId: rec.id, error });
            }
          );
        });
      });

      // Wait for all placements to complete (success or failure)
      const results = await Promise.allSettled(placementPromises);

      const duration = Date.now() - startTime;
      const successCount = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success
      ).length;
      console.log(`[ImageModal] Completed ${successCount}/${recommendations.length} placements in ${duration}ms (parallel)`);

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
  // styleId parameter allows overriding the style for this specific regeneration
  const regeneratePlacement = useCallback(
    async (placementId: string, newPrompt: string, styleId?: string) => {
      const placement = placements.find((p) => p.id === placementId);
      if (!placement) return;

      // Use provided styleId or fall back to currentStyleId
      const effectiveStyleId = styleId || currentStyleId;

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
          styleId: effectiveStyleId,
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
    // Clear the draft when modal is explicitly closed
    clearImageModalDraft();
    console.log('[useImageModal] Modal closed, draft cleared');
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
