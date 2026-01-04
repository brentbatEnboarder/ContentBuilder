import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboarding, ONBOARDING_STEPS } from '@/contexts/OnboardingContext';

export const WizardBanner = () => {
  const {
    isOnboarding,
    currentStep,
    firstName,
    previousStep,
    isStepCompleted,
    isStepCurrent,
  } = useOnboarding();

  if (!isOnboarding) return null;

  const stepInfo = ONBOARDING_STEPS.find((s) => s.step === currentStep);
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.step === currentStep);
  const isFirstStep = currentIndex === 0;

  // Personalize step 1 description with user's name
  const getDescription = () => {
    if (currentStep === 'company' && firstName) {
      return `Hi ${firstName}! ${stepInfo?.description}`;
    }
    return stepInfo?.description || '';
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Back button (hidden on first step) */}
          <div className="w-20">
            {!isFirstStep && (
              <button
                onClick={previousStep}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          {/* Center: Progress dots and step info */}
          <div className="flex flex-col items-center gap-3">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {ONBOARDING_STEPS.map((step, index) => {
                const isCompleted = isStepCompleted(step.step);
                const isCurrent = isStepCurrent(step.step);

                return (
                  <div key={step.step} className="flex items-center">
                    {/* Step dot */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                        isCompleted && 'bg-primary text-primary-foreground',
                        isCurrent && !isCompleted && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                        !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                    </div>

                    {/* Connector line (not after last step) */}
                    {index < ONBOARDING_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-8 h-0.5 mx-1 transition-colors duration-300',
                          isStepCompleted(step.step) ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step title and description */}
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                Step {stepInfo?.number} of {ONBOARDING_STEPS.length}: {stepInfo?.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-nowrap">
                {getDescription()}
              </p>
            </div>
          </div>

          {/* Right: Spacer for balance */}
          <div className="w-20" />
        </div>
      </div>
    </div>
  );
};
