import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceSlider } from '@/components/settings/VoiceSlider';
import { VoiceInfoBox } from '@/components/settings/VoiceInfoBox';
import { SampleCommunications } from '@/components/settings/SampleCommunications';
import { VoiceSummary } from '@/components/settings/VoiceSummary';
import { VoiceJsonExport } from '@/components/settings/VoiceJsonExport';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { sliderConfigs, DimensionKey } from '@/lib/voiceConfig';
import { toast } from 'sonner';

export const BrandVoiceScreen = () => {
  const { settings, hasChanges, isSaving, updateDraft, save, cancel } = useVoiceSettings();
  const [activeInfo, setActiveInfo] = useState<DimensionKey | null>(null);

  const handleSliderChange = (key: DimensionKey, value: number) => {
    updateDraft(key, value);
    setActiveInfo(key);
  };

  const handleSave = async () => {
    try {
      await save();
      toast.success('Brand voice settings saved successfully');
    } catch (error) {
      toast.error('Failed to save voice settings');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    cancel();
    setActiveInfo(null);
    toast.info('Changes discarded');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-2">Brand Voice</h1>
      <p className="text-muted-foreground mb-8">
        Configure how your generated content should sound.
      </p>

      {/* Sliders Section */}
      <div className="bg-card rounded-lg border border-border mb-6">
        {sliderConfigs.map((config, index) => (
          <div key={config.key}>
            <div className="px-6">
              <VoiceSlider
                title={config.title}
                description={config.description}
                leftLabel={config.leftLabel}
                rightLabel={config.rightLabel}
                value={settings[config.key]}
                onChange={(v) => handleSliderChange(config.key, v)}
              />
            </div>
            {index < sliderConfigs.length - 1 && (
              <div className="border-t border-border" />
            )}
          </div>
        ))}
      </div>

      {/* Info Box - shows when slider adjusted */}
      <VoiceInfoBox 
        activeKey={activeInfo} 
        value={activeInfo ? settings[activeInfo] : 0} 
      />

      {/* Sample Communications */}
      <SampleCommunications
        formality={settings.formality}
        humor={settings.humor}
        respect={settings.respect}
        enthusiasm={settings.enthusiasm}
      />

      {/* Summary Panel */}
      <VoiceSummary values={settings} />

      {/* JSON Export */}
      <VoiceJsonExport values={settings} />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={handleCancel} disabled={!hasChanges || isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};
