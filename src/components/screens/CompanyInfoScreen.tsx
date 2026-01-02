import { useCallback } from 'react';
import { Building2, Loader2, CheckCircle2, ExternalLink, Globe, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';
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

  const handleSave = useCallback(async () => {
    try {
      await save();
      toast.success('Company information saved successfully');
    } catch (error) {
      toast.error('Failed to save company information');
      console.error('Save error:', error);
    }
  }, [save]);

  const handleCancel = useCallback(() => {
    cancel();
    toast.info('Changes discarded');
  }, [cancel]);

  // Register actions with header
  useRegisterHeaderActions(hasChanges, isSaving, handleSave, handleCancel);

  const handleScan = async () => {
    await scanUrl();
    if (scanError) {
      toast.error(scanError);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* URL Input Section */}
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Website Scanner</span>
          <Sparkles className="w-3.5 h-3.5 text-primary/60 ml-auto" />
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="https://yourcompany.com"
                value={settings.url}
                onChange={(e) => updateDraft({ url: e.target.value })}
                className="pl-10 h-11"
              />
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button
              onClick={handleScan}
              disabled={!settings.url || isScanning}
              className="min-w-[120px] h-11 shadow-md shadow-primary/20"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                'Scan Website'
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {isScanning
              ? 'AI is analyzing your website to extract company information...'
              : 'Enter your company website to auto-extract profile information using AI'}
          </p>
        </div>
      </div>

      {/* Scan Progress Section */}
      {(isScanning || scannedPages.length > 0) && (
        <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500/5 to-green-500/10 border-b border-border/50">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/15">
              {isScanning ? (
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
            <span className="text-sm font-medium text-foreground">
              {isScanning ? 'Scanning in Progress' : `Scan Complete`}
            </span>
            {!isScanning && (
              <span className="text-xs text-muted-foreground ml-auto">
                {scannedPages.length} pages analyzed
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Real-time progress during scanning */}
            {isScanning && scanProgress && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{scanProgress.message}</span>
                </div>
                {scanProgress.pagesScraped !== undefined && scanProgress.totalPages !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Pages scanned</span>
                      <span className="font-medium">{scanProgress.pagesScraped} / {scanProgress.totalPages}</span>
                    </div>
                    <div className="relative w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300"
                        style={{ width: `${(scanProgress.pagesScraped / scanProgress.totalPages) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scanned pages list after completion */}
            {!isScanning && scannedPages.length > 0 && (
              <div className="space-y-4">
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {scannedPages.map((url, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground group">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-foreground transition-colors"
                      >
                        {url.replace(/^https?:\/\//, '')}
                      </a>
                      <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </li>
                  ))}
                </ul>

                {canScanMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={scanMore}
                    disabled={isScanning}
                  >
                    Scan More Pages
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Profile Section */}
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Company Profile</span>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Logo placeholder */}
            <div className="flex-shrink-0">
              <div className="group relative w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer">
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Company logo"
                    className="w-full h-full object-contain rounded-xl p-1"
                  />
                ) : (
                  <>
                    <Building2 className="w-8 h-8 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                    <span className="text-[10px] text-muted-foreground mt-1 group-hover:text-primary/70 transition-colors">Logo</span>
                  </>
                )}
              </div>
            </div>

            {/* Form fields */}
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Company Name</Label>
                <Input
                  id="name"
                  placeholder="Enter company name"
                  value={settings.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>

              <div>
                <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={settings.industry}
                  onChange={(e) => updateDraft({ industry: e.target.value })}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <Label htmlFor="description" className="text-sm font-medium">Company Description</Label>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This description will be used to generate personalized onboarding content.
            </p>
            <Textarea
              id="description"
              placeholder="Describe what your company does, its mission, values, culture, and what makes it unique..."
              value={settings.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              className="min-h-[280px] resize-y text-sm leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
