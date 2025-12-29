import { Bot, User, Paperclip } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/page';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-sm text-muted-foreground px-4 py-1 bg-background rounded-full border border-border">
          ─── {message.content} ───
        </span>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date)).toLowerCase();
  };

  return (
    <div className={cn(
      'flex flex-col max-w-[85%] gap-1',
      isUser ? 'self-end items-end' : 'self-start items-start'
    )}>
      <div className={cn(
        'flex items-center gap-2 text-xs',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary' : 'bg-muted'
        )}>
          {isUser ? (
            <User className="w-3.5 h-3.5 text-primary-foreground" />
          ) : (
            <Bot className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium text-foreground">
          {isUser ? 'You' : 'AI'}
        </span>
        {isUser && (
          <span className="text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

      <div className={cn(
        'px-4 py-3 whitespace-pre-wrap',
        isUser 
          ? 'bg-primary text-primary-foreground rounded-xl rounded-br-sm' 
          : 'bg-muted text-foreground rounded-xl rounded-bl-sm'
      )}>
        {message.content}
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {message.attachments.map((file) => (
            <div 
              key={file.id}
              className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded"
            >
              <Paperclip className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
