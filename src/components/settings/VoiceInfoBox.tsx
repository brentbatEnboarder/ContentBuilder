import { Sparkles, Quote } from 'lucide-react';
import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';

interface VoiceInfoBoxProps {
  activeKey: DimensionKey | null;
  value: number;
}

export const VoiceInfoBox = ({ activeKey, value }: VoiceInfoBoxProps) => {
  if (!activeKey) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Adjust a slider to see a live preview</p>
      </div>
    );
  }

  const config = dimensionConfig[activeKey];
  const valueData = config.values[value];

  return (
    <div className="space-y-4">
      {/* Dimension indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>{config.left}</span>
        <div className="flex-1 flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= value ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span>{config.right}</span>
      </div>

      {/* Value label */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          {valueData.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground text-center leading-relaxed">
        {valueData.description}
      </p>

      {/* Example */}
      <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border/50">
        <Quote className="absolute top-2 left-2 w-4 h-4 text-primary/30" />
        <p className="text-xs font-medium text-muted-foreground mb-2 ml-5">
          Example
        </p>
        <p className="text-sm text-foreground italic leading-relaxed ml-5">
          {valueData.example}
        </p>
      </div>
    </div>
  );
};
