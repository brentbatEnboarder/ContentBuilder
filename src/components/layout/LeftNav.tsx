import {
  ChevronsLeft,
  ChevronsRight,
  FilePlus,
  Building2,
  SlidersHorizontal,
  Palette,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';
import type { ScreenType } from '@/hooks/useNavigation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeftNavProps {
  isCollapsed: boolean;
  activeScreen: ScreenType;
  onToggle: () => void;
  onNavigate: (screen: ScreenType) => void;
}

const navItems: { icon: typeof FilePlus; label: string; screen: ScreenType; isPrimary?: boolean }[] = [
  { icon: FilePlus, label: 'New Page', screen: 'new-page', isPrimary: true },
  { icon: Building2, label: 'Company Info', screen: 'company' },
  { icon: SlidersHorizontal, label: 'Brand Voice', screen: 'voice' },
  { icon: Palette, label: 'Image Style', screen: 'style' },
  { icon: FileText, label: 'Pages', screen: 'pages' },
];

export const LeftNav = ({
  isCollapsed,
  activeScreen,
  onToggle,
  onNavigate,
}: LeftNavProps) => {
  const toggleButton = (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center rounded-md p-2 text-muted-foreground',
        'hover:bg-secondary hover:text-secondary-foreground transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring',
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

  return (
    <nav
      className={cn(
        'h-screen bg-card border-r border-border flex flex-col',
        'transition-all duration-300 ease-in-out',
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

      {/* Navigation items */}
      <div className={cn('flex flex-col gap-1', isCollapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          // Pages should be active when on pages or page-editor screen
          const isActive = item.screen === activeScreen || 
            (item.screen === 'pages' && activeScreen === 'page-editor');
          
          return (
            <NavItem
              key={item.screen}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              isCollapsed={isCollapsed}
              isPrimary={item.isPrimary}
              onClick={() => onNavigate(item.screen)}
            />
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User section */}
      <div className={cn('border-t border-border', isCollapsed ? 'p-2' : 'p-3')}>
        <UserMenu isCollapsed={isCollapsed} />
      </div>
    </nav>
  );
};
