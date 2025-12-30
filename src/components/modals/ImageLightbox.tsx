import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import type { LightboxImage } from '../../types/imageGeneration';

interface ImageLightboxProps {
  isOpen: boolean;
  images: LightboxImage[];
  currentImageId: string;
  selectedImages: Record<string, string>;
  onClose: () => void;
  onNavigate: (imageId: string) => void;
  onSelect: (placementId: string, imageId: string) => void;
  onEdit: (imageId: string, placementId: string) => void;
  onRegenerate: (placementId: string) => void;
}

export const ImageLightbox = ({
  isOpen,
  images,
  currentImageId,
  selectedImages,
  onClose,
  onNavigate,
  onSelect,
  onEdit,
  onRegenerate,
}: ImageLightboxProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Find current image index
  const currentIndex = images.findIndex((img) => img.id === currentImageId);
  const currentImage = images[currentIndex];
  const totalImages = images.length;

  // Check if current image is selected
  const isCurrentSelected =
    currentImage && selectedImages[currentImage.placementId] === currentImage.id;

  // Navigation functions with wrap-around
  const goToPrevious = useCallback(() => {
    if (images.length === 0) return;
    const prevIndex = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
    onNavigate(images[prevIndex].id);
  }, [currentIndex, images, onNavigate]);

  const goToNext = useCallback(() => {
    if (images.length === 0) return;
    const nextIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;
    onNavigate(images[nextIndex].id);
  }, [currentIndex, images, onNavigate]);

  // Handle select and close
  const handleSelect = useCallback(() => {
    if (currentImage) {
      onSelect(currentImage.placementId, currentImage.id);
      onClose();
    }
  }, [currentImage, onSelect, onClose]);

  // Keyboard event handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleSelect();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, handleSelect]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus close button
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      // Return focus when closed
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || images.length === 0) return;

    const prevIndex = currentIndex <= 0 ? images.length - 1 : currentIndex - 1;
    const nextIndex = currentIndex >= images.length - 1 ? 0 : currentIndex + 1;

    // Preload previous and next images
    [prevIndex, nextIndex].forEach((idx) => {
      const img = new Image();
      img.src = images[idx].url;
    });
  }, [isOpen, currentIndex, images]);

  // Don't render if no images
  if (images.length === 0) return null;

  const placementLabel =
    currentImage?.placementType.charAt(0).toUpperCase() +
    currentImage?.placementType.slice(1) +
    ' Image';

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Backdrop */}
          <motion.div className="absolute inset-0 bg-black/[0.92]" onClick={onClose} />

          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="fixed top-6 right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous button */}
          <button
            onClick={goToPrevious}
            className="fixed left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Next button */}
          <button
            onClick={goToNext}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center max-w-[85vw] max-h-[90vh]">
            {/* Image with crossfade */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage.id}
                src={currentImage.url}
                alt={`${placementLabel} - Variation ${currentImage.variationIndex + 1}`}
                className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>

            {/* Image info */}
            <div
              className="mt-6 text-center text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              <p className="text-lg font-semibold">{placementLabel}</p>
              <p className="text-sm text-white/80 mt-1">
                Variation {currentImage.variationIndex + 1} of {currentImage.variationTotal}
              </p>
              <p className="text-sm text-white/60 mt-0.5">
                Image {currentIndex + 1} of {totalImages}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              <Button
                onClick={handleSelect}
                className={cn(
                  'gap-2',
                  isCurrentSelected ? 'bg-green-600 hover:bg-green-700 text-white' : ''
                )}
              >
                <Check className="w-4 h-4" />
                {isCurrentSelected ? 'Selected' : 'Select This'}
              </Button>

              <Button
                variant="outline"
                className="gap-2 bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white"
                onClick={() => onEdit(currentImage.id, currentImage.placementId)}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>

              <Button
                variant="outline"
                className="gap-2 bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white"
                onClick={() => onRegenerate(currentImage.placementId)}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
