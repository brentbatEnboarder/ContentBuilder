import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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
import type { GenerationProgress } from '../../types/imageGeneration';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt?: string; // No longer displayed but kept for backwards compatibility
  progress: GenerationProgress;
  isLoading: boolean;
  isGeneratingMore?: boolean; // Background generation in progress after first batch
  hasGeneratedImages?: boolean;
  children?: React.ReactNode;
}

// Sparkle particle component
const Sparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <Sparkles className="w-4 h-4 text-primary" />
  </motion.div>
);

// Paint stroke component
const PaintStroke = ({ color, delay, path }: { color: string; delay: number; path: string }) => (
  <motion.path
    d={path}
    stroke={color}
    strokeWidth="8"
    strokeLinecap="round"
    fill="none"
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: 1, opacity: 1 }}
    transition={{
      pathLength: { duration: 1.5, delay, ease: 'easeInOut' },
      opacity: { duration: 0.3, delay },
    }}
  />
);

// Robot Painter Animation
const RobotPainterAnimation = () => {
  const sparklePositions = [
    { x: 10, y: 20, delay: 0 },
    { x: 85, y: 15, delay: 0.3 },
    { x: 75, y: 70, delay: 0.6 },
    { x: 15, y: 75, delay: 0.9 },
    { x: 50, y: 10, delay: 1.2 },
    { x: 90, y: 45, delay: 1.5 },
  ];

  const strokeColors = ['#7C21CC', '#9D4EDD', '#C77DFF', '#E0AAFF', '#F3E8FF'];
  const strokePaths = [
    'M 60 80 Q 100 60 140 80',
    'M 70 100 Q 110 80 150 100',
    'M 80 120 Q 120 100 160 120',
    'M 65 140 Q 105 120 145 140',
    'M 75 160 Q 115 140 155 160',
  ];

  return (
    <div className="relative w-80 h-64 mx-auto flex items-center justify-center">
      {/* Sparkles - positioned relative to center */}
      {sparklePositions.map((pos, i) => (
        <Sparkle key={i} delay={pos.delay} x={pos.x} y={pos.y} />
      ))}

      {/* Canvas/Easel - centered container */}
      <div className="relative">
        <motion.div
          className="w-48 h-40 bg-background rounded-lg border-4 border-muted shadow-lg overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Paint strokes on canvas */}
          <svg className="w-full h-full" viewBox="0 0 200 180">
            {strokePaths.map((path, i) => (
              <PaintStroke key={i} color={strokeColors[i]} delay={i * 0.4} path={path} />
            ))}

            {/* Abstract shapes */}
            <motion.circle
              cx="50"
              cy="50"
              r="20"
              fill="#F3E8FF"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              transition={{ delay: 2, duration: 0.5 }}
            />
            <motion.circle
              cx="160"
              cy="40"
              r="15"
              fill="#E0AAFF"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ delay: 2.3, duration: 0.5 }}
            />
          </svg>
        </motion.div>

        {/* Robot arm with paintbrush - positioned relative to canvas */}
        <motion.div
          className="absolute -right-16 top-1/2 -translate-y-1/2"
          animate={{
            rotate: [-5, 5, -5],
            y: [-2, 2, -2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Robot hand */}
          <div className="relative">
            <motion.div
              className="w-12 h-16 bg-gradient-to-b from-muted to-muted-foreground/20 rounded-lg shadow-md"
              style={{ transformOrigin: 'center right' }}
            >
              {/* Robot hand details */}
              <div className="absolute top-2 left-2 right-2 h-2 bg-primary/30 rounded" />
              <div className="absolute top-6 left-2 right-2 h-1 bg-primary/20 rounded" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </motion.div>

            {/* Paintbrush */}
            <motion.div
              className="absolute -left-20 top-1/2 -translate-y-1/2 flex items-center"
              animate={{
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Brush handle */}
              <div className="w-16 h-3 bg-gradient-to-r from-amber-700 to-amber-600 rounded-r-full" />
              {/* Brush ferrule */}
              <div className="w-2 h-4 bg-muted-foreground/50 rounded-sm" />
              {/* Brush bristles */}
              <motion.div
                className="w-6 h-5 bg-gradient-to-r from-primary to-purple-400 rounded-l-full"
                animate={{
                  scaleY: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const ImageGenerationModal = ({
  isOpen,
  onClose,
  prompt: _prompt, // No longer displayed
  progress,
  isLoading,
  isGeneratingMore = false,
  hasGeneratedImages = false,
  children,
}: ImageGenerationModalProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClose = () => {
    if (isLoading || isGeneratingMore || hasGeneratedImages) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-foreground/70"
              onClick={handleClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              className="relative z-10 w-full max-w-[900px] max-h-[90vh] mx-4 bg-background rounded-xl shadow-2xl overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="p-8 flex flex-col flex-1 min-h-0">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Loading animation or content */}
                {isLoading ? (
                  <div className="py-8">
                    {/* Robot painter animation */}
                    <RobotPainterAnimation />

                    {/* Progress messaging */}
                    <div className="mt-8 text-center">
                      <motion.p
                        key={progress.message}
                        className="text-lg font-medium text-foreground mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {progress.message}
                      </motion.p>

                      {/* Progress bar */}
                      <div className="max-w-md mx-auto">
                        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percent}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {progress.completedImages} of {progress.totalImages} images complete
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Content area for image grid */
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    {/* Background generation progress bar */}
                    <AnimatePresence>
                      {isGeneratingMore && (
                        <motion.div
                          className="mb-4 px-1"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <motion.div
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                />
                                <span className="text-sm font-medium text-foreground">
                                  {progress.message}
                                </span>
                              </div>
                              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress.percent}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {progress.completedImages}/{progress.totalImages}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex-1 min-h-0 overflow-auto">{children}</div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard generated images?</AlertDialogTitle>
            <AlertDialogDescription>
              {isLoading || isGeneratingMore
                ? 'Image generation is still in progress. Are you sure you want to cancel?'
                : "You haven't selected any images. Generated images will be discarded. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading || isGeneratingMore ? 'Stop & Close' : 'Discard & Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageGenerationModal;
