import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  isCollapsed: boolean;
  isPrimary?: boolean;
  onClick: () => void;
}

export const NavItem = ({
  icon: Icon,
  label,
  isActive = false,
  isCollapsed,
  isPrimary = false,
  onClick,
}: NavItemProps) => {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center w-full rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5',
        isPrimary
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20'
          : isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {/* Left accent bar for active state */}
      {isActive && !isPrimary && (
        <div className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full',
          isCollapsed && 'w-0.5 h-4'
        )} />
      )}
      <Icon className={cn(
        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
        isActive && !isPrimary && 'scale-110'
      )} />
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};
