import { MessageSquare } from 'lucide-react';

export const EmptyPreview = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Start a conversation
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Chat with AI to generate content. Your preview will appear here.
      </p>
    </div>
  );
};
