import { useState, useCallback } from 'react';
import { SlidersHorizontal, Lightbulb, MessageSquareText } from 'lucide-react';
import { VoiceSlider } from '@/components/settings/VoiceSlider';
import { VoiceInfoBox } from '@/components/settings/VoiceInfoBox';
import { SampleCommunications } from '@/components/settings/SampleCommunications';
import { VoiceSummary } from '@/components/settings/VoiceSummary';
import { VoiceJsonExport } from '@/components/settings/VoiceJsonExport';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useOnboardingHeaderActions } from '@/hooks/useOnboardingHeaderActions';
import { sliderConfigs, DimensionKey } from '@/lib/voiceConfig';
import { toast } from 'sonner';

export const BrandVoiceScreen = () => {
  const { settings, hasChanges, isSaving, updateDraft, save, cancel } = useVoiceSettings();
  const [activeInfo, setActiveInfo] = useState<DimensionKey | null>('humor'); // Default to show humor

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
    setActiveInfo('humor');
    toast.info('Changes discarded');
  }, [cancel]);

  // Register actions with header (uses onboarding-aware hook for wizard flow)
  useOnboardingHeaderActions(hasChanges, isSaving, handleSave, handleCancel);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Section - Sliders and Info Box side by side */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Sliders Card - Left */}
        <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">Voice Dimensions</span>
          </div>

          {/* Card Body */}
          <div className="divide-y divide-border/50">
            {sliderConfigs.map((config) => (
              <div
                key={config.key}
                className={`px-5 transition-colors duration-200 ${
                  activeInfo === config.key ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <VoiceSlider
                  title={config.title}
                  description={config.description}
                  leftLabel={config.leftLabel}
                  rightLabel={config.rightLabel}
                  value={settings[config.key]}
                  onChange={(v) => handleSliderChange(config.key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info Box Card - Right */}
        <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-b border-border/50">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-foreground">Live Preview</span>
          </div>

          {/* Card Body - flex-1 to fill remaining height */}
          <div className="p-5 flex-1 flex flex-col justify-center">
            <VoiceInfoBox
              activeKey={activeInfo}
              value={activeInfo ? settings[activeInfo] : 0}
            />
          </div>
        </div>
      </div>

      {/* Sample Communications Section */}
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <MessageSquareText className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Sample Communications</span>
          <span className="text-xs text-muted-foreground ml-auto">See how your voice settings sound in real HR messages</span>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <SampleCommunications
            formality={settings.formality}
            humor={settings.humor}
            respect={settings.respect}
            enthusiasm={settings.enthusiasm}
          />
        </div>
      </div>

      {/* Summary Panel */}
      <VoiceSummary values={settings} />

      {/* JSON Export */}
      <VoiceJsonExport values={settings} />
    </div>
  );
};
