import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomer } from '@/contexts/CustomerContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * If true, requires a customer to be selected.
   * If false, only requires authentication (for customer selection page).
   * Default: true
   */
  requireCustomer?: boolean;
}

export function ProtectedRoute({ children, requireCustomer = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentCustomer, loading: customerLoading } = useCustomer();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (authLoading || customerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to customer selection if no customer selected (and customer is required)
  if (requireCustomer && !currentCustomer) {
    return <Navigate to="/select-customer" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
