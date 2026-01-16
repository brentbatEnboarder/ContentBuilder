import { useState, useCallback, useEffect } from 'react';

export type ScreenType = 'new-page' | 'company' | 'voice' | 'style' | 'pages' | 'page-editor' | 'admin';

const NAV_STATE_KEY = 'contentbuilder_nav_state';

interface PersistedNavState {
  activeScreen: ScreenType;
  editingPageId: string | null;
  newPageKey: number;
}

/**
 * Load navigation state from sessionStorage
 * Returns null if no saved state or invalid
 */
function loadNavState(): PersistedNavState | null {
  try {
    const saved = sessionStorage.getItem(NAV_STATE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as PersistedNavState;
    // Validate the screen type
    const validScreens: ScreenType[] = ['new-page', 'company', 'voice', 'style', 'pages', 'page-editor', 'admin'];
    if (!validScreens.includes(parsed.activeScreen)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save navigation state to sessionStorage
 */
function saveNavState(state: PersistedNavState): void {
  try {
    sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

interface NavigationState {
  isNavCollapsed: boolean;
  activeScreen: ScreenType;
  editingPageId: string | null;
  newPageKey: number; // Unique key to force remount of new page editor
  toggleNav: () => void;
  setActiveScreen: (screen: ScreenType) => void;
  editPage: (pageId: string) => void;
  createNewPage: () => void;
  goToPages: () => void;
}

export const useNavigation = (): NavigationState => {
  // Load initial state from sessionStorage if available
  const savedState = loadNavState();

  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activeScreen, setActiveScreen] = useState<ScreenType>(savedState?.activeScreen ?? 'company');
  const [editingPageId, setEditingPageId] = useState<string | null>(savedState?.editingPageId ?? null);
  const [newPageKey, setNewPageKey] = useState(savedState?.newPageKey ?? 0);

  // Persist navigation state to sessionStorage whenever it changes
  useEffect(() => {
    saveNavState({ activeScreen, editingPageId, newPageKey });
  }, [activeScreen, editingPageId, newPageKey]);

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
    setNewPageKey(prev => prev + 1); // Increment key to force fresh mount
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
    newPageKey,
    toggleNav,
    setActiveScreen: handleSetActiveScreen,
    editPage,
    createNewPage,
    goToPages,
  };
};
