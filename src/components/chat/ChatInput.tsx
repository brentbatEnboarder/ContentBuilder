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
      className="relative bg-gradient-to-t from-slate-50 via-card to-card dark:from-slate-900 dark:via-card dark:to-card border-t border-border/50 px-4 pt-3 pb-4"
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
          <button
            type="button"
            onClick={onGenerateImages}
            disabled={!hasContent || isGeneratingImages}
            className="
              flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl
              bg-gradient-to-b from-coral to-coral-hover
              text-white font-medium text-sm
              border border-coral-hover/50
              shadow-[0_2px_8px_rgba(252,115,97,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]
              hover:from-coral-hover hover:to-coral
              hover:shadow-[0_4px_16px_rgba(252,115,97,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]
              active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
              transition-all duration-150 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            "
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
          </button>
        )}
      </div>

      {/* Input box with embedded buttons - elevated card style */}
      <div className="relative rounded-xl bg-card border border-border/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_4px_16px_rgba(124,33,204,0.12)] focus-within:border-primary/40 transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type, paste URL, or drop files..."
          disabled={disabled}
          className="w-full min-h-[80px] max-h-[160px] px-4 py-3 pb-12 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50"
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
                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>

          {/* Mic + Send buttons - bottom right */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Voice input (coming soon)</TooltipContent>
            </Tooltip>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className="
                h-8 w-8 rounded-lg flex items-center justify-center
                bg-gradient-to-b from-primary to-primary-hover
                text-white
                shadow-[0_2px_6px_rgba(124,33,204,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]
                hover:shadow-[0_3px_10px_rgba(124,33,204,0.45)]
                active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]
                transition-all duration-150 ease-out
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              "
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
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
