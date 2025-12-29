import { Info } from 'lucide-react';
import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';
import { cn } from '@/lib/utils';

interface VoiceInfoBoxProps {
  activeKey: DimensionKey | null;
  value: number;
}

export const VoiceInfoBox = ({ activeKey, value }: VoiceInfoBoxProps) => {
  if (!activeKey) return null;

  const config = dimensionConfig[activeKey];
  const valueData = config.values[value];

  return (
    <div 
      className={cn(
        "rounded-xl p-6 mb-6 transition-all duration-300",
        "bg-[hsl(270_100%_96%)] border-2 border-[hsl(270_95%_90%)]"
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-[hsl(270_75%_35%)] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-[hsl(270_75%_25%)]">
            {config.left} ↔ {config.right}: {valueData.label}
          </h4>
          <p className="text-[hsl(270_60%_40%)] mt-1">
            {valueData.description}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 ml-8">
        <p className="text-sm text-muted-foreground mb-2 font-medium">
          Example HR Communication:
        </p>
        <p className="text-foreground italic whitespace-pre-line">
          "{valueData.example}"
        </p>
      </div>
    </div>
  );
};
