import { FileText, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyPagesStateProps {
  onCreatePage: () => void;
  companyName?: string;
}

export const EmptyPagesState = ({ onCreatePage, companyName }: EmptyPagesStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 max-w-md mx-auto">
      {/* Animated gradient background */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="relative w-28 h-28 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-3xl flex items-center justify-center border border-primary/20">
          <div className="relative">
            <FileText className="w-12 h-12 text-primary" />
            <Sparkles className="w-5 h-5 text-amber-500 absolute -top-1 -right-2 animate-pulse" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
        {companyName ? `Start creating for ${companyName}` : 'Create your first page'}
      </h2>

      <p className="text-muted-foreground text-center mb-8 leading-relaxed">
        Generate beautiful, on-brand content with AI assistance. Your pages will appear here in a visual gallery.
      </p>

      <Button size="lg" onClick={onCreatePage} className="gap-2">
        <Plus className="w-5 h-5" />
        Create New Page
      </Button>
    </div>
  );
};
