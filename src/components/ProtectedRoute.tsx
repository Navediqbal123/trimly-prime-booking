import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedUserProvider } from '@/contexts/ProtectedUserContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut, refreshBarberStatus, isSuperAdmin, isAdmin, isBarber, isBarberPending, barberStatusChecked } = useAuth();
  const location = useLocation();

  // Show loader while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Provide user data to children via context (so they don't need to call useAuth)
  return (
    <ProtectedUserProvider value={{ 
      user, 
      signOut, 
      refreshBarberStatus,
      isSuperAdmin, 
      isAdmin, 
      isBarber, 
      isBarberPending, 
      barberStatusChecked 
    }}>
      {children}
    </ProtectedUserProvider>
  );
}
