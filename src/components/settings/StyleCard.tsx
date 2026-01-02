import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleCardProps {
  style: ImageStyleType;
  label: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  image: string;
}

export const StyleCard = ({
  label,
  description,
  isSelected,
  onClick,
  image
}: StyleCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden',
        'border-2 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
        isSelected
          ? 'border-primary shadow-md shadow-primary/10'
          : 'border-border/50 hover:border-primary/50'
      )}
    >
      {/* Sample image */}
      <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
        <img
          src={image}
          alt={`${label} style example`}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            'group-hover:scale-105'
          )}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Label */}
      <div className={cn(
        'p-3 text-left transition-colors',
        isSelected ? 'bg-primary/5' : 'bg-card'
      )}>
        <span className={cn(
          'text-sm font-semibold block',
          isSelected ? 'text-primary' : 'text-foreground'
        )}>
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {description}
        </span>
      </div>

      {/* Selected checkmark badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};
