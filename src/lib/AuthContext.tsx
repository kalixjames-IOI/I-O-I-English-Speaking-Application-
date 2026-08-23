import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { auth as authHelpers, isSupabaseConfigured, supabase } from "./supabase";
import type { Database } from "./database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AuthError = { message: string; status?: number } | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError }>;
  signInWithGoogle: () => Promise<{ error: AuthError }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  profile: Profile | null;
}

const AuthContext = createContext<AuthContextType | null>(null);
const configurationError = { message: "Supabase is not configured for this environment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable accounts." };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) {
      console.warn("[Auth] Profile lookup failed:", error.message);
      return;
    }
    if (data) {
      setProfile(data);
      return;
    }
    const { data: created, error: createError } = await supabase.from("profiles").insert({ id: user.id, email: user.email ?? null, full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Learner" }).select("*").single();
    if (createError) {
      console.warn("[Auth] Profile creation failed:", createError.message);
      return;
    }
    setProfile(created);
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data: { session: nextSession }, error }) => {
      if (!active) return;
      if (error) console.warn("[Auth] Session lookup failed:", error.message);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setProfile(null);
      setLoading(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => { void refreshProfile(); }, [refreshProfile]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) return { error: configurationError };
    const { error } = await authHelpers.signUp(email.trim(), password, fullName?.trim());
    return { error: error ? { message: error.message, status: error.status } : null };
  };
  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: configurationError };
    const { error } = await authHelpers.signIn(email.trim(), password);
    return { error: error ? { message: error.message, status: error.status } : null };
  };
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) return { error: configurationError };
    const { error } = await authHelpers.signInWithGoogle();
    return { error: error ? { message: error.message, status: error.status } : null };
  };
  const signOut = async () => {
    if (isSupabaseConfigured) await authHelpers.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signInWithGoogle, signOut, refreshProfile, profile }}>{children}</AuthContext.Provider>;
};
