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
    <div className="py-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-24 text-right flex-shrink-0 font-medium">
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
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  step <= value ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <span className="text-xs text-muted-foreground w-24 flex-shrink-0 font-medium">
          {rightLabel}
        </span>
      </div>
    </div>
  );
};
