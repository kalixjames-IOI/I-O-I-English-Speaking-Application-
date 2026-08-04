import React, { useState } from "react";
import { CEFRLevel, LessonUnit, UserProfile } from "../types";
import { SAMPLE_CURRICULUM_UNITS } from "../data/initialData";
import { CurriculumEngineHub } from "./CurriculumEngineHub";
import { BookOpen, CheckCircle, Clock, Play, Sparkles, Trophy, Layers } from "lucide-react";

interface CurriculumViewProps {
  user?: UserProfile;
  onUpdateUser?: (updated: UserProfile) => void;
  onStartRoleplay?: (scenarioTitle: string, initialMessage: string) => void;
  userLevel: CEFRLevel;
  completedLessonIds: string[];
  onSelectLesson: (unit: LessonUnit) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  user,
  onUpdateUser,
  onStartRoleplay,
  userLevel,
  completedLessonIds,
  onSelectLesson
}) => {
  const [viewMode, setViewMode] = useState<"engine" | "standard">("engine");
  const [selectedCEFR, setSelectedCEFR] = useState<CEFRLevel>(userLevel || "B1");

  if (user && onUpdateUser && viewMode === "engine") {
    return (
      <div className="w-full space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Master Curriculum Engine & Knowledge Hub
          </span>
          <button
            onClick={() => setViewMode("standard")}
            className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
          >
            Switch to Simple Pathway View
          </button>
        </div>

        <CurriculumEngineHub
          user={user}
          onUpdateUser={onUpdateUser}
          onStartRoleplay={onStartRoleplay}
        />
      </div>
    );
  }

  const cefrLevels: { level: CEFRLevel; name: string; title: string; color: string }[] = [
    { level: "A1", name: "Beginner", title: "Foundations & Everyday Expressions", color: "from-emerald-600 to-teal-600" },
    { level: "A2", name: "Elementary", title: "Routine Tasks & Social Exchanges", color: "from-teal-600 to-cyan-600" },
    { level: "B1", name: "Intermediate", title: "Travel, Work & Personal Opinions", color: "from-indigo-600 to-blue-600" },
    { level: "B2", name: "Upper Int.", title: "Complex Technical & Spontaneous Speech", color: "from-cyan-600 to-indigo-600" },
    { level: "C1", name: "Advanced", title: "Executive Rhetoric & Implicit Meaning", color: "from-amber-600 to-orange-600" },
    { level: "C2", name: "Mastery", title: "Native Command & Precision Fluency", color: "from-rose-600 to-purple-600" }
  ];

  const currentLevelInfo = cefrLevels.find((l) => l.level === selectedCEFR) || cefrLevels[2];
  const activeUnits = SAMPLE_CURRICULUM_UNITS.filter((u) => u.level === selectedCEFR);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <span className="text-xs font-bold text-slate-300">Simple Pathway View</span>
        {user && onUpdateUser && (
          <button
            onClick={() => setViewMode("engine")}
            className="text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            🚀 Open Master Curriculum Engine (900 Lessons & 10,000+ Vocab)
          </button>
        )}
      </div>

      {/* CEFR Level Selector Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Global CEFR Learning Pathway</h2>
          </div>
          <span className="text-xs text-slate-400">CEFR Standard (A1-C2)</span>
        </div>

        {/* Level Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-2">
          {cefrLevels.map((lvl) => {
            const isActive = selectedCEFR === lvl.level;
            const isUserCurrent = userLevel === lvl.level;

            return (
              <button
                key={lvl.level}
                onClick={() => setSelectedCEFR(lvl.level)}
                className={`relative px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex flex-col items-center ${
                  isActive
                    ? "bg-slate-900 border-indigo-500 text-white shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/40"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Level {lvl.level}</span>
                  {isUserCurrent && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[9px] font-normal opacity-80">{lvl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Level Banner Card */}
      <div className={`w-full bg-gradient-to-r ${currentLevelInfo.color} p-5 rounded-3xl text-white shadow-xl shadow-indigo-950/40 relative overflow-hidden space-y-2`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
            CEFR LEVEL {currentLevelInfo.level} • {currentLevelInfo.name.toUpperCase()}
          </span>
          <span className="text-xs bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-md">
            Interactive Units
          </span>
        </div>

        <h3 className="text-lg font-bold">{currentLevelInfo.title}</h3>
        <p className="text-xs text-white/90 leading-relaxed max-w-lg">
          Complete interactive speaking, grammar, and vocabulary modules designed specifically for {currentLevelInfo.name} learners.
        </p>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Curriculum Units ({activeUnits.length > 0 ? activeUnits.length : "AI Generated On-Demand"})
        </h3>

        {activeUnits.length > 0 ? (
          activeUnits.map((unit) => {
            const isCompleted = completedLessonIds.includes(unit.id);

            return (
              <div
                key={unit.id}
                onClick={() => onSelectLesson(unit)}
                className={`group bg-slate-900 border p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-between space-x-4 hover:border-indigo-500 hover:shadow-lg ${
                  isCompleted ? "border-emerald-500/40 bg-emerald-950/10" : "border-slate-800"
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : `U${unit.unitNumber}`}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-indigo-300 font-semibold border border-slate-700">
                        {unit.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{unit.estimatedMinutes} mins</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                      {unit.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{unit.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>+{unit.xpReward} XP</span>
                  </span>

                  <button className="p-2.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer">
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-200">Custom Level {selectedCEFR} Curriculum Ready</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use the Scenario Studio to generate custom AI lessons tailored specifically for Level {selectedCEFR}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

