import { FileText, MoreVertical } from 'lucide-react';
import { format, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageCardMenu } from './PageCardMenu';
import type { Page } from '@/types/page';

interface PageCardProps {
  page: Page;
  onClick: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const formatDate = (date: Date): string => {
  const now = new Date();
  // Show relative time if within last 7 days
  if (isAfter(date, subDays(now, 7))) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'MMM d, yyyy');
};

export const PageCard = ({
  page,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
}: PageCardProps) => {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 p-4 bg-card rounded-lg border border-border',
        'cursor-pointer transition-all duration-200',
        'hover:border-primary hover:shadow-md hover:shadow-primary/10'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate">
          {page.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Created: {formatDate(page.createdAt)} • Last edited:{' '}
          {formatDate(page.updatedAt)}
        </p>
      </div>

      {/* Menu */}
      <div onClick={handleMenuClick}>
        <PageCardMenu
          trigger={
            <button
              className={cn(
                'p-2 rounded-md text-muted-foreground',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-muted hover:text-foreground',
                'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
