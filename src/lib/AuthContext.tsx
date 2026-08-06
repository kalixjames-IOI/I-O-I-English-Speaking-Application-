import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, auth as authHelpers } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  }, [user]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setProfile(null); // Reset profile on auth change
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
  }, [user, refreshProfile]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await authHelpers.signUp(email, password, fullName);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await authHelpers.signIn(email, password);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await authHelpers.signInWithGoogle();
    return { error };
  };

  const signOut = async () => {
    await authHelpers.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
      profile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
