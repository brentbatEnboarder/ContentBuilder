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
 *
 * During onboarding, the "Save & Next" button is always shown (even without changes)
 * and appears in the WizardBanner instead of the header.
 *
 * @param canProceed - Optional flag to indicate if the step requirements are met.
 *                     For step 1 (Company), this should be true only after scan completes.
 *                     Defaults to true for steps 2-3.
 */
export const useOnboardingHeaderActions = (
  hasChanges: boolean,
  isSaving: boolean,
  onSave: () => Promise<void>,
  onCancel: () => void,
  canProceed: boolean = true
) => {
  const { isOnboarding, currentStep, nextStep, completeOnboarding } = useOnboarding();

  const handleSave = useCallback(async () => {
    // Always save first (even if no changes, to persist defaults)
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

  // During onboarding, show button if canProceed is true (step requirements met)
  // Outside onboarding, only show button when there are changes
  const effectiveHasChanges = isOnboarding ? canProceed : hasChanges;

  // Register with the header/wizard banner
  useRegisterHeaderActions(effectiveHasChanges, isSaving, handleSave, onCancel);

  // Return the wrapped handler in case the screen needs it directly
  return { handleSave };
};
