import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Check, Pencil, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHeaderActions } from '@/contexts/HeaderActionsContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import type { ScreenType } from '@/hooks/useNavigation';

interface TopHeaderProps {
  activeScreen: ScreenType;
}

const screenConfig: Record<ScreenType, { title: string; subtitle?: string }> = {
  'company': {
    title: 'Company Info',
    subtitle: 'Set up your company profile to personalize generated content.',
  },
  'voice': {
    title: 'Brand Voice',
    subtitle: 'Configure how your generated content should sound.',
  },
  'style': {
    title: 'Image Style',
    subtitle: 'Configure brand colors and image style for generated content.',
  },
  'pages': {
    title: 'Pages',
  },
  'new-page': {
    title: 'New Page',
  },
  'page-editor': {
    title: 'Edit Page',
  },
};

export const TopHeader = ({ activeScreen }: TopHeaderProps) => {
  const { actions } = useHeaderActions();
  const { isOnboarding, currentStep } = useOnboarding();
  const config = screenConfig[activeScreen] || { title: 'Company Info' };

  // Editing state for page title
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isPageEditor = activeScreen === 'page-editor';
  const isNewPage = activeScreen === 'new-page';
  const canEditTitle = (isPageEditor || isNewPage) && actions?.onTitleChange;

  // During onboarding, setup steps (1-3) - button is in WizardBanner, not here
  const isOnboardingSetupStep = isOnboarding && ['company', 'voice', 'style'].includes(currentStep);

  // For page editor/new page, show save button when dirty or just saved
  // For other screens, only show when there are changes
  // During onboarding setup steps, don't show buttons here (they're in WizardBanner)
  const showButtons = isOnboardingSetupStep
    ? false
    : (isPageEditor || isNewPage)
      ? (actions?.hasChanges || actions?.showSaved)
      : actions?.hasChanges;

  // Use page title from actions if available (for page editor)
  const displayTitle = actions?.pageTitle || config.title;

  // Start editing when clicking the title
  const handleTitleClick = () => {
    if (canEditTitle) {
      setEditValue(displayTitle);
      setIsEditing(true);
    }
  };

  // Commit changes on blur or Enter
  const handleEditComplete = () => {
    if (editValue.trim() && editValue !== displayTitle) {
      actions?.onTitleChange?.(editValue.trim());
    }
    setIsEditing(false);
  };

  // Cancel on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 shrink-0">
      {/* Left side - Logo or Back button */}
      <div className="flex items-center w-48 shrink-0">
        {isPageEditor && actions?.onBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={actions.onBack}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pages
          </Button>
        ) : (
          <img
            src="/ACGLogo.png"
            alt="AI Content Generator"
            className="h-12 w-auto"
          />
        )}
      </div>

      {/* Title & Subtitle - Center */}
      <div className="flex-1 flex justify-center">
        <div className="text-center">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold text-center h-8 w-64"
              placeholder="Enter page title"
            />
          ) : (
            <h1
              className={`text-lg font-semibold text-foreground leading-tight inline-flex items-center gap-2 ${
                canEditTitle ? 'cursor-pointer hover:text-muted-foreground group' : ''
              }`}
              onClick={handleTitleClick}
              title={canEditTitle ? 'Click to edit title' : undefined}
            >
              {displayTitle}
              {canEditTitle && (
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </h1>
          )}
          {config.subtitle && !isPageEditor && !isNewPage && (
            <p className="text-sm text-muted-foreground leading-tight">
              {config.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons - Right */}
      <div className="w-48 shrink-0 flex justify-end gap-3">
        {showButtons && actions && (
          <>
            {!isPageEditor && !isNewPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={actions.onCancel}
                disabled={actions.isSaving}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={actions.onSave}
              disabled={(isPageEditor || isNewPage) ? (!actions.hasChanges && !actions.showSaved) : actions.isSaving}
              className="gap-2"
            >
              {actions.showSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : actions.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isOnboardingSetupStep ? (
                <>
                  Save & Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Save'
              )}
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
