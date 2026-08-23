import React, { useState } from "react";
import { apiFetch } from "../lib/api";
import { UserProfile, CEFRLevel, PersonalizedRoadmap } from "../types";
import { NATIVE_LANGUAGES, LEARNING_GOALS, PLACEMENT_QUESTIONS } from "../data/initialData";
import { Sparkles, Globe, Target, Clock, BookOpen, CheckCircle, ArrowRight, BrainCircuit, RefreshCw, Award } from "lucide-react";

interface OnboardingFlowProps {
  user: UserProfile;
  onComplete: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete, onClose }) => {
  const [step, setStep] = useState<"profile" | "placement" | "generating" | "roadmap">("profile");
  const [nativeLang, setNativeLang] = useState(user.nativeLanguage || "Spanish");
  const [selectedGoal, setSelectedGoal] = useState(user.targetGoal || "Daily Conversation & Socializing");
  const [dailyMins, setDailyMins] = useState(user.dailyMinutesGoal || 15);
  const [learningStyle, setLearningStyle] = useState(user.learningStyle || "Interactive Voice");
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(user.currentLevel || "B1");

  // Placement Test State
  const [quizIndex, setQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  // Generated Roadmap
  const [generatedRoadmap, setGeneratedRoadmap] = useState<PersonalizedRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnswerSelect = (optionIdx: number) => {
    const updatedAnswers = [...userAnswers, optionIdx];
    setUserAnswers(updatedAnswers);

    if (optionIdx === PLACEMENT_QUESTIONS[quizIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }

    if (quizIndex + 1 < PLACEMENT_QUESTIONS.length) {
      setQuizIndex((prev) => prev + 1);
    } else {
      // Calculate final placed level
      const finalScore = score + (optionIdx === PLACEMENT_QUESTIONS[quizIndex].correctIndex ? 1 : 0);
      let placedLevel: CEFRLevel = "A1";
      if (finalScore >= 5) placedLevel = "C1";
      else if (finalScore >= 4) placedLevel = "B2";
      else if (finalScore >= 3) placedLevel = "B1";
      else if (finalScore >= 2) placedLevel = "A2";
      
      setCurrentLevel(placedLevel);
      generateAIRoadmap(placedLevel);
    }
  };

  const generateAIRoadmap = async (level: CEFRLevel) => {
    setStep("generating");
    setIsLoading(true);

    try {
      const response = await apiFetch("/api/gemini/onboarding-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeLanguage: nativeLang,
          level,
          goal: selectedGoal,
          dailyMinutes: dailyMins,
          learningStyle
        })
      });

      const data = await response.json();
      setGeneratedRoadmap(data);
      setStep("roadmap");
    } catch (err) {
      console.error("Roadmap error:", err);
      // Fallback roadmap
      setGeneratedRoadmap({
        curriculumName: `${selectedGoal} Masterclass for ${nativeLang} Speakers`,
        assignedCEFR: level,
        weeklyFocus: ["Natural Connected Speech", "Business & Social Idioms", "Confidence Building"],
        recommendedTeacher: "Emma (US Accent)",
        dailyPlan: [
          { day: "Day 1", topic: "Self-Introductions & Native Connectors", minutes: dailyMins },
          { day: "Day 2", topic: "Practical Everyday Conversation", minutes: dailyMins },
          { day: "Day 3", topic: "Live AI Avatar Roleplay Practice", minutes: dailyMins },
          { day: "Day 4", topic: "Pronunciation & Rhythm Polish", minutes: dailyMins },
          { day: "Day 5", topic: "Weekly CEFR Fluency Assessment", minutes: dailyMins }
        ],
        aiTip: "Practice speaking out loud at least 10 minutes every day to retrain mouth muscles!"
      });
      setStep("roadmap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    onComplete({
      nativeLanguage: nativeLang,
      currentLevel,
      targetGoal: selectedGoal,
      dailyMinutesGoal: dailyMins,
      learningStyle,
      roadmap: generatedRoadmap || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl shadow-indigo-950/50 flex flex-col space-y-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Step 1: User Learning Profile Setup */}
        {step === "profile" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">AI Personalization Engine</h2>
                  <p className="text-xs text-slate-400">Configure your 24/7 personal English learning setup</p>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
            </div>

            {/* Native Language Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Your Native Language</span>
              </label>
              <select
                value={nativeLang}
                onChange={(e) => setNativeLang(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {NATIVE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Learning Goal Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Primary Learning Goal</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LEARNING_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.title)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedGoal === goal.title
                        ? "bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500"
                        : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-100">{goal.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{goal.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Minutes & Style */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Daily Target</span>
                </label>
                <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                  {[10, 15, 25].map((m) => (
                    <button
                      key={m}
                      onClick={() => setDailyMins(m)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dailyMins === m ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {m} m
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Learning Style</span>
                </label>
                <select
                  value={learningStyle}
                  onChange={(e) => setLearningStyle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Interactive Voice">Interactive Voice Chat</option>
                  <option value="Visual & Flashcards">Visual & Flashcards</option>
                  <option value="Grammar & Drills">Grammar & Roleplays</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={() => setStep("placement")}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>Take Diagnostic Placement Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: AI Placement Diagnostic Quiz */}
        {step === "placement" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-bold text-white">CEFR Diagnostic Assessment</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 rounded-full text-indigo-300">
                Question {quizIndex + 1} of {PLACEMENT_QUESTIONS.length}
              </span>
            </div>

            {/* Current Question */}
            <div className="space-y-4">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  {PLACEMENT_QUESTIONS[quizIndex].category} • Level {PLACEMENT_QUESTIONS[quizIndex].level}
                </span>
                <h3 className="text-sm font-semibold text-slate-100 leading-relaxed">
                  {PLACEMENT_QUESTIONS[quizIndex].question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {PLACEMENT_QUESTIONS[quizIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/80 text-xs text-slate-200 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{opt}</span>
                    <span className="w-5 h-5 rounded-full border border-slate-600 group-hover:border-indigo-400 group-hover:bg-indigo-500/20 flex items-center justify-center text-[10px] text-slate-400 group-hover:text-indigo-300">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: AI Roadmap Generating Loading Screen */}
        {step === "generating" && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <BrainCircuit className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Generating Personalized AI Curriculum...</h3>
              <p className="text-xs text-slate-400">
                Analyzing native language ({nativeLang}) & goal ({selectedGoal}) with Gemini AI
              </p>
            </div>
          </div>
        )}

        {/* Step 4: AI Roadmap Result Overview */}
        {step === "roadmap" && generatedRoadmap && (
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>Your Personal AI Learning Roadmap Ready!</span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{generatedRoadmap.curriculumName}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                  CEFR {generatedRoadmap.assignedCEFR}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p><strong>Recommended Teacher:</strong> {generatedRoadmap.recommendedTeacher}</p>
                <p><strong>Weekly Focus:</strong> {generatedRoadmap.weeklyFocus.join(" • ")}</p>
              </div>

              {/* Daily Schedule Preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400">5-Day Personal Schedule:</span>
                <div className="space-y-1">
                  {generatedRoadmap.dailyPlan.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                      <span className="font-semibold text-indigo-400">{p.day}</span>
                      <span className="text-slate-200 truncate mx-2 flex-1">{p.topic}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{p.minutes} min</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tip Callout */}
              <div className="bg-indigo-950/50 border border-indigo-800/50 p-2.5 rounded-xl text-xs text-indigo-200 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p><strong>AI Coach Tip:</strong> {generatedRoadmap.aiTip}</p>
              </div>
            </div>

            <button
              onClick={handleFinishOnboarding}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Start Learning with AI Teacher
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
