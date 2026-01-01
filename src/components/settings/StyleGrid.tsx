import { StyleCard } from './StyleCard';
import type { ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleOption {
  style: ImageStyleType;
  label: string;
  image: string;
}

const styleOptions: StyleOption[] = [
  {
    style: 'corporate',
    label: 'Corporate',
    image: '/styles/corporate.jpg',
  },
  {
    style: 'flat',
    label: 'Flat',
    image: '/styles/flat.jpg',
  },
  {
    style: 'isometric',
    label: 'Isometric',
    image: '/styles/isometric.jpg',
  },
  {
    style: 'abstract',
    label: 'Abstract',
    image: '/styles/abstract.jpg',
  },
  {
    style: 'handdrawn',
    label: 'Hand-drawn',
    image: '/styles/handdrawn.jpg',
  },
  {
    style: 'photorealistic',
    label: 'Photorealistic',
    image: '/styles/photo.jpg',
  },
  {
    style: 'minimalist',
    label: 'Minimalist',
    image: '/styles/minimalist.jpg',
  },
  {
    style: 'warm',
    label: 'Warm',
    image: '/styles/warm.jpg',
  },
];

interface StyleGridProps {
  selectedStyle: ImageStyleType;
  onSelect: (style: ImageStyleType) => void;
}

export const StyleGrid = ({ selectedStyle, onSelect }: StyleGridProps) => {
  const selectedLabel = styleOptions.find(s => s.style === selectedStyle)?.label;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4">
        {styleOptions.map((option) => (
          <StyleCard
            key={option.style}
            style={option.style}
            label={option.label}
            image={option.image}
            isSelected={selectedStyle === option.style}
            onClick={() => onSelect(option.style)}
          />
        ))}
      </div>
      
      <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
        Selected: <span className="font-medium text-foreground">{selectedLabel}</span>
        <span className="text-primary">✓</span>
      </p>
    </div>
  );
};
