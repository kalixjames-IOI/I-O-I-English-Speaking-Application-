import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { auth as authHelpers, db, isSupabaseConfigured } from "./supabase";

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
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setProfile(null);
      return;
    }
    const { data } = await db.ensureProfile(user.id, user.email, user.user_metadata?.full_name);
    if (data) setProfile(data);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    authHelpers.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = authHelpers.onAuthStateChange((currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) void refreshProfile();
    else setProfile(null);
  }, [user, refreshProfile]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await authHelpers.signUp(email, password, fullName);
    if (!error && data.user && data.session && isSupabaseConfigured) {
      await db.ensureProfile(data.user.id, data.user.email, fullName);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authHelpers.signIn(email, password);
    if (!error && data.user && isSupabaseConfigured) {
      await db.ensureProfile(data.user.id, data.user.email, data.user.user_metadata?.full_name);
    }
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
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile, profile }}>
      {children}
    </AuthContext.Provider>
  );
};
