import { useState, useRef, useCallback } from 'react';
import { Plus, Mic, SendHorizontal, Link, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileChip } from './FileChip';
import { FileDropZone } from './FileDropZone';
import { StyleDropdown } from '@/components/preview/StyleDropdown';
import { useInputDetection, useFileDropzone } from '@/hooks/useInputDetection';
import type { FileAttachment } from '@/types/page';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  disabled?: boolean;
  hasContent?: boolean;
  isGeneratingImages?: boolean;
  onGenerateImages?: () => void;
  onNavigateToStyle?: () => void;
  onStyleChange?: () => void;
}

const generateFileId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const ChatInput = ({
  onSend,
  disabled,
  hasContent,
  isGeneratingImages,
  onGenerateImages,
  onNavigateToStyle,
  onStyleChange,
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
      className="relative bg-gradient-to-t from-muted/50 via-background to-background border-t border-border px-4 pt-3 pb-4"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, handleFilesSelected)}
    >
      <FileDropZone isDragOver={isDragOver} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.pptx"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* File attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map(file => (
            <FileChip
              key={file.id}
              file={file}
              onRemove={() => handleRemoveFile(file.id)}
            />
          ))}
        </div>
      )}

      {/* Style Dropdown + Generate Imagery Button */}
      <div className="flex items-center gap-2 mb-3">
        {onNavigateToStyle && (
          <StyleDropdown
            onNavigateToSettings={onNavigateToStyle}
            onStyleChange={onStyleChange}
          />
        )}
        {onGenerateImages && (
          <Button
            variant="outline"
            className="flex-1 gap-2 bg-background hover:bg-muted"
            onClick={onGenerateImages}
            disabled={!hasContent || isGeneratingImages}
          >
            {isGeneratingImages ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate Imagery
              </>
            )}
          </Button>
        )}
      </div>

      {/* Input box with embedded buttons - elevated card style */}
      <div className="relative rounded-xl bg-background border border-border shadow-sm shadow-primary/5 focus-within:shadow-md focus-within:shadow-primary/10 focus-within:border-primary/30 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type, paste URL, or drop files..."
          disabled={disabled}
          className="w-full min-h-[80px] max-h-[160px] px-4 py-3 pb-12 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          rows={2}
        />

        {/* Bottom row: Plus on left, Mic + Send on right */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {/* Plus (attach) button - bottom left */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>

          {/* Mic + Send buttons - bottom right */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-muted"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input (coming soon)</TooltipContent>
            </Tooltip>

            <Button
              size="icon"
              className="h-8 w-8 rounded-lg shadow-sm"
              onClick={handleSubmit}
              disabled={!canSend}
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasUrl && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-primary">
          <Link className="w-3.5 h-3.5" />
          <span>URL detected - will extract content</span>
        </div>
      )}
    </div>
  );
};
