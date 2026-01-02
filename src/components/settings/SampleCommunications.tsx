import { useMemo } from 'react';
import { SampleCard } from './SampleCard';
import { sampleConfigs } from '@/lib/voiceConfig';

interface SampleCommunicationsProps {
  formality: number;
  humor: number;
  respect: number;
  enthusiasm: number;
}

export const SampleCommunications = ({
  formality,
  humor,
  respect,
  enthusiasm,
}: SampleCommunicationsProps) => {
  const samples = useMemo(() => {
    return sampleConfigs.map((config) => ({
      ...config,
      content: config.generator(formality, humor, respect, enthusiasm),
    }));
  }, [formality, humor, respect, enthusiasm]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {samples.map((sample) => (
        <SampleCard
          key={sample.id}
          badge={sample.badge}
          title={sample.title}
          content={sample.content}
        />
      ))}
    </div>
  );
};
