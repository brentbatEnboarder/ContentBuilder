import { FileText } from 'lucide-react';

interface FileDropZoneProps {
  isDragOver: boolean;
}

export const FileDropZone = ({ isDragOver }: FileDropZoneProps) => {
  if (!isDragOver) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg">
      <div className="flex flex-col items-center gap-2 text-primary">
        <FileText className="w-8 h-8" />
        <p className="font-medium">Drop files here</p>
        <p className="text-sm text-muted-foreground">PDF, DOCX, TXT, PPTX</p>
      </div>
    </div>
  );
};
