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
  | 'photo'
  | 'minimalist'
  | 'warm';

export interface StyleSettings {
  selectedStyle: ImageStyleType;
}

const defaultSettings: StyleSettings = {
  selectedStyle: 'flat',
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

  // Check if draft differs from saved
  const hasChanges = savedSettings
    ? draft.selectedStyle !== savedSettings.selectedStyle
    : false;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styleSettings', customerId] });
    },
  });

  // Select a style in draft
  const selectStyle = useCallback((style: ImageStyleType) => {
    setDraft({ selectedStyle: style });
  }, []);

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

  return {
    settings: draft,
    savedSettings: savedSettings || defaultSettings,
    isLoading,
    isSaving: saveMutation.isPending,
    hasChanges,
    error: error as Error | null,
    selectStyle,
    save,
    cancel,
  };
};
