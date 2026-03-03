import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, SUPER_ADMIN_EMAIL } from '@/lib/supabase';
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

  // Initialize auth state
  useEffect(() => {
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

  const refreshBarberStatus = useCallback(async () => {
    setBarberStatusChecked(true);
  }, []);

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
