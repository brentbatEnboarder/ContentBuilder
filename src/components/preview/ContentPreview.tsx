import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, Pencil } from 'lucide-react';
import { ImageGrid } from './ImageGrid';
import { cn } from '@/lib/utils';

interface ContentPreviewProps {
  text: string;
  images: string[];
  onRegenerateImage?: (index: number) => void;
  onTextChange?: (text: string) => void;
}

export const ContentPreview = ({ text, images, onRegenerateImage, onTextChange }: ContentPreviewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editedText with text prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditedText(text);
    }
  }, [text, isEditing]);

  // Auto-focus and adjust height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      adjustTextareaHeight();
    }
  }, [isEditing]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  const handleStartEditing = useCallback(() => {
    if (onTextChange) {
      setIsEditing(true);
    }
  }, [onTextChange]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editedText !== text && onTextChange) {
      onTextChange(editedText);
    }
  }, [editedText, text, onTextChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedText(text);
  }, [text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditedText(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  const isEditable = !!onTextChange;

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Card Header - Subtle teal accent */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-teal/5 via-slate-50/50 to-transparent dark:from-teal/10 dark:via-slate-800/50 dark:to-transparent border-b border-border/40">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-teal/20 to-teal/10 border border-teal/20">
          <FileText className="w-4 h-4 text-teal" />
        </div>
        <span className="text-sm font-semibold text-foreground">Generated Content</span>
        <Sparkles className="w-4 h-4 text-golden ml-auto" />
      </div>

      {/* Card Body */}
      <div className="p-6">
        {isEditing ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={handleChange}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full min-h-[300px] p-4 rounded-lg',
                'bg-muted/30 border border-primary/30',
                'text-foreground text-sm font-mono leading-relaxed',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                'resize-none overflow-hidden'
              )}
              placeholder="Enter your content in markdown..."
            />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Markdown supported</span>
              <span>Esc to cancel • Click outside to save</span>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'relative group',
              isEditable && 'cursor-text'
            )}
            onClick={handleStartEditing}
          >
            {/* Edit hint overlay */}
            {isEditable && (
              <div
                className={cn(
                  'absolute -top-2 -right-2 z-10',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'bg-primary text-primary-foreground',
                  'px-2 py-1 rounded-md text-xs font-medium',
                  'flex items-center gap-1 shadow-lg'
                )}
              >
                <Pencil className="w-3 h-3" />
                Click to edit
              </div>
            )}

            {/* Hover border effect */}
            <div
              className={cn(
                'rounded-lg transition-colors',
                isEditable && 'group-hover:bg-muted/30 group-hover:ring-1 group-hover:ring-border p-4 -m-4'
              )}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {text}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <ImageGrid images={images} onRegenerateImage={onRegenerateImage} />
      </div>
    </div>
  );
};
