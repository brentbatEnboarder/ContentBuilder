import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';
import { Pencil } from 'lucide-react';

interface TextBlockProps {
  id: string;
  content: string;
  onUpdate?: (content: string) => void;
  isEditable?: boolean;
}

export const TextBlock = ({
  id,
  content,
  onUpdate,
  isEditable = true,
}: TextBlockProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editedContent with content prop when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(content);
    }
  }, [content, isEditing]);

  // Auto-focus and adjust height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
      // Adjust height to content
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
    if (isEditable && onUpdate) {
      setIsEditing(true);
    }
  }, [isEditable, onUpdate]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editedContent !== content && onUpdate) {
      onUpdate(editedContent);
    }
  }, [editedContent, content, onUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedContent(content); // Reset to original
  }, [content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
      // Ctrl/Cmd + Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditedContent(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  if (isEditing) {
    return (
      <div id={id} className="relative group">
        <textarea
          ref={textareaRef}
          value={editedContent}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full min-h-[200px] p-4 rounded-lg',
            'bg-card border border-primary/30',
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
    );
  }

  return (
    <div
      id={id}
      className={cn(
        'relative group',
        isEditable && onUpdate && 'cursor-text'
      )}
      onClick={handleStartEditing}
    >
      {/* Edit hint overlay - shows on hover when editable */}
      {isEditable && onUpdate && (
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
          'p-4 -m-4 rounded-lg transition-colors',
          isEditable && onUpdate && 'group-hover:bg-muted/30 group-hover:ring-1 group-hover:ring-border'
        )}
      >
        <div
          className={cn(
            'prose prose-sm max-w-none',
            'prose-headings:text-foreground prose-headings:font-semibold',
            'prose-p:text-foreground prose-p:leading-relaxed',
            'prose-strong:text-foreground prose-strong:font-semibold',
            'prose-ul:text-foreground prose-ol:text-foreground',
            'prose-li:text-foreground',
            'prose-a:text-primary hover:prose-a:underline'
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default TextBlock;
