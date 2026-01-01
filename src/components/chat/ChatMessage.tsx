import { useState } from 'react';
import { Paperclip, Loader2, ZoomIn, Check, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage as ChatMessageType } from '@/types/page';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onSelectImage?: (imageUrl: string) => void;
  onEditImage?: (imageUrl: string) => void;
}

export const ChatMessage = ({ message, onSelectImage, onEditImage }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [hoveredImageIdx, setHoveredImageIdx] = useState<number | null>(null);

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
    <>
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
            isUser ? 'bg-foreground' : ''
          )}
            style={!isUser ? { backgroundColor: '#7C21CC' } : undefined}
          >
            {isUser ? (
              <img
                src="/enboarder-icon-white.png"
                alt="You"
                className="w-4 h-4"
              />
            ) : (
              <img
                src="/enboarder-icon-white.png"
                alt="Enboarder"
                className="w-4 h-4"
              />
            )}
          </div>
          <span className="font-medium text-foreground">
            {isUser ? 'You' : 'Enboarder'}
          </span>
          {isUser && (
            <span className="text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>

        <div
          className={cn(
            'px-4 py-3 rounded-xl',
            isUser
              ? 'bg-muted text-foreground rounded-br-sm'
              : 'text-foreground rounded-bl-sm'
          )}
          style={!isUser ? { backgroundColor: '#e0c4f4' } : undefined}
        >
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Inline generated images */}
          {message.images && message.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.images.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredImageIdx(idx)}
                  onMouseLeave={() => setHoveredImageIdx(null)}
                >
                  <img
                    src={imageUrl}
                    alt={`Generated image ${idx + 1}`}
                    className="max-w-full rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow"
                    style={{ maxHeight: '200px' }}
                    onClick={() => setExpandedImage(imageUrl)}
                  />
                  {/* Hover overlay with action buttons */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center gap-2 transition-opacity',
                      hoveredImageIdx === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                  >
                    {/* Select button */}
                    {onSelectImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectImage(imageUrl);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-foreground text-sm font-medium rounded-md hover:bg-gray-100 transition-colors shadow-lg"
                        title="Add to content"
                      >
                        <Check className="w-4 h-4" />
                        Select
                      </button>
                    )}
                    {/* Edit button */}
                    {onEditImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditImage(imageUrl);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-foreground text-sm font-medium rounded-md hover:bg-gray-100 transition-colors shadow-lg"
                        title="Edit image"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {/* Expand button (always available) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedImage(imageUrl);
                      }}
                      className="flex items-center justify-center w-8 h-8 bg-white/80 text-foreground rounded-md hover:bg-white transition-colors shadow-lg"
                      title="View full size"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Image generating indicator */}
          {message.isGeneratingImage && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating image...</span>
            </div>
          )}
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

      {/* Expanded image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Expanded generated image"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
