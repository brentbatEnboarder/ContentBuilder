import { Lightbulb } from 'lucide-react';
import type { VoiceSettings } from '@/hooks/useVoiceSettings';
import { generateVoicePreview } from '@/lib/voiceDescriptors';

interface VoicePreviewProps {
  settings: VoiceSettings;
}

export const VoicePreview = ({ settings }: VoicePreviewProps) => {
  const previewText = generateVoicePreview(settings);

  return (
    <div className="bg-primary-light rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground mb-1">Voice Preview</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            "{previewText}"
          </p>
        </div>
      </div>
    </div>
  );
};
