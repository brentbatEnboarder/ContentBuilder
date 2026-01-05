import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/page';
import { ChatMessage } from './ChatMessage';
import { LoadingMessage } from './LoadingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          <div className="flex justify-center py-3">
            <button
              type="button"
              onClick={onApproveImagePlan}
              className="
                flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-gradient-to-b from-coral to-coral-hover
                text-white font-semibold
                border border-coral-hover/50
                shadow-[0_2px_10px_rgba(252,115,97,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]
                hover:from-coral-hover hover:to-coral
                hover:shadow-[0_4px_16px_rgba(252,115,97,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]
                active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
                transition-all duration-150 ease-out
              "
            >
              <Play className="w-4 h-4" />
              Generate Images
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
