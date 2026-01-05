import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVoiceSettings, VoiceSettings } from '@/hooks/useVoiceSettings';
import { DimensionKey } from '@/lib/voiceConfig';

interface VoiceDropdownProps {
  onNavigateToSettings: () => void;
}

const getVoiceSummary = (settings: VoiceSettings): string => {
  const formalityLabels = ['Formal', 'Somewhat Formal', 'Balanced', 'Casual', 'Very Casual'];
  return formalityLabels[settings.formality] || 'Balanced';
};

const sliderLabels: Record<DimensionKey, { label: string; min: string; max: string }> = {
  formality: { label: 'Formality', min: 'Formal', max: 'Casual' },
  humor: { label: 'Humor', min: 'Serious', max: 'Funny' },
  respect: { label: 'Respect', min: 'Respectful', max: 'Irreverent' },
  enthusiasm: { label: 'Enthusiasm', min: 'Matter-of-fact', max: 'Enthusiastic' },
};

export const VoiceDropdown = ({ onNavigateToSettings }: VoiceDropdownProps) => {
  const { settings } = useVoiceSettings();

  const getValueLabel = (key: DimensionKey, value: number): string => {
    const { min, max } = sliderLabels[key];
    if (value <= 1) return min;
    if (value >= 3) return max;
    return 'Balanced';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-3 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Voice: {getVoiceSummary(settings)}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {(Object.keys(sliderLabels) as DimensionKey[]).map((key) => (
          <div key={key} className="px-2 py-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{sliderLabels[key].label}</span>
              <span className="font-medium">{getValueLabel(key, settings[key])}</span>
            </div>
          </div>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onNavigateToSettings}>
          Edit Voice Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
