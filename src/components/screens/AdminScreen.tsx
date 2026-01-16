import { useEffect, useState } from 'react';
import { Shield, Users, Building2, FileText, LogIn, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import apiClient, { AdminUsageResponse } from '@/services/api';

interface StatCardProps {
  icon: typeof Shield;
  label: string;
  value: number | null;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, color }: StatCardProps) => (
  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

export const AdminScreen = () => {
  const [data, setData] = useState<AdminUsageResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAdminUsage();
      setData(response.data);
    } catch (err) {
      setError('Failed to load usage data');
      console.error('Admin usage fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatEventType = (type: string) => {
    switch (type) {
      case 'user_login': return 'Login';
      case 'customer_selected': return 'Customer Selected';
      case 'page_created': return 'Page Created';
      default: return type;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Usage analytics and activity tracking</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="bg-card rounded-2xl border border-border p-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Stats Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Unique Users"
              value={data.totals.uniqueUsers}
              color="bg-blue-500"
            />
            <StatCard
              icon={LogIn}
              label="Total Logins"
              value={data.totals.logins}
              color="bg-green-500"
            />
            <StatCard
              icon={Building2}
              label="Customers Selected"
              value={data.totals.customerSelections}
              color="bg-purple-500"
            />
            <StatCard
              icon={FileText}
              label="Pages Created"
              value={data.totals.pagesCreated}
              color="bg-orange-500"
            />
          </div>

          {/* Activity by Day */}
          <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <span className="text-sm font-medium text-foreground">Activity (Last 7 Days)</span>
            </div>
            <div className="p-4">
              {Object.keys(data.activityByDay).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No activity in the last 7 days</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.activityByDay)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([day, activity]) => (
                      <div key={day} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm font-medium text-foreground w-28">{day}</span>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3 h-3" /> {activity.logins} logins
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {activity.customers} customers
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {activity.pages} pages
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-card rounded-2xl border border-border shadow-md overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
              <span className="text-sm font-medium text-foreground">Recent Events</span>
              <span className="text-xs text-muted-foreground ml-auto">Last 100 events</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Time</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Event</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          event.eventType === 'user_login' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          event.eventType === 'customer_selected' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                          event.eventType === 'page_created' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                        )}>
                          {formatEventType(event.eventType)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {'customer_name' in event.metadata && `Customer: ${event.metadata.customer_name}`}
                        {'title' in event.metadata && `Page: ${event.metadata.title}`}
                        {'provider' in event.metadata && `Provider: ${event.metadata.provider}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
