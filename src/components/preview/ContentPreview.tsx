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
        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary-hover">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text}
          </ReactMarkdown>
        </div>

        <ImageGrid images={images} onRegenerateImage={onRegenerateImage} />
      </div>
    </div>
  );
};
