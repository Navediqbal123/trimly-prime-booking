import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { isAuthenticated, isTokenExpired, removeAuthToken } from '@/lib/api';
import { toast } from 'sonner';

export function MainLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Protected route guard - check on every route change
  useEffect(() => {
    if (!loading && user) {
      // Double-check token validity on route changes
      if (isTokenExpired()) {
        removeAuthToken();
        toast.error('Session expired. Please login again.');
        navigate('/auth', { replace: true });
      }
    }
  }, [location.pathname, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth check - redirect if not authenticated
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
