import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyPagesStateProps {
  onCreatePage: () => void;
  companyName?: string;
}

export const EmptyPagesState = ({ onCreatePage, companyName }: EmptyPagesStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-primary-light rounded-2xl flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        No pages yet{companyName ? ` for ${companyName}` : ''}
      </h2>
      
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Create your first page to start generating content with AI assistance.
      </p>
      
      <Button onClick={onCreatePage}>
        <Plus className="w-4 h-4 mr-2" />
        Create New Page
      </Button>
    </div>
  );
};
