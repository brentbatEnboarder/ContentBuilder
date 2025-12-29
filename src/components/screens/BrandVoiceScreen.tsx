import { useState, useCallback } from 'react';
import { VoiceSlider } from '@/components/settings/VoiceSlider';
import { VoiceInfoBox } from '@/components/settings/VoiceInfoBox';
import { SampleCommunications } from '@/components/settings/SampleCommunications';
import { VoiceSummary } from '@/components/settings/VoiceSummary';
import { VoiceJsonExport } from '@/components/settings/VoiceJsonExport';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
import { sliderConfigs, DimensionKey } from '@/lib/voiceConfig';
import { toast } from 'sonner';

export const BrandVoiceScreen = () => {
  const { settings, hasChanges, isSaving, updateDraft, save, cancel } = useVoiceSettings();
  const [activeInfo, setActiveInfo] = useState<DimensionKey | null>(null);

  const handleSliderChange = (key: DimensionKey, value: number) => {
    updateDraft(key, value);
    setActiveInfo(key);
  };

  const handleSave = useCallback(async () => {
    try {
      await save();
      toast.success('Brand voice settings saved successfully');
    } catch (error) {
      toast.error('Failed to save voice settings');
      console.error('Save error:', error);
    }
  }, [save]);

  const handleCancel = useCallback(() => {
    cancel();
    setActiveInfo(null);
    toast.info('Changes discarded');
  }, [cancel]);

  // Register actions with header
  useRegisterHeaderActions(hasChanges, isSaving, handleSave, handleCancel);

  return (
    <div className="p-8 max-w-4xl mx-auto">
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
    </div>
  );
};
