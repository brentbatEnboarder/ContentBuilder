import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropZoneProps {
  id: string;
  isActive: boolean;
  isInvalid?: boolean;
}

export const DropZone = ({ id, isActive, isInvalid }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const showIndicator = isActive;
  const isHighlighted = isOver && !isInvalid;
  const isRejected = isOver && isInvalid;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-all duration-200',
        showIndicator ? 'h-12 my-2' : 'h-0 my-0'
      )}
    >
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0.8 }}
          className={cn('absolute inset-x-0 top-1/2 -translate-y-1/2', 'flex items-center justify-center')}
        >
          {/* Line */}
          <div
            className={cn(
              'absolute inset-x-0 h-0.5 transition-all duration-200',
              isHighlighted && 'h-1 bg-primary shadow-[0_0_8px_rgba(124,33,204,0.5)]',
              isRejected && 'h-1 bg-destructive',
              !isHighlighted && !isRejected && 'bg-border'
            )}
          />

          {/* Center Icon */}
          <div
            className={cn(
              'relative z-10 w-6 h-6 rounded-full flex items-center justify-center',
              'transition-all duration-200',
              isHighlighted && 'bg-primary text-primary-foreground scale-110',
              isRejected && 'bg-destructive text-destructive-foreground scale-110',
              !isHighlighted && !isRejected && 'bg-muted text-muted-foreground border border-border'
            )}
          >
            <Plus className="w-3 h-3" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DropZone;
