import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserMenuProps {
  isCollapsed: boolean;
  userName?: string;
  userEmail?: string;
}

export const UserMenu = ({
  isCollapsed,
  userName = 'Brent Pearson',
  userEmail = 'brent@acme.com',
}: UserMenuProps) => {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center cursor-pointer">
              <span className="text-sm font-medium text-primary-foreground">
                {initials}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="text-sm">
              <p className="font-medium">{userName}</p>
              <p className="text-muted-foreground">{userEmail}</p>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors">
      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-primary-foreground">
          {initials}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{userName}</p>
        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
      </div>
      <button
        onClick={handleLogout}
        className={cn(
          'p-1.5 rounded-md text-muted-foreground',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-secondary hover:text-secondary-foreground'
        )}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
};
