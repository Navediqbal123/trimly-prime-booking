import { Navigate } from 'react-router-dom';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Loader2 } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '@/lib/supabase';

export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user } = useProtectedUser();
  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function BarberOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isBarber, isSuperAdmin, barberStatusChecked } = useProtectedUser();
  if (!barberStatusChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isBarber && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
