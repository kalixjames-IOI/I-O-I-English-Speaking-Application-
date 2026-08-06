import React, { useState } from "react";
import { Smartphone, Monitor, Wifi, Battery, Signal, Sparkles, Trophy, Flame, Layers } from "lucide-react";

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

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  activeTab,
  setActiveTab,
  userStreak,
  userXp,
  userPlan,
  onOpenSubscription
}) => {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "fullscreen">("mobile");
  const [osType, setOsType] = useState<"ios" | "android">("ios");
  const currentTime = "09:41";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start font-sans antialiased selection:bg-indigo-500 selection:text-white pb-6">
      {/* Top Bar for Desktop Frame Controller */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-slate-100 tracking-tight text-sm">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs shadow-md shadow-indigo-500/30">
              IOI
            </span>
            <span>I O I Education Network</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              AI Native Platform
            </span>
          </div>
        </div>

        {/* Stats & Upgrade Pill */}
        <div className="hidden sm:flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{userStreak} Days Streak</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-300 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-indigo-400" />
            <span>{userXp} XP</span>
          </div>
          <button
            onClick={onOpenSubscription}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span className="capitalize">{userPlan === "free" ? "Upgrade to Premium" : `${userPlan} Active`}</span>
          </button>
        </div>

        {/* Device Switcher Controls */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 flex items-center">
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile App View</span>
            </button>
            <button
              onClick={() => setDeviceMode("fullscreen")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                deviceMode === "fullscreen"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Full Layout</span>
            </button>
          </div>

          {deviceMode === "mobile" && (
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 hidden lg:flex items-center">
              <button
                onClick={() => setOsType("ios")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  osType === "ios" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                iOS
              </button>
              <button
                onClick={() => setOsType("android")}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  osType === "android" ? "bg-slate-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Android
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {deviceMode === "mobile" ? (
          /* Mobile Device Frame Mockup */
          <div className="relative w-full max-w-[420px] h-[850px] bg-slate-900 rounded-[48px] border-[10px] border-slate-800 shadow-2xl shadow-indigo-950/50 flex flex-col overflow-hidden transition-all duration-300 ring-1 ring-slate-700/50">
            {/* iOS Dynamic Island or Android Camera Hole */}
            {osType === "ios" ? (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-900/60 ring-1 ring-indigo-500/40"></div>
              </div>
            ) : (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-40 ring-1 ring-slate-800"></div>
            )}

            {/* Mobile OS Top Status Bar */}
            <div className="w-full px-6 pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-300 font-semibold z-30 select-none bg-slate-900/90 backdrop-blur-md">
              <span>{currentTime}</span>
              <div className="flex items-center space-x-1.5">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 fill-slate-300" />
              </div>
            </div>

            {/* Scrollable Mobile App Screen Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 flex flex-col relative pb-20">
              {children}
            </div>

            {/* Mobile Bottom Navigation Tab Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 flex items-center justify-around z-40">
              <button
                onClick={() => setActiveTab("teachers")}
                className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === "teachers" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === "teachers" ? "bg-indigo-500/10" : ""}`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">AI Teachers</span>
              </button>

              <button
                onClick={() => setActiveTab("curriculum")}
                className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === "curriculum" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === "curriculum" ? "bg-indigo-500/10" : ""}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">Curriculum</span>
              </button>

              <button
                onClick={() => setActiveTab("voice")}
                className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === "voice" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/40 -mt-5 ring-4 ring-slate-900">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">Live Voice</span>
              </button>

              <button
                onClick={() => setActiveTab("pronounce")}
                className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === "pronounce" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === "pronounce" ? "bg-indigo-500/10" : ""}`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">Speech Lab</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
                  activeTab === "analytics" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`p-1 rounded-lg ${activeTab === "analytics" ? "bg-indigo-500/10" : ""}`}>
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">Profile</span>
              </button>
            </div>

            {/* iOS Bottom Home Bar */}
            {osType === "ios" && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600 rounded-full z-50 pointer-events-none"></div>
            )}
          </div>
        ) : (
          /* Full Desktop Layout View */
          <div className="w-full min-h-[800px] bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-4 md:p-6 flex flex-col space-y-6">
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
};
