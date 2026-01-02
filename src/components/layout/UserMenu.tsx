import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface UserMenuProps {
  isCollapsed: boolean;
}

export const UserMenu = ({ isCollapsed }: UserMenuProps) => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        // Use email prefix as name if no full name in metadata
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (fullName) {
          setUserName(fullName);
        } else if (user.email) {
          // Use part before @ as display name
          setUserName(user.email.split('@')[0]);
        }
      }
    };
    getUser();
  }, []);

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail?.slice(0, 2).toUpperCase() || '?';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center cursor-pointer shadow-md shadow-primary/20 ring-2 ring-primary/20">
              <span className="text-sm font-semibold text-primary-foreground">
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
              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
    <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-background/80 transition-all duration-200">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 ring-2 ring-primary/20">
        <span className="text-sm font-semibold text-primary-foreground">
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
          'p-1.5 rounded-lg text-muted-foreground',
          'opacity-0 group-hover:opacity-100 transition-all duration-200',
          'hover:bg-destructive/10 hover:text-destructive'
        )}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
};
