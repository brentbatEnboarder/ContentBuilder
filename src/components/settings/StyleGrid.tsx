import { StyleCard } from './StyleCard';
import type { ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleOption {
  style: ImageStyleType;
  label: string;
  gradient: string;
}

const styleOptions: StyleOption[] = [
  {
    style: 'corporate',
    label: 'Corporate',
    gradient: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 50%, #4299e1 100%)',
  },
  {
    style: 'flat',
    label: 'Flat',
    gradient: 'linear-gradient(135deg, #9F7AEA 0%, #ED64A6 50%, #F687B3 100%)',
  },
  {
    style: 'isometric',
    label: 'Isometric',
    gradient: 'linear-gradient(135deg, #38B2AC 0%, #81E6D9 50%, #B2F5EA 100%)',
  },
  {
    style: 'abstract',
    label: 'Abstract',
    gradient: 'linear-gradient(135deg, #ED8936 0%, #F6AD55 50%, #FEEBC8 100%)',
  },
  {
    style: 'handdrawn',
    label: 'Hand-drawn',
    gradient: 'linear-gradient(135deg, #68D391 0%, #9AE6B4 50%, #C6F6D5 100%)',
  },
  {
    style: 'photo',
    label: 'Photorealistic',
    gradient: 'linear-gradient(135deg, #4A5568 0%, #718096 50%, #A0AEC0 100%)',
  },
  {
    style: 'minimalist',
    label: 'Minimalist',
    gradient: 'linear-gradient(135deg, #E2E8F0 0%, #EDF2F7 50%, #F7FAFC 100%)',
  },
  {
    style: 'warm',
    label: 'Warm',
    gradient: 'linear-gradient(135deg, #C53030 0%, #E53E3E 50%, #FC8181 100%)',
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
            gradient={option.gradient}
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
