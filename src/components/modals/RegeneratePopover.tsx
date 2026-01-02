import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { StyleDropdown } from '../preview/StyleDropdown';
import { useStyleSettings } from '../../hooks/useStyleSettings';
import type { PlacementType } from '../../types/content';

interface RegeneratePopoverProps {
  isOpen: boolean;
  anchorRect: DOMRect | null;
  placementId: string;
  placementType: PlacementType;
  currentPrompt: string;
  onRegenerate: (placementId: string, newPrompt: string, styleId?: string) => void;
  onClose: () => void;
}

export const RegeneratePopover = ({
  isOpen,
  anchorRect,
  placementId,
  placementType,
  currentPrompt,
  onRegenerate,
  onClose,
}: RegeneratePopoverProps) => {
  const [prompt, setPrompt] = useState(currentPrompt);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings: styleSettings } = useStyleSettings();

  // Reset prompt when popover opens
  useEffect(() => {
    if (isOpen) {
      setPrompt(currentPrompt);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, currentPrompt]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleRegenerate = () => {
    onRegenerate(placementId, prompt.trim() || currentPrompt, styleSettings.selectedStyle);
    onClose();
  };

  const placementLabel = placementType.charAt(0).toUpperCase() + placementType.slice(1);

  // Calculate position
  const getPopoverStyle = (): React.CSSProperties => {
    if (!anchorRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const popoverWidth = 360;
    const popoverHeight = 280; // Approximate height
    const margin = 8;

    let top = anchorRect.bottom + margin;
    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

    // Ensure popover stays within viewport
    if (left < margin) left = margin;
    if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin;
    }

    // If not enough space below, show above
    if (top + popoverHeight > window.innerHeight - margin) {
      top = anchorRect.top - popoverHeight - margin;
    }

    return { top, left };
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop for click outside detection */}
          <div className="fixed inset-0 z-[120]" />

          {/* Popover */}
          <motion.div
            ref={popoverRef}
            className="fixed z-[121] w-[360px] bg-background rounded-xl shadow-2xl border border-border overflow-hidden"
            style={getPopoverStyle()}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Arrow/Caret */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-l border-t border-border rotate-45"
              style={{ zIndex: -1 }}
            />

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Regenerate {placementLabel} Images
                </h3>
                <StyleDropdown onNavigateToSettings={() => {}} />
              </div>

              {/* Current Prompt */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Current prompt:</label>
                <div className="p-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground line-clamp-2">
                  {currentPrompt}
                </div>
              </div>

              {/* Edit Prompt */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Modify prompt (optional):
                </label>
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Edit the prompt to get different results..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleRegenerate}>
                  Regenerate
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default RegeneratePopover;
