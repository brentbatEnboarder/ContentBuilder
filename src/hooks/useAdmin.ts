import { useAuth } from '@/contexts/AuthContext';

// Admin emails - add more as needed
const ADMIN_EMAILS = ['brent@enboarder.com'];

/**
 * Hook to check if the current user has admin privileges.
 * Currently based on email whitelist.
 */
export const useAdmin = () => {
  const { user } = useAuth();

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  return { isAdmin };
};
