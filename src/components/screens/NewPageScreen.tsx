import { FilePlus } from 'lucide-react';

export const NewPageScreen = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-2">Create New Page</h1>
      <p className="text-muted-foreground mb-8">
        Generate AI-powered content for your new page.
      </p>

      <div className="bg-card rounded-lg border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
          <FilePlus className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">
          Page creation coming soon
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This feature will allow you to create AI-generated content pages
          using your company profile and brand voice settings.
        </p>
      </div>
    </div>
  );
};
