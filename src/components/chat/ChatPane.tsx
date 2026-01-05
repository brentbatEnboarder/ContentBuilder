import { useState, useCallback, useRef } from 'react';
import { FileText } from 'lucide-react';
import type { ChatMessage as ChatMessageType, FileAttachment } from '@/types/page';
import { ChatMessages } from './ChatMessages';
import { ChatInput, ChatInputRef } from './ChatInput';

interface ChatPaneProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  onSendMessage: (message: string, attachments?: FileAttachment[], files?: File[]) => void;
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

// Valid file types for drag-drop
const VALID_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.pptx', '.xlsx'];
const VALID_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

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
  const [isDragOver, setIsDragOver] = useState(false);
  const chatInputRef = useRef<ChatInputRef>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file =>
      VALID_MIME_TYPES.includes(file.type) ||
      VALID_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    if (validFiles.length > 0 && chatInputRef.current) {
      chatInputRef.current.addFiles(validFiles);
    }
  }, []);

  return (
    <div
      className="relative flex flex-col h-full bg-gradient-to-b from-card via-card to-slate-50/30 dark:to-slate-900/30 border-r border-border/50"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Full-pane drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary">
          <div className="flex flex-col items-center gap-2 text-primary bg-card/90 p-6 rounded-xl shadow-lg">
            <FileText className="w-12 h-12" />
            <p className="font-medium text-lg">Drop files here</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, MD, PPTX, XLSX</p>
          </div>
        </div>
      )}
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onSelectImage={onSelectImage}
        onEditImage={onEditImage}
        isImagePlanning={isImagePlanning}
        onApproveImagePlan={onApproveImagePlan}
      />
      <ChatInput
        ref={chatInputRef}
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
