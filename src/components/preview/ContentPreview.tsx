import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles } from 'lucide-react';
import { ImageGrid } from './ImageGrid';

interface ContentPreviewProps {
  text: string;
  images: string[];
  onRegenerateImage?: (index: number) => void;
}

export const ContentPreview = ({ text, images, onRegenerateImage }: ContentPreviewProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Generated Content</span>
        <Sparkles className="w-3.5 h-3.5 text-primary/60 ml-auto" />
      </div>

      {/* Card Body */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>

        <ImageGrid images={images} onRegenerateImage={onRegenerateImage} />
      </div>
    </div>
  );
};
