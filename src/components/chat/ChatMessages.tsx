import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/page';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSelectImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
  isImagePlanning?: boolean;
  onApproveImagePlan?: () => void;
}

export const ChatMessages = ({
  messages,
  isLoading,
  onSelectImage,
  onEditImage,
  isImagePlanning,
  onApproveImagePlan,
}: ChatMessagesProps) => {
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

  // Show "Go" button when in image planning mode and not loading
  const showGoButton = isImagePlanning && !isLoading && messages.length > 0;

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

        {/* Go button for image planning approval */}
        {showGoButton && onApproveImagePlan && (
          <div className="flex justify-center py-2">
            <Button
              onClick={onApproveImagePlan}
              className="gap-2 px-6"
              style={{ backgroundColor: '#7C21CC' }}
            >
              <Play className="w-4 h-4" />
              Generate Images
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
