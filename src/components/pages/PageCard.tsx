import { FileText, MoreVertical, ImageIcon, Type } from 'lucide-react';
import { format, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageCardMenu } from './PageCardMenu';
import type { Page } from '@/types/page';
import type { ContentBlock } from '@/types/content';

interface PageCardProps {
  page: Page;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  // Show relative time if within last 7 days
  if (isAfter(date, subDays(now, 7))) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'MMM d, yyyy');
};

// Extract first header image from content blocks
const getHeaderImage = (contentBlocks?: ContentBlock[]): string | null => {
  if (!contentBlocks) return null;
  const headerImage = contentBlocks.find(
    (block): block is ContentBlock & { type: 'image' } =>
      block.type === 'image' && block.placementType === 'header'
  );
  return headerImage?.imageUrl || null;
};

// Extract first image of any type from content blocks
const getAnyImage = (contentBlocks?: ContentBlock[]): string | null => {
  if (!contentBlocks) return null;
  const anyImage = contentBlocks.find(
    (block): block is ContentBlock & { type: 'image' } => block.type === 'image'
  );
  return anyImage?.imageUrl || null;
};

// Extract text preview from content
const getTextPreview = (contentBlocks?: ContentBlock[], textContent?: string): string => {
  // First try content blocks
  if (contentBlocks) {
    const textBlock = contentBlocks.find(
      (block): block is ContentBlock & { type: 'text' } => block.type === 'text'
    );
    if (textBlock?.content) {
      // Strip markdown and get first ~80 chars
      const plain = textBlock.content
        .replace(/[#*_~`>\[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      return plain.length > 80 ? plain.substring(0, 80) + '...' : plain;
    }
  }
  // Fall back to text field
  if (textContent) {
    const plain = textContent
      .replace(/[#*_~`>\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > 80 ? plain.substring(0, 80) + '...' : plain;
  }
  return '';
};

// Generate deterministic gradient based on page ID
const getGradient = (id: string): string => {
  // Use page ID to pick a gradient consistently
  const gradients = [
    'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20',
    'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
    'from-amber-500/20 via-orange-500/20 to-rose-500/20',
    'from-emerald-500/20 via-green-500/20 to-lime-500/20',
    'from-pink-500/20 via-rose-500/20 to-red-500/20',
    'from-indigo-500/20 via-blue-500/20 to-purple-500/20',
  ];
  const index = id.charCodeAt(0) % gradients.length;
  return gradients[index];
};

// Count content stats
const getContentStats = (page: Page) => {
  const blocks = page.content?.contentBlocks || [];
  const imageCount = blocks.filter(b => b.type === 'image').length;
  const textContent = blocks
    .filter((b): b is ContentBlock & { type: 'text' } => b.type === 'text')
    .map(b => b.content)
    .join(' ');
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  return { imageCount, wordCount };
};

export const PageCard = ({
  page,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: PageCardProps) => {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const thumbnailImage = getHeaderImage(page.content?.contentBlocks) ||
                         getAnyImage(page.content?.contentBlocks);
  const textPreview = getTextPreview(page.content?.contentBlocks, page.content?.text);
  const { imageCount, wordCount } = getContentStats(page);
  const hasContent = imageCount > 0 || wordCount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card rounded-xl border border-border overflow-hidden',
        'cursor-pointer transition-all duration-300 ease-out',
        'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5',
        'hover:-translate-y-1'
      )}
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {thumbnailImage ? (
          <img
            src={thumbnailImage}
            alt={page.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={cn(
            'w-full h-full bg-gradient-to-br',
            getGradient(page.id),
            'flex items-center justify-center'
          )}>
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <FileText className="w-10 h-10" />
              {!hasContent && (
                <span className="text-xs font-medium">Empty page</span>
              )}
            </div>
          </div>
        )}

        {/* Hover overlay with menu */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        )}>
          <div className="absolute top-2 right-2" onClick={handleMenuClick}>
            <PageCardMenu
              trigger={
                <button
                  className={cn(
                    'p-2 rounded-lg bg-white/90 backdrop-blur-sm text-foreground',
                    'shadow-lg hover:bg-white transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mb-1">
          {page.title}
        </h3>

        {textPreview && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {textPreview}
          </p>
        )}

        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(page.updatedAt)}</span>

          {hasContent && (
            <div className="flex items-center gap-3">
              {wordCount > 0 && (
                <span className="flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  {wordCount}
                </span>
              )}
              {imageCount > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {imageCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
