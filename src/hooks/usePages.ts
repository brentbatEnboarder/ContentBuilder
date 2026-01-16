import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/contexts/CustomerContext';
import { logUsageEvent } from '@/services/usageLogger';
import type { Page, PageContent, ChatMessage } from '@/types/page';

// Database row type (snake_case from Supabase)
interface PageRow {
  id: string;
  customer_id: string;
  title: string;
  content: PageContent | null;
  chat_history: ChatMessage[] | null;
  created_at: string;
  updated_at: string;
}

// Transform database row to frontend Page type
const rowToPage = (row: PageRow): Page => ({
  id: row.id,
  title: row.title,
  content: row.content || { text: '', images: [] },
  chatHistory: (row.chat_history || []).map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  })),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const usePages = () => {
  const { currentCustomer } = useCustomer();
  const queryClient = useQueryClient();
  const customerId = currentCustomer?.id;

  // Local state for search filtering
  const [searchQuery, setSearchQuery] = useState('');

  // Query: Fetch all pages for this customer
  const {
    data: pages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pages', customerId],
    queryFn: async () => {
      console.log('[usePages] Fetching pages for customer', customerId);

      if (!customerId) return [];

      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[usePages] Fetch error', error);
        throw error;
      }

      console.log('[usePages] Fetched pages', {
        count: data?.length,
        pages: data?.map((p: PageRow) => ({
          id: p.id,
          title: p.title,
          contentLength: p.content?.text?.length || 0,
        })),
      });

      return (data as PageRow[]).map(rowToPage);
    },
    enabled: !!customerId,
  });

  // Mutation: Create a new page
  const createMutation = useMutation({
    mutationFn: async (title: string = 'Untitled Page') => {
      console.log('[usePages] createPage called', { title, customerId });

      if (!customerId) {
        console.error('[usePages] No customer selected for create');
        throw new Error('No customer selected');
      }

      const { data, error } = await supabase
        .from('pages')
        .insert({
          customer_id: customerId,
          title,
          content: { text: '', images: [] },
          chat_history: [],
        })
        .select()
        .single();

      if (error) {
        console.error('[usePages] Supabase create error', error);
        throw error;
      }

      console.log('[usePages] Supabase create success', data);
      return rowToPage(data as PageRow);
    },
    onSuccess: (newPage) => {
      queryClient.invalidateQueries({ queryKey: ['pages', customerId] });
      logUsageEvent('page_created', {
        customerId: customerId || undefined,
        pageId: newPage.id,
        metadata: { title: newPage.title },
      });
    },
  });

  // Mutation: Update an existing page
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Page> }) => {
      console.log('[usePages] updatePage called', { id, customerId, updates });

      if (!customerId) {
        console.error('[usePages] No customer selected');
        throw new Error('No customer selected');
      }

      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.chatHistory !== undefined) {
        updateData.chat_history = updates.chatHistory.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }));
      }

      console.log('[usePages] Supabase update payload', { id, updateData });

      const { data, error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', id)
        .eq('customer_id', customerId) // Extra safety check
        .select()
        .single();

      if (error) {
        console.error('[usePages] Supabase update error', error);
        throw error;
      }

      console.log('[usePages] Supabase update success', data);
      return rowToPage(data as PageRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', customerId] });
    },
  });

  // Mutation: Delete a page
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!customerId) throw new Error('No customer selected');

      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id)
        .eq('customer_id', customerId); // Extra safety check

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', customerId] });
    },
  });

  // Mutation: Duplicate a page
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!customerId) throw new Error('No customer selected');

      const original = pages.find((p) => p.id === id);
      if (!original) throw new Error('Page not found');

      const { data, error } = await supabase
        .from('pages')
        .insert({
          customer_id: customerId,
          title: `Copy of ${original.title}`,
          content: original.content,
          chat_history: original.chatHistory?.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp.toISOString(),
          })),
        })
        .select()
        .single();

      if (error) throw error;
      return rowToPage(data as PageRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages', customerId] });
    },
  });

  // Filter pages by search query
  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;
    return pages.filter((page) =>
      page.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pages, searchQuery]);

  // Helper functions that wrap mutations
  const createPage = useCallback(
    async (title: string = 'Untitled Page'): Promise<Page> => {
      return createMutation.mutateAsync(title);
    },
    [createMutation]
  );

  const updatePage = useCallback(
    async (id: string, updates: Partial<Page>) => {
      return updateMutation.mutateAsync({ id, updates });
    },
    [updateMutation]
  );

  const deletePage = useCallback(
    async (id: string) => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation]
  );

  const duplicatePage = useCallback(
    async (id: string): Promise<Page> => {
      return duplicateMutation.mutateAsync(id);
    },
    [duplicateMutation]
  );

  const getPage = useCallback(
    (id: string): Page | undefined => {
      return pages.find((p) => p.id === id);
    },
    [pages]
  );

  return {
    pages: filteredPages,
    allPages: pages,
    isLoading,
    error: error as Error | null,
    searchQuery,
    setSearchQuery,
    createPage,
    updatePage,
    deletePage,
    duplicatePage,
    getPage,
    // Expose mutation states for loading indicators
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
