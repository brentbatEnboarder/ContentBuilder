import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageGrid } from './ImageGrid';

interface ContentPreviewProps {
  text: string;
  images: string[];
  onRegenerateImage?: (index: number) => void;
}

export const ContentPreview = ({ text, images, onRegenerateImage }: ContentPreviewProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {text}
        </ReactMarkdown>
      </div>

      <ImageGrid images={images} onRegenerateImage={onRegenerateImage} />
    </div>
  );
};
