import React, { useState } from "react";
import { UserProfile, SavedWord } from "../types";
import { Flame, Trophy, Award, BookOpen, Clock, Sparkles, Volume2, Trash2, Crown } from "lucide-react";

interface ProgressAnalyticsProps {
  user: UserProfile;
  onOpenSubscription: () => void;
  onOpenCertificate: () => void;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  user,
  onOpenSubscription,
  onOpenCertificate
}) => {
  const [savedWords, setSavedWords] = useState<SavedWord[]>(user.savedVocabulary || []);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setSavedWords((prev) => prev.filter((w) => w.word !== wordToRemove));
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Overview Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Learner Performance Dashboard</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            CEFR {user.currentLevel}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Flame className="w-4 h-4 text-amber-500 mx-auto animate-pulse" />
            <div className="text-lg font-extrabold text-white mt-1">{user.streakDays} Days</div>
            <span className="text-[10px] text-slate-400">Daily Streak</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Trophy className="w-4 h-4 text-indigo-400 mx-auto" />
            <div className="text-lg font-extrabold text-white mt-1">{user.totalXp} XP</div>
            <span className="text-[10px] text-slate-400">Total XP</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Award className="w-4 h-4 text-cyan-400 mx-auto" />
            <div className="text-lg font-extrabold text-white mt-1">{user.fluencyScore}%</div>
            <span className="text-[10px] text-slate-400">Fluency Score</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-center">
            <Clock className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="text-lg font-extrabold text-white mt-1">{user.dailyMinutesGoal} min</div>
            <span className="text-[10px] text-slate-400">Daily Goal</span>
          </div>
        </div>
      </div>

      {/* Subscription & Certificate Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div
          onClick={onOpenCertificate}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300">View Official Certificate</h4>
              <p className="text-[10px] text-slate-400">CEFR Level {user.currentLevel} Verified</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-400">View ➔</span>
        </div>

        <div
          onClick={onOpenSubscription}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">Manage Plan ({user.plan.toUpperCase()})</h4>
              <p className="text-[10px] text-slate-400">Upgrade or view subscription SaaS perks</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-400">Plans ➔</span>
        </div>
      </div>

      {/* Saved Vocabulary Flashcard Review Bank */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Personal Vocabulary ({savedWords.length})</span>
          </h3>
        </div>

        {savedWords.length > 0 ? (
          <div className="space-y-2">
            {savedWords.map((wordItem, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{wordItem.word}</h4>
                    <span className="text-xs text-indigo-300 font-mono">{wordItem.phonetic}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => speakText(wordItem.word)}
                      className="text-slate-400 hover:text-indigo-300 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveWord(wordItem.word)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{wordItem.definition}</p>
                <p className="text-[11px] text-slate-400 italic">"{wordItem.example}"</p>
                <p className="text-[11px] text-indigo-400">🌐 {wordItem.nativeTranslation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-1 text-xs text-slate-400">
            <p>No saved vocabulary yet.</p>
            <p className="text-[10px]">Save words during your voice chats or lessons to review them here anytime!</p>
          </div>
        )}
      </div>
    </div>
  );
};
