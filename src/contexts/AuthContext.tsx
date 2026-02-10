import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  login as apiLogin, 
  getAuthToken, 
  removeAuthToken, 
  getApprovedBarbers,
  getPendingBarbers,
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
    }, logoutTime);
  }, []);

  // Check barber status from backend API - uses /api/barber/approved and /api/barber/pending
  // Persists verified status to localStorage so it survives page refreshes
  const refreshBarberStatus = useCallback(async () => {
    if (!user || !user.id) return;
    
    // Skip for admins
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') {
      setBarberStatusChecked(true);
      return;
    }

    try {
      // First check approved barbers
      const approvedResponse = await getApprovedBarbers();
      
      if (approvedResponse.success && approvedResponse.data) {
        const myApprovedBarber = approvedResponse.data.find(
          (b) => b.user_id === user.id
        );
        
        if (myApprovedBarber) {
          localStorage.setItem('barber_status', JSON.stringify({ status: 'approved', id: myApprovedBarber.id }));
          setUser(prev => prev ? { 
            ...prev, 
            barber: { status: 'approved', id: myApprovedBarber.id },
            role: 'barber'
          } : null);
          setBarberStatusChecked(true);
          return;
        }
      }

      // Check pending barbers if not approved
      const pendingResponse = await getPendingBarbers();
      
      if (pendingResponse.success && pendingResponse.data) {
        const myPendingBarber = pendingResponse.data.find(
          (b) => b.user_id === user.id
        );
        
        if (myPendingBarber) {
          localStorage.setItem('barber_status', JSON.stringify({ status: 'pending', id: myPendingBarber.id }));
          setUser(prev => prev ? { 
            ...prev, 
            barber: { status: 'pending', id: myPendingBarber.id },
            role: 'barber_pending'
          } : null);
          setBarberStatusChecked(true);
          return;
        }
      }

      // Not a barber at all - clear cached data
      localStorage.removeItem('barber_status');
      setUser(prev => {
        if (prev && prev.role !== 'admin' && prev.role !== 'super_admin') {
          return { ...prev, role: 'user', barber: undefined };
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to check barber status:', error);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user?.id, user?.email]);

  // Initialize user from stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAuthToken();
        
        // No token - not logged in
        if (!token) {
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        // Check if token is expired
        if (isTokenExpired()) {
          removeAuthToken();
          setUser(null);
          setLoading(false);
          setIsInitialized(true);
          return;
        }
        
        // Decode token and set user, restoring cached barber status
        const decoded = decodeJWT(token);
        if (decoded?.email) {
          const email = decoded.email;
          let role: UserRole = email === SUPER_ADMIN_EMAIL 
            ? 'super_admin' 
            : (decoded.role as UserRole) || 'user';
          
          // Restore cached barber status so role doesn't revert on refresh
          let barberData: UserProfile['barber'] | undefined;
          try {
            const cached = localStorage.getItem('barber_status');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.status === 'approved') {
                role = 'barber';
                barberData = { status: 'approved', id: parsed.id };
              } else if (parsed.status === 'pending') {
                role = 'barber_pending';
                barberData = { status: 'pending', id: parsed.id };
              }
            }
          } catch {}
          
          const initialUser: UserProfile = {
            email,
            full_name: email.split('@')[0],
            role,
            id: decoded.id,
            barber: barberData,
          };
          
          setUser(initialUser);
          
          // Setup auto-logout timer
          setupAutoLogoutTimer();
        } else {
          // Invalid token format
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

    // Cleanup timers on unmount
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [setupAutoLogoutTimer]);

  // Check barber status after user is set
  useEffect(() => {
    if (user && user.id && !barberStatusChecked && isInitialized) {
      refreshBarberStatus();
    }
  }, [user?.id, barberStatusChecked, isInitialized, refreshBarberStatus]);

  // Poll barber status every 10 seconds + refresh on window focus
  useEffect(() => {
    if (!user || !user.id || !isInitialized) return;

    // Skip polling for admins
    if (user.email === SUPER_ADMIN_EMAIL || user.role === 'admin' || user.role === 'super_admin') return;

    const poll = () => refreshBarberStatus();

    // Poll every 10 seconds for near-realtime approval detection
    const interval = setInterval(poll, 10000);

    // Also refresh on window focus
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
    localStorage.removeItem('barber_status');
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
  const isBarber = user?.role === 'barber' || user?.barber?.status === 'approved';
  const isBarberPending = user?.role === 'barber_pending' || user?.barber?.status === 'pending';

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return null;
  }

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
