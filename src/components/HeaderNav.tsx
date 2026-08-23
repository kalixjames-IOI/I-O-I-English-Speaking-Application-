import React from "react";
import { BookOpen, Crown, Globe, LogIn, LogOut, MessageCircle, Sparkles, UserRound, Users, WandSparkles } from "lucide-react";
import type { CEFRLevel, UserProfile } from "../types";

interface HeaderNavProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSubscription: () => void;
  onOpenOnboarding: () => void;
  isAuthenticated?: boolean;
  userEmail?: string | null;
  userName?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const tabs = [
  { id: "home", label: "Home", icon: WandSparkles },
  { id: "course", label: "Course", icon: BookOpen },
  { id: "teachers", label: "Teachers", icon: Users },
  { id: "tutor", label: "AI Tutor", icon: MessageCircle },
  { id: "community", label: "Community", icon: Globe },
  { id: "profile", label: "Profile", icon: UserRound },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({ user, activeTab, setActiveTab, onOpenSubscription, onOpenOnboarding, isAuthenticated, userEmail, userName, onSignIn, onSignOut }) => {
  const cefrColors: Record<CEFRLevel, string> = { A1: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", A2: "bg-teal-500/20 text-teal-300 border-teal-500/30", B1: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30", B2: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30", C1: "bg-amber-500/20 text-amber-300 border-amber-500/30", C2: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  return <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-900/95 px-4 py-3 backdrop-blur-md"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><button onClick={onOpenOnboarding} className="relative shrink-0" aria-label="Open learning profile"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20"><div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-900 text-sm font-black text-white">{user.name.charAt(0)}</div></div><span className="absolute -bottom-1 -right-1 rounded-full border border-slate-900 bg-indigo-600 p-0.5"><Globe className="h-2.5 w-2.5 text-white" /></span></button><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold text-slate-100">{user.name}</h2><span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${cefrColors[user.currentLevel]}`}>CEFR {user.currentLevel}</span></div><p className="truncate text-[11px] text-slate-400">{user.nativeLanguage} speaker · <span className="capitalize text-indigo-300">{user.plan} plan</span></p></div></div><div className="flex items-center gap-2">{isAuthenticated ? <button onClick={onSignOut} className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"><LogOut className="h-3.5 w-3.5" /><span className="hidden max-w-24 truncate sm:inline">{userName || userEmail || "Account"}</span></button> : <button onClick={onSignIn} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-2.5 py-1.5 text-xs font-bold text-white hover:brightness-110"><LogIn className="h-3.5 w-3.5" /><span>Sign in</span></button>}{user.plan === "free" ? <button onClick={onOpenSubscription} className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 sm:flex"><Crown className="h-3.5 w-3.5" /><span>Upgrade</span></button> : <span className="hidden rounded-xl border border-amber-500/30 bg-amber-500/20 px-2.5 py-1.5 text-xs font-semibold text-amber-300 sm:inline">{user.plan.toUpperCase()}</span>}<button onClick={onOpenOnboarding} className="rounded-xl border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700" title="Update your learning roadmap"><Sparkles className="h-4 w-4 text-indigo-400" /></button></div></div><nav className="mt-3 grid grid-cols-6 gap-1" aria-label="Main navigation">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold transition sm:flex-row sm:gap-1.5 sm:text-xs ${activeTab === id ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} aria-current={activeTab === id ? "page" : undefined}><Icon className="h-4 w-4" /><span className="truncate">{label}</span></button>)}</nav></header>;
};
