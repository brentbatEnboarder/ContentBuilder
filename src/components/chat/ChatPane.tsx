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
}: ChatPaneProps) => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onSelectImage={onSelectImage}
        onEditImage={onEditImage}
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
