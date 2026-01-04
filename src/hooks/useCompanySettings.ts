import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/contexts/CustomerContext';
import { apiClient, ScrapeProgress, LogoCandidate } from '@/services/api';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  buttonBg: string;
  buttonFg: string;
}

export interface CompanySettings {
  url: string;
  name: string;
  industry: string;
  description: string;
  logo: string | null;
  colors: BrandColors;
}

const defaultSettings: CompanySettings = {
  url: '',
  name: '',
  industry: '',
  description: '',
  logo: null,
  colors: {
    primary: '#7C21CC',
    secondary: '#342F46',
    accent: '#008161',
    textColor: '#1a1a1a',
    buttonBg: '#7C21CC',
    buttonFg: '#FFFFFF',
  },
};

interface ScanState {
  isScanning: boolean;
  progress: ScrapeProgress | null;
  scannedPages: string[];
  canScanMore: boolean;
  logoCandidates: LogoCandidate[];
  streamingDescription: string; // Accumulated extraction chunks
  error: string | null;
}

const defaultScanState: ScanState = {
  isScanning: false,
  progress: null,
  scannedPages: [],
  canScanMore: false,
  logoCandidates: [],
  streamingDescription: '',
  error: null,
};

export const useCompanySettings = () => {
  const { currentCustomer } = useCustomer();
  const queryClient = useQueryClient();
  const customerId = currentCustomer?.id;

  // Local draft state for unsaved changes
  const [draft, setDraft] = useState<CompanySettings>(defaultSettings);
  const [scanState, setScanState] = useState<ScanState>(defaultScanState);

  // Query: Fetch company settings from Supabase
  const {
    data: savedSettings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['companySettings', customerId],
    queryFn: async () => {
      if (!customerId) return defaultSettings;

      const { data, error } = await supabase
        .from('customer_settings')
        .select('company_info')
        .eq('customer_id', customerId)
        .single();

      // PGRST116 = row not found - that's okay, just return defaults
      if (error && error.code !== 'PGRST116') throw error;
      return (data?.company_info as CompanySettings) || defaultSettings;
    },
    enabled: !!customerId,
  });

  // Sync draft with saved settings when they load
  useEffect(() => {
    if (savedSettings) {
      setDraft(savedSettings);
    }
  }, [savedSettings]);

  // Check if draft differs from saved
  const hasChanges = savedSettings
    ? JSON.stringify(draft) !== JSON.stringify(savedSettings)
    : false;

  // Mutation: Save settings to Supabase
  const saveMutation = useMutation({
    mutationFn: async (newSettings: CompanySettings) => {
      if (!customerId) throw new Error('No customer selected');

      // Upsert: insert or update based on customer_id
      const { error } = await supabase.from('customer_settings').upsert(
        {
          customer_id: customerId,
          company_info: newSettings,
        },
        {
          onConflict: 'customer_id',
        }
      );

      if (error) throw error;
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySettings', customerId] });
    },
  });

  // Update draft (local only, not saved)
  const updateDraft = useCallback((updates: Partial<CompanySettings>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  // Update a specific color in draft
  const updateColors = useCallback(
    (colorKey: keyof CompanySettings['colors'], value: string) => {
      setDraft((prev) => ({
        ...prev,
        colors: { ...prev.colors, [colorKey]: value },
      }));
    },
    []
  );

  // Save draft to Supabase
  const save = useCallback(async () => {
    return saveMutation.mutateAsync(draft);
  }, [draft, saveMutation]);

  // Cancel changes and revert to saved settings
  const cancel = useCallback(() => {
    if (savedSettings) {
      setDraft(savedSettings);
    }
  }, [savedSettings]);

  // Scan URL via intelligent multi-page scraper
  const scanUrl = useCallback(async () => {
    if (!draft.url) return;

    setScanState((prev) => ({
      ...prev,
      isScanning: true,
      error: null,
      progress: null,
      streamingDescription: '',
    }));

    try {
      const result = await apiClient.scrapeIntelligent(
        draft.url,
        (progress) => {
          setScanState((prev) => ({ ...prev, progress }));

          // Handle logo_found event - update logo immediately
          if (progress.type === 'logo_found') {
            if (progress.logo) {
              setDraft((prev) => ({ ...prev, logo: progress.logo! }));
            }
            if (progress.logoCandidates) {
              setScanState((prev) => ({
                ...prev,
                logoCandidates: progress.logoCandidates || [],
              }));
            }
          }

          // Handle extraction_chunk event - accumulate streaming description
          if (progress.type === 'extraction_chunk' && progress.chunk) {
            setScanState((prev) => ({
              ...prev,
              streamingDescription: prev.streamingDescription + progress.chunk,
            }));
          }
        }
      );

      if (result) {
        setDraft((prev) => ({
          ...prev,
          name: result.name || prev.name,
          industry: result.industry || prev.industry,
          description: result.description || prev.description,
          logo: result.logo || prev.logo,
          colors: {
            primary: result.colors?.primary || prev.colors.primary,
            secondary: result.colors?.secondary || prev.colors.secondary,
            accent: result.colors?.accent || prev.colors.accent,
            textColor: result.colors?.textColor || prev.colors.textColor,
            buttonBg: result.colors?.buttonBg || prev.colors.buttonBg,
            buttonFg: result.colors?.buttonFg || prev.colors.buttonFg,
          },
        }));
        setScanState((prev) => ({
          ...prev,
          scannedPages: result.pagesScraped,
          canScanMore: result.canScanMore,
          logoCandidates: result.logoCandidates || prev.logoCandidates,
          streamingDescription: '', // Clear streaming state when complete
        }));
      }
    } catch (err) {
      console.error('URL scan failed:', err);
      setScanState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to scan URL',
      }));
    } finally {
      setScanState((prev) => ({ ...prev, isScanning: false }));
    }
  }, [draft.url]);

  // Scan more pages (continues from where previous scan left off)
  const scanMore = useCallback(async () => {
    if (!draft.url) return;

    setScanState((prev) => ({
      ...prev,
      isScanning: true,
      error: null,
      progress: null,
    }));

    try {
      const result = await apiClient.scrapeIntelligent(
        draft.url,
        (progress) => {
          setScanState((prev) => ({ ...prev, progress }));
        },
        { scanMore: true }
      );

      if (result) {
        // Update with any new/better information
        setDraft((prev) => ({
          ...prev,
          description: result.description || prev.description,
        }));
        setScanState((prev) => ({
          ...prev,
          scannedPages: result.pagesScraped,
          canScanMore: result.canScanMore,
        }));
      }
    } catch (err) {
      console.error('Scan more failed:', err);
      setScanState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to scan more pages',
      }));
    } finally {
      setScanState((prev) => ({ ...prev, isScanning: false }));
    }
  }, [draft.url]);

  return {
    settings: draft,
    savedSettings: savedSettings || defaultSettings,
    isLoading,
    isScanning: scanState.isScanning,
    isSaving: saveMutation.isPending,
    hasChanges,
    error: error as Error | null,
    scanError: scanState.error,
    scanProgress: scanState.progress,
    scannedPages: scanState.scannedPages,
    canScanMore: scanState.canScanMore,
    logoCandidates: scanState.logoCandidates,
    streamingDescription: scanState.streamingDescription,
    updateDraft,
    updateColors,
    save,
    cancel,
    scanUrl,
    scanMore,
  };
};
