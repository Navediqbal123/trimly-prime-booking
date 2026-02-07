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

// Polling interval for barber status (3 seconds for real-time feel)
const BARBER_STATUS_POLL_INTERVAL = 3000;

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
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      } else {
        // No barber profile found - ensure user role is 'user'
        setUser(prev => {
          if (prev && prev.role !== 'admin' && prev.role !== 'super_admin') {
            return { ...prev, role: 'user' };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to check barber status:', error);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user?.id, user?.email]); // Only depend on user id and email, not the entire user object

  // Start polling for barber status updates
  const startBarberStatusPolling = useCallback(() => {
    // Clear any existing polling
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    // Only poll for non-admin users who might become barbers
    pollingTimerRef.current = setInterval(() => {
      refreshBarberStatus();
    }, BARBER_STATUS_POLL_INTERVAL);
  }, [refreshBarberStatus]);

  // Stop polling
  const stopBarberStatusPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Initialize user from stored token on mount
  useEffect(() => {
    const initAuth = () => {
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
      stopBarberStatusPolling();
    };
  }, [setupAutoLogoutTimer, stopBarberStatusPolling]);

  // Check barber status after user is set and start polling
  useEffect(() => {
    if (user && !barberStatusChecked && isInitialized) {
      refreshBarberStatus();
    }
  }, [user?.id, barberStatusChecked, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start/stop polling based on user state
  useEffect(() => {
    if (user && isInitialized) {
      // Only poll for users who might get barber status updates
      const shouldPoll = user.role === 'user' || user.role === 'barber_pending';
      if (shouldPoll) {
        startBarberStatusPolling();
      } else {
        stopBarberStatusPolling();
      }
    } else {
      stopBarberStatusPolling();
    }

    return () => stopBarberStatusPolling();
  }, [user?.role, isInitialized, startBarberStatusPolling, stopBarberStatusPolling]);

  // Window focus event - refresh barber status when user returns to tab
  useEffect(() => {
    const handleWindowFocus = () => {
      if (user && isInitialized) {
        refreshBarberStatus();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [user?.id, isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

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
