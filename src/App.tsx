import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { CustomerProvider } from '@/contexts/CustomerContext';
import { HeaderActionsProvider } from '@/contexts/HeaderActionsContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { CustomerSelection } from '@/pages/CustomerSelection';
import { AppLayout } from '@/components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent refetch when tabbing back - disrupts scans/streaming
      refetchOnReconnect: false, // Prevent refetch on network reconnect
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomerProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public route - Login */}
                <Route path="/login" element={<Login />} />

                {/* Protected route - Customer Selection (no customer required) */}
                <Route
                  path="/select-customer"
                  element={
                    <ProtectedRoute requireCustomer={false}>
                      <CustomerSelection />
                    </ProtectedRoute>
                  }
                />

                {/* Protected route - Main App (requires customer) */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <HeaderActionsProvider>
                        <OnboardingProvider>
                          <AppLayout />
                        </OnboardingProvider>
                      </HeaderActionsProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster position="top-right" richColors />
            </BrowserRouter>
          </TooltipProvider>
        </CustomerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
