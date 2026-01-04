import { useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useRegisterHeaderActions } from '@/contexts/HeaderActionsContext';

/**
 * Wrapper hook for settings screens during onboarding.
 * Extends save behavior to advance to the next step after successful save.
 *
 * Usage: Replace useRegisterHeaderActions with this hook in settings screens.
 *
 * On step 3 (Visual Style), this will also complete the onboarding
 * before advancing to the page creation step.
 */
export const useOnboardingHeaderActions = (
  hasChanges: boolean,
  isSaving: boolean,
  onSave: () => Promise<void>,
  onCancel: () => void
) => {
  const { isOnboarding, currentStep, nextStep, completeOnboarding } = useOnboarding();

  const handleSave = useCallback(async () => {
    // Always save first
    await onSave();

    // If in onboarding, advance to next step
    if (isOnboarding) {
      if (currentStep === 'style') {
        // Last setup step - complete onboarding in database
        await completeOnboarding();
      }
      // Advance to next step (this will update currentStep in context)
      nextStep();
    }
  }, [onSave, isOnboarding, currentStep, nextStep, completeOnboarding]);

  // Register with the header
  useRegisterHeaderActions(hasChanges, isSaving, handleSave, onCancel);

  // Return the wrapped handler in case the screen needs it directly
  return { handleSave };
};
