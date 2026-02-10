import React, { createContext, useContext } from 'react';
import { UserProfile } from './AuthContext';

interface ProtectedUserContextType {
  user: UserProfile;
  signOut: () => Promise<void>;
  refreshBarberStatus: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBarber: boolean;
  isBarberPending: boolean;
  barberStatusChecked: boolean;
}

const ProtectedUserContext = createContext<ProtectedUserContextType | null>(null);

export const useProtectedUser = () => {
  const context = useContext(ProtectedUserContext);
  if (!context) {
    throw new Error('useProtectedUser must be used within a ProtectedRoute');
  }
  return context;
};

export const ProtectedUserProvider = ProtectedUserContext.Provider;
