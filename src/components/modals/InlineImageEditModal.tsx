import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface InlineImageEditModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onSubmit: (editPrompt: string) => Promise<string | null>;
  onClose: () => void;
  onImageEdited?: (newImageUrl: string) => void;
}

const suggestionChips = [
  'More abstract',
  'Warmer colors',
  'More professional',
  'Add people',
  'Simplify',
  'Brighter',
  'More minimal',
  'Different angle',
];

/**
 * Modal for editing inline chat images with a reference image
 * Uses Gemini's vision capabilities to generate a modified version
 */
export const InlineImageEditModal = ({
  isOpen,
  imageUrl,
  onSubmit,
  onClose,
  onImageEdited,
}: InlineImageEditModalProps) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditPrompt('');
      setError(null);
      setGeneratedImage(null);
      setTimeout(() => inputRef.current?.focus(), 300);
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
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editPrompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const newImageUrl = await onSubmit(editPrompt.trim());
      if (newImageUrl) {
        setGeneratedImage(newImageUrl);
        onImageEdited?.(newImageUrl);
      } else {
        setError('Failed to generate edited image. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && imageUrl && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[110] bg-foreground/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[111] w-[600px] max-w-[90vw] max-h-[85vh] bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: '-45%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: '-45%', x: '-50%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
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
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex gap-5">
                {/* Reference Image (left) */}
                <div className="flex-shrink-0 w-[180px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Reference
                  </label>
                  <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Reference image"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </div>

                {/* Chat/Edit Area (right) */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Generated Image Result */}
                  {generatedImage && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-muted-foreground mb-2">
                        Result
                      </label>
                      <div className="relative rounded-lg border border-primary/30 overflow-hidden bg-muted">
                        <img
                          src={generatedImage}
                          alt="Edited image"
                          className="w-full max-h-[200px] object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        The edited image has been added to your chat. You can select it to add to your content.
                      </p>
                    </div>
                  )}

                  {/* Suggestions */}
                  <div className="mb-4">
                    <label className="block text-xs text-muted-foreground mb-2">
                      Suggestions:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestionChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleChipClick(chip)}
                          disabled={isLoading}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded-full transition-colors',
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
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  {/* Chat Input */}
                  <form onSubmit={handleSubmit} className="mt-auto">
                    <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-muted/50 focus-within:border-primary/50 transition-colors">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe the changes you want..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isLoading || !editPrompt.trim()}
                        className="gap-1.5 px-3"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Editing...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Footer */}
            {generatedImage && (
              <div className="px-5 py-4 border-t border-border">
                <Button onClick={onClose} className="w-full">
                  Done
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default InlineImageEditModal;
