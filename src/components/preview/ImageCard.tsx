import { Loader2 } from 'lucide-react';

interface ImageCardProps {
  title: string;
  type: 'header' | 'body';
  aspectRatio: string;
  images: string[]; // base64 data URLs
  isGenerating?: boolean;
}

export const ImageCard = ({
  title,
  type,
  aspectRatio,
  images,
  isGenerating,
}: ImageCardProps) => {
  // Calculate aspect ratio for CSS
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '21:9':
        return 'aspect-[21/9]';
      case '2:1':
        return 'aspect-[2/1]';
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      case '9:16':
        return 'aspect-[9/16]';
      case '1:1':
        return 'aspect-square';
      case '3:2':
        return 'aspect-[3/2]';
      default:
        return 'aspect-video';
    }
  };

  if (isGenerating) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {type === 'header' ? 'Header Image' : 'Body Image'}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className={`${getAspectRatioClass()} rounded-md bg-muted flex items-center justify-center`}>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {type === 'header' ? 'Header Image' : 'Body Image'}
        </span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {images.length} variation{images.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {images.map((src, index) => (
          <div key={index} className={`${getAspectRatioClass()} rounded-md overflow-hidden bg-muted`}>
            <img
              src={src}
              alt={`${title} - variation ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
