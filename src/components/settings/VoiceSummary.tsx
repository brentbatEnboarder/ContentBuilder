import { UserCircle, ChevronRight } from 'lucide-react';
import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';

interface VoiceSummaryProps {
  values: Record<DimensionKey, number>;
}

export const VoiceSummary = ({ values }: VoiceSummaryProps) => {
  const dimensions = Object.values(dimensionConfig);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
          <UserCircle className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Your Brand Voice Profile</span>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {dimensions.map((dim) => {
            const value = values[dim.key];
            const valueData = dim.values[value];

            return (
              <div
                key={dim.key}
                className="relative bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-4 border border-border/50 group hover:border-primary/30 transition-colors"
              >
                {/* Mini progress indicator */}
                <div className="flex gap-0.5 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1 rounded-full ${
                        i <= value ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                {/* Dimension labels */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2 font-medium">
                  <span>{dim.left}</span>
                  <ChevronRight className="w-3 h-3 opacity-50" />
                  <span>{dim.right}</span>
                </div>

                {/* Value label */}
                <p className="font-semibold text-foreground text-sm text-center">
                  {valueData.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
