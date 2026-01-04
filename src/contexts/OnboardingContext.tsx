import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCustomer } from './CustomerContext';
import { useAuth } from './AuthContext';

// Step definitions
export type OnboardingStep = 'company' | 'voice' | 'style' | 'pages';

export interface StepInfo {
  step: OnboardingStep;
  number: number;
  title: string;
  description: string;
  personalizedDescription?: string; // For step 1 with user's name
}

export const ONBOARDING_STEPS: StepInfo[] = [
  {
    step: 'company',
    number: 1,
    title: 'Scan Customer',
    description: "Let's scan your customer's website to gather context for AI content generation.",
    personalizedDescription: "Let's scan your customer's website to gather context for AI content generation.",
  },
  {
    step: 'voice',
    number: 2,
    title: 'Brand Voice',
    description: "Set your customer's brand voice to ensure all content matches their tone and style.",
  },
  {
    step: 'style',
    number: 3,
    title: 'Visual Style',
    description: 'Choose branding colors and image styles for AI-generated visuals.',
  },
  {
    step: 'pages',
    number: 4,
    title: 'First Page',
    description: "You're all set! Let's create your first piece of content.",
  },
];

interface OnboardingContextType {
  // State
  isOnboarding: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isLoading: boolean;
  firstName: string;

  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;
  markStepComplete: (step: OnboardingStep) => void;

  // Helpers
  getStepInfo: (step: OnboardingStep) => StepInfo | undefined;
  isStepCompleted: (step: OnboardingStep) => boolean;
  isStepCurrent: (step: OnboardingStep) => boolean;
  canNavigateToStep: (step: OnboardingStep) => boolean;
  getStepNumber: (step: OnboardingStep) => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { currentCustomer } = useCustomer();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const customerId = currentCustomer?.id;

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('company');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);

  // Extract first name from user metadata
  const firstName = (() => {
    if (!user) return '';
    // Try full_name from Google OAuth or other providers
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '';
    // Get just the first name
    return fullName.split(' ')[0] || 'there';
  })();

  // Query: Check if onboarding is completed
  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ['onboardingStatus', customerId],
    queryFn: async () => {
      if (!customerId) return { completed: true }; // No customer = skip onboarding

      const { data, error } = await supabase
        .from('customer_settings')
        .select('onboarding_completed')
        .eq('customer_id', customerId)
        .single();

      // PGRST116 = row not found - onboarding not completed yet
      if (error && error.code === 'PGRST116') {
        return { completed: false };
      }
      if (error) throw error;

      return { completed: data?.onboarding_completed ?? false };
    },
    enabled: !!customerId,
  });

  const isOnboarding = !onboardingStatus?.completed && !isLoading && !!customerId;

  // Mutation: Complete onboarding
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error('No customer selected');

      const { error } = await supabase.from('customer_settings').upsert(
        { customer_id: customerId, onboarding_completed: true },
        { onConflict: 'customer_id' }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingStatus', customerId] });
    },
  });

  // Mark a step as completed (local state)
  const markStepComplete = useCallback((step: OnboardingStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  // Navigation functions
  const nextStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.step === currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      // Mark current step as completed
      markStepComplete(currentStep);
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1].step);
    }
  }, [currentStep, markStepComplete]);

  const previousStep = useCallback(() => {
    const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.step === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1].step);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await completeMutation.mutateAsync();
  }, [completeMutation]);

  // Helpers
  const getStepInfo = useCallback((step: OnboardingStep) => {
    return ONBOARDING_STEPS.find((s) => s.step === step);
  }, []);

  const isStepCompleted = useCallback(
    (step: OnboardingStep) => {
      return completedSteps.includes(step);
    },
    [completedSteps]
  );

  const isStepCurrent = useCallback(
    (step: OnboardingStep) => {
      return currentStep === step;
    },
    [currentStep]
  );

  const canNavigateToStep = useCallback(
    (step: OnboardingStep) => {
      const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.step === step);
      const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.step === currentStep);
      // Can navigate to current step, completed steps, or the immediate next step
      return stepIndex <= currentIndex || completedSteps.includes(step);
    },
    [currentStep, completedSteps]
  );

  const getStepNumber = useCallback((step: OnboardingStep) => {
    const info = ONBOARDING_STEPS.find((s) => s.step === step);
    return info?.number ?? 0;
  }, []);

  // Reset state when customer changes
  useEffect(() => {
    setCurrentStep('company');
    setCompletedSteps([]);
  }, [customerId]);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        completedSteps,
        isLoading,
        firstName,
        nextStep,
        previousStep,
        goToStep,
        completeOnboarding,
        markStepComplete,
        getStepInfo,
        isStepCompleted,
        isStepCurrent,
        canNavigateToStep,
        getStepNumber,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
