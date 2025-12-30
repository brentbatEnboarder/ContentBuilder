import type { AspectRatio, PlacementType } from './content';

// Re-export for convenience
export type { AspectRatio, PlacementType } from './content';

// Image placement with generated variations
export interface ImagePlacement {
  id: string;
  type: PlacementType;
  description: string;
  aspectRatio: AspectRatio;
  position?: string; // e.g., "After 'Welcome' section"
  images: GeneratedImageVariation[];
}

// A single generated image variation
export interface GeneratedImageVariation {
  id: string;
  url: string;
  isLoading: boolean;
  prompt?: string; // The prompt used to generate
  seed?: number; // For reproducibility
}

// Progress tracking during generation
export interface GenerationProgress {
  currentPlacement: PlacementType;
  completedImages: number;
  totalImages: number;
  message: string;
  percent: number;
}

// Flattened image for lightbox navigation
export interface LightboxImage {
  id: string;
  url: string;
  placementId: string;
  placementType: PlacementType;
  variationIndex: number; // 0-based
  variationTotal: number; // typically 3
}

// Image being edited in the edit panel
export interface EditingImage {
  id: string;
  url: string;
  placementId: string;
  placementType: PlacementType;
}

// Modal state machine states
export type ImageModalState =
  | 'closed'
  | 'generating'
  | 'selecting'
  | 'lightbox'
  | 'editing'
  | 'regenerating';

// Regenerate popover data
export interface RegeneratePopoverData {
  placementId: string;
  placementType: PlacementType;
  currentPrompt: string;
  anchorRect: DOMRect | null;
}
