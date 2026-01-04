import {
  ChevronsLeft,
  ChevronsRight,
  FilePlus,
  Building2,
  Speech,
  Palette,
  FileText,
  Settings,
  Layers,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import type { ScreenType } from '@/hooks/useNavigation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Map screens to onboarding steps
const screenToStep: Record<ScreenType, OnboardingStep | undefined> = {
  company: 'company',
  voice: 'voice',
  style: 'style',
  pages: 'pages',
  'new-page': 'pages',
  'page-editor': 'pages',
};

interface LeftNavProps {
  isCollapsed: boolean;
  activeScreen: ScreenType;
  onToggle: () => void;
  onNavigate: (screen: ScreenType) => void;
}

const setupItems: { icon: typeof FilePlus; label: string; screen: ScreenType }[] = [
  { icon: Building2, label: 'Company Info', screen: 'company' },
  { icon: Speech, label: 'Brand Voice', screen: 'voice' },
  { icon: Palette, label: 'Image Style', screen: 'style' },
];

const contentItems: { icon: typeof FilePlus; label: string; screen: ScreenType }[] = [
  { icon: FileText, label: 'Pages', screen: 'pages' },
];

const newPageItem = { icon: FilePlus, label: 'New Page', screen: 'new-page' as ScreenType, isPrimary: true };

export const LeftNav = ({
  isCollapsed,
  activeScreen,
  onToggle,
  onNavigate,
}: LeftNavProps) => {
  const { isOnboarding, isStepCompleted, canNavigateToStep } = useOnboarding();

  const toggleButton = (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center rounded-lg p-2 text-muted-foreground',
        'hover:bg-primary/10 hover:text-foreground transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        isCollapsed ? 'justify-center w-full' : 'ml-auto'
      )}
    >
      {isCollapsed ? (
        <ChevronsRight className="h-5 w-5" />
      ) : (
        <ChevronsLeft className="h-5 w-5" />
      )}
    </button>
  );

  const SectionLabel = ({ icon: Icon, label }: { icon: typeof Settings; label: string }) => (
    <div className={cn(
      'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2',
      isCollapsed ? 'justify-center' : 'px-3'
    )}>
      {isCollapsed ? (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted/50">
              <Icon className="h-3.5 w-3.5" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ) : (
        <>
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </>
      )}
    </div>
  );

  return (
    <nav
      className={cn(
        'h-full bg-gradient-to-b from-card to-card/95 border-r border-border flex flex-col',
        'transition-all duration-300 ease-in-out shadow-sm',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Toggle button */}
      <div className={cn('p-3', isCollapsed ? 'flex justify-center' : 'flex justify-end')}>
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
            <TooltipContent side="right">Expand navigation</TooltipContent>
          </Tooltip>
        ) : (
          toggleButton
        )}
      </div>

      {/* Setup Section */}
      <div className={cn('flex flex-col', isCollapsed ? 'px-2' : 'px-3')}>
        <SectionLabel icon={Settings} label="Setup" />
        <div className="flex flex-col gap-0.5">
          {setupItems.map((item) => {
            const isActive = item.screen === activeScreen;
            const step = screenToStep[item.screen];
            const isCompleted = step ? isStepCompleted(step) : false;
            const canNavigate = !isOnboarding || (step ? canNavigateToStep(step) : true);

            return (
              <div key={item.screen} className="relative">
                <div className={cn(!canNavigate && 'opacity-50 pointer-events-none')}>
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    onClick={() => canNavigate && onNavigate(item.screen)}
                  />
                </div>
                {/* Checkmark badge for completed steps */}
                {isCompleted && (
                  <div
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center',
                      isCollapsed ? 'right-0.5' : 'right-2'
                    )}
                  >
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className={cn('flex flex-col mt-6', isCollapsed ? 'px-2' : 'px-3')}>
        <SectionLabel icon={Layers} label="Content" />
        <div className="flex flex-col gap-0.5">
          {contentItems.map((item) => {
            // Pages should be active when on pages or page-editor screen
            const isActive =
              item.screen === activeScreen ||
              (item.screen === 'pages' && activeScreen === 'page-editor');
            const step = screenToStep[item.screen];
            const canNavigate = !isOnboarding || (step ? canNavigateToStep(step) : true);

            return (
              <div
                key={item.screen}
                className={cn(!canNavigate && 'opacity-50 pointer-events-none')}
              >
                <NavItem
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                  onClick={() => canNavigate && onNavigate(item.screen)}
                />
              </div>
            );
          })}

          {/* New Page button */}
          <div className="mt-2">
            {(() => {
              const step = screenToStep[newPageItem.screen];
              const canNavigate = !isOnboarding || (step ? canNavigateToStep(step) : true);
              return (
                <div className={cn(!canNavigate && 'opacity-50 pointer-events-none')}>
                  <NavItem
                    icon={newPageItem.icon}
                    label={newPageItem.label}
                    isActive={activeScreen === 'new-page'}
                    isCollapsed={isCollapsed}
                    isPrimary={newPageItem.isPrimary}
                    onClick={() => canNavigate && onNavigate(newPageItem.screen)}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className={cn(
        'border-t border-border/50 bg-muted/30',
        isCollapsed ? 'p-2' : 'p-3'
      )}>
        <UserMenu isCollapsed={isCollapsed} />
      </div>
    </nav>
  );
};
