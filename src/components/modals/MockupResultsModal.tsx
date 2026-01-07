import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Loader2,
  ImageIcon,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { MockupResult } from '@/types/mockup';

interface MockupResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MockupResult[];
  isLoading?: boolean;
  loadingProgress?: number; // 0-100
  templateName?: string;
  onEdit?: (mockup: MockupResult) => void;
  onDelete?: (mockupId: string) => void;
}

export const MockupResultsModal = ({
  isOpen,
  onClose,
  results,
  isLoading = false,
  loadingProgress = 0,
  templateName = 'Mockup',
  onEdit,
  onDelete,
}: MockupResultsModalProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Open lightbox
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Navigate lightbox
  const navigateLightbox = useCallback(
    (direction: 'prev' | 'next') => {
      if (lightboxIndex === null) return;
      const newIndex =
        direction === 'prev'
          ? lightboxIndex === 0
            ? results.length - 1
            : lightboxIndex - 1
          : lightboxIndex === results.length - 1
            ? 0
            : lightboxIndex + 1;
      setLightboxIndex(newIndex);
    },
    [lightboxIndex, results.length]
  );

  // Convert base64 data URL directly to Blob (more reliable than fetch for large images)
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([byteNumbers], { type: mimeType });
  };

  // Download helper - converts data URL to blob and triggers download
  const downloadImage = async (dataUrl: string, filename: string, format: 'png' | 'jpeg') => {
    try {
      let blob: Blob;

      if (format === 'jpeg') {
        // Convert to JPEG using canvas
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = dataUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill white background for JPEG (no transparency)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          blob = dataUrlToBlob(jpegDataUrl);
        } else {
          throw new Error('Could not get canvas context');
        }
      } else {
        // PNG - convert directly without canvas
        blob = dataUrlToBlob(dataUrl);
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  };

  // Download images
  const handleDownload = async (format: 'png' | 'jpeg') => {
    if (results.length === 0) return;

    const toDownload = results;

    setIsDownloading(true);
    try {
      for (let i = 0; i < toDownload.length; i++) {
        const result = toDownload[i];
        const filename = `${templateName.toLowerCase().replace(/\s+/g, '-')}-mockup-${i + 1}`;
        await downloadImage(result.imageUrl, filename, format);
        // Small delay between downloads to avoid browser blocking
        if (i < toDownload.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      toast.success(`Downloaded ${toDownload.length} mockup${toDownload.length > 1 ? 's' : ''} as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download mockup. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
      if (e.key === 'ArrowRight') navigateLightbox('next');
      if (e.key === 'Escape') closeLightbox();
    },
    [lightboxIndex, navigateLightbox, closeLightbox]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Mockup results"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {isLoading ? 'Generating Mockups...' : 'Your Device Mockups'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isLoading
                      ? `Creating ${templateName} mockups`
                      : `${results.length} mockup${results.length !== 1 ? 's' : ''} generated`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {isLoading ? (
                // Loading state
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative w-24 h-24 mb-6">
                    {/* Animated phone icon */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Smartphone className="w-16 h-16 text-primary" />
                    </motion.div>
                    {/* Orbiting sparkle */}
                    <motion.div
                      className="absolute w-4 h-4"
                      animate={{
                        rotate: 360,
                        x: [0, 40, 0, -40, 0],
                        y: [-40, 0, 40, 0, -40],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <ImageIcon className="w-4 h-4 text-golden" />
                    </motion.div>
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Creating your mockups...
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This may take up to 30 seconds per variation
                  </p>
                  {/* Progress bar */}
                  <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary-hover"
                      initial={{ width: '0%' }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.round(loadingProgress)}% complete
                  </p>
                </div>
              ) : results.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-16">
                  <Smartphone className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium text-foreground">No mockups generated</p>
                  <p className="text-sm text-muted-foreground">
                    Something went wrong. Please try again.
                  </p>
                </div>
              ) : (
                // Results grid
                <>
                  {/* Image grid */}
                  <div className={cn(
                    "grid gap-4",
                    results.length === 1 ? "grid-cols-1 max-w-lg mx-auto" : "grid-cols-1 md:grid-cols-3"
                  )}>
                    {results.map((result, index) => (
                        <div
                          key={result.id}
                          className="relative group rounded-xl overflow-hidden transition-all duration-200 border-2 hover:shadow-lg border-border/50 hover:border-primary/50"
                        >
                          {/* Image */}
                          <div
                            className="aspect-video relative bg-muted cursor-pointer"
                            onClick={() => openLightbox(index)}
                          >
                            <img
                              src={result.imageUrl}
                              alt={`Mockup ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                              {/* Edit button */}
                              {onEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(result);
                                  }}
                                  className="p-3 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-primary transition-colors shadow-lg"
                                  title="Edit mockup"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                              )}
                              {/* Delete button */}
                              {onDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(result.id);
                                  }}
                                  className="p-3 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-lg"
                                  title="Delete mockup"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                            {/* Click to view hint */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to view full size
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {results.length > 0 ? 'Download your mockup' : ''}
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  disabled={isLoading || results.length === 0 || isDownloading}
                  onClick={() => handleDownload('jpeg')}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  JPEG
                </Button>
                <Button
                  disabled={isLoading || results.length === 0 || isDownloading}
                  onClick={() => handleDownload('png')}
                  className="gap-2 bg-gradient-to-b from-teal to-teal-hover"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  PNG
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Lightbox */}
          <AnimatePresence>
            {lightboxIndex !== null && results[lightboxIndex] && (
              <motion.div
                className="fixed inset-0 z-[110] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeLightbox}
              >
                {/* Dark backdrop */}
                <div className="absolute inset-0 bg-black/95" />

                {/* Close button */}
                <button
                  onClick={closeLightbox}
                  className="fixed top-6 right-6 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>

                {/* Navigation - Previous */}
                {results.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('prev');
                    }}
                    className="fixed left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                )}

                {/* Navigation - Next */}
                {results.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateLightbox('next');
                    }}
                    className="fixed right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                )}

                {/* Image */}
                <motion.img
                  key={lightboxIndex}
                  src={results[lightboxIndex].imageUrl}
                  alt={`Mockup ${lightboxIndex + 1}`}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg z-10"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Counter */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                  {lightboxIndex + 1} / {results.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MockupResultsModal;
