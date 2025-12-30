import { useState, useCallback, useEffect, useRef } from 'react';
import type { Page, ChatMessage } from '@/types/page';
import { usePages } from './usePages';
import { apiClient } from '@/services/api';

interface PageEditorState {
  page: Page | null;
  isDirty: boolean;
  generatedContent: {
    text: string;
    images: string[];
  };
  isGenerating: boolean;
}

export const usePageEditor = (pageId: string | null) => {
  const { getPage, updatePage, createPage } = usePages();
  
  const [state, setState] = useState<PageEditorState>({
    page: null,
    isDirty: false,
    generatedContent: { text: '', images: [] },
    isGenerating: false,
  });

  // Load page on mount or when pageId changes
  // IMPORTANT: Only reset state on initial load, not on every getPage change
  const hasLoadedRef = useRef(false);
  const loadedPageIdRef = useRef<string | null>(null);
  const justSavedRef = useRef(false);

  useEffect(() => {
    // Skip loading if we just saved - prevents state reset
    if (justSavedRef.current) {
      console.log('[usePageEditor] Skipping load - just saved');
      justSavedRef.current = false;
      return;
    }

    // Reset loading flag if pageId changed (navigated to different page)
    if (pageId !== loadedPageIdRef.current) {
      hasLoadedRef.current = false;
      loadedPageIdRef.current = pageId;
    }

    console.log('[usePageEditor] Load effect triggered', {
      pageId,
      hasLoaded: hasLoadedRef.current,
    });

    if (pageId) {
      const existingPage = getPage(pageId);
      console.log('[usePageEditor] getPage result', {
        found: !!existingPage,
        pageId,
        contentLength: existingPage?.content?.text?.length,
      });

      if (existingPage) {
        // Only load from DB on initial mount, not on subsequent query refetches
        // This prevents losing unsaved changes when the query refreshes
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
          setState({
            page: existingPage,
            isDirty: false,
            generatedContent: existingPage.content || { text: '', images: [] },
            isGenerating: false,
          });
        } else {
          // Just update page metadata, preserve local content
          console.log('[usePageEditor] Skipping content reset - already loaded');
        }
      }
    } else {
      // New page - will be created on first save
      const newPage: Page = {
        id: `temp_${Date.now()}`,
        title: 'Untitled Page',
        createdAt: new Date(),
        updatedAt: new Date(),
        content: { text: '', images: [] },
        chatHistory: [],
      };
      setState({
        page: newPage,
        isDirty: false,
        generatedContent: { text: '', images: [] },
        isGenerating: false,
      });
    }
  }, [pageId, getPage]);

  const updateTitle = useCallback((title: string) => {
    setState(prev => ({
      ...prev,
      page: prev.page ? { ...prev.page, title } : null,
      isDirty: true,
    }));
  }, []);

  const updateGeneratedContent = useCallback((content: { text: string; images: string[] }) => {
    console.log('[usePageEditor] updateGeneratedContent called', {
      textLength: content.text.length,
      imageCount: content.images.length,
      textPreview: content.text.substring(0, 100),
    });
    setState(prev => ({
      ...prev,
      generatedContent: content,
      isDirty: true,
    }));
  }, []);

  const updateChatHistory = useCallback((messages: ChatMessage[]) => {
    setState(prev => ({
      ...prev,
      page: prev.page ? { ...prev.page, chatHistory: messages } : null,
      isDirty: true,
    }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState(prev => ({ ...prev, isGenerating }));
  }, []);

  const save = useCallback(async (): Promise<Page | null> => {
    console.log('[usePageEditor] save() called', {
      hasPage: !!state.page,
      pageId: state.page?.id,
      contentLength: state.generatedContent.text.length,
      contentPreview: state.generatedContent.text.substring(0, 200),
      imageCount: state.generatedContent.images.length,
      chatHistoryLength: state.page?.chatHistory?.length,
    });

    if (!state.page) {
      console.error('[usePageEditor] No page to save');
      return null;
    }

    const isNewPage = state.page.id.startsWith('temp_');
    console.log('[usePageEditor] isNewPage:', isNewPage);

    // CRITICAL: Capture content BEFORE any async operations
    const contentToSave = { ...state.generatedContent };
    const chatHistoryToSave = state.page.chatHistory ? [...state.page.chatHistory] : [];

    console.log('[usePageEditor] Content captured for save', {
      textLength: contentToSave.text.length,
      imageCount: contentToSave.images.length,
    });

    // Set flag to prevent load effect from resetting state after save
    justSavedRef.current = true;

    try {
      if (isNewPage) {
        // For new pages with default title, try to generate a better one from content
        let pageTitle = state.page.title;
        if (pageTitle === 'Untitled Page' && contentToSave.text) {
          try {
            pageTitle = await apiClient.generateTitle(contentToSave.text);
          } catch {
            // Keep default title on error
          }
        }

        // Create new page with (possibly generated) title
        const created = await createPage(pageTitle);
        await updatePage(created.id, {
          content: contentToSave,
          chatHistory: chatHistoryToSave,
        });
        setState(prev => ({
          ...prev,
          page: { ...prev.page!, id: created.id, title: pageTitle },
          isDirty: false,
        }));
        return { ...state.page, id: created.id, title: pageTitle };
      } else {
        // Update existing page
        await updatePage(state.page.id, {
          title: state.page.title,
          content: contentToSave,
          chatHistory: chatHistoryToSave,
        });
        setState(prev => ({ ...prev, isDirty: false }));
        return state.page;
      }
    } catch (error) {
      // Reset the flag if save failed
      justSavedRef.current = false;
      throw error;
    }
  }, [state.page, state.generatedContent, createPage, updatePage]);

  const discardChanges = useCallback(() => {
    if (pageId) {
      const existingPage = getPage(pageId);
      if (existingPage) {
        setState({
          page: existingPage,
          isDirty: false,
          generatedContent: existingPage.content || { text: '', images: [] },
          isGenerating: false,
        });
      }
    }
  }, [pageId, getPage]);

  return {
    page: state.page,
    isDirty: state.isDirty,
    generatedContent: state.generatedContent,
    isGenerating: state.isGenerating,
    updateTitle,
    updateGeneratedContent,
    updateChatHistory,
    setIsGenerating,
    save,
    discardChanges,
  };
};
