import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, SUPER_ADMIN_EMAIL } from '@/lib/supabase';
import { getApprovedBarbers, getPendingBarbers } from '@/lib/api';
import type { User, Session } from '@supabase/supabase-js';

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

function buildProfile(supaUser: User): UserProfile {
  const email = supaUser.email || '';
  const role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
  return {
    email,
    full_name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email.split('@')[0],
    role,
    id: supaUser.id,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [barberStatusChecked, setBarberStatusChecked] = useState(false);

  // Initialize auth state — force sign-out once to clear stale tokens
  useEffect(() => {
    const FORCE_RELOGIN_KEY = 'trimly_force_relogin_v2';
    const didForce = sessionStorage.getItem(FORCE_RELOGIN_KEY);

    if (!didForce) {
      sessionStorage.setItem(FORCE_RELOGIN_KEY, '1');
      supabase.auth.signOut().then(() => {
        setUser(null);
        setLoading(false);
      });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildProfile(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(buildProfile(session.user));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-check barber status when user is set and not super_admin
  useEffect(() => {
    if (user?.id && user.role !== 'super_admin') {
      refreshBarberStatus();
    }
  }, [user?.id]);

  const refreshBarberStatus = useCallback(async () => {
    if (!user?.id) {
      setBarberStatusChecked(true);
      return;
    }
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        getApprovedBarbers(),
        getPendingBarbers(),
      ]);

      const userId = user.id;
      const isApproved = approvedRes.success && approvedRes.data?.some(b => b.user_id === userId);
      const isPending = pendingRes.success && pendingRes.data?.some(b => b.user_id === userId);

      if (isApproved) {
        setUser(prev => prev ? { ...prev, role: 'barber' } : prev);
      } else if (isPending) {
        setUser(prev => prev ? { ...prev, role: 'barber_pending' } : prev);
      }
    } catch (err) {
      console.error('Failed to refresh barber status:', err);
    } finally {
      setBarberStatusChecked(true);
    }
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  };

  const signUp = async (name: string, email: string, password: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone || '' },
      },
    });
    if (error) return { error: new Error(error.message) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBarberStatusChecked(false);
  };

  const updateLocalRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isBarber = user?.role === 'barber' || user?.barber?.status === 'approved';
  const isBarberPending = user?.role === 'barber_pending' || user?.barber?.status === 'pending';

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
