import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import type { EditingImage } from '../../types/imageGeneration';

interface EditImagePanelProps {
  isOpen: boolean;
  referenceImage: EditingImage | null;
  onSubmit: (imageId: string, placementId: string, editPrompt: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  error?: string;
}

const suggestionChips = [
  'More abstract',
  'Warmer colors',
  'More professional',
  'Add people',
  'Simplify',
  'Brighter',
  'More minimal',
];

export const EditImagePanel = ({
  isOpen,
  referenceImage,
  onSubmit,
  onClose,
  isLoading,
  error,
}: EditImagePanelProps) => {
  const [editPrompt, setEditPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset prompt when panel opens
  useEffect(() => {
    if (isOpen) {
      setEditPrompt('');
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const handleChipClick = (suggestion: string) => {
    setEditPrompt((prev) => {
      if (prev.trim()) {
        return `${prev.trim()}, ${suggestion.toLowerCase()}`;
      }
      return suggestion;
    });
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!referenceImage || !editPrompt.trim()) return;
    await onSubmit(referenceImage.id, referenceImage.placementId, editPrompt.trim());
  };

  const placementLabel =
    referenceImage?.placementType.charAt(0).toUpperCase() +
    (referenceImage?.placementType.slice(1) || '') +
    ' Image';

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && referenceImage && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[110] bg-foreground/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isLoading ? undefined : onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 z-[111] h-full w-[420px] bg-background shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Edit Image</h2>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Reference Image */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reference Image
                </label>
                <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
                  <img
                    src={referenceImage.url}
                    alt={placementLabel}
                    className="w-full max-h-[200px] object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{placementLabel}</p>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  What would you like to change?
                </label>
                <Textarea
                  ref={textareaRef}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe your changes... e.g., 'Make the colors warmer' or 'Add more people in the background'"
                  rows={4}
                  className="resize-y"
                  disabled={isLoading}
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <label className="block text-xs text-muted-foreground mb-2">Suggestions:</label>
                <div className="flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      disabled={isLoading}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        'bg-primary/10 text-primary hover:bg-primary/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !editPrompt.trim()}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Edited Version'
                )}
              </Button>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EditImagePanel;
