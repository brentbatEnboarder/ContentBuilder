import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">ContentBuilder</h1>
        <p className="text-muted-foreground mb-6">AI-powered content generation platform</p>
        {user && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Signed in as: <span className="font-medium text-foreground">{user.email}</span>
            </p>
            <button
              onClick={logout}
              className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground font-medium hover:bg-secondary/80"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
