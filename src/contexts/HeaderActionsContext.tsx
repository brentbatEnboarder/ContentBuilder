import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface HeaderActions {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  // For page editor screens
  onBack?: () => void;
  pageTitle?: string;
  showSaved?: boolean;
}

interface HeaderActionsContextType {
  actions: HeaderActions | null;
  registerActions: (actions: HeaderActions) => void;
  clearActions: () => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | null>(null);

export const HeaderActionsProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<HeaderActions | null>(null);

  const registerActions = useCallback((newActions: HeaderActions) => {
    // Only update if values actually changed to prevent infinite loops
    setActions((prev) => {
      if (
        prev?.hasChanges === newActions.hasChanges &&
        prev?.isSaving === newActions.isSaving &&
        prev?.pageTitle === newActions.pageTitle &&
        prev?.showSaved === newActions.showSaved
      ) {
        // Values unchanged, keep previous object to avoid re-render
        return prev;
      }
      return newActions;
    });
  }, []);

  const clearActions = useCallback(() => {
    setActions(null);
  }, []);

  return (
    <HeaderActionsContext.Provider value={{ actions, registerActions, clearActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = () => {
  const context = useContext(HeaderActionsContext);
  if (!context) {
    throw new Error('useHeaderActions must be used within HeaderActionsProvider');
  }
  return context;
};

/**
 * Hook for screens to register their save/cancel actions with the header.
 * Actions are cleared when the component unmounts.
 */
export const useRegisterHeaderActions = (
  hasChanges: boolean,
  isSaving: boolean,
  onSave: () => void,
  onCancel: () => void,
  options?: {
    onBack?: () => void;
    pageTitle?: string;
    showSaved?: boolean;
  }
) => {
  const { registerActions, clearActions } = useHeaderActions();

  useEffect(() => {
    registerActions({
      hasChanges,
      isSaving,
      onSave,
      onCancel,
      onBack: options?.onBack,
      pageTitle: options?.pageTitle,
      showSaved: options?.showSaved,
    });
  }, [hasChanges, isSaving, onSave, onCancel, options?.onBack, options?.pageTitle, options?.showSaved, registerActions]);

  useEffect(() => {
    return () => clearActions();
  }, [clearActions]);
};
