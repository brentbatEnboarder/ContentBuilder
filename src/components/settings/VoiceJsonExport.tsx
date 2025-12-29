import { dimensionConfig, DimensionKey } from '@/lib/voiceConfig';

interface VoiceJsonExportProps {
  values: Record<DimensionKey, number>;
}

export const VoiceJsonExport = ({ values }: VoiceJsonExportProps) => {
  const exportData = {
    dimensional_positioning: {
      formality: values.formality,
      humor: values.humor,
      respect: values.respect,
      enthusiasm: values.enthusiasm,
    },
    labels: {
      formality: dimensionConfig.formality.values[values.formality].label,
      humor: dimensionConfig.humor.values[values.humor].label,
      respect: dimensionConfig.respect.values[values.respect].label,
      enthusiasm: dimensionConfig.enthusiasm.values[values.enthusiasm].label,
    },
  };

  return (
    <details className="bg-muted/50 rounded-lg mb-6 group">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors rounded-lg">
        ▶ Export as JSON
      </summary>
      <div className="px-4 pb-4">
        <pre className="bg-[hsl(220_20%_10%)] text-[hsl(140_60%_65%)] p-4 rounded-lg text-sm font-mono overflow-x-auto">
          {JSON.stringify(exportData, null, 2)}
        </pre>
      </div>
    </details>
  );
};
