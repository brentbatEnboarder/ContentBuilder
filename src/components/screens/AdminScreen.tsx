import { Shield } from 'lucide-react';

export const AdminScreen = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Admin Dashboard</span>
        </div>

        {/* Card Body */}
        <div className="p-6">
          <p className="text-muted-foreground">
            Admin features coming soon. This is where you'll be able to view usage analytics and manage the application.
          </p>
        </div>
      </div>
    </div>
  );
};
