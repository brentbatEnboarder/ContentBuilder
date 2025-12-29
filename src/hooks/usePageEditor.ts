import { useState, useCallback, useEffect } from 'react';
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
  useEffect(() => {
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
    if (!state.page) return null;

    const isNewPage = state.page.id.startsWith('temp_');

    if (isNewPage) {
      // For new pages with default title, try to generate a better one from content
      let pageTitle = state.page.title;
      if (pageTitle === 'Untitled Page' && state.generatedContent.text) {
        try {
          pageTitle = await apiClient.generateTitle(state.generatedContent.text);
        } catch {
          // Keep default title on error
        }
      }

      // Create new page with (possibly generated) title
      const created = await createPage(pageTitle);
      await updatePage(created.id, {
        content: state.generatedContent,
        chatHistory: state.page.chatHistory,
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
        content: state.generatedContent,
        chatHistory: state.page.chatHistory,
      });
      setState(prev => ({ ...prev, isDirty: false }));
      return state.page;
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
