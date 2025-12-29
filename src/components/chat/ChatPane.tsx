import type { ChatMessage as ChatMessageType, FileAttachment } from '@/types/page';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface ChatPaneProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
}

export const ChatPane = ({ messages, isLoading, onSendMessage }: ChatPaneProps) => {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
};
