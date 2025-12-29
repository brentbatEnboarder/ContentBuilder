import { useState, useCallback } from 'react';

export type ScreenType = 'new-page' | 'company' | 'voice' | 'style' | 'pages' | 'page-editor';

interface NavigationState {
  isNavCollapsed: boolean;
  activeScreen: ScreenType;
  editingPageId: string | null;
  toggleNav: () => void;
  setActiveScreen: (screen: ScreenType) => void;
  editPage: (pageId: string) => void;
  createNewPage: () => void;
  goToPages: () => void;
}

export const useNavigation = (): NavigationState => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenType>('company');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);

  const toggleNav = useCallback(() => {
    setIsNavCollapsed(prev => !prev);
  }, []);

  const handleSetActiveScreen = useCallback((screen: ScreenType) => {
    setActiveScreen(screen);
    if (screen !== 'page-editor') {
      setEditingPageId(null);
    }
  }, []);

  const editPage = useCallback((pageId: string) => {
    setEditingPageId(pageId);
    setActiveScreen('page-editor');
  }, []);

  const createNewPage = useCallback(() => {
    setEditingPageId(null);
    setActiveScreen('new-page');
  }, []);

  const goToPages = useCallback(() => {
    setEditingPageId(null);
    setActiveScreen('pages');
  }, []);

  return {
    isNavCollapsed,
    activeScreen,
    editingPageId,
    toggleNav,
    setActiveScreen: handleSetActiveScreen,
    editPage,
    createNewPage,
    goToPages,
  };
};
