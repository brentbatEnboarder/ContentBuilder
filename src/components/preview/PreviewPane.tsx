import { Pencil, Trash2 } from 'lucide-react';
import { PreviewToolbar } from './PreviewToolbar';
import { ContentPreview } from './ContentPreview';
import { ContentSkeleton } from './ContentSkeleton';
import { EmptyPreview } from './EmptyPreview';
import { ImageCard } from './ImageCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ContentBlock } from '@/types/content';

// Component to display a single image from content blocks with hover actions
interface BlockImageProps {
  block: ContentBlock & { type: 'image' };
  onEdit?: (block: ContentBlock & { type: 'image' }) => void;
  onDelete?: (blockId: string) => void;
}

const BlockImage = ({ block, onEdit, onDelete }: BlockImageProps) => (
  <div className="relative group rounded-lg overflow-hidden shadow-md">
    <img
      src={block.imageUrl}
      alt={block.altText || 'Generated image'}
      className="w-full h-auto object-contain"
    />
    {/* Hover overlay with actions */}
    {(onEdit || onDelete) && (
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
        {onEdit && (
          <button
            onClick={() => onEdit(block)}
            className="p-3 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-primary transition-colors shadow-lg"
            title="Edit image"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(block.id)}
            className="p-3 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-lg"
            title="Delete image"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    )}
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
  onMockup?: () => void;
  onTestCapture?: () => void;
  // Legacy props for planned images
  plannedImages?: GeneratedImageSet[];
  isGeneratingImages?: boolean;
  // Props for content blocks (kept for compatibility but simplified)
  contentBlocks?: ContentBlock[];
  onReorderBlocks?: (fromIndex: number, toIndex: number) => void;
  onDeleteBlock?: (blockId: string) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<ContentBlock>) => void;
  // Image block actions
  onEditImageBlock?: (block: ContentBlock & { type: 'image' }) => void;
  onDeleteImageBlock?: (blockId: string) => void;
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
  onMockup,
  onTestCapture,
  plannedImages = [],
  isGeneratingImages = false,
  contentBlocks = [],
  onEditImageBlock,
  onDeleteImageBlock,
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
        onMockup={onMockup}
        onTestCapture={onTestCapture}
        contentBlocks={contentBlocks}
        pageTitle={pageTitle}
        images={content.images}
      />

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header Images from content blocks (new flow) */}
          {headerImageBlocks.map((block) => (
            <BlockImage
              key={block.id}
              block={block}
              onEdit={onEditImageBlock}
              onDelete={onDeleteImageBlock}
            />
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
            <BlockImage
              key={block.id}
              block={block}
              onEdit={onEditImageBlock}
              onDelete={onDeleteImageBlock}
            />
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
