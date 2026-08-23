import React, { useState } from "react";
import { Battery, BookOpen, Globe, Layers, MessageCircle, Monitor, Signal, Smartphone, Sparkles, Users, UserRound, Wifi } from "lucide-react";

interface MobileContainerProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userStreak: number;
  userXp: number;
  userPlan: string;
  onOpenSubscription: () => void;
  isAuthenticated?: boolean;
  userEmail?: string | null;
  userName?: string;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const navigation = [
  { id: "home", label: "Home", icon: Sparkles },
  { id: "course", label: "Course", icon: BookOpen },
  { id: "teachers", label: "Teachers", icon: Users },
  { id: "tutor", label: "AI Tutor", icon: MessageCircle },
  { id: "community", label: "Community", icon: Globe },
  { id: "profile", label: "Profile", icon: UserRound },
];

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, activeTab, setActiveTab, userStreak, userXp, userPlan, onOpenSubscription }) => {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "fullscreen">("mobile");
  const [osType, setOsType] = useState<"ios" | "android">("ios");
  return <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white"><div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-4 py-2.5 text-xs text-slate-300 backdrop-blur-md"><div className="flex min-w-0 items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 text-xs font-black text-white">IOI</span><span className="hidden truncate font-bold tracking-tight text-slate-100 sm:inline">I O I Education Network</span><span className="hidden rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 md:inline">AI native platform</span></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 sm:flex"><span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-300">{userStreak} day streak</span><span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 font-semibold text-indigo-300">{userXp} XP</span><button onClick={onOpenSubscription} className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 font-bold text-slate-950 hover:brightness-110">{userPlan === "free" ? "Upgrade" : `${userPlan} active`}</button></div><div className="flex rounded-lg border border-slate-700 bg-slate-800 p-0.5"><button onClick={() => setDeviceMode("mobile")} className={`rounded-md p-1.5 ${deviceMode === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Mobile view"><Smartphone className="h-3.5 w-3.5" /></button><button onClick={() => setDeviceMode("fullscreen")} className={`rounded-md p-1.5 ${deviceMode === "fullscreen" ? "bg-indigo-600 text-white" : "text-slate-400"}`} title="Full layout"><Monitor className="h-3.5 w-3.5" /></button></div>{deviceMode === "mobile" && <div className="hidden rounded-lg border border-slate-700 bg-slate-800 p-0.5 lg:flex"><button onClick={() => setOsType("ios")} className={`rounded-md px-2 py-1 text-[11px] ${osType === "ios" ? "bg-slate-700 text-white" : "text-slate-400"}`}>iOS</button><button onClick={() => setOsType("android")} className={`rounded-md px-2 py-1 text-[11px] ${osType === "android" ? "bg-slate-700 text-white" : "text-slate-400"}`}>Android</button></div>}</div></div><div className="mx-auto flex w-full max-w-7xl items-center justify-center p-2 sm:p-4 md:p-6">{deviceMode === "mobile" ? <div className="relative flex h-[850px] w-full max-w-[420px] flex-col overflow-hidden rounded-[48px] border-[10px] border-slate-800 bg-slate-900 shadow-2xl shadow-indigo-950/50 ring-1 ring-slate-700/50"><div className="absolute left-1/2 top-2 z-40 h-6 w-28 -translate-x-1/2 rounded-full bg-black" /><div className="flex items-center justify-between bg-slate-900/90 px-6 pb-1 pt-3 text-[11px] font-semibold text-slate-300"><span>09:41</span><div className="flex items-center gap-1.5"><Signal className="h-3 w-3" /><Wifi className="h-3 w-3" /><Battery className="h-3.5 w-3.5 fill-slate-300" /></div></div><div className="relative flex-1 overflow-y-auto bg-slate-950 pb-20 custom-scrollbar">{children}</div><nav className="absolute bottom-0 left-0 right-0 z-40 grid h-[72px] grid-cols-6 border-t border-slate-800/80 bg-slate-900/95 px-1 backdrop-blur-xl" aria-label="Mobile navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-bold transition ${activeTab === id ? "text-indigo-300" : "text-slate-500 hover:text-slate-200"}`} aria-current={activeTab === id ? "page" : undefined}><span className={`rounded-lg p-1 ${activeTab === id ? "bg-indigo-500/15" : ""}`}><Icon className="h-4 w-4" /></span><span className="max-w-full truncate">{label}</span></button>)}</nav>{osType === "ios" && <div className="absolute bottom-1 left-1/2 z-50 h-1 w-32 -translate-x-1/2 rounded-full bg-slate-600" />}</div> : <div className="min-h-[800px] w-full rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl"><div className="max-h-[calc(100vh-130px)] overflow-y-auto">{children}</div></div>}</div></div>;
};
