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
        'flex items-center w-full rounded-md font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5',
        isPrimary
          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
          : isActive
            ? 'nav-item-active'
            : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
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
