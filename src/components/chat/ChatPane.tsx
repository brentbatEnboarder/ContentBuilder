import type { ChatMessage as ChatMessageType, FileAttachment } from '@/types/page';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatPaneProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  hasContent?: boolean;
  isGeneratingImages?: boolean;
  onGenerateImages?: () => void;
  onSelectImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
  onNavigateToStyle?: () => void;
  onStyleChange?: () => void;
  isImagePlanning?: boolean;
  onApproveImagePlan?: () => void;
}

export const ChatPane = ({
  messages,
  isLoading,
  onSendMessage,
  hasContent,
  isGeneratingImages,
  onGenerateImages,
  onSelectImage,
  onEditImage,
  onNavigateToStyle,
  onStyleChange,
  isImagePlanning,
  onApproveImagePlan,
}: ChatPaneProps) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-card via-card to-slate-50/30 dark:to-slate-900/30 border-r border-border/50">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onSelectImage={onSelectImage}
        onEditImage={onEditImage}
        isImagePlanning={isImagePlanning}
        onApproveImagePlan={onApproveImagePlan}
      />
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        hasContent={hasContent}
        isGeneratingImages={isGeneratingImages}
        onGenerateImages={onGenerateImages}
        onNavigateToStyle={onNavigateToStyle}
        onStyleChange={onStyleChange}
      />
    </div>
  );
};
