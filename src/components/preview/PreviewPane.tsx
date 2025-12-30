import { PreviewToolbar } from './PreviewToolbar';
import { ContentPreview } from './ContentPreview';
import { ContentSkeleton } from './ContentSkeleton';
import { EmptyPreview } from './EmptyPreview';
import { ImageCard } from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DraggableContentPreview } from '@/components/content';
import type { ContentBlock } from '@/types/content';

export interface GeneratedImageSet {
  recommendationId: string;
  type: 'header' | 'body';
  title: string;
  aspectRatio: string;
  placement: 'top' | 'bottom';
  images: string[];
}

interface PreviewPaneProps {
  content: {
    text: string;
    images: string[];
  };
  isGenerating: boolean;
  onNavigateToVoice: () => void;
  onNavigateToStyle: () => void;
  onRegenerate: () => void;
  onRegenerateImage?: (index: number) => void;
  onStyleChange?: () => void;
  // New props for planned images (legacy flow)
  plannedImages?: GeneratedImageSet[];
  isGeneratingImages?: boolean;
  // New props for content blocks (Phase 9)
  contentBlocks?: ContentBlock[];
  onReorderBlocks?: (fromIndex: number, toIndex: number) => void;
  onDeleteBlock?: (blockId: string) => void;
}

export const PreviewPane = ({
  content,
  isGenerating,
  onNavigateToVoice,
  onNavigateToStyle,
  onRegenerate,
  onRegenerateImage,
  onStyleChange,
  plannedImages = [],
  isGeneratingImages = false,
  contentBlocks = [],
  onReorderBlocks,
  onDeleteBlock,
}: PreviewPaneProps) => {
  const hasContent = content.text.length > 0;
  const hasContentBlocks = contentBlocks.length > 0;

  // Separate images by placement (legacy flow)
  const headerImages = plannedImages.filter((img) => img.placement === 'top');
  const bodyImages = plannedImages.filter((img) => img.placement === 'bottom');

  return (
    <div className="flex flex-col h-full bg-background">
      <PreviewToolbar
        content={content.text}
        hasContent={hasContent}
        isGenerating={isGenerating}
        onNavigateToVoice={onNavigateToVoice}
        onNavigateToStyle={onNavigateToStyle}
        onRegenerate={onRegenerate}
        onStyleChange={onStyleChange}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* If we have content blocks (from image modal), render draggable preview */}
          {hasContentBlocks ? (
            <DraggableContentPreview
              blocks={contentBlocks}
              onReorder={onReorderBlocks || (() => {})}
              onDeleteImage={onDeleteBlock || (() => {})}
            />
          ) : (
            <>
              {/* Header Images (at top) - legacy flow */}
              {headerImages.map((imgSet) => (
                <ImageCard
                  key={imgSet.recommendationId}
                  title={imgSet.title}
                  type={imgSet.type}
                  aspectRatio={imgSet.aspectRatio}
                  images={imgSet.images}
                  isGenerating={isGeneratingImages && imgSet.images.length === 0}
                />
              ))}

              {/* Main Content */}
              {isGenerating ? (
                <ContentSkeleton />
              ) : hasContent ? (
                <ContentPreview
                  text={content.text}
                  images={content.images}
                  onRegenerateImage={onRegenerateImage}
                />
              ) : (
                <EmptyPreview />
              )}

              {/* Body Images (at bottom) - legacy flow */}
              {bodyImages.map((imgSet) => (
                <ImageCard
                  key={imgSet.recommendationId}
                  title={imgSet.title}
                  type={imgSet.type}
                  aspectRatio={imgSet.aspectRatio}
                  images={imgSet.images}
                  isGenerating={isGeneratingImages && imgSet.images.length === 0}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
