import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as apiLogin, getAuthToken, removeAuthToken, getMyBarberProfile } from '@/lib/api';

// Super admin email - special handling
const SUPER_ADMIN_EMAIL = 'navedahmad9012@gmail.com';

export type UserRole = 'user' | 'barber_pending' | 'barber' | 'admin' | 'super_admin';

export interface UserProfile {
  email: string;
  full_name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateLocalRole: (role: UserRole) => void;
  refreshBarberStatus: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isBarberPending: boolean;
  barberStatusChecked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to decode JWT payload (without verification - backend handles that)
function decodeToken(token: string): { email?: string; role?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [barberStatusChecked, setBarberStatusChecked] = useState(false);

  // Check barber status from backend API
  const refreshBarberStatus = useCallback(async () => {
    if (!user) return;
    
    // Skip for admins
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') {
      setBarberStatusChecked(true);
      return;
    }

    try {
      const response = await getMyBarberProfile();
      
      if (response.success && response.data) {
        const barberStatus = response.data.status;
        
        if (barberStatus === 'approved') {
          setUser(prev => prev ? { ...prev, role: 'barber' } : null);
        } else if (barberStatus === 'pending') {
          setUser(prev => prev ? { ...prev, role: 'barber_pending' } : null);
        }
      }
      // If no barber record, keep current role (user)
    } catch (error) {
      console.error('Failed to check barber status:', error);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user]);

  // Initialize user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded?.email) {
          const email = decoded.email;
          // Determine initial role - super admin gets special treatment
          const role: UserRole = email === SUPER_ADMIN_EMAIL 
            ? 'super_admin' 
            : (decoded.role as UserRole) || 'user';
          
          setUser({
            email,
            full_name: email.split('@')[0],
            role,
          });
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Check barber status after user is set
  useEffect(() => {
    if (user && !barberStatusChecked) {
      refreshBarberStatus();
    }
  }, [user, barberStatusChecked, refreshBarberStatus]);

  const signIn = async (email: string, password: string) => {
    try {
      setBarberStatusChecked(false);
      const result = await apiLogin({ email, password });

      if (!result.success) {
        return { error: new Error(result.error || 'Login failed') };
      }

      // Decode token to get user info
      const token = result.data?.token;
      if (token) {
        const decoded = decodeToken(token);
        const role: UserRole = email === SUPER_ADMIN_EMAIL 
          ? 'super_admin' 
          : (decoded?.role as UserRole) || 'user';

        setUser({
          email,
          full_name: decoded?.email?.split('@')[0] || email.split('@')[0],
          role,
        });
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    removeAuthToken();
    setUser(null);
    setBarberStatusChecked(false);
  };

  // Update local role (for UI purposes after becoming barber, etc.)
  const updateLocalRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isBarber = user?.role === 'barber';
  const isBarberPending = user?.role === 'barber_pending';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        updateLocalRole,
        refreshBarberStatus,
        isSuperAdmin,
        isAdmin,
        isBarber,
        isBarberPending,
        barberStatusChecked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
