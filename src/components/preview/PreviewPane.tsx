import { PreviewToolbar } from './PreviewToolbar';
import { ContentPreview } from './ContentPreview';
import { ContentSkeleton } from './ContentSkeleton';
import { EmptyPreview } from './EmptyPreview';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

export const PreviewPane = ({
  content,
  isGenerating,
  onNavigateToVoice,
  onNavigateToStyle,
  onRegenerate,
  onRegenerateImage,
  onStyleChange,
}: PreviewPaneProps) => {
  const hasContent = content.text.length > 0;

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
        <div className="p-6">
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
        </div>
      </ScrollArea>
    </div>
  );
};
