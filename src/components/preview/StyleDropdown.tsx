import { Palette, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStyleSettings, ImageStyleType } from '@/hooks/useStyleSettings';

interface StyleDropdownProps {
  onNavigateToSettings: () => void;
  onStyleChange?: () => void;
}

const styleLabels: Record<ImageStyleType, string> = {
  corporate: 'Corporate',
  flat: 'Flat',
  isometric: 'Isometric',
  abstract: 'Abstract',
  handdrawn: 'Hand-drawn',
  photo: 'Photorealistic',
  minimalist: 'Minimalist',
  warm: 'Warm',
};

export const StyleDropdown = ({ onNavigateToSettings, onStyleChange }: StyleDropdownProps) => {
  const { settings, selectStyle, save } = useStyleSettings();

  const handleStyleSelect = (style: ImageStyleType) => {
    selectStyle(style);
    save();
    onStyleChange?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2">
          <Palette className="w-4 h-4" />
          <span className="text-sm">Style: {styleLabels[settings.selectedStyle]}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {(Object.keys(styleLabels) as ImageStyleType[]).map((style) => (
          <DropdownMenuItem
            key={style}
            onClick={() => handleStyleSelect(style)}
            className="flex justify-between"
          >
            <span>{styleLabels[style]}</span>
            {settings.selectedStyle === style && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateToSettings}>
          Edit Style Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
