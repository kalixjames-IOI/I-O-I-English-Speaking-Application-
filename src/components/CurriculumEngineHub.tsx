import React, { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Volume2,
  CheckCircle2,
  Lock,
  Play,
  Search,
  Filter,
  Mic,
  MessageSquare,
  Award,
  Layers,
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
  Target,
  Brain,
  HelpCircle,
  Lightbulb,
  Headphones,
  Sliders,
  Database,
  Globe,
  Star
} from "lucide-react";
import {
  CEFRLevel,
  UserProfile,
  FullCurriculumLesson,
  CurriculumModuleItem,
  VocabularyDatabaseItem,
  SpeakingScenarioItem,
  ListeningScriptItem
} from "../types";
import {
  CEFR_LEVEL_METADATA,
  MASTER_CURRICULUM_MODULES,
  buildFullStructuredLesson
} from "../data/curriculumMatrix";
import {
  SAMPLE_VOCAB_DATABASE,
  searchAndExpandVocabularyDatabase
} from "../data/vocabDatabase";
import {
  SAMPLE_SPEAKING_SCENARIOS,
  getScenariosByCategoryAndLevel
} from "../data/speakingScenarios";
import {
  SAMPLE_LISTENING_SCRIPTS,
  getListeningScriptsByLevel
} from "../data/listeningScripts";

interface CurriculumEngineHubProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onStartRoleplay?: (scenarioTitle: string, initialMessage: string) => void;
}

type TabType = "matrix" | "vocabulary" | "scenarios" | "listening" | "generator";

export const CurriculumEngineHub: React.FC<CurriculumEngineHubProps> = ({
  user,
  onUpdateUser,
  onStartRoleplay
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("matrix");

  // Matrix State
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(user.currentLevel || "B1");
  const [selectedUnitNumber, setSelectedUnitNumber] = useState<number>(1);
  const [activeLessonModal, setActiveLessonModal] = useState<FullCurriculumLesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState<boolean>(false);

  // Vocab Database State
  const [vocabSearchQuery, setVocabSearchQuery] = useState<string>("");
  const [vocabLevelFilter, setVocabLevelFilter] = useState<string>("All");
  const [vocabDomainFilter, setVocabDomainFilter] = useState<string>("All Domains");

  // Scenario State
  const [scenarioCategory, setScenarioCategory] = useState<string>("All Categories");
  const [scenarioLevel, setScenarioLevel] = useState<string>("All");

  // Listening State
  const [listeningLevel, setListeningLevel] = useState<string>("All");
  const [activeScript, setActiveScript] = useState<ListeningScriptItem | null>(SAMPLE_LISTENING_SCRIPTS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showTranscriptTranslations, setShowTranscriptTranslations] = useState<boolean>(true);

  // Generator State
  const [customTopic, setCustomTopic] = useState<string>("Cross-Cultural Leadership & Negotiation");
  const [customLevel, setCustomLevel] = useState<CEFRLevel>("B2");
  const [generatedSuccessMsg, setGeneratedSuccessMsg] = useState<string | null>(null);

  // TTS audio playback helper using standard Web Speech API fallback
  const handlePlayTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = playbackSpeed;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Launch Lesson Modal handler
  const handleLaunchLesson = async (lvl: CEFRLevel, uNum: number, mNum: number, topicTitle: string) => {
    setIsGeneratingLesson(true);
    setCurrentStepIndex(0);

    try {
      const resp = await fetch("/api/gemini/generate-full-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: lvl,
          unitNumber: uNum,
          moduleNumber: mNum,
          topicTitle: topicTitle,
          userNativeLang: user.nativeLanguage
        })
      });

      if (resp.ok) {
        const fullData: FullCurriculumLesson = await resp.json();
        setActiveLessonModal(fullData);
      } else {
        const fallback = buildFullStructuredLesson(lvl, uNum, mNum);
        setActiveLessonModal(fallback);
      }
    } catch (e) {
      const fallback = buildFullStructuredLesson(lvl, uNum, mNum);
      setActiveLessonModal(fallback);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  // Save word to user profile
  const handleSaveWord = (vocab: VocabularyDatabaseItem) => {
    const exists = user.savedVocabulary.some((w) => w.word.toLowerCase() === vocab.word.toLowerCase());
    if (!exists) {
      const updatedSaved = [
        ...user.savedVocabulary,
        {
          word: vocab.word,
          phonetic: vocab.phonetic,
          definition: vocab.definition,
          example: vocab.example,
          nativeTranslation: vocab.nativeTranslations["es"] || vocab.nativeTranslations["fr"] || vocab.word,
          dateAdded: new Date().toISOString().split("T")[0]
        }
      ];
      onUpdateUser({ ...user, savedVocabulary: updatedSaved });
    }
  };

  // Filtered Vocab List
  const filteredVocab = searchAndExpandVocabularyDatabase(
    vocabSearchQuery,
    vocabLevelFilter === "All" ? undefined : (vocabLevelFilter as CEFRLevel),
    vocabDomainFilter
  );

  // Filtered Scenarios List
  const filteredScenarios = getScenariosByCategoryAndLevel(
    scenarioCategory,
    scenarioLevel === "All" ? undefined : (scenarioLevel as CEFRLevel)
  );

  // Filtered Listening Scripts List
  const filteredListening = getListeningScriptsByLevel(
    listeningLevel === "All" ? undefined : (listeningLevel as CEFRLevel)
  );

  const levelMeta = CEFR_LEVEL_METADATA[selectedLevel];
  const unitModules = MASTER_CURRICULUM_MODULES.filter(
    (m) => m.level === selectedLevel && m.unitNumber === selectedUnitNumber
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Engine Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Automated AI Curriculum Engine v3.6
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-300 font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
              <span>900 Master Lessons</span>
              <span>•</span>
              <span>10,000+ Vocabulary</span>
              <span>•</span>
              <span>1,000+ Scenarios</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Complete CEFR Curriculum & Knowledge Engine
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl mt-1 leading-relaxed">
              Systematic mastery across A1-C2 with 13-part structured lesson units, real-life roleplays, vocabulary repositories, and AI-driven speech evaluation.
            </p>
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              id="btn_tab_matrix"
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "matrix"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              900 Lesson Matrix (A1-C2)
            </button>

            <button
              id="btn_tab_vocabulary"
              onClick={() => setActiveTab("vocabulary")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "vocabulary"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Database className="w-4 h-4" />
              10,000+ Vocabulary
            </button>

            <button
              id="btn_tab_scenarios"
              onClick={() => setActiveTab("scenarios")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "scenarios"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              1,000+ Speaking Scenarios
            </button>

            <button
              id="btn_tab_listening"
              onClick={() => setActiveTab("listening")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "listening"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Headphones className="w-4 h-4" />
              1,000+ Listening Scripts
            </button>

            <button
              id="btn_tab_generator"
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "generator"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-white/5 hover:bg-white/10 text-slate-300"
              }`}
            >
              <Brain className="w-4 h-4 text-emerald-400" />
              AI Lesson Generator Studio
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 900 LESSON MATRIX */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* CEFR Level Selector Chips */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Select CEFR Mastery Level</span>
              <span className="text-indigo-600 font-mono">15 Units • 150 Modules per Level</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((lvl) => {
                const meta = CEFR_LEVEL_METADATA[lvl];
                const isSelected = selectedLevel === lvl;
                return (
                  <button
                    key={lvl}
                    id={`btn_level_chip_${lvl}`}
                    onClick={() => {
                      setSelectedLevel(lvl);
                      setSelectedUnitNumber(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-lg">{lvl}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {meta.totalLessons}
                      </span>
                    </div>
                    <div className="text-xs font-medium truncate opacity-90 mt-0.5">{meta.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Level Description & Unit List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: 15 Units Selector */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Level {selectedLevel}: {levelMeta.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{levelMeta.description}</p>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {levelMeta.units.map((unit) => {
                  const isSelected = selectedUnitNumber === unit.unitNumber;
                  return (
                    <button
                      key={unit.unitNumber}
                      id={`btn_unit_select_${unit.unitNumber}`}
                      onClick={() => setSelectedUnitNumber(unit.unitNumber)}
                      className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold ring-2 ring-indigo-500/20"
                          : "bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                          Unit {unit.unitNumber} • {unit.theme}
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{unit.unitTitle}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: 10 Modules for the selected Unit */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Unit {selectedUnitNumber} Breakdown
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {levelMeta.units.find((u) => u.unitNumber === selectedUnitNumber)?.unitTitle}
                  </h3>
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  10 Modules • 100 XP Each
                </div>
              </div>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {unitModules.map((mod) => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-700">
                          {mod.category}
                        </span>
                        <span className="text-slate-500 font-medium">{mod.estimatedMinutes} mins</span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{mod.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mod.topic}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />+{mod.xpReward} XP
                      </span>

                      <button
                        id={`btn_launch_mod_${mod.id}`}
                        onClick={() =>
                          handleLaunchLesson(selectedLevel, selectedUnitNumber, mod.moduleNumber, mod.title)
                        }
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Launch 13-Part Unit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 10,000+ VOCABULARY DATABASE */}
      {activeTab === "vocabulary" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  10,000+ Vocabulary Repository
                </h3>
                <p className="text-xs text-slate-500">
                  Search definitions, phonetics, collocations, native translations, and audio pronunciation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Saved Words:</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                  {user.savedVocabulary.length} Words
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 10,000+ words (e.g. Mitigate, Algorithm, Itinerary)..."
                  value={vocabSearchQuery}
                  onChange={(e) => setVocabSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* CEFR Level filter */}
              <select
                value={vocabLevelFilter}
                onChange={(e) => setVocabLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All CEFR Levels</option>
                <option value="A1">Level A1 (Beginner)</option>
                <option value="A2">Level A2 (Elementary)</option>
                <option value="B1">Level B1 (Intermediate)</option>
                <option value="B2">Level B2 (Upper Int.)</option>
                <option value="C1">Level C1 (Advanced)</option>
                <option value="C2">Level C2 (Mastery)</option>
              </select>

              {/* Domain filter */}
              <select
                value={vocabDomainFilter}
                onChange={(e) => setVocabDomainFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Domains">All Topic Domains</option>
                <option value="Business">Business & Corporate</option>
                <option value="Travel">Travel & Tourism</option>
                <option value="Tech & AI">Tech & Artificial Intelligence</option>
                <option value="Healthcare">Healthcare & Medicine</option>
                <option value="Academic">Academic & Science</option>
                <option value="Everyday Social">Everyday Social</option>
                <option value="Media & Culture">Media & Culture</option>
              </select>
            </div>
          </div>

          {/* Vocab Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map((vocab) => {
              const isSaved = user.savedVocabulary.some(
                (w) => w.word.toLowerCase() === vocab.word.toLowerCase()
              );

              return (
                <div
                  key={vocab.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-extrabold text-slate-900">{vocab.word}</h4>
                        <span className="text-xs text-slate-500 font-mono italic">{vocab.phonetic}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                        {vocab.cefrLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="capitalize">{vocab.partOfSpeech}</span>
                      <span>•</span>
                      <span className="text-indigo-600">{vocab.topicDomain}</span>
                    </div>

                    <p className="text-sm text-slate-700 font-medium">{vocab.definition}</p>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-bold text-slate-800">Example:</span> "{vocab.example}"
                      </div>
                      <div className="text-indigo-700 font-medium">
                        <span className="font-bold">Translation:</span>{" "}
                        {vocab.nativeTranslations["es"] || Object.values(vocab.nativeTranslations)[0]}
                      </div>
                    </div>

                    {vocab.collocations && vocab.collocations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Collocations:</span>
                        {vocab.collocations.map((col, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePlayTTS(vocab.word)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Volume2 className="w-4 h-4" /> Listen
                    </button>

                    <button
                      onClick={() => handleSaveWord(vocab)}
                      disabled={isSaved}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isSaved
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      }`}
                    >
                      {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : "+ Save to Vocabulary"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 1,000+ SPEAKING SCENARIOS */}
      {activeTab === "scenarios" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  1,000+ Real-Life Speaking Scenarios Bank
                </h3>
                <p className="text-xs text-slate-500">
                  Practice immersive roleplays across Business, Travel, Academic, Healthcare, and Customs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={scenarioCategory}
                onChange={(e) => setScenarioCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Categories">All Categories</option>
                <option value="Business">Business & Corporate</option>
                <option value="Travel">Travel & Hotels</option>
                <option value="Flight & Customs">Flight & Airport Customs</option>
                <option value="Healthcare">Healthcare & Doctors</option>
                <option value="Tech & Engineering">Tech & AI Demonstrations</option>
                <option value="Negotiations">Salary & Deal Negotiations</option>
                <option value="Emergency">Emergency & Police Assistance</option>
              </select>

              <select
                value={scenarioLevel}
                onChange={(e) => setScenarioLevel(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All CEFR Levels</option>
                <option value="A2">Elementary (A2)</option>
                <option value="B1">Intermediate (B1)</option>
                <option value="B2">Upper Intermediate (B2)</option>
                <option value="C1">Advanced (C1)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScenarios.map((scen) => (
              <div
                key={scen.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      {scen.category} • CEFR {scen.cefrLevel}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: scen.difficultyRating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900">{scen.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{scen.situationDescription}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-500">Your Role:</span>
                      <div className="font-semibold text-slate-800">{scen.userRole}</div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">AI Teacher Role:</span>
                      <div className="font-semibold text-indigo-700">{scen.aiTeacherRole}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Target Vocabulary:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {scen.targetVocabulary.map((v, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 italic truncate max-w-[200px]">
                    "{scen.starterPhrase}"
                  </span>

                  <button
                    onClick={() => {
                      if (onStartRoleplay) {
                        onStartRoleplay(scen.title, scen.starterPhrase);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" /> Start AI Voice Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 1,000+ LISTENING SCRIPTS */}
      {activeTab === "listening" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-indigo-600" />
                  1,000+ Listening Practice Scripts Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Interactive audio transcripts with native accent speed toggles and comprehension quizzes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Speed:</span>
                {[0.8, 1.0, 1.2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      playbackSpeed === spd
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeScript && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                    {activeScript.category} • CEFR {activeScript.cefrLevel}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{activeScript.title}</h3>
                </div>

                <button
                  onClick={() => {
                    const fullText = activeScript.transcript.map((t) => t.text).join(" ");
                    handlePlayTTS(fullText);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" /> Listen Full Audio Script ({playbackSpeed}x)
                </button>
              </div>

              {/* Transcript Dialogue */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interactive Dialogue Transcript
                </div>
                {activeScript.transcript.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-indigo-700">{item.speaker}</span>
                      <span className="font-mono text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{item.text}</p>
                    {showTranscriptTranslations && item.translation && (
                      <p className="text-xs text-slate-500 italic">{item.translation}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Comprehension Quiz */}
              {activeScript.comprehensionQuiz && activeScript.comprehensionQuiz.length > 0 && (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" /> Listening Comprehension Check
                  </h4>
                  {activeScript.comprehensionQuiz.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-900">{q.question}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs font-medium ${
                              oIdx === q.correctIndex
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            {opt} {oIdx === q.correctIndex && "✓"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUTOMATED AI LESSON GENERATOR STUDIO */}
      {activeTab === "generator" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" /> Automated AI Content Generation Workflow
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Generate full 13-part structured lessons on demand for any industry, topic, or CEFR level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Lesson Topic or Domain</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. AI Product Pitch, Venture Capital Term Sheets..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase">Target CEFR Level</label>
              <select
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value as CEFRLevel)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="A1">A1 Beginner</option>
                <option value="A2">A2 Elementary</option>
                <option value="B1">B1 Intermediate</option>
                <option value="B2">B2 Upper Int.</option>
                <option value="C1">C1 Advanced</option>
                <option value="C2">C2 Mastery</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Automated 13-part JSON Schema validation & Gemini 3.6 Flash pipeline ready.
            </div>

            <button
              id="btn_generate_custom_unit"
              onClick={() => handleLaunchLesson(customLevel, 1, 1, customTopic)}
              disabled={isGeneratingLesson}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {isGeneratingLesson ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating 13-Part Unit...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate & Launch Complete Unit
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 13-PART FULL LESSON MODAL PLAYER */}
      {activeLessonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8 space-y-6 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">
                  Level {activeLessonModal.level} • Unit {activeLessonModal.unitNumber}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{activeLessonModal.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{activeLessonModal.subtitle}</p>
              </div>

              <button
                id="btn_close_lesson_modal"
                onClick={() => setActiveLessonModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 13 Parts Step Indicator */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-100 text-xs">
              {[
                "1. Objective",
                "2. Grammar",
                "3. Vocabulary",
                "4. Examples",
                "5. Listening",
                "6. Speaking",
                "7. AI Roleplay",
                "8. Pronunciation",
                "9. Exercises",
                "10. Quiz",
                "11. Homework",
                "12. Evaluation"
              ].map((stepName, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all ${
                    currentStepIndex === idx
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {stepName}
                </button>
              ))}
            </div>

            {/* Step 0: Objective */}
            {currentStepIndex === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Learning Objective
                </h3>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-sm font-semibold text-indigo-950 leading-relaxed">
                  {activeLessonModal.learningObjective}
                </div>
              </div>
            )}

            {/* Step 1: Grammar */}
            {currentStepIndex === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Grammar Rules & Explanation
                </h3>
                <p className="text-sm text-slate-700">{activeLessonModal.grammarExplanation.summary}</p>

                <div className="space-y-3">
                  {activeLessonModal.grammarExplanation.rules.map((r, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold text-sm text-slate-900">{r.ruleTitle}</div>
                      <div className="text-xs text-slate-600">{r.explanation}</div>
                      <div className="text-xs font-mono bg-white p-2 rounded-lg border border-slate-200 text-indigo-700">
                        "{r.example}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Vocabulary */}
            {currentStepIndex === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" /> Lesson Vocabulary List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeLessonModal.vocabularyList.map((v, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{v.term}</span>
                        <span className="text-xs font-mono text-slate-500">{v.phonetic}</span>
                      </div>
                      <p className="text-xs text-slate-600">{v.definition}</p>
                      <p className="text-xs text-indigo-700 font-semibold">"{v.example}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Examples */}
            {currentStepIndex === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Natural Example Sentences
                </h3>
                {activeLessonModal.exampleSentences.map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="font-bold text-sm text-slate-900">{s.english}</p>
                    <p className="text-xs text-indigo-700">{s.nativeTranslation}</p>
                    <span className="text-[11px] text-slate-500 italic">{s.contextNote}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Listening */}
            {currentStepIndex === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-indigo-600" /> Listening Script
                </h3>
                <p className="text-xs text-slate-500">{activeLessonModal.listeningScript.audioText}</p>

                {activeLessonModal.listeningScript.speakers.map((s, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-indigo-700">{s.speaker}:</span>
                    <p className="text-slate-800 font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Speaking */}
            {currentStepIndex === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-indigo-600" /> Target Speaking Practice
                </h3>
                {activeLessonModal.speakingPractice.targetPhrases.map((p, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="font-bold text-sm text-slate-900">{p.phrase}</div>
                    <div className="text-xs font-mono text-slate-500">{p.phonetic}</div>
                    <div className="text-xs text-indigo-700 font-semibold">Tip: {p.pronunciationTip}</div>
                    <button
                      onClick={() => handlePlayTTS(p.phrase)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Listen Phrase
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Step 6: AI Conversation Roleplay */}
            {currentStepIndex === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" /> AI Roleplay Scenario
                </h3>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                  <div className="font-bold text-sm text-indigo-950">
                    {activeLessonModal.aiConversationScenario.scenarioTitle}
                  </div>
                  <p className="text-xs text-indigo-800">
                    "{activeLessonModal.aiConversationScenario.initialMessage}"
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (onStartRoleplay) {
                      onStartRoleplay(
                        activeLessonModal.aiConversationScenario.scenarioTitle,
                        activeLessonModal.aiConversationScenario.initialMessage
                      );
                      setActiveLessonModal(null);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" /> Start AI Voice Practice Now
                </button>
              </div>
            )}

            {/* Step 7: Pronunciation Practice */}
            {currentStepIndex === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-indigo-600" /> Pronunciation & Stress Patterns
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {activeLessonModal.pronunciationPractice.stressPatterns.map((st, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{st.word}</div>
                      <div className="text-indigo-700 font-semibold">Stress: {st.stressedSyllable}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={currentStepIndex === 0}
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-50"
              >
                Previous Step
              </button>

              <button
                onClick={() => {
                  if (currentStepIndex < 11) {
                    setCurrentStepIndex((prev) => prev + 1);
                  } else {
                    setActiveLessonModal(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {currentStepIndex === 11 ? "Complete Unit ✓" : "Next Step →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
