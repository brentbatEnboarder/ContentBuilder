import { useCallback } from 'react';
import { Palette, ImageIcon } from 'lucide-react';
import { StyleGrid } from '@/components/settings/StyleGrid';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useStyleSettings } from '@/hooks/useStyleSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
import { toast } from 'sonner';

export const ImageStyleScreen = () => {
  const { settings: styleSettings, hasChanges: styleHasChanges, isSaving: styleIsSaving, selectStyle, save: saveStyle, cancel: cancelStyle } = useStyleSettings();
  const { settings: companySettings, hasChanges: colorHasChanges, isSaving: colorIsSaving, updateColors, save: saveColors, cancel: cancelColors } = useCompanySettings();

  const hasChanges = styleHasChanges || colorHasChanges;
  const isSaving = styleIsSaving || colorIsSaving;

  const handleSave = useCallback(async () => {
    try {
      // Save both if either has changes
      if (styleHasChanges) await saveStyle();
      if (colorHasChanges) await saveColors();
      toast.success('Visual settings saved successfully');
    } catch (error) {
      toast.error('Failed to save visual settings');
      console.error('Save error:', error);
    }
  }, [styleHasChanges, colorHasChanges, saveStyle, saveColors]);

  const handleCancel = useCallback(() => {
    cancelStyle();
    cancelColors();
    toast.info('Changes discarded');
  }, [cancelStyle, cancelColors]);

  // Register actions with header
  useRegisterHeaderActions(hasChanges, isSaving, handleSave, handleCancel);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Brand Colors Section */}
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <Palette className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Brand Colors</span>
          <span className="text-xs text-muted-foreground ml-auto">Used to style generated content</span>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ColorPicker
              label="Primary"
              value={companySettings.colors.primary}
              onChange={(v) => updateColors('primary', v)}
            />
            <ColorPicker
              label="Secondary"
              value={companySettings.colors.secondary}
              onChange={(v) => updateColors('secondary', v)}
            />
            <ColorPicker
              label="Accent"
              value={companySettings.colors.accent}
              onChange={(v) => updateColors('accent', v)}
            />
            <ColorPicker
              label="Text Color"
              value={companySettings.colors.textColor}
              onChange={(v) => updateColors('textColor', v)}
            />
            <ColorPicker
              label="Button BG"
              value={companySettings.colors.buttonBg}
              onChange={(v) => updateColors('buttonBg', v)}
            />
            <ColorPicker
              label="Button FG"
              value={companySettings.colors.buttonFg}
              onChange={(v) => updateColors('buttonFg', v)}
            />
          </div>
        </div>
      </div>

      {/* Image Style Section */}
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <ImageIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Image Style</span>
          <span className="text-xs text-muted-foreground ml-auto">Visual style for AI-generated images</span>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <StyleGrid
            selectedStyle={styleSettings.selectedStyle}
            onSelect={selectStyle}
          />
        </div>
      </div>
    </div>
  );
};
