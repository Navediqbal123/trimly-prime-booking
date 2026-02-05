import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { isAuthenticated, isTokenExpired, handleSessionExpiry } from '@/lib/api';

export function MainLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Protected route guard - check on every render and route change
  useEffect(() => {
    if (!loading) {
      // Double-check token validity on route changes
      if (!isAuthenticated()) {
        if (isTokenExpired()) {
          handleSessionExpiry(true);
        }
      }
    }
  }, [location.pathname, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Additional auth check before rendering
  if (!user || !isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
