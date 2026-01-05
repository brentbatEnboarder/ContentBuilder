import { useCallback, useState, useRef, useEffect } from 'react';
import { Building2, Loader2, CheckCircle2, ExternalLink, Globe, Sparkles, FileText, Eye, Edit3, ImagePlus, X, Link2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useOnboardingHeaderActions } from '@/hooks/useOnboardingHeaderActions';
import { useCustomer } from '@/contexts/CustomerContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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
    logoCandidates,
    streamingDescription,
    updateDraft,
    save,
    cancel,
    scanUrl,
    scanMore,
  } = useCompanySettings();

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const { currentCustomer } = useCustomer();

  // Auto-scroll description container when streaming
  useEffect(() => {
    if (streamingDescription && descriptionRef.current) {
      descriptionRef.current.scrollTop = descriptionRef.current.scrollHeight;
    }
  }, [streamingDescription]);

  // Profile is active if a scan has been completed OR if there's existing data
  const hasScannedOrHasData = scannedPages.length > 0 || !!settings.name || !!settings.description;

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

  // Register actions with header (uses onboarding-aware hook for wizard flow)
  // For step 1, canProceed is only true after scan completes (company info exists)
  useOnboardingHeaderActions(hasChanges, isSaving, handleSave, handleCancel, hasScannedOrHasData);

  const handleScan = async () => {
    await scanUrl();
    if (scanError) {
      toast.error(scanError);
    }
  };

  const handleLogoClick = () => {
    setLogoUrl(settings.logo || '');
    setShowLogoModal(true);
  };

  const handleLogoSave = () => {
    updateDraft({ logo: logoUrl.trim() || null });
    setShowLogoModal(false);
    toast.success('Logo updated');
  };

  const handleLogoRemove = () => {
    updateDraft({ logo: null });
    setShowLogoModal(false);
    toast.info('Logo removed');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCustomer) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentCustomer.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, fall back to base64
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          // Convert to base64 as fallback
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            setLogoUrl(base64);
            toast.success('Logo loaded (using local storage)');
          };
          reader.readAsDataURL(file);
        } else {
          throw uploadError;
        }
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);

        setLogoUrl(publicUrl);
        toast.success('Logo uploaded');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      <div className={`bg-card rounded-2xl border shadow-md overflow-hidden transition-all ${
        hasScannedOrHasData
          ? 'border-border'
          : 'border-border/50 opacity-60'
      }`}>
        {/* Card Header */}
        <div className={`flex items-center gap-2 px-5 py-3 border-b border-border/50 ${
          hasScannedOrHasData
            ? 'bg-gradient-to-r from-primary/5 to-primary/10'
            : 'bg-muted/30'
        }`}>
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${
            hasScannedOrHasData ? 'bg-primary/15' : 'bg-muted'
          }`}>
            <Building2 className={`w-4 h-4 ${hasScannedOrHasData ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <span className="text-sm font-medium text-foreground">Company Profile</span>
          {!hasScannedOrHasData && (
            <span className="text-xs text-muted-foreground ml-auto">Scan a website to populate</span>
          )}
        </div>

        {/* Card Body */}
        <div className={`p-6 ${!hasScannedOrHasData ? 'pointer-events-none' : ''}`}>
          <div className="flex gap-6">
            {/* Logo - clickable to edit */}
            <div className="flex-shrink-0">
              <div
                onClick={hasScannedOrHasData ? handleLogoClick : undefined}
                className={`group relative w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center ${
                  hasScannedOrHasData
                    ? 'border-border hover:border-primary/50 cursor-pointer'
                    : 'border-border/50 cursor-not-allowed'
                }`}
              >
                {settings.logo ? (
                  <>
                    <img
                      src={settings.logo}
                      alt="Company logo"
                      className="w-full h-full object-contain rounded-xl p-1"
                    />
                    {/* Edit overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus className={`w-8 h-8 transition-colors ${
                      hasScannedOrHasData
                        ? 'text-muted-foreground group-hover:text-primary/70'
                        : 'text-muted-foreground/50'
                    }`} />
                    <span className={`text-[10px] mt-1 transition-colors ${
                      hasScannedOrHasData
                        ? 'text-muted-foreground group-hover:text-primary/70'
                        : 'text-muted-foreground/50'
                    }`}>Add Logo</span>
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
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Company Description</Label>
              {settings.description && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {settings.description.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
                </span>
              )}
              <div className="ml-auto">
                {isEditingDescription ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingDescription(false)}
                    className="h-7 px-3 text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1.5" />
                    Done Editing
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDescription(true)}
                    className="h-7 px-3 text-xs"
                  >
                    <Edit3 className="w-3 h-3 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </div>

            {isEditingDescription ? (
              <Textarea
                id="description"
                placeholder="Describe what your company does, its mission, values, culture, and what makes it unique..."
                value={settings.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                className="min-h-[350px] resize-y text-sm leading-relaxed font-mono"
                autoFocus
              />
            ) : streamingDescription ? (
              /* Streaming extraction in progress - show progress indicator */
              <div
                ref={descriptionRef}
                className="min-h-[200px] max-h-[500px] overflow-y-auto p-4 bg-primary/5 rounded-lg border border-primary/20 relative flex flex-col items-center justify-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">AI is analyzing company information...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Extracting details from {scannedPages.length} pages
                    </p>
                  </div>
                  <div className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                    ~{streamingDescription.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={descriptionRef}
                className="min-h-[200px] max-h-[500px] overflow-y-auto p-4 bg-muted/20 rounded-lg border border-border prose prose-sm dark:prose-invert max-w-none"
              >
                {settings.description ? (
                  <ReactMarkdown>{settings.description}</ReactMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">No description yet. Click Edit to add one.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logo Edit Modal */}
      <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
        <DialogContent className={logoCandidates.length > 0 ? "sm:max-w-lg" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-primary" />
              Company Logo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-muted rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-muted-foreground/50" />
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Logo
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                {isUploadingLogo ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload an image</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, SVG up to 2MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Logo Candidates from Image Search */}
            {logoCandidates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Found Online
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {logoCandidates.slice(0, 6).map((candidate, index) => {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setLogoUrl(candidate.url)}
                        className={`relative aspect-square bg-muted rounded-lg border-2 overflow-hidden transition-all hover:border-primary/50 ${
                          logoUrl === candidate.url ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        }`}
                        title={candidate.title}
                      >
                        {(candidate.url || candidate.thumbnailUrl) ? (
                          <img
                            src={`/api/image-proxy?url=${encodeURIComponent(candidate.url || candidate.thumbnailUrl)}`}
                            alt={candidate.title}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // If primary URL failed via proxy, try thumbnailUrl
                              const currentProxiedUrl = decodeURIComponent(target.src.split('url=')[1] || '');
                              if (currentProxiedUrl === candidate.url && candidate.thumbnailUrl && candidate.thumbnailUrl !== candidate.url) {
                                target.src = `/api/image-proxy?url=${encodeURIComponent(candidate.thumbnailUrl)}`;
                                return;
                              }
                              target.style.display = 'none';
                              // Show fallback icon
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.fallback-icon')) {
                                const fallback = document.createElement('div');
                                fallback.className = 'fallback-icon absolute inset-0 flex items-center justify-center text-muted-foreground';
                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Click to select a logo found online</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-sm font-medium flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Logo URL
              </Label>
              <Input
                id="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            {settings.logo && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleLogoRemove}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => setShowLogoModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleLogoSave}>
              Save Logo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
