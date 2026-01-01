import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/contexts/CustomerContext';
import type { DimensionKey } from '@/lib/voiceConfig';

export interface VoiceSettings {
  formality: number;
  humor: number;
  respect: number;
  enthusiasm: number;
}

const defaultSettings: VoiceSettings = {
  formality: 2,
  humor: 2,
  respect: 2,
  enthusiasm: 2,
};

export const useVoiceSettings = () => {
  const { currentCustomer } = useCustomer();
  const queryClient = useQueryClient();
  const customerId = currentCustomer?.id;

  // Local draft state for unsaved changes
  const [draft, setDraft] = useState<VoiceSettings>(defaultSettings);

  // Query: Fetch voice settings from Supabase
  const {
    data: savedSettings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['voiceSettings', customerId],
    queryFn: async () => {
      if (!customerId) return defaultSettings;

      const { data, error } = await supabase
        .from('customer_settings')
        .select('voice_settings')
        .eq('customer_id', customerId)
        .single();

      // PGRST116 = row not found - that's okay, just return defaults
      if (error && error.code !== 'PGRST116') throw error;

      const voiceSettings = data?.voice_settings as VoiceSettings | null;
      if (!voiceSettings) return defaultSettings;

      // Handle migration from old key names if needed
      if ('tone' in voiceSettings) {
        const old = voiceSettings as unknown as {
          tone?: number;
          complexity?: number;
          enthusiasm?: number;
          personality?: number;
        };
        return {
          formality: old.tone ?? 2,
          humor: old.complexity ?? 2,
          respect: old.enthusiasm ?? 2,
          enthusiasm: old.personality ?? 2,
        };
      }

      return voiceSettings;
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
    mutationFn: async (newSettings: VoiceSettings) => {
      if (!customerId) throw new Error('No customer selected');

      // Upsert: insert or update based on customer_id
      const { error } = await supabase.from('customer_settings').upsert(
        {
          customer_id: customerId,
          voice_settings: newSettings,
        },
        {
          onConflict: 'customer_id',
        }
      );

      if (error) throw error;
      return newSettings;
    },
    // OPTIMISTIC UPDATE: Update cache BEFORE mutation completes
    // This prevents the "bounce" effect where values revert temporarily
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['voiceSettings', customerId] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData(['voiceSettings', customerId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['voiceSettings', customerId], newSettings);

      // Return context with the previous value
      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      // Rollback to the previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['voiceSettings', customerId], context.previousSettings);
      }
    },
  });

  // Update a single dimension in draft
  const updateDraft = useCallback((key: DimensionKey, value: number) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
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
    updateDraft,
    save,
    cancel,
  };
};
