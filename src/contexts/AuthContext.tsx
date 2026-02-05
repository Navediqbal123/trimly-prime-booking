import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  login as apiLogin, 
  getAuthToken, 
  removeAuthToken, 
  getMyBarberProfile,
  isTokenExpired,
  getTokenExpiry,
  decodeJWT
} from '@/lib/api';

// Super admin email - special handling
const SUPER_ADMIN_EMAIL = 'navedahmad9012@gmail.com';

export type UserRole = 'user' | 'barber_pending' | 'barber' | 'admin' | 'super_admin';

export interface UserProfile {
  email: string;
  full_name?: string;
  role: UserRole;
  id?: string;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [barberStatusChecked, setBarberStatusChecked] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup auto-logout timer
  const setupAutoLogoutTimer = useCallback(() => {
    // Clear any existing timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    const expiresAt = getTokenExpiry();
    if (!expiresAt) return;

    const timeUntilExpiry = expiresAt - Date.now();
    
    // If already expired, logout immediately
    if (timeUntilExpiry <= 0) {
      removeAuthToken();
      setUser(null);
      return;
    }

    // Set timer for auto-logout (trigger 10 seconds before actual expiry for safety)
    const logoutTime = Math.max(timeUntilExpiry - 10000, 0);
    
    logoutTimerRef.current = setTimeout(() => {
      removeAuthToken();
      setUser(null);
      // Toast will be shown by MainLayout when it detects no user
    }, logoutTime);
  }, []);

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
    const initAuth = () => {
      const token = getAuthToken();
      
      // No token - not logged in
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Check if token is expired - just clear, don't show toast on initial load
      if (isTokenExpired()) {
        removeAuthToken();
        setLoading(false);
        return;
      }
      
      // Decode token and set user
      const decoded = decodeJWT(token);
      if (decoded?.email) {
        const email = decoded.email;
        const role: UserRole = email === SUPER_ADMIN_EMAIL 
          ? 'super_admin' 
          : (decoded.role as UserRole) || 'user';
        
        setUser({
          email,
          full_name: email.split('@')[0],
          role,
          id: decoded.id,
        });
        
        // Setup auto-logout timer
        setupAutoLogoutTimer();
      } else {
        // Invalid token format
        removeAuthToken();
      }
      
      setLoading(false);
    };

    initAuth();

    // Cleanup timer on unmount
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [setupAutoLogoutTimer]);

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
        const decoded = decodeJWT(token);
        const role: UserRole = email === SUPER_ADMIN_EMAIL 
          ? 'super_admin' 
          : (decoded?.role as UserRole) || 'user';

        setUser({
          email,
          full_name: decoded?.email?.split('@')[0] || email.split('@')[0],
          role,
          id: decoded?.id,
        });

        // Setup auto-logout timer for new session
        setupAutoLogoutTimer();
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    // Clear logout timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    
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
