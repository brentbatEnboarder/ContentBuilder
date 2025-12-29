import { Building2, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';

export const CompanyInfoScreen = () => {
  const {
    settings,
    isScanning,
    isSaving,
    hasChanges,
    scanError,
    scanProgress,
    scannedPages,
    canScanMore,
    updateDraft,
    save,
    cancel,
    scanUrl,
    scanMore,
  } = useCompanySettings();

  const handleSave = async () => {
    try {
      await save();
      toast.success('Company information saved successfully');
    } catch (error) {
      toast.error('Failed to save company information');
      console.error('Save error:', error);
    }
  };

  const handleScan = async () => {
    await scanUrl();
    if (scanError) {
      toast.error(scanError);
    }
  };

  const handleCancel = () => {
    cancel();
    toast.info('Changes discarded');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Company Information
      </h1>
      <p className="text-muted-foreground mb-8">
        Set up your company profile to personalize generated content.
      </p>

      {/* URL Input Section */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <Label className="text-base font-medium">Company URL</Label>
        <div className="flex gap-3 mt-3">
          <Input
            type="url"
            placeholder="https://yourcompany.com"
            value={settings.url}
            onChange={(e) => updateDraft({ url: e.target.value })}
            className="flex-1"
          />
          <Button
            onClick={handleScan}
            disabled={!settings.url || isScanning}
            className="min-w-[100px]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning
              </>
            ) : (
              'Scan'
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isScanning
            ? 'Scanning your website to extract company information...'
            : 'Enter your company website to auto-extract profile information'}
        </p>
      </div>

      {/* Scan Progress Section */}
      {(isScanning || scannedPages.length > 0) && (
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <h3 className="font-medium mb-4">Scan Progress</h3>

          {/* Real-time progress during scanning */}
          {isScanning && scanProgress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">{scanProgress.message}</span>
              </div>
              {scanProgress.pagesScraped !== undefined && scanProgress.totalPages !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Pages scanned</span>
                    <span>{scanProgress.pagesScraped} / {scanProgress.totalPages}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(scanProgress.pagesScraped / scanProgress.totalPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scanned pages list after completion */}
          {!isScanning && scannedPages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Scanned {scannedPages.length} pages</span>
              </div>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {scannedPages.map((url, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:text-foreground hover:underline"
                    >
                      {url.replace(/^https?:\/\//, '')}
                    </a>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                  </li>
                ))}
              </ul>

              {canScanMore && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scanMore}
                  disabled={isScanning}
                  className="mt-2"
                >
                  Scan More Pages
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Company Profile Section */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <h2 className="text-base font-medium text-foreground mb-6">
          Company Profile
        </h2>

        <div className="flex gap-6">
          {/* Logo placeholder */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-muted rounded-lg border border-border flex items-center justify-center">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Company logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                value={settings.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Technology, Healthcare, Finance"
                value={settings.industry}
                onChange={(e) => updateDraft({ industry: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <Label htmlFor="description">Company Description</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-2">
            This description will be used to generate personalized onboarding content.
          </p>
          <Textarea
            id="description"
            placeholder="Describe what your company does, its mission, values, culture, and what makes it unique..."
            value={settings.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            className="mt-1.5 min-h-[300px] resize-y"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={!hasChanges || isSaving}
        >
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
