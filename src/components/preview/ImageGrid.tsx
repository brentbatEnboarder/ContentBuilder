import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  images: string[];
  onRegenerateImage?: (index: number) => void;
}

export const ImageGrid = ({ images, onRegenerateImage }: ImageGridProps) => {
  if (images.length === 0) return null;

  return (
    <div className={cn(
      'grid gap-4 mt-6',
      images.length === 1 && 'grid-cols-1',
      images.length === 2 && 'grid-cols-2',
      images.length >= 3 && 'grid-cols-3'
    )}>
      {images.map((image, index) => (
        <div
          key={index}
          className="relative group aspect-video bg-muted rounded-lg overflow-hidden"
        >
          <img
            src={image}
            alt={`Generated image ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => onRegenerateImage?.(index)}
            >
              <RotateCw className="w-3.5 h-3.5" />
              Regenerate
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
