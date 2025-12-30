import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils';

interface TextBlockProps {
  id: string;
  content: string;
}

export const TextBlock = ({ id, content }: TextBlockProps) => {
  return (
    <div
      id={id}
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
  );
};

export default TextBlock;
