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
  // Track if we have a real page (not temp) to prevent resetting after save
  const hasSavedPageRef = useRef(false);

  useEffect(() => {
    console.log('[usePageEditor] ===== LOAD EFFECT TRIGGERED =====', {
      pageId,
      justSavedRef: justSavedRef.current,
      hasLoadedRef: hasLoadedRef.current,
      loadedPageIdRef: loadedPageIdRef.current,
      hasSavedPageRef: hasSavedPageRef.current,
    });

    // Skip loading if we just saved - prevents state reset
    // Keep the flag TRUE until we navigate away (pageId changes to something else)
    if (justSavedRef.current) {
      console.log('[usePageEditor] Skipping load - just saved');
      // Only reset the flag if pageId actually changes to a different value
      // This protects against multiple effect runs from query invalidation
      return;
    }

    // Reset loading flag if pageId changed (navigated to different page)
    if (pageId !== loadedPageIdRef.current) {
      console.log('[usePageEditor] Page ID changed, resetting hasLoaded', {
        from: loadedPageIdRef.current,
        to: pageId,
      });
      hasLoadedRef.current = false;
      loadedPageIdRef.current = pageId;
      // Reset the saved flag when navigating to a truly different page
      // But NOT if we're going from null to a real ID (that's a save)
      if (loadedPageIdRef.current !== null && pageId !== null) {
        hasSavedPageRef.current = false;
        justSavedRef.current = false;
      }
    }

    console.log('[usePageEditor] Load effect continuing', {
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
          console.log('[usePageEditor] LOADING PAGE FROM DB (first load)', {
            pageId: existingPage.id,
            contentLength: existingPage.content?.text?.length || 0,
          });
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
      } else {
        console.log('[usePageEditor] Page not found in cache for id:', pageId);
      }
    } else {
      // Only create new temp page if we haven't already saved a page in this session
      // This prevents resetting state after save when pageId is still null
      if (!hasSavedPageRef.current && !hasLoadedRef.current) {
        console.log('[usePageEditor] No pageId - creating new temp page');
        hasLoadedRef.current = true; // Mark as loaded to prevent recreating
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
      } else {
        console.log('[usePageEditor] Skipping new page creation - already have content');
      }
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
    console.log('[usePageEditor] ========== SAVE START ==========');
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
      textPreview: contentToSave.text.substring(0, 100),
      imageCount: contentToSave.images.length,
    });

    // Set flag to prevent load effect from resetting state after save
    justSavedRef.current = true;
    console.log('[usePageEditor] Set justSavedRef = true');

    try {
      if (isNewPage) {
        // For new pages with default title, try to generate a better one from content
        let pageTitle = state.page.title;
        console.log('[usePageEditor] Checking auto-title generation', {
          currentTitle: pageTitle,
          hasContent: !!contentToSave.text,
          contentLength: contentToSave.text?.length || 0,
        });

        if (pageTitle === 'Untitled Page' && contentToSave.text) {
          console.log('[usePageEditor] Generating title from content...');
          try {
            pageTitle = await apiClient.generateTitle(contentToSave.text);
            console.log('[usePageEditor] Generated title:', pageTitle);
          } catch (error) {
            console.error('[usePageEditor] Failed to generate title:', error);
            // Keep default title on error
          }
        }

        // Create new page with (possibly generated) title
        console.log('[usePageEditor] Creating new page with title:', pageTitle);
        const created = await createPage(pageTitle);
        console.log('[usePageEditor] Page created, id:', created.id);

        console.log('[usePageEditor] Updating page with content...', {
          id: created.id,
          contentTextLength: contentToSave.text.length,
        });
        await updatePage(created.id, {
          content: contentToSave,
          chatHistory: chatHistoryToSave,
        });
        console.log('[usePageEditor] Page updated successfully');

        // Mark that we've saved a real page - prevents effect from resetting state
        hasSavedPageRef.current = true;

        setState(prev => {
          console.log('[usePageEditor] Setting state after new page save', {
            prevContentLength: prev.generatedContent.text.length,
            keepingContent: true,
          });
          return {
            ...prev,
            page: { ...prev.page!, id: created.id, title: pageTitle },
            isDirty: false,
          };
        });
        console.log('[usePageEditor] ========== SAVE COMPLETE (new) ==========');
        return { ...state.page, id: created.id, title: pageTitle };
      } else {
        // Update existing page
        console.log('[usePageEditor] Updating existing page', {
          id: state.page.id,
          title: state.page.title,
          contentLength: contentToSave.text.length,
        });
        await updatePage(state.page.id, {
          title: state.page.title,
          content: contentToSave,
          chatHistory: chatHistoryToSave,
        });
        console.log('[usePageEditor] Existing page updated successfully');
        setState(prev => ({ ...prev, isDirty: false }));
        console.log('[usePageEditor] ========== SAVE COMPLETE (existing) ==========');
        return state.page;
      }
    } catch (error) {
      // Reset the flag if save failed
      console.error('[usePageEditor] Save failed:', error);
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
