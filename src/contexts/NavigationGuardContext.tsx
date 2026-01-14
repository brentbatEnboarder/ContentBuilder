import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

/**
 * NavigationGuardContext handles "unsaved changes" dialogs when navigating away from dirty pages.
 *
 * Flow:
 * 1. PageEditorScreen registers its dirty state and save function
 * 2. When user clicks "New Page", LeftNav calls requestNewPage()
 * 3. If dirty, pendingAction is set and PageEditorScreen shows a dialog
 * 4. User chooses Save (save then navigate), Discard (navigate without saving), or Cancel
 */

type PendingAction = 'new-page' | null;

interface NavigationGuardState {
  // Whether the current view has unsaved changes
  isDirty: boolean;
  // Pending navigation action waiting for user confirmation
  pendingAction: PendingAction;
  // Register the current page's dirty state and save function
  registerGuard: (isDirty: boolean, onSave: () => Promise<void>) => void;
  // Unregister when leaving the guarded view
  unregisterGuard: () => void;
  // Request to create a new page (may trigger confirmation dialog)
  requestNewPage: () => void;
  // User confirmed: save then proceed
  confirmSave: () => Promise<void>;
  // User confirmed: discard and proceed
  confirmDiscard: () => void;
  // User cancelled: stay on current page
  cancelNavigation: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardState | null>(null);

interface NavigationGuardProviderProps {
  children: ReactNode;
  onCreateNewPage: () => void;
}

export const NavigationGuardProvider = ({ children, onCreateNewPage }: NavigationGuardProviderProps) => {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  // Use ref for save function to avoid stale closures
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  const registerGuard = useCallback((dirty: boolean, onSave: () => Promise<void>) => {
    setIsDirty(dirty);
    saveRef.current = onSave;
  }, []);

  const unregisterGuard = useCallback(() => {
    setIsDirty(false);
    saveRef.current = null;
    setPendingAction(null);
  }, []);

  const requestNewPage = useCallback(() => {
    if (isDirty) {
      // Page has unsaved changes - show confirmation dialog
      setPendingAction('new-page');
    } else {
      // No unsaved changes - proceed immediately
      onCreateNewPage();
    }
  }, [isDirty, onCreateNewPage]);

  const confirmSave = useCallback(async () => {
    if (saveRef.current) {
      await saveRef.current();
    }
    setPendingAction(null);
    onCreateNewPage();
  }, [onCreateNewPage]);

  const confirmDiscard = useCallback(() => {
    setPendingAction(null);
    onCreateNewPage();
  }, [onCreateNewPage]);

  const cancelNavigation = useCallback(() => {
    setPendingAction(null);
  }, []);

  return (
    <NavigationGuardContext.Provider
      value={{
        isDirty,
        pendingAction,
        registerGuard,
        unregisterGuard,
        requestNewPage,
        confirmSave,
        confirmDiscard,
        cancelNavigation,
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
};

export const useNavigationGuard = (): NavigationGuardState => {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard must be used within NavigationGuardProvider');
  }
  return context;
};

/**
 * Hook for PageEditorScreen to register its dirty state with the navigation guard
 */
export const useRegisterNavigationGuard = (isDirty: boolean, onSave: () => Promise<void>) => {
  const { registerGuard, unregisterGuard } = useNavigationGuard();

  // Update the guard whenever dirty state or save function changes
  useEffect(() => {
    registerGuard(isDirty, onSave);
  }, [isDirty, onSave, registerGuard]);

  // Unregister when component unmounts
  useEffect(() => {
    return () => unregisterGuard();
  }, [unregisterGuard]);
};
