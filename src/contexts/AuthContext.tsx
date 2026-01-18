import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile, UserRole, SUPER_ADMIN_EMAIL } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isBarberPending: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        const role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
        const newProfile: Partial<Profile> = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Fallback to mock profile
          setProfile({
            id: userId,
            email,
            full_name: email.split('@')[0],
            role,
            created_at: new Date().toISOString(),
          });
        } else {
          setProfile(createdProfile);
        }
      } else if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to mock profile
        const role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
        setProfile({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role,
          created_at: new Date().toISOString(),
        });
      } else {
        // Check if super admin
        if (email === SUPER_ADMIN_EMAIL && data.role !== 'super_admin') {
          const { data: updatedProfile } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('id', userId)
            .select()
            .single();
          setProfile(updatedProfile || { ...data, role: 'super_admin' });
        } else {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      const role: UserRole = email === SUPER_ADMIN_EMAIL ? 'super_admin' : 'user';
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role,
        created_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id, session.user.email || '');
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error: error as Error | null };
  };

  const isSuperAdmin = profile?.role === 'super_admin' || profile?.email === SUPER_ADMIN_EMAIL;
  const isAdmin = isSuperAdmin || profile?.role === 'admin';
  const isBarber = profile?.role === 'barber';
  const isBarberPending = profile?.role === 'barber_pending';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        isSuperAdmin,
        isAdmin,
        isBarber,
        isBarberPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
