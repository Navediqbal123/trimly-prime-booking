import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister,
  getAuthToken, 
  removeAuthToken, 
  getMyBarberProfile,
  getMyRole,
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
  barber?: {
    status: 'pending' | 'approved';
    id?: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateLocalRole: (role: UserRole) => void;
  refreshBarberStatus: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isBarberPending: boolean;
  barberStatusChecked: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [barberStatusChecked, setBarberStatusChecked] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup auto-logout timer
  const setupAutoLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    const expiresAt = getTokenExpiry();
    if (!expiresAt) return;

    const timeUntilExpiry = expiresAt - Date.now();
    
    if (timeUntilExpiry <= 0) {
      removeAuthToken();
      setUser(null);
      return;
    }

    const logoutTime = Math.max(timeUntilExpiry - 10000, 0);
    
    logoutTimerRef.current = setTimeout(() => {
      removeAuthToken();
      setUser(null);
    }, logoutTime);
  }, []);

  // Fetch role from backend API (NOT localStorage, NOT Supabase)
  const fetchBackendRole = useCallback(async (): Promise<UserRole> => {
    try {
      const result = await getMyRole();
      if (result.success && result.data?.role) {
        return result.data.role as UserRole;
      }
    } catch (err) {
      console.error('Failed to fetch role from backend:', err);
    }
    return 'user';
  }, []);

  // Check barber status using backend API as source of truth
  const refreshBarberStatus = useCallback(async () => {
    if (!user || !user.id) return;
    
    // Skip for admins
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') {
      setBarberStatusChecked(true);
      return;
    }

    try {
      const backendRole = await fetchBackendRole();
      
      if (backendRole === 'barber') {
        setUser(prev => prev ? { 
          ...prev, 
          barber: { status: 'approved' },
          role: 'barber'
        } : null);
      } else if (backendRole === 'barber_pending') {
        setUser(prev => prev ? { 
          ...prev, 
          barber: { status: 'pending' },
          role: 'barber_pending'
        } : null);
      } else {
        setUser(prev => {
          if (prev && prev.role !== 'admin' && prev.role !== 'super_admin') {
            return { ...prev, role: 'user', barber: undefined };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to check barber status:', error);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user?.id, user?.email, fetchBackendRole]);

  // Initialize user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        
        if (!token) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        if (isTokenExpired()) {
          removeAuthToken();
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        const decoded = decodeJWT(token);
        if (decoded?.email) {
          const email = decoded.email;
          const userId = decoded.id;
          
          let role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
          let barberData: UserProfile['barber'] | undefined;

          // Fetch role from backend API (not localStorage)
          if (email !== SUPER_ADMIN_EMAIL) {
            const backendRole = await fetchBackendRole();
            role = backendRole;
            if (backendRole === 'barber') {
              barberData = { status: 'approved' };
            } else if (backendRole === 'barber_pending') {
              barberData = { status: 'pending' };
            }
          }
          
          setUser({
            email,
            full_name: email.split('@')[0],
            role,
            id: userId,
            barber: barberData,
          });
          
          setupAutoLogoutTimer();
        } else {
          removeAuthToken();
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        removeAuthToken();
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [setupAutoLogoutTimer, fetchBackendRole]);

  // Check barber status after user is set
  useEffect(() => {
    if (user && user.id && !barberStatusChecked && isInitialized) {
      refreshBarberStatus();
    }
  }, [user?.id, barberStatusChecked, isInitialized, refreshBarberStatus]);

  // Poll barber status every 5 seconds + refresh on window focus
  useEffect(() => {
    if (!user || !user.id || !isInitialized) return;
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') return;

    const poll = () => refreshBarberStatus();
    const interval = setInterval(poll, 5000);

    const handleWindowFocus = () => poll();
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user?.id, user?.email, isInitialized, refreshBarberStatus]);

  const signIn = async (email: string, password: string) => {
    try {
      setBarberStatusChecked(false);
      const result = await apiLogin({ email, password });

      if (!result.success) {
        return { error: new Error(result.error || 'Login failed') };
      }

      const token = result.data?.token;
      if (token) {
        const decoded = decodeJWT(token);
        const userId = decoded?.id;
        
        let role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';

        // Fetch fresh role from backend after login
        if (email !== SUPER_ADMIN_EMAIL) {
          const backendRole = await fetchBackendRole();
          role = backendRole;
        }

        setUser({
          email,
          full_name: decoded?.email?.split('@')[0] || email.split('@')[0],
          role,
          id: userId,
          barber: role === 'barber' ? { status: 'approved' } : role === 'barber_pending' ? { status: 'pending' } : undefined,
        });

        setupAutoLogoutTimer();
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setBarberStatusChecked(false);
      const result = await apiRegister({ name, email, password, phone, role: 'user' });

      if (!result.success) {
        return { error: new Error(result.error || 'Registration failed') };
      }

      const token = result.data?.token;
      if (token) {
        const decoded = decodeJWT(token);

        setUser({
          email,
          full_name: name,
          role: 'user',
          id: decoded?.id,
        });

        setupAutoLogoutTimer();
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    
    removeAuthToken();
    localStorage.removeItem('barber_status');
    setUser(null);
    setBarberStatusChecked(false);
  };

  const updateLocalRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isBarber = user?.role === 'barber' || user?.barber?.status === 'approved';
  const isBarberPending = user?.role === 'barber_pending' || user?.barber?.status === 'pending';

  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
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
