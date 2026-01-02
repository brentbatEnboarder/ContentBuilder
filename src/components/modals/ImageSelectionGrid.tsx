import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';
import { StyleDropdown } from '../preview/StyleDropdown';
import { useStyleSettings } from '../../hooks/useStyleSettings';
import type { ImagePlacement, AspectRatio } from '../../types/imageGeneration';

interface ImageSelectionGridProps {
  placements: ImagePlacement[];
  selectedImages: Record<string, string>;
  skippedPlacements: Set<string>;
  onSelectImage: (placementId: string, imageId: string) => void;
  onSkipPlacement: (placementId: string, skipped: boolean) => void;
  onRegenerate: (placementId: string, styleId: string) => void;
  onImageClick: (placementId: string, imageId: string) => void;
  onEditClick: (placementId: string, imageId: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

// Aspect ratio to padding-bottom percentage mapping
const aspectRatioMap: Record<AspectRatio, string> = {
  '21:9': '42.86%',
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
  '3:2': '66.67%',
  '9:16': '177.78%',
};

// Skeleton with shimmer effect
const ImageSkeleton = ({ aspectRatio }: { aspectRatio: AspectRatio }) => (
  <div
    className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
    style={{ paddingBottom: aspectRatioMap[aspectRatio] || '56.25%' }}
  >
    <div className="absolute inset-0">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  </div>
);

// Individual image card with hover and selection
const SelectableImageCard = ({
  image,
  aspectRatio,
  isSelected,
  isSkipped,
  index,
  onSelect,
  onEdit,
  onClick,
}: {
  image: { id: string; url: string; isLoading: boolean };
  aspectRatio: AspectRatio;
  isSelected: boolean;
  isSkipped: boolean;
  index: number;
  onSelect: () => void;
  onEdit: () => void;
  onClick: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (image.isLoading) {
    return <ImageSkeleton aspectRatio={aspectRatio} />;
  }

  return (
    <motion.div
      className={cn(
        'relative w-full overflow-hidden rounded-lg border cursor-pointer transition-all duration-200',
        isSelected ? 'border-primary border-[3px] shadow-lg' : 'border-border',
        isSkipped && 'opacity-40 pointer-events-none'
      )}
      style={{ paddingBottom: aspectRatioMap[aspectRatio] || '56.25%' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      onMouseEnter={() => !isSkipped && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <motion.img
        src={image.url}
        alt="Generated image"
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Loading placeholder while image loads */}
      {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* Selection badge */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && !isSkipped && (
          <motion.div
            className="absolute inset-0 bg-foreground/50 flex flex-col items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Button
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Check className="w-4 h-4" />
              Select
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 bg-background hover:bg-background/90"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Placement group component
const PlacementGroup = ({
  placement,
  selectedImageId,
  isSkipped,
  currentStyleId,
  onSelectImage,
  onSkip,
  onRegenerate,
  onImageClick,
  onEditClick,
  isLast,
}: {
  placement: ImagePlacement;
  selectedImageId?: string;
  isSkipped: boolean;
  currentStyleId: string;
  onSelectImage: (imageId: string) => void;
  onSkip: (skipped: boolean) => void;
  onRegenerate: (styleId: string) => void;
  onImageClick: (imageId: string) => void;
  onEditClick: (imageId: string) => void;
  isLast: boolean;
}) => {
  const placementLabel = placement.type.toUpperCase() + ' IMAGE';

  return (
    <div className={cn('pb-6', !isLast && 'border-b border-border mb-6')}>
      {/* Placement label */}
      <div className="mb-2">
        <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {placementLabel}
        </span>
      </div>

      {/* Prompt + controls row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Prompt - wraps to 2 lines */}
        <p className="text-sm text-muted-foreground/80 italic line-clamp-2 flex-1 min-w-0">
          &quot;{placement.description}&quot;
        </p>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <StyleDropdown
            onNavigateToSettings={() => {}}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => onRegenerate(currentStyleId)}
            disabled={isSkipped}
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate All
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isSkipped} onCheckedChange={(checked) => onSkip(checked === true)} />
            <span className="text-sm text-muted-foreground">Skip</span>
          </label>
        </div>
      </div>

      {/* Position indicator */}
      {placement.position && (
        <p className="text-xs text-muted-foreground mb-3">Position: {placement.position}</p>
      )}

      {/* Image grid */}
      <div
        className={cn('grid gap-4 transition-opacity duration-300', isSkipped && 'opacity-40')}
        style={{
          gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
        }}
      >
        {placement.images.map((image, index) => (
          <SelectableImageCard
            key={image.id}
            image={image}
            aspectRatio={placement.aspectRatio}
            isSelected={selectedImageId === image.id}
            isSkipped={isSkipped}
            index={index}
            onSelect={() => onSelectImage(image.id)}
            onEdit={() => onEditClick(image.id)}
            onClick={() => onImageClick(image.id)}
          />
        ))}
      </div>
    </div>
  );
};

export const ImageSelectionGrid = ({
  placements,
  selectedImages,
  skippedPlacements,
  onSelectImage,
  onSkipPlacement,
  onRegenerate,
  onImageClick,
  onEditClick,
  onApply,
  onCancel,
}: ImageSelectionGridProps) => {
  // Get current style from global settings
  const { settings: styleSettings } = useStyleSettings();

  // Calculate selection count
  const nonSkippedPlacements = placements.filter((p) => !skippedPlacements.has(p.id));
  const selectedCount = nonSkippedPlacements.filter((p) => selectedImages[p.id]).length;
  const totalRequired = nonSkippedPlacements.length;

  const canApply = selectedCount > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-1">
        {placements.map((placement, index) => (
          <PlacementGroup
            key={placement.id}
            placement={placement}
            selectedImageId={selectedImages[placement.id]}
            isSkipped={skippedPlacements.has(placement.id)}
            currentStyleId={styleSettings.selectedStyle}
            onSelectImage={(imageId) => onSelectImage(placement.id, imageId)}
            onSkip={(skipped) => onSkipPlacement(placement.id, skipped)}
            onRegenerate={(styleId) => onRegenerate(placement.id, styleId)}
            onImageClick={(imageId) => onImageClick(placement.id, imageId)}
            onEditClick={(imageId) => onEditClick(placement.id, imageId)}
            isLast={index === placements.length - 1}
          />
        ))}
      </div>

      {/* Footer actions bar */}
      <div className="sticky bottom-0 bg-background border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-6 py-4 mt-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <span className="text-sm text-muted-foreground">
            {selectedCount} of {totalRequired} images selected
          </span>

          <Button onClick={onApply} disabled={!canApply} className="gap-2">
            Apply Selected Images
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectionGrid;
