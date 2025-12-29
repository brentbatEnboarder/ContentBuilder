import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleCardProps {
  style: ImageStyleType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  image: string;
}

export const StyleCard = ({
  label,
  isSelected,
  onClick,
  image
}: StyleCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-lg overflow-hidden',
        'border-2 transition-all duration-200',
        'hover:shadow-md hover:border-primary',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isSelected ? 'border-primary shadow-sm' : 'border-border'
      )}
    >
      {/* Sample image */}
      <div className="aspect-[4/3] w-full bg-muted">
        <img
          src={image}
          alt={`${label} style example`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      
      {/* Label */}
      <div className="p-3 bg-card text-left">
        <span className={cn(
          'text-sm font-medium',
          isSelected ? 'text-primary' : 'text-foreground'
        )}>
          {label}
        </span>
      </div>
      
      {/* Selected checkmark badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </button>
  );
};
