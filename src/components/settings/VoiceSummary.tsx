import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';

interface VoiceSummaryProps {
  values: Record<DimensionKey, number>;
}

export const VoiceSummary = ({ values }: VoiceSummaryProps) => {
  const dimensions = Object.values(dimensionConfig);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Your Brand Voice Profile
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {dimensions.map((dim) => {
          const value = values[dim.key];
          const valueData = dim.values[value];
          
          return (
            <div
              key={dim.key}
              className="bg-muted/50 rounded-lg p-4"
            >
              <p className="text-sm text-muted-foreground mb-1">
                {dim.left} ↔ {dim.right}
              </p>
              <p className="font-semibold text-foreground">
                {valueData.label}
              </p>
              <p className="text-xs text-primary mt-1">
                Score: {value}/4
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
