import { PreviewToolbar } from './PreviewToolbar';
import { ContentPreview } from './ContentPreview';
import { ContentSkeleton } from './ContentSkeleton';
import { EmptyPreview } from './EmptyPreview';
import { ImageCard } from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ContentBlock } from '@/types/content';

// Component to display a single image from content blocks
const BlockImage = ({ block }: { block: ContentBlock & { type: 'image' } }) => (
  <div className="rounded-lg overflow-hidden shadow-md">
    <img
      src={block.imageUrl}
      alt={block.altText || 'Generated image'}
      className="w-full h-auto object-contain"
    />
  </div>
);

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
    contentBlocks?: ContentBlock[];
  };
  isGenerating: boolean;
  onNavigateToVoice: () => void;
  onRegenerate: () => void;
  onRegenerateImage?: (index: number) => void;
  onTextChange?: (text: string) => void;
  // Legacy props for planned images
  plannedImages?: GeneratedImageSet[];
  isGeneratingImages?: boolean;
  // Props for content blocks (kept for compatibility but simplified)
  contentBlocks?: ContentBlock[];
  onReorderBlocks?: (fromIndex: number, toIndex: number) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<ContentBlock>) => void;
  // Page title for downloads
  pageTitle?: string;
}

export const PreviewPane = ({
  content,
  isGenerating,
  onNavigateToVoice,
  onRegenerate,
  onRegenerateImage,
  onTextChange,
  plannedImages = [],
  isGeneratingImages = false,
  contentBlocks = [],
  pageTitle = 'Untitled',
}: PreviewPaneProps) => {
  const hasContent = content.text.length > 0;

  // Separate images by placement (legacy flow)
  const headerImages = plannedImages.filter((img) => img.placement === 'top');
  const bodyImages = plannedImages.filter((img) => img.placement === 'bottom');

  // Extract header and body images from content blocks
  const blocks = content.contentBlocks || contentBlocks || [];
  const headerImageBlocks = blocks.filter(
    (b): b is ContentBlock & { type: 'image' } => b.type === 'image' && b.placementType === 'header'
  );
  const bodyImageBlocks = blocks.filter(
    (b): b is ContentBlock & { type: 'image' } => b.type === 'image' && b.placementType === 'body'
  );

  // Check if we have images from content blocks (new flow) vs legacy flow
  const hasBlockImages = headerImageBlocks.length > 0 || bodyImageBlocks.length > 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-background to-slate-100/50 dark:from-slate-900 dark:via-background dark:to-slate-800/50">
      <PreviewToolbar
        content={content.text}
        hasContent={hasContent}
        isGenerating={isGenerating}
        onNavigateToVoice={onNavigateToVoice}
        onRegenerate={onRegenerate}
        contentBlocks={contentBlocks}
        pageTitle={pageTitle}
        images={content.images}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header Images from content blocks (new flow) */}
          {headerImageBlocks.map((block) => (
            <BlockImage key={block.id} block={block} />
          ))}

          {/* Header Images from planned images (legacy flow) */}
          {!hasBlockImages && headerImages.map((imgSet) => (
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
              // Only pass images to ContentPreview if we don't have content blocks
              // (content blocks handle their own image placement)
              images={hasBlockImages ? [] : content.images}
              onRegenerateImage={onRegenerateImage}
              onTextChange={onTextChange}
            />
          ) : (
            <EmptyPreview />
          )}

          {/* Body Images from content blocks (new flow) */}
          {bodyImageBlocks.map((block) => (
            <BlockImage key={block.id} block={block} />
          ))}

          {/* Body Images from planned images (legacy flow) */}
          {!hasBlockImages && bodyImages.map((imgSet) => (
            <ImageCard
              key={imgSet.recommendationId}
              title={imgSet.title}
              type={imgSet.type}
              aspectRatio={imgSet.aspectRatio}
              images={imgSet.images}
              isGenerating={isGeneratingImages && imgSet.images.length === 0}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
