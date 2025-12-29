import { Slider } from '@/components/ui/slider';

interface VoiceSliderProps {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
}

export const VoiceSlider = ({
  title,
  description,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: VoiceSliderProps) => {
  return (
    <div className="py-5">
      <div className="mb-4">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-28 text-right flex-shrink-0">
          {leftLabel}
        </span>
        
        <div className="flex-1 relative">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={0}
            max={4}
            step={1}
            className="w-full"
          />
          {/* Step markers */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between pointer-events-none px-[10px]">
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-1 h-1 rounded-full ${
                  step <= value ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
        
        <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
          {rightLabel}
        </span>
      </div>
    </div>
  );
};
