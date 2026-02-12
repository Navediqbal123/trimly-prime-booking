import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister,
  getAuthToken, 
  removeAuthToken, 
  getMyBarberProfile,
  isTokenExpired,
  getTokenExpiry,
  decodeJWT
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
  signUp: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
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

  // Fetch role directly from Supabase profiles table (source of truth)
  const fetchProfileRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data?.role) {
        return data.role as UserRole;
      }
    } catch (err) {
      console.error('Failed to fetch profile role from Supabase:', err);
    }
    return null;
  }, []);

  // Check barber status using Supabase profiles table as source of truth
  const refreshBarberStatus = useCallback(async () => {
    if (!user || !user.id) return;
    
    // Skip for admins
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') {
      setBarberStatusChecked(true);
      return;
    }

    try {
      // Fetch authoritative role from Supabase profiles table
      const dbRole = await fetchProfileRole(user.id);
      
      if (dbRole === 'barber') {
        setUser(prev => prev ? { 
          ...prev, 
          barber: { status: 'approved' },
          role: 'barber'
        } : null);
        setBarberStatusChecked(true);
        return;
      }
      
      if (dbRole === 'barber_pending') {
        setUser(prev => prev ? { 
          ...prev, 
          barber: { status: 'pending' },
          role: 'barber_pending'
        } : null);
        setBarberStatusChecked(true);
        return;
      }

      if (dbRole === 'user') {
        setUser(prev => prev ? { 
          ...prev, 
          barber: undefined,
          role: 'user'
        } : null);
        setBarberStatusChecked(true);
        return;
      }

      // Fallback: check /api/barber/me
      const response = await getMyBarberProfile();
      
      if (response.success && response.data) {
        const profile = response.data;
        
        if (profile.status === 'approved') {
          setUser(prev => prev ? { 
            ...prev, 
            barber: { status: 'approved', id: profile.id },
            role: 'barber'
          } : null);
        } else if (profile.status === 'pending') {
          setUser(prev => prev ? { 
            ...prev, 
            barber: { status: 'pending', id: profile.id },
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
      } else {
        if (!response.error?.includes('Network error')) {
          setUser(prev => {
            if (prev && prev.role !== 'admin' && prev.role !== 'super_admin') {
              return { ...prev, role: 'user', barber: undefined };
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Failed to check barber status:', error);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user?.id, user?.email, fetchProfileRole]);

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
        
        // Decode token to get basic user info
        const decoded = decodeJWT(token);
        if (decoded?.email) {
          const email = decoded.email;
          const userId = decoded.id;
          
          // Determine role: fetch from DB (source of truth), not localStorage
          let role: UserRole = email === SUPER_ADMIN_EMAIL 
            ? 'super_admin' 
            : 'user'; // default, will be overridden by DB
          
          let barberData: UserProfile['barber'] | undefined;

          if (userId && email !== SUPER_ADMIN_EMAIL) {
            const dbRole = await fetchProfileRole(userId);
            if (dbRole) {
              role = dbRole;
              if (dbRole === 'barber') {
                barberData = { status: 'approved' };
              } else if (dbRole === 'barber_pending') {
                barberData = { status: 'pending' };
              }
            }
          }
          
          const initialUser: UserProfile = {
            email,
            full_name: email.split('@')[0],
            role,
            id: userId,
            barber: barberData,
          };
          
          setUser(initialUser);
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
  }, [setupAutoLogoutTimer, fetchProfileRole]);

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
        
        // Fetch role from DB immediately after login
        let role: UserRole = email === SUPER_ADMIN_EMAIL 
          ? 'super_admin' 
          : 'user';

        if (userId && email !== SUPER_ADMIN_EMAIL) {
          const dbRole = await fetchProfileRole(userId);
          if (dbRole) role = dbRole;
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

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setBarberStatusChecked(false);
      const result = await apiRegister({ name, email, password });

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
