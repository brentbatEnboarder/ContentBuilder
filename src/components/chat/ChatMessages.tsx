import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/page';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSelectImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
}

export const ChatMessages = ({ messages, isLoading, onSelectImage, onEditImage }: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check if the last message is an assistant message that's being streamed
  // (has empty content or placeholder text). If so, don't show LoadingMessage.
  const lastMessage = messages[messages.length - 1];
  const hasStreamingAssistant =
    lastMessage?.role === 'assistant' &&
    (!lastMessage.content || lastMessage.content === 'Generating content...');
  const showLoading = isLoading && !hasStreamingAssistant;

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="flex flex-col gap-4 py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onSelectImage={onSelectImage}
            onEditImage={onEditImage}
          />
        ))}
        {showLoading && <LoadingMessage />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
