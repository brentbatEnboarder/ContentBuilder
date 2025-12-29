import { ImageGrid } from './ImageGrid';

interface ContentPreviewProps {
  text: string;
  images: string[];
  onRegenerateImage?: (index: number) => void;
}

export const ContentPreview = ({ text, images, onRegenerateImage }: ContentPreviewProps) => {
  // Parse markdown-like text into formatted content
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Handle headers
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h2 key={index} className="text-xl font-bold text-foreground mb-3">
            {trimmed.slice(2, -2)}
          </h2>
        );
      }
      
      // Handle bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return (
          <li key={index} className="ml-4 text-foreground">
            {trimmed.slice(1).trim()}
          </li>
        );
      }
      
      // Handle empty lines
      if (trimmed === '') {
        return <br key={index} />;
      }
      
      // Regular paragraph
      return (
        <p key={index} className="text-foreground mb-2">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="prose prose-sm max-w-none">
        {renderContent(text)}
      </div>
      
      <ImageGrid images={images} onRegenerateImage={onRegenerateImage} />
    </div>
  );
};
