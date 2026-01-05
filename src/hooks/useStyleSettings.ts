import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/contexts/CustomerContext';

export type ImageStyleType =
  | 'corporate'
  | 'flat'
  | 'isometric'
  | 'abstract'
  | 'handdrawn'
  | 'photorealistic'
  | 'minimalist'
  | 'warm';

export interface StyleSettings {
  selectedStyle: ImageStyleType;
  targetWordLength: number;
}

const defaultSettings: StyleSettings = {
  selectedStyle: 'flat',
  targetWordLength: 300,
};

export const useStyleSettings = () => {
  const { currentCustomer } = useCustomer();
  const queryClient = useQueryClient();
  const customerId = currentCustomer?.id;

  // Local draft state for unsaved changes
  const [draft, setDraft] = useState<StyleSettings>(defaultSettings);

  // Query: Fetch style settings from Supabase
  const {
    data: savedSettings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['styleSettings', customerId],
    queryFn: async () => {
      if (!customerId) return defaultSettings;

      const { data, error } = await supabase
        .from('customer_settings')
        .select('style_settings')
        .eq('customer_id', customerId)
        .single();

      // PGRST116 = row not found - that's okay, just return defaults
      if (error && error.code !== 'PGRST116') throw error;
      return (data?.style_settings as StyleSettings) || defaultSettings;
    },
    enabled: !!customerId,
  });

  // Sync draft with saved settings when they load
  useEffect(() => {
    if (savedSettings) {
      setDraft(savedSettings);
    }
  }, [savedSettings]);

  // Check if draft differs from saved (only check selectedStyle for Visual Style screen save button)
  const hasChanges = savedSettings
    ? draft.selectedStyle !== savedSettings.selectedStyle
    : false;

  // Merge saved settings with defaults to handle missing fields
  const mergedSettings = savedSettings
    ? { ...defaultSettings, ...savedSettings }
    : defaultSettings;

  // Mutation: Save settings to Supabase
  const saveMutation = useMutation({
    mutationFn: async (newSettings: StyleSettings) => {
      if (!customerId) throw new Error('No customer selected');

      // Upsert: insert or update based on customer_id
      const { error } = await supabase.from('customer_settings').upsert(
        {
          customer_id: customerId,
          style_settings: newSettings,
        },
        {
          onConflict: 'customer_id',
        }
      );

      if (error) throw error;
      return newSettings;
    },
    // OPTIMISTIC UPDATE: Update cache BEFORE mutation completes
    // This ensures all hook instances see the new value immediately
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['styleSettings', customerId] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(['styleSettings', customerId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['styleSettings', customerId], newSettings);

      // Return context with the previous value
      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      // Rollback to the previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['styleSettings', customerId], context.previousSettings);
      }
    },
  });

  // Select a style in draft
  const selectStyle = useCallback((style: ImageStyleType) => {
    setDraft((prev) => ({ ...prev, selectedStyle: style }));
  }, []);

  // Set target word length and auto-save immediately
  const setTargetWordLength = useCallback(
    async (length: number) => {
      // Clamp to reasonable bounds
      const clampedLength = Math.max(50, Math.min(5000, Math.round(length)));
      const newSettings = { ...draft, targetWordLength: clampedLength };
      setDraft(newSettings);
      // Auto-save immediately
      await saveMutation.mutateAsync(newSettings);
    },
    [draft, saveMutation]
  );

  // Adjust target by percentage (for shorter/longer buttons)
  const adjustTargetLength = useCallback(
    async (multiplier: number) => {
      const currentTarget = draft.targetWordLength || defaultSettings.targetWordLength;
      const newTarget = Math.round(currentTarget * multiplier);
      await setTargetWordLength(newTarget);
    },
    [draft.targetWordLength, setTargetWordLength]
  );

  // Save draft to Supabase
  // Optional parameter allows saving new settings without waiting for draft state update
  const save = useCallback(async (overrideSettings?: Partial<StyleSettings>) => {
    const settingsToSave = overrideSettings
      ? { ...draft, ...overrideSettings }
      : draft;
    return saveMutation.mutateAsync(settingsToSave);
  }, [draft, saveMutation]);

  // Cancel changes and revert to saved settings
  const cancel = useCallback(() => {
    if (savedSettings) {
      setDraft(savedSettings);
    }
  }, [savedSettings]);

  return {
    settings: { ...defaultSettings, ...draft }, // Merge with defaults to ensure all fields exist
    savedSettings: mergedSettings,
    isLoading,
    isSaving: saveMutation.isPending,
    hasChanges,
    error: error as Error | null,
    selectStyle,
    setTargetWordLength,
    adjustTargetLength,
    save,
    cancel,
  };
};
