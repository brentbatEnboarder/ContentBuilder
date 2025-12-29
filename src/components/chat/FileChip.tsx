import { FileText, X } from 'lucide-react';
import type { FileAttachment } from '@/types/page';

interface FileChipProps {
  file: FileAttachment;
  onRemove: () => void;
}

export const FileChip = ({ file, onRemove }: FileChipProps) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-3 py-2">
      <FileText className="w-4 h-4 text-muted-foreground" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate max-w-[150px]">
          {file.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatSize(file.size)}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 p-0.5 hover:bg-background rounded transition-colors"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};
