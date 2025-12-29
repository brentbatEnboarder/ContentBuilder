import { useState, useRef, useCallback } from 'react';
import { Paperclip, Mic, SendHorizontal, Link, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileChip } from './FileChip';
import { FileDropZone } from './FileDropZone';
import { useInputDetection, useFileDropzone } from '@/hooks/useInputDetection';
import type { FileAttachment } from '@/types/page';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  hasContent?: boolean;
  isGeneratingImages?: boolean;
  onGenerateImages?: () => void;
}

const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const ChatInput = ({
  onSend,
  disabled,
  hasContent,
  isGeneratingImages,
  onGenerateImages,
}: ChatInputProps) => {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { hasUrl } = useInputDetection(value);
  const { isDragOver, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileDropzone();

  const handleFilesSelected = useCallback((files: File[]) => {
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: generateFileId(),
      name: file.name,
      type: file.type,
      size: file.size,
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setAttachments(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedValue = value.trim();
    if (!trimmedValue && attachments.length === 0) return;

    onSend(trimmedValue, attachments.length > 0 ? attachments : undefined);
    setValue('');
    setAttachments([]);
  }, [value, attachments, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
    e.target.value = '';
  }, [handleFilesSelected]);

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <div
      className="relative border-t border-border bg-card p-4"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, handleFilesSelected)}
    >
      <FileDropZone isDragOver={isDragOver} />

      {/* Generate Imagery Button */}
      {hasContent && onGenerateImages && (
        <div className="mb-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onGenerateImages}
            disabled={isGeneratingImages}
          >
            {isGeneratingImages ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Images...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate Imagery
              </>
            )}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.pptx"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex items-center gap-2 mb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled
            >
              <Mic className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voice input (coming soon)</TooltipContent>
        </Tooltip>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map(file => (
            <FileChip
              key={file.id}
              file={file}
              onRemove={() => handleRemoveFile(file.id)}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type, paste URL, or drop files..."
          disabled={disabled}
          className="min-h-[80px] max-h-[160px] pr-12 resize-none"
          rows={2}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-8 w-8"
          onClick={handleSubmit}
          disabled={!canSend}
        >
          <SendHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {hasUrl && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-primary">
          <Link className="w-3.5 h-3.5" />
          <span>URL detected - will extract content</span>
        </div>
      )}
    </div>
  );
};
