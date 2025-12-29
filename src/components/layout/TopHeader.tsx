import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHeaderActions } from '@/contexts/HeaderActionsContext';
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
  const config = screenConfig[activeScreen] || { title: 'Company Info' };

  const isPageEditor = activeScreen === 'new-page' || activeScreen === 'page-editor';

  // For page editor, show save button when dirty or just saved
  // For other screens, only show when there are changes
  const showButtons = isPageEditor
    ? (actions?.hasChanges || actions?.showSaved)
    : actions?.hasChanges;

  // Use page title from actions if available (for page editor)
  const displayTitle = actions?.pageTitle || config.title;

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
            className="h-10 w-auto"
          />
        )}
      </div>

      {/* Title & Subtitle - Center */}
      <div className="flex-1 flex justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            {displayTitle}
          </h1>
          {config.subtitle && !isPageEditor && (
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
            {!isPageEditor && (
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
              disabled={isPageEditor ? (!actions.hasChanges && !actions.showSaved) : actions.isSaving}
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
