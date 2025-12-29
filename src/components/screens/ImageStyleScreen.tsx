import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StyleGrid } from '@/components/settings/StyleGrid';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { useStyleSettings } from '@/hooks/useStyleSettings';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';

export const ImageStyleScreen = () => {
  const { settings: styleSettings, hasChanges: styleHasChanges, isSaving: styleIsSaving, selectStyle, save: saveStyle, cancel: cancelStyle } = useStyleSettings();
  const { settings: companySettings, hasChanges: colorHasChanges, isSaving: colorIsSaving, updateColors, save: saveColors, cancel: cancelColors } = useCompanySettings();

  const hasChanges = styleHasChanges || colorHasChanges;
  const isSaving = styleIsSaving || colorIsSaving;

  const handleSave = async () => {
    try {
      // Save both if either has changes
      if (styleHasChanges) await saveStyle();
      if (colorHasChanges) await saveColors();
      toast.success('Visual settings saved successfully');
    } catch (error) {
      toast.error('Failed to save visual settings');
      console.error('Save error:', error);
    }
  };

  const handleCancel = () => {
    cancelStyle();
    cancelColors();
    toast.info('Changes discarded');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-2">Visual Style</h1>
      <p className="text-muted-foreground mb-8">
        Configure brand colors and image style for generated content.
      </p>

      {/* Brand Colors Section */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h2 className="text-base font-medium text-foreground mb-2">Brand Colors</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These colors will be used to style generated content to match your brand.
        </p>
        <div className="grid grid-cols-3 gap-4">
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
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
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

      {/* Image Style Section */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h2 className="text-base font-medium text-foreground mb-2">Image Style</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose the visual style for AI-generated images.
        </p>
        <StyleGrid
          selectedStyle={styleSettings.selectedStyle}
          onSelect={selectStyle}
        />
      </div>

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
