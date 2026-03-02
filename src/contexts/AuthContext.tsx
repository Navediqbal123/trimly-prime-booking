import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  login as apiLogin, 
  register as apiRegister,
  getMe,
  logout as apiLogout,
  getMyBarberProfile,
  getMyRole,
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

  // Fetch role from backend API
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

  // Build UserProfile from backend user data
  const buildUserProfile = useCallback(async (userData: { id: string; email: string; name?: string; role?: string }): Promise<UserProfile> => {
    const email = userData.email;
    let role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
    let barberData: UserProfile['barber'] | undefined;

    if (email !== SUPER_ADMIN_EMAIL) {
      const backendRole = await fetchBackendRole();
      role = backendRole;
      if (backendRole === 'barber') {
        barberData = { status: 'approved' };
      } else if (backendRole === 'barber_pending') {
        barberData = { status: 'pending' };
      }
    }

    return {
      email,
      full_name: userData.name || email.split('@')[0],
      role,
      id: userData.id,
      barber: barberData,
    };
  }, [fetchBackendRole]);

  // Check barber status
  const refreshBarberStatus = useCallback(async () => {
    if (!user || !user.id) return;
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') {
      setBarberStatusChecked(true);
      return;
    }

    try {
      const backendRole = await fetchBackendRole();
      if (backendRole === 'barber') {
        setUser(prev => prev ? { ...prev, barber: { status: 'approved' }, role: 'barber' } : null);
      } else if (backendRole === 'barber_pending') {
        setUser(prev => prev ? { ...prev, barber: { status: 'pending' }, role: 'barber_pending' } : null);
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

  // Initialize: check session via GET /api/auth/me
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await getMe();
        
        if (result.success && result.data?.id && result.data?.email) {
          const profile = await buildUserProfile(result.data);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [buildUserProfile]);

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

      // After login, backend sets HTTP-only cookie. Fetch user via /api/auth/me
      const meResult = await getMe();
      if (meResult.success && meResult.data?.id && meResult.data?.email) {
        const profile = await buildUserProfile(meResult.data);
        setUser(profile);
      } else {
        // Fallback: use login response data if available
        if (result.data?.id && result.data?.email) {
          const profile = await buildUserProfile(result.data);
          setUser(profile);
        }
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

      // Try auto-login after signup
      const loginResult = await apiLogin({ email, password });
      if (loginResult.success) {
        const meResult = await getMe();
        if (meResult.success && meResult.data?.id && meResult.data?.email) {
          const profile = await buildUserProfile(meResult.data);
          setUser(profile);
        } else if (loginResult.data?.id && loginResult.data?.email) {
          const profile = await buildUserProfile(loginResult.data);
          setUser(profile);
        }
        return { error: null };
      } else {
        // Login failed after signup - might need email confirmation
        return { error: null, needsConfirmation: true } as any;
      }
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await apiLogout();
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
