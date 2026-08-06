import React from "react";
import { UserProfile, CEFRLevel } from "../types";
import { Sparkles, Flame, Trophy, Award, Crown, Globe, ChevronRight, LogIn, LogOut } from "lucide-react";

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

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenSubscription,
  onOpenOnboarding,
  isAuthenticated,
  userEmail,
  userName,
  onSignIn,
  onSignOut
}) => {
  const cefrColors: Record<CEFRLevel, string> = {
    A1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    A2: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    B1: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    B2: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    C1: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    C2: "bg-rose-500/20 text-rose-400 border-rose-500/30"
  };

  return (
    <header className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 flex flex-col space-y-3 sticky top-0 z-30 backdrop-blur-md">
      <div className="flex items-center justify-between">
        {/* User Info & CEFR Level Badge */}
        <div className="flex items-center space-x-3">
          <div className="relative cursor-pointer" onClick={onOpenOnboarding}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-white text-sm">
                {user.name.charAt(0)}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-0.5 border border-slate-900">
              <Globe className="w-2.5 h-2.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-100">{user.name}</h2>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${cefrColors[user.currentLevel]}`}>
                CEFR {user.currentLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
              <span>{user.nativeLanguage} speaker</span>
              <span>•</span>
              <span className="text-indigo-300 capitalize">{user.plan} Plan</span>
            </p>
          </div>
        </div>

        {/* Auth Button */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <button
              onClick={onSignOut}
              className="flex items-center space-x-1 bg-slate-800 border border-slate-700 text-slate-300 font-medium px-3 py-1.5 rounded-xl text-xs hover:bg-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{userName || userEmail || 'Account'}</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center space-x-1 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Upgrade & Roadmap Button */}
        <div className="flex items-center space-x-2">
          {user.plan === "free" ? (
            <button
              onClick={onOpenSubscription}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md shadow-amber-500/20 hover:brightness-110 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span>Pro</span>
            </button>
          ) : (
            <span className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>{user.plan.toUpperCase()}</span>
            </span>
          )}

          <button
            onClick={onOpenOnboarding}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Update AI Personal Roadmap"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Navigation Quick Tabs Pill Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "teachers"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          AI Teachers
        </button>

        <button
          onClick={() => setActiveTab("curriculum")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "curriculum"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          CEFR Path (A1-C2)
        </button>

        <button
          onClick={() => setActiveTab("video")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1 ${
            activeTab === "video"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="text-amber-300">🎥</span>
          <span>AI Video Lessons</span>
        </button>


        <button
          onClick={() => setActiveTab("voice")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "voice"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          Voice Studio
        </button>

        <button
          onClick={() => setActiveTab("pronounce")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "pronounce"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          Pronunciation Lab
        </button>

        <button
          onClick={() => setActiveTab("essay")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "essay"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          Essay AI Evaluator
        </button>

        <button
          onClick={() => setActiveTab("studio")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "studio"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          Scenario Generator
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
          }`}
        >
          Profile & Stats
        </button>
      </div>
    </header>
  );
};
