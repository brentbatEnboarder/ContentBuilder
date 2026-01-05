import { StyleCard } from './StyleCard';
import type { ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleOption {
  style: ImageStyleType;
  label: string;
  description: string;
  image: string;
}

const styleOptions: StyleOption[] = [
  {
    style: 'corporate',
    label: 'Corporate',
    description: 'Professional, polished',
    image: '/styles/corporate.jpg',
  },
  {
    style: 'flat',
    label: 'Flat',
    description: 'Bold colors, simple shapes',
    image: '/styles/flat.jpg',
  },
  {
    style: 'isometric',
    label: 'Isometric',
    description: '3D perspective art',
    image: '/styles/isometric.jpg',
  },
  {
    style: 'abstract',
    label: 'Abstract',
    description: 'Dynamic, modern art',
    image: '/styles/abstract.jpg',
  },
  {
    style: 'handdrawn',
    label: 'Hand-drawn',
    description: 'Sketch style, casual',
    image: '/styles/handdrawn.jpg',
  },
  {
    style: 'photorealistic',
    label: 'Photorealistic',
    description: 'Natural, lifelike',
    image: '/styles/photo.jpg',
  },
  {
    style: 'minimalist',
    label: 'Minimalist',
    description: 'Clean, lots of space',
    image: '/styles/minimalist.jpg',
  },
  {
    style: 'infographic',
    label: 'Infographic',
    description: 'Data viz, diagrams',
    image: '/styles/infographic.jpg',
  },
];

interface StyleGridProps {
  selectedStyle: ImageStyleType;
  onSelect: (style: ImageStyleType) => void;
}

export const StyleGrid = ({ selectedStyle, onSelect }: StyleGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {styleOptions.map((option) => (
        <StyleCard
          key={option.style}
          style={option.style}
          label={option.label}
          description={option.description}
          image={option.image}
          isSelected={selectedStyle === option.style}
          onClick={() => onSelect(option.style)}
        />
      ))}
    </div>
  );
};
