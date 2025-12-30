import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { cn } from '../../lib/utils';
import type { AspectRatio, PlacementType } from '../../types/content';

interface DraggableImageCardProps {
  id: string;
  imageUrl: string;
  aspectRatio: AspectRatio;
  placementType: PlacementType;
  altText?: string;
  isDragging?: boolean;
  onDelete: () => void;
}

const aspectRatioMap: Record<AspectRatio, string> = {
  '21:9': '42.86%',
  '16:9': '56.25%',
  '4:3': '75%',
  '1:1': '100%',
  '3:2': '66.67%',
  '9:16': '177.78%',
};

export const DraggableImageCard = ({
  id,
  imageUrl,
  aspectRatio,
  placementType,
  altText,
  onDelete,
}: DraggableImageCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isHeader = placementType === 'header';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isHeader,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative group rounded-lg border border-border bg-background overflow-hidden',
          'shadow-sm transition-shadow',
          isDragging && 'shadow-xl scale-[1.02] opacity-90 z-50',
          !isDragging && 'hover:shadow-md'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isDragging ? 0.9 : 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex">
          {/* Drag Handle - Only show for non-header images */}
          {!isHeader && (
            <div
              {...attributes}
              {...listeners}
              className={cn(
                'flex-shrink-0 w-8 flex items-center justify-center',
                'bg-muted/50 cursor-grab active:cursor-grabbing',
                'hover:bg-muted transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset'
              )}
              tabIndex={0}
              role="button"
              aria-label="Drag to reorder image"
              aria-describedby={`dnd-instructions-${id}`}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Image Container */}
          <div className="flex-1 relative">
            <div
              className="relative w-full"
              style={{ paddingBottom: aspectRatioMap[aspectRatio] || '56.25%' }}
            >
              <img
                src={imageUrl}
                alt={altText || `${placementType} image`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Delete Button */}
            <AnimatePresence>
              {isHovered && !isDragging && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleDeleteClick}
                  className={cn(
                    'absolute top-2 right-2 p-2 rounded-full',
                    'bg-background/90 backdrop-blur-sm',
                    'border border-border shadow-md',
                    'text-muted-foreground hover:text-destructive',
                    'transition-colors'
                  )}
                  aria-label="Delete image"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Placement Type Badge */}
            <div className="absolute bottom-2 left-2">
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded',
                  'bg-background/90 backdrop-blur-sm border border-border',
                  'text-muted-foreground capitalize'
                )}
              >
                {placementType}
              </span>
            </div>
          </div>
        </div>

        {/* Screen reader instructions */}
        <span id={`dnd-instructions-${id}`} className="sr-only">
          Press Space or Enter to pick up. Use arrow keys to move. Press Space or Enter to drop.
          Press Escape to cancel.
        </span>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this image from content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the image from the content preview. You can add it back later if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DraggableImageCard;
