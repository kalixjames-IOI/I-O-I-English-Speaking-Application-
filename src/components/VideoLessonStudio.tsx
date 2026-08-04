import React, { useState, useEffect } from "react";
import { UserProfile, CEFRLevel, AIVideoLessonPackage, StoryboardScene, SubtitleCue } from "../types";
import { MASTER_CURRICULUM_MODULES } from "../data/curriculumMatrix";
import { AI_TEACHERS } from "../data/initialData";
import {
  generateVideoLessonPackage,
  batchConvertLessonsToVideo,
  exportSubtitlesSRT,
  exportVideoManifestJSON,
  exportSlideDeckMarkdown
} from "../utils/videoPipelineEngine";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Video,
  Layers,
  FileText,
  Download,
  Copy,
  Check,
  HelpCircle,
  Trophy,
  Zap,
  RefreshCw,
  Mic,
  CheckCircle2,
  Camera,
  Film,
  UserCheck,
  Edit3,
  Send,
  HelpCircle as QuestionIcon,
  Globe,
  Sliders,
  CheckSquare
} from "lucide-react";

interface VideoLessonStudioProps {
  user: UserProfile;
  initialLessonTitle?: string;
  initialCEFR?: CEFRLevel;
  onUpdateUser?: (updated: UserProfile) => void;
  onStartRoleplay?: (scenarioTitle: string, initialMessage: string) => void;
}

export const VideoLessonStudio: React.FC<VideoLessonStudioProps> = ({
  user,
  initialLessonTitle,
  initialCEFR,
  onUpdateUser,
  onStartRoleplay
}) => {
  // Studio Navigation Mode
  const [activeStudioTab, setActiveStudioTab] = useState<"player" | "pipeline" | "exports">("player");

  // Video Format Mode (FORMAT 1: AI Avatar Teacher vs FORMAT 2: AI Animation Learning)
  const [videoFormat, setVideoFormat] = useState<"avatar" | "animation">("avatar");

  // Selection state
  const [selectedCEFR, setSelectedCEFR] = useState<CEFRLevel>(initialCEFR || user.currentLevel || "B1");
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string>(
    initialLessonTitle || "Ordering at a Michelin-Star Restaurant in London"
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [videoPackage, setVideoPackage] = useState<AIVideoLessonPackage | null>(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [subtitleLanguage, setSubtitleLanguage] = useState<"en" | "native">("en");
  const [showQuizOverlay, setShowQuizOverlay] = useState<boolean>(false);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Interactive Practice State
  const [isRecordingPractice, setIsRecordingPractice] = useState<boolean>(false);
  const [practiceAudioRecorded, setPracticeAudioRecorded] = useState<boolean>(false);
  const [homeworkAnswerText, setHomeworkAnswerText] = useState<string>("");
  const [homeworkSubmitted, setHomeworkSubmitted] = useState<boolean>(false);

  // Batch Pipeline State
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number; currentTitle: string }>({
    completed: 0,
    total: 0,
    currentTitle: ""
  });
  const [batchGeneratedList, setBatchGeneratedList] = useState<AIVideoLessonPackage[]>([]);

  // Export Copy States
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Auto-load or generate initial video package
  useEffect(() => {
    loadOrGenerateVideo(selectedLessonTitle, selectedCEFR);
  }, []);

  const loadOrGenerateVideo = async (title: string, level: CEFRLevel) => {
    setIsGenerating(true);
    setShowQuizOverlay(false);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setCurrentSceneIndex(0);
    setCurrentTimeSeconds(0);
    setIsPlaying(false);
    setPracticeAudioRecorded(false);
    setHomeworkSubmitted(false);

    try {
      const pkg = await generateVideoLessonPackage({
        lessonTitle: title,
        cefrLevel: level,
        category: "Conversation & Grammar",
        teacherName: user.roadmap?.recommendedTeacher || "Emma (US Accent)"
      });
      setVideoPackage(pkg);
    } catch (err) {
      console.error("Video load error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Video Time Scrubber Simulation
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && videoPackage) {
      interval = setInterval(() => {
        setCurrentTimeSeconds((prev) => {
          const next = prev + 0.5 * playbackSpeed;
          if (next >= videoPackage.totalDurationSeconds) {
            setIsPlaying(false);
            return videoPackage.totalDurationSeconds;
          }

          // Calculate current scene based on cumulative scene durations
          let cumulative = 0;
          for (let i = 0; i < videoPackage.storyboard.length; i++) {
            const scene = videoPackage.storyboard[i];
            cumulative += scene.durationSeconds;
            if (next <= cumulative) {
              if (i !== currentSceneIndex) {
                setCurrentSceneIndex(i);
                if (scene.quizCheckpoint) {
                  setIsPlaying(false);
                  setShowQuizOverlay(true);
                }
              }
              break;
            }
          }

          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoPackage, playbackSpeed, currentSceneIndex]);

  // Speech Synthesis Helper
  const handleNarrateScene = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (!isMuted) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, ""));
        utterance.rate = playbackSpeed * (videoPackage?.voiceNarrationConfig.recommendedRate || 0.95);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const togglePlayPause = () => {
    if (!videoPackage) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      const currentScene = videoPackage.storyboard[currentSceneIndex];
      if (currentScene) {
        handleNarrateScene(currentScene.spokenScript);
      }
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleSceneJump = (index: number) => {
    if (!videoPackage || index < 0 || index >= videoPackage.storyboard.length) return;
    setCurrentSceneIndex(index);
    let time = 0;
    for (let i = 0; i < index; i++) {
      time += videoPackage.storyboard[i].durationSeconds;
    }
    setCurrentTimeSeconds(time);
    setShowQuizOverlay(false);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);

    if (isPlaying) {
      handleNarrateScene(videoPackage.storyboard[index].spokenScript);
    }
  };

  // Batch Pipeline Launcher
  const handleRunBatchPipeline = async () => {
    const modulesToConvert = MASTER_CURRICULUM_MODULES.filter((m) => m.level === selectedCEFR).slice(0, 6);
    setIsBatchRunning(true);
    try {
      const results = await batchConvertLessonsToVideo(
        modulesToConvert.map((m) => ({ title: m.title, cefrLevel: m.level, category: m.category })),
        (completed, total, currentTitle) => {
          setBatchProgress({ completed, total, currentTitle });
        }
      );
      setBatchGeneratedList(results);
    } catch (err) {
      console.error("Batch error:", err);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleCopyText = (text: string, typeKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const activeScene: StoryboardScene | undefined = videoPackage?.storyboard[currentSceneIndex];

  // Active Subtitle Cue
  const currentSubtitleCue = videoPackage?.subtitleScript.find(
    (s) => currentTimeSeconds >= s.startSeconds && currentTimeSeconds <= s.endSeconds
  ) || videoPackage?.subtitleScript[0];

  const sectionCategories = [
    { num: 1, name: "1. Introduction", icon: Sparkles },
    { num: 2, name: "2. Teaching Explanation", icon: BookOpen },
    { num: 3, name: "3. Examples", icon: Layers },
    { num: 4, name: "4. Practice", icon: Mic },
    { num: 5, name: "5. Review", icon: CheckCircle2 },
    { num: 6, name: "6. Homework", icon: Edit3 }
  ];

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-slate-800 p-5 rounded-3xl space-y-3 relative overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  I O I Education Network — AI Video Production Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Global Broadcast Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Dual-Format AI Teacher Avatar & Animated Learning Video generation system. Supports complete 6-section lesson structure, voice narration, subtitles, and interactive practice.
              </p>
            </div>
          </div>

          {/* Studio Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveStudioTab("player")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeStudioTab === "player"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Video Canvas</span>
            </button>
            <button
              onClick={() => setActiveStudioTab("pipeline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeStudioTab === "pipeline"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Batch Pipeline</span>
            </button>
            <button
              onClick={() => setActiveStudioTab("exports")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeStudioTab === "exports"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exports & Manifest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Switcher Ribbon */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level:</span>
            <div className="flex space-x-1">
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedCEFR(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedCEFR === lvl
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Lesson:</span>
            <select
              value={selectedLessonTitle}
              onChange={(e) => {
                setSelectedLessonTitle(e.target.value);
                loadOrGenerateVideo(e.target.value, selectedCEFR);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs"
            >
              <option value="Ordering at a Michelin-Star Restaurant in London">Ordering at a Michelin-Star Restaurant</option>
              <option value="Tech Startup Pitch Meeting & Investor Q&A">Tech Startup Pitch & Investor Q&A</option>
              <option value="Job Offer Salary & Equity Negotiation">Job Offer Salary & Equity Negotiation</option>
              <option value="Medical Doctor Appointment & Describing Symptoms">Medical Appointment & Symptoms</option>
              <option value="Airport Customs & Aviation Navigation">Airport Customs & Aviation</option>
              {MASTER_CURRICULUM_MODULES.filter((m) => m.level === selectedCEFR).map((mod) => (
                <option key={mod.id} value={mod.title}>
                  Lesson {mod.globalLessonIndex}: {mod.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => loadOrGenerateVideo(selectedLessonTitle, selectedCEFR)}
          disabled={isGenerating}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-md"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Generating AI Video Package...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate / Refresh Video</span>
            </>
          )}
        </button>
      </div>

      {/* MODE 1: Interactive Video Player & Inspector */}
      {activeStudioTab === "player" && (
        <div className="space-y-6">
          {/* Format Mode Selector Banner (Format 1: Avatar Teacher vs Format 2: Animation Video) */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-4 h-4 text-indigo-400" />
                Select Video Format Mode:
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVideoFormat("avatar")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                  videoFormat === "avatar"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Format 1: AI Avatar Teacher Video</span>
              </button>

              <button
                onClick={() => setVideoFormat("animation")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                  videoFormat === "animation"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Format 2: AI Animation Learning Video</span>
              </button>
            </div>
          </div>

          {/* 6-Section Timeline Stepper Ribbon */}
          {videoPackage && (
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl overflow-x-auto custom-scrollbar">
              <div className="flex items-center space-x-2 min-w-max">
                {videoPackage.storyboard.map((scene, idx) => {
                  const isActive = currentSceneIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSceneJump(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-[10px] font-mono text-indigo-300">{idx + 1}</span>
                      <span>{scene.sectionCategory || scene.title.split(".")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isGenerating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 animate-bounce">
                <Video className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-200">Generating AI Video Lesson Package...</h3>
                <p className="text-xs text-slate-400">Synthesizing AI Avatar scripts, storyboards, slides, subtitles, and interactive quiz presentation.</p>
              </div>
            </div>
          ) : videoPackage ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 8 Cols: Interactive 16:9 Video Canvas Player */}
              <div className="lg:col-span-8 space-y-4">
                <div
                  className={`relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group ${
                    isFullScreen ? "fixed inset-0 z-50 rounded-none border-none" : "aspect-video"
                  }`}
                >
                  {/* Studio Canvas Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-between p-4 sm:p-6">
                    {/* Top HUD Bar */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-full text-[11px] font-bold text-slate-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>IOI Network {videoFormat === "avatar" ? "AI Avatar Teacher" : "Animation Video"}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-indigo-400">Section {currentSceneIndex + 1}/6</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                          {activeScene?.cameraFraming || "Medium Close-Up"}
                        </span>
                        <button
                          onClick={() => setIsFullScreen(!isFullScreen)}
                          className="p-1.5 rounded-xl bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
                        >
                          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* FORMAT 1: AI AVATAR TEACHER VIEW */}
                    {videoFormat === "avatar" && (
                      <div className="grid grid-cols-12 gap-4 items-center my-auto z-10">
                        {/* Avatar Presenter Column */}
                        <div className="col-span-4 flex flex-col items-center justify-center space-y-2">
                          <div className="relative">
                            <img
                              src={videoPackage.assignedTeacher.avatarUrl}
                              alt={videoPackage.assignedTeacher.name}
                              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 transition-all shadow-xl ${
                                isPlaying ? "border-indigo-400 ring-4 ring-indigo-500/20 scale-105" : "border-slate-700"
                              }`}
                            />
                            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-bold text-indigo-300 shadow">
                                {activeScene?.facialExpressionCue || "[Warm Smile]"}
                              </span>
                            </div>
                          </div>

                          <div className="text-center space-y-0.5">
                            <h4 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                              <span>{videoPackage.assignedTeacher.flag}</span>
                              <span>{videoPackage.assignedTeacher.name}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400">{activeScene?.avatarPose || "Presenting"}</p>
                          </div>
                        </div>

                        {/* Slide Deck Canvas Column */}
                        <div className="col-span-8 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-2xl space-y-2 shadow-2xl">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {activeScene?.sectionCategory || "Lesson Slide"}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              CEFR {videoPackage.cefrLevel}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <h3 className="font-extrabold text-slate-100 text-sm">
                              {activeScene?.slideContent.heading}
                            </h3>

                            {activeScene?.slideContent.subheading && (
                              <p className="text-[11px] text-slate-300 font-medium">
                                {activeScene.slideContent.subheading}
                              </p>
                            )}

                            {activeScene?.slideContent.bulletPoints && (
                              <ul className="space-y-1 text-[11px] text-slate-300">
                                {activeScene.slideContent.bulletPoints.map((bp, idx) => (
                                  <li key={idx} className="flex items-start space-x-1.5">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    <span>{bp}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {activeScene?.slideContent.grammarHighlightBox && (
                              <div className="bg-indigo-950/60 border border-indigo-800/60 p-2.5 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                                  📌 {activeScene.slideContent.grammarHighlightBox.title}
                                </span>
                                <p className="text-[11px] text-slate-200">
                                  {activeScene.slideContent.grammarHighlightBox.ruleText}
                                </p>
                              </div>
                            )}

                            {activeScene?.slideContent.commonMistakes && (
                              <div className="bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                                  ❌ Common Mistake vs Native Fix
                                </span>
                                <p className="text-[10px] text-rose-200 line-through">
                                  "{activeScene.slideContent.commonMistakes[0].mistake}"
                                </p>
                                <p className="text-[11px] text-emerald-300 font-bold">
                                  ✅ "{activeScene.slideContent.commonMistakes[0].correction}"
                                </p>
                              </div>
                            )}

                            {/* Section 4 Interactive Repeat-After-Me Box */}
                            {activeScene?.interactivePractice && (
                              <div className="bg-emerald-950/50 border border-emerald-800/60 p-3 rounded-xl space-y-2">
                                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                                  <Mic className="w-3 h-3" /> Repeat After Teacher Practice
                                </span>
                                <p className="text-xs text-white font-bold">
                                  "{activeScene.interactivePractice.repeatAfterTeacherSentence}"
                                </p>
                                <button
                                  onClick={() => {
                                    setIsRecordingPractice(true);
                                    setTimeout(() => {
                                      setIsRecordingPractice(false);
                                      setPracticeAudioRecorded(true);
                                    }, 2000);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center space-x-1"
                                >
                                  {isRecordingPractice ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                      <span>Recording Speech...</span>
                                    </>
                                  ) : practiceAudioRecorded ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                                      <span>Practiced! +20 XP</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mic className="w-3 h-3" />
                                      <span>Hold to Record Speech</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Section 6 Homework Assignment Box */}
                            {activeScene?.homeworkAssignment && (
                              <div className="bg-amber-950/50 border border-amber-800/60 p-3 rounded-xl space-y-2">
                                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                                  📝 Today's Homework Task
                                </span>
                                <p className="text-[11px] text-slate-200">
                                  <strong>Speaking Task:</strong> {activeScene.homeworkAssignment.speakingTask}
                                </p>
                                <p className="text-[11px] text-slate-200">
                                  <strong>Writing Task:</strong> {activeScene.homeworkAssignment.writingTask}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FORMAT 2: AI ANIMATED LEARNING VIDEO VIEW */}
                    {videoFormat === "animation" && (
                      <div className="my-auto z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-5 rounded-2xl space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            Animated Motion Graphics Stage
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {activeScene?.visualAssetSuggestions.assetType || "Motion Graphic"}
                          </span>
                        </div>

                        {/* Kinetic Callout Text Bubbles */}
                        <div className="flex flex-wrap gap-2">
                          {activeScene?.onScreenText?.map((txt, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-3 py-1 rounded-xl bg-indigo-900/60 border border-indigo-700/60 text-indigo-200 text-xs font-bold shadow animate-pulse"
                            >
                              {txt}
                            </span>
                          ))}
                        </div>

                        {/* Animation Instructions Highlight Box */}
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            🎥 Kinetic Visual Cue & Motion Instructions:
                          </span>
                          <p className="text-xs text-slate-200 font-mono">
                            {activeScene?.animationInstructions || "Dynamic text typography slide with glowing particle transitions."}
                          </p>
                        </div>

                        {/* Visual Prompt Graphic Asset Specification */}
                        <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                            🎨 Primary Visual Graphic Generator Prompt:
                          </span>
                          <p className="text-xs text-indigo-200 italic">
                            "{activeScene?.visualAssetSuggestions.primaryGraphicPrompt}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Interactive Quiz Pause Overlay */}
                    {showQuizOverlay && activeScene?.quizCheckpoint && (
                      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col justify-center p-6 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            Interactive Video Checkpoint Quiz
                          </span>
                          <button
                            onClick={() => setShowQuizOverlay(false)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Skip Quiz & Resume
                          </button>
                        </div>

                        <div className="space-y-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                          <h4 className="text-xs font-bold text-slate-100">
                            {activeScene.quizCheckpoint.question}
                          </h4>

                          <div className="space-y-2">
                            {activeScene.quizCheckpoint.options.map((option, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  setQuizSelectedOption(oIdx);
                                  setQuizSubmitted(true);
                                }}
                                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                  quizSelectedOption === oIdx
                                    ? oIdx === activeScene.quizCheckpoint?.correctIndex
                                      ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                                      : "bg-rose-950 border-rose-500 text-rose-200"
                                    : "bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>

                          {quizSubmitted && (
                            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs space-y-1">
                              <span className={`font-bold block ${quizSelectedOption === activeScene.quizCheckpoint.correctIndex ? "text-emerald-400" : "text-rose-400"}`}>
                                {quizSelectedOption === activeScene.quizCheckpoint.correctIndex ? "Correct! +30 XP" : "Incorrect"}
                              </span>
                              <p className="text-slate-300 text-[11px]">{activeScene.quizCheckpoint.explanation}</p>
                              <button
                                onClick={() => {
                                  setShowQuizOverlay(false);
                                  setIsPlaying(true);
                                }}
                                className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Continue Video →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subtitle Caption Overlay */}
                    {showSubtitles && (
                      <div className="text-center z-10 px-4 py-2 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-800/80 max-w-2xl mx-auto space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 block uppercase tracking-wider">
                          {currentSubtitleCue?.speaker || videoPackage.assignedTeacher.name}
                        </span>
                        <p className="text-xs font-semibold text-white leading-relaxed">
                          "{subtitleLanguage === "en" ? currentSubtitleCue?.text : currentSubtitleCue?.nativeTranslation || currentSubtitleCue?.text}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Scrubber & Playback Controls Bar */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-3 shadow-xl">
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={videoPackage.totalDurationSeconds}
                      value={currentTimeSeconds}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCurrentTimeSeconds(val);
                        let cum = 0;
                        for (let i = 0; i < videoPackage.storyboard.length; i++) {
                          cum += videoPackage.storyboard[i].durationSeconds;
                          if (val <= cum) {
                            setCurrentSceneIndex(i);
                            break;
                          }
                        }
                      }}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>
                        {Math.floor(currentTimeSeconds / 60)}:{(Math.floor(currentTimeSeconds % 60)).toString().padStart(2, "0")}
                      </span>
                      <span>
                        {Math.floor(videoPackage.totalDurationSeconds / 60)}:{(Math.floor(videoPackage.totalDurationSeconds % 60)).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={togglePlayPause}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                      </button>

                      <button
                        onClick={() => handleSceneJump(currentSceneIndex - 1)}
                        disabled={currentSceneIndex === 0}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleSceneJump(currentSceneIndex + 1)}
                        disabled={currentSceneIndex >= videoPackage.storyboard.length - 1}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setCurrentSceneIndex(0);
                          setCurrentTimeSeconds(0);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowSubtitles(!showSubtitles)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          showSubtitles ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        CC Subtitles
                      </button>

                      {showSubtitles && (
                        <button
                          onClick={() => setSubtitleLanguage(subtitleLanguage === "en" ? "native" : "en")}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                        >
                          🌐 {subtitleLanguage === "en" ? "English" : "Native Trans."}
                        </button>
                      )}

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackSpeed(rate)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                            playbackSpeed === rate ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Video Section Storyboard Breakdown Inspector */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      6-Section Video Storyboard
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      6/6 Complete
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {videoPackage.storyboard.map((scene, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => handleSceneJump(sIdx)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            currentSceneIndex === sIdx
                              ? "bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-600/20"
                              : "bg-slate-800/80 border-slate-700/80 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-100">{scene.sectionCategory || scene.title}</span>
                            <span className="text-[10px] text-indigo-300 font-mono">{scene.durationSeconds}s</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">"{scene.spokenScript}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Takeaways Card */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Lesson Key Summary
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {videoPackage.summary.keyTakeaways.map((kt, kIdx) => (
                        <li key={kIdx} className="flex items-start space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{kt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Practice in Voice Studio Action Button */}
                  {onStartRoleplay && (
                    <button
                      onClick={() => onStartRoleplay(videoPackage.title, videoPackage.avatarTeachingScript.introduction)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold p-3 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Practice Live Speech in Voice Studio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MODE 2: Automated Pipeline Converter (Single & Batch) */}
      {activeStudioTab === "pipeline" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Automated Batch Video Lesson Converter</h2>
                <p className="text-xs text-slate-400">
                  Convert every curriculum module across all CEFR levels into broadcast-ready 6-section AI video packages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Target CEFR Level Module</span>
                <div className="flex space-x-2">
                  {(["A1", "A2", "B1", "B2", "C1", "C2"] as CEFRLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedCEFR(lvl)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCEFR === lvl ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Will convert lessons for CEFR level {selectedCEFR} into AI video manifests automatically.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Run Automated Pipeline</span>
                  <p className="text-[11px] text-slate-400">
                    Processes AI avatar scripts, voiceover pitch configs, storyboards, slide content, and quiz overlays in sequence.
                  </p>
                </div>

                <button
                  onClick={handleRunBatchPipeline}
                  disabled={isBatchRunning}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold p-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg"
                >
                  {isBatchRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Batch Pipeline Running ({batchProgress.completed}/{batchProgress.total})...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Start Batch Video Pipeline ({selectedCEFR})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isBatchRunning && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Converting: {batchProgress.currentTitle}</span>
                  <span>{Math.round((batchProgress.completed / (batchProgress.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.completed / (batchProgress.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {batchGeneratedList.length > 0 && (
              <div className="space-y-3 border-t border-slate-800 pt-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Generated Video Packages ({batchGeneratedList.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {batchGeneratedList.map((pkg, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{pkg.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {pkg.cefrLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">"{pkg.avatarTeachingScript.fullNarrativeText}"</p>
                      <button
                        onClick={() => {
                          setVideoPackage(pkg);
                          setSelectedLessonTitle(pkg.title);
                          setActiveStudioTab("player");
                        }}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                      >
                        <span>Open in Video Player Canvas →</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: Export & Distribution Studio */}
      {activeStudioTab === "exports" && videoPackage && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Video Assets & Package Exporter</h2>
                <p className="text-xs text-slate-400">
                  Download standard subtitle files (.SRT), JSON manifests, and slide decks for broadcast distribution on mobile apps.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold text-white">Subtitle Script (.SRT)</span>
                </div>
                <p className="text-[11px] text-slate-400">Timecoded subtitle cues formatted for video editors or players.</p>
                <button
                  onClick={() => handleCopyText(exportSubtitlesSRT(videoPackage.subtitleScript), "srt")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedType === "srt" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === "srt" ? "Copied SRT Subtitles!" : "Copy .SRT File"}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <Layers className="w-5 h-5" />
                  <span className="text-xs font-bold text-white">Video Manifest (.JSON)</span>
                </div>
                <p className="text-[11px] text-slate-400">Complete AI Avatar, storyboard, and voice JSON structure.</p>
                <button
                  onClick={() => handleCopyText(exportVideoManifestJSON(videoPackage), "json")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedType === "json" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === "json" ? "Copied JSON Manifest!" : "Copy Manifest JSON"}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-xs font-bold text-white">Slide Deck (.MD)</span>
                </div>
                <p className="text-[11px] text-slate-400">Printable slide deck document with graphics & script transcript.</p>
                <button
                  onClick={() => handleCopyText(exportSlideDeckMarkdown(videoPackage), "md")}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold p-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {copiedType === "md" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedType === "md" ? "Copied Slide Deck!" : "Copy Slide Deck"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
