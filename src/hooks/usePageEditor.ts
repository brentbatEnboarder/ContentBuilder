import { useState, useCallback, useEffect, useRef } from 'react';
import type { Page, ChatMessage } from '@/types/page';
import type { ContentBlock } from '@/types/content';
import { usePages } from './usePages';
import { apiClient } from '@/services/api';

interface PageEditorState {
  page: Page | null;
  isDirty: boolean;
  generatedContent: {
    text: string;
    images: string[];
    contentBlocks?: ContentBlock[];
  };
  isGenerating: boolean;
}

// Draft storage for persisting unsaved work across tab switches
const DRAFT_KEY_PREFIX = 'contentbuilder_draft_';

interface DraftState {
  title: string;
  text: string;
  contentBlocks?: ContentBlock[];
  chatHistory?: ChatMessage[];
  savedAt: number;
}

function getDraftKey(pageId: string | null): string {
  return `${DRAFT_KEY_PREFIX}${pageId || 'new'}`;
}

function loadDraft(pageId: string | null): DraftState | null {
  try {
    const key = getDraftKey(pageId);
    const saved = sessionStorage.getItem(key);
    if (!saved) return null;
    const draft = JSON.parse(saved) as DraftState;
    // Only use drafts less than 1 hour old
    if (Date.now() - draft.savedAt > 3600000) {
      sessionStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(pageId: string | null, draft: DraftState): void {
  try {
    const key = getDraftKey(pageId);
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

function clearDraft(pageId: string | null): void {
  try {
    const key = getDraftKey(pageId);
    sessionStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
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
      const oldPageId = loadedPageIdRef.current;
      console.log('[usePageEditor] Page ID changed, resetting hasLoaded', {
        from: oldPageId,
        to: pageId,
      });
      hasLoadedRef.current = false;

      // Reset the saved flag when navigating to a truly different page
      // But NOT if we're going from null to a real ID (that's a save)
      // Use oldPageId before updating loadedPageIdRef
      if (!(oldPageId === null && pageId !== null)) {
        // Reset for: existing->new, existing->existing, new->new (shouldn't happen)
        hasSavedPageRef.current = false;
        justSavedRef.current = false;
      }

      loadedPageIdRef.current = pageId;
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
          // Check for draft first (unsaved work from tab switch)
          const draft = loadDraft(pageId);
          if (draft && draft.text) {
            console.log('[usePageEditor] RESTORING DRAFT for existing page', {
              pageId: existingPage.id,
              draftTextLength: draft.text.length,
              savedAt: new Date(draft.savedAt).toISOString(),
            });
            hasLoadedRef.current = true;
            setState({
              page: { ...existingPage, title: draft.title || existingPage.title, chatHistory: draft.chatHistory || existingPage.chatHistory },
              isDirty: true, // Mark dirty since we have unsaved draft
              generatedContent: {
                text: draft.text,
                images: existingPage.content?.images || [],
                contentBlocks: draft.contentBlocks || existingPage.content?.contentBlocks,
              },
              isGenerating: false,
            });
          } else {
            console.log('[usePageEditor] LOADING PAGE FROM DB (first load)', {
              pageId: existingPage.id,
              contentLength: existingPage.content?.text?.length || 0,
              blockCount: existingPage.content?.contentBlocks?.length || 0,
            });
            hasLoadedRef.current = true;
            setState({
              page: existingPage,
              isDirty: false,
              generatedContent: existingPage.content || { text: '', images: [], contentBlocks: [] },
              isGenerating: false,
            });
          }
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
        // Check for draft first (unsaved work from tab switch)
        const draft = loadDraft(null);
        if (draft && draft.text) {
          console.log('[usePageEditor] RESTORING DRAFT for new page', {
            draftTextLength: draft.text.length,
            savedAt: new Date(draft.savedAt).toISOString(),
          });
          hasLoadedRef.current = true;
          const newPage: Page = {
            id: `temp_${Date.now()}`,
            title: draft.title || 'Untitled Page',
            createdAt: new Date(),
            updatedAt: new Date(),
            content: { text: draft.text, images: [], contentBlocks: draft.contentBlocks },
            chatHistory: draft.chatHistory || [],
          };
          setState({
            page: newPage,
            isDirty: true, // Mark dirty since we have unsaved draft
            generatedContent: { text: draft.text, images: [], contentBlocks: draft.contentBlocks },
            isGenerating: false,
          });
        } else {
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
        }
      } else {
        console.log('[usePageEditor] Skipping new page creation - already have content');
      }
    }
  }, [pageId, getPage]);

  // Auto-save draft to sessionStorage when content changes
  // This preserves work across tab switches
  useEffect(() => {
    // Only save if we have content and a page
    if (!state.page || !state.generatedContent.text) return;

    // Don't save if not dirty (nothing has changed from DB state)
    if (!state.isDirty) return;

    // Determine the correct pageId for the draft key
    const draftPageId = state.page.id.startsWith('temp_') ? null : state.page.id;

    const draft: DraftState = {
      title: state.page.title,
      text: state.generatedContent.text,
      contentBlocks: state.generatedContent.contentBlocks,
      chatHistory: state.page.chatHistory,
      savedAt: Date.now(),
    };

    saveDraft(draftPageId, draft);
    console.log('[usePageEditor] Draft saved to sessionStorage', {
      pageId: draftPageId,
      textLength: draft.text.length,
    });
  }, [state.page, state.generatedContent, state.isDirty]);

  // Save draft immediately when tab is hidden (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.page && state.isDirty) {
        const draftPageId = state.page.id.startsWith('temp_') ? null : state.page.id;

        const draft: DraftState = {
          title: state.page.title,
          text: state.generatedContent.text,
          contentBlocks: state.generatedContent.contentBlocks,
          chatHistory: state.page.chatHistory,
          savedAt: Date.now(),
        };

        saveDraft(draftPageId, draft);
        console.log('[usePageEditor] Draft saved on tab hide', {
          pageId: draftPageId,
          textLength: draft.text.length,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.page, state.generatedContent, state.isDirty]);

  const updateTitle = useCallback((title: string) => {
    setState(prev => ({
      ...prev,
      page: prev.page ? { ...prev.page, title } : null,
      isDirty: true,
    }));
  }, []);

  const updateGeneratedContent = useCallback((content: { text: string; images: string[]; contentBlocks?: ContentBlock[] }) => {
    console.log('[usePageEditor] updateGeneratedContent called', {
      textLength: content.text.length,
      imageCount: content.images.length,
      blockCount: content.contentBlocks?.length || 0,
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

        // Clear the draft for new pages (was stored under null key)
        clearDraft(null);
        console.log('[usePageEditor] Cleared draft for new page');

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

        // Clear the draft for this page
        clearDraft(state.page.id);
        console.log('[usePageEditor] Cleared draft for existing page:', state.page.id);

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
