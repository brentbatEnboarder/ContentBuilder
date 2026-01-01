import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface HeaderActions {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  // For page editor screens
  onBack?: () => void;
  pageTitle?: string;
  showSaved?: boolean;
  onTitleChange?: (title: string) => void;
}

// Separate display state (triggers re-renders) from callbacks (stored in refs)
interface HeaderDisplayState {
  hasChanges: boolean;
  isSaving: boolean;
  pageTitle?: string;
  showSaved?: boolean;
}

interface HeaderActionsContextType {
  displayState: HeaderDisplayState | null;
  // Callbacks accessed via refs - always fresh, no stale closures
  callbackRefs: React.MutableRefObject<{
    onSave?: () => void;
    onCancel?: () => void;
    onBack?: () => void;
    onTitleChange?: (title: string) => void;
  }>;
  registerActions: (actions: HeaderActions) => void;
  clearActions: () => void;
}

const HeaderActionsContext = createContext<HeaderActionsContextType | null>(null);

export const HeaderActionsProvider = ({ children }: { children: ReactNode }) => {
  const [displayState, setDisplayState] = useState<HeaderDisplayState | null>(null);

  // Use refs for callbacks to avoid stale closure issues
  const callbackRefs = useRef<{
    onSave?: () => void;
    onCancel?: () => void;
    onBack?: () => void;
    onTitleChange?: (title: string) => void;
  }>({});

  const registerActions = useCallback((newActions: HeaderActions) => {
    // Always update callback refs (no stale closures!)
    callbackRefs.current = {
      onSave: newActions.onSave,
      onCancel: newActions.onCancel,
      onBack: newActions.onBack,
      onTitleChange: newActions.onTitleChange,
    };

    // Only update display state if values actually changed (prevents re-renders)
    setDisplayState((prev) => {
      if (
        prev?.hasChanges === newActions.hasChanges &&
        prev?.isSaving === newActions.isSaving &&
        prev?.pageTitle === newActions.pageTitle &&
        prev?.showSaved === newActions.showSaved
      ) {
        return prev;
      }
      return {
        hasChanges: newActions.hasChanges,
        isSaving: newActions.isSaving,
        pageTitle: newActions.pageTitle,
        showSaved: newActions.showSaved,
      };
    });
  }, []);

  const clearActions = useCallback(() => {
    setDisplayState(null);
    callbackRefs.current = {};
  }, []);

  return (
    <HeaderActionsContext.Provider value={{ displayState, callbackRefs, registerActions, clearActions }}>
      {children}
    </HeaderActionsContext.Provider>
  );
};

export const useHeaderActions = () => {
  const context = useContext(HeaderActionsContext);
  if (!context) {
    throw new Error('useHeaderActions must be used within HeaderActionsProvider');
  }

  // Provide a convenient combined interface for consumers
  // Callbacks are accessed from refs to always be fresh
  const actions = context.displayState
    ? {
        hasChanges: context.displayState.hasChanges,
        isSaving: context.displayState.isSaving,
        pageTitle: context.displayState.pageTitle,
        showSaved: context.displayState.showSaved,
        onSave: () => context.callbackRefs.current.onSave?.(),
        onCancel: () => context.callbackRefs.current.onCancel?.(),
        onBack: context.callbackRefs.current.onBack
          ? () => context.callbackRefs.current.onBack?.()
          : undefined,
        onTitleChange: context.callbackRefs.current.onTitleChange,
      }
    : null;

  return { actions, registerActions: context.registerActions, clearActions: context.clearActions };
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
    onTitleChange?: (title: string) => void;
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
      onTitleChange: options?.onTitleChange,
    });
  }, [hasChanges, isSaving, onSave, onCancel, options?.onBack, options?.pageTitle, options?.showSaved, options?.onTitleChange, registerActions]);

  useEffect(() => {
    return () => clearActions();
  }, [clearActions]);
};
