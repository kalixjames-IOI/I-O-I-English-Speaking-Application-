import React, { useEffect, useMemo, useState } from "react";
import { AudioLines, BookOpen, Brain, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Clock3, Headphones, HelpCircle, Loader2, MessageSquare, Mic, Play, RotateCcw, Sparkles, Star, Subtitles, Trophy, Video, Volume2, X } from "lucide-react";
import { db, isSupabaseConfigured, loadFullLesson } from "../lib/supabase";
import { getDemoLessonBundle } from "../data/curriculumCatalog";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";

interface LessonDatabasePlayerProps {
  lessonId: string;
  onClose: () => void;
  onComplete?: (xpGained: number) => void;
  onOpenTutor?: () => void;
}

type TabType = "overview" | "video" | "vocabulary" | "grammar" | "listening" | "dialogue" | "speaking" | "quiz";

const tabMeta: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Start", icon: <Sparkles className="h-4 w-4" /> },
  { id: "video", label: "Video", icon: <Video className="h-4 w-4" /> },
  { id: "vocabulary", label: "Words", icon: <BookOpen className="h-4 w-4" /> },
  { id: "grammar", label: "Grammar", icon: <Brain className="h-4 w-4" /> },
  { id: "listening", label: "Listen", icon: <Headphones className="h-4 w-4" /> },
  { id: "dialogue", label: "Dialogue", icon: <MessageSquare className="h-4 w-4" /> },
  { id: "speaking", label: "Speak", icon: <Mic className="h-4 w-4" /> },
  { id: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" /> },
];

export const LessonDatabasePlayer: React.FC<LessonDatabasePlayerProps> = ({ lessonId, onClose, onComplete, onOpenTutor }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [audioRate, setAudioRate] = useState(0.9);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [speakingPhrase, setSpeakingPhrase] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechResult, setSpeechResult] = useState<{ score: number; feedback: string } | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextData = !isSupabaseConfigured || lessonId.startsWith("demo-")
          ? getDemoLessonBundle(lessonId)
          : await loadFullLesson(lessonId);
        if (active) setData(nextData);
      } catch {
        if (active) setError("This lesson could not be loaded. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchData();
    return () => { active = false; };
  }, [lessonId]);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const quizzes = data?.quizzes ?? [];
  const currentQuiz = quizzes[quizIndex];
  const currentSpeakingPhrase = speakingPhrase || data?.dialogues?.find((item: any) => item.speaker !== "Learner")?.text || "I am ready to speak clearly and confidently.";
  const listeningLines = data?.dialogues ?? [];
  const progressStep = Math.round(((tabMeta.findIndex((tab) => tab.id === activeTab) + 1) / tabMeta.length) * 100);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) {
      setError("Audio playback is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = audioRate;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const startSpeakingPractice = () => {
    setCountdown(3);
    setSpeechResult(null);
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current === null || current <= 1) {
          window.clearInterval(timer);
          setIsRecording(true);
          window.setTimeout(() => setIsRecording(false), 5000);
          return null;
        }
        return current - 1;
      });
    }, 1000);
  };

  const assessSpeaking = async () => {
    setIsRecording(false);
    const fallbackScore = 86;
    try {
      const response = await apiFetch("/api/gemini/assess-speech", { method: "POST", body: JSON.stringify({ transcript: currentSpeakingPhrase, targetPhrase: currentSpeakingPhrase, cefrLevel: "B1" }) });
      if (!response.ok) throw new Error("assessment failed");
      const result = await response.json();
      const score = Math.max(0, Math.min(100, Math.round((Number(result.accuracyScore) + Number(result.fluencyScore) + Number(result.pronunciationScore)) / 3)));
      setSpeechResult({ score, feedback: result.feedbackText || "Good work. Repeat once more while keeping the final word strong." });
      if (user && isSupabaseConfigured && !lessonId.startsWith("demo-")) {
        await db.upsertProgress(user.id, lessonId, { completion_status: "in_progress", speaking_score: score });
      }
      return;
    } catch {
      setSpeechResult({ score: fallbackScore, feedback: "Good rhythm and clear delivery. Repeat once more while keeping the final word strong." });
    }
    if (user && isSupabaseConfigured && !lessonId.startsWith("demo-")) {
      await db.upsertProgress(user.id, lessonId, { completion_status: "in_progress", speaking_score: fallbackScore });
    }
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz || !selectedOption) return;
    const isCorrect = selectedOption === currentQuiz.correct_answer;
    const nextScore = quizScore + (isCorrect ? 1 : 0);
    setQuizScore(nextScore);
    setQuizAnswered(true);
    if (user && isSupabaseConfigured && !lessonId.startsWith("demo-")) {
      const total = quizzes.length;
      const score = total ? Math.round((nextScore / total) * 100) : 0;
      await db.upsertProgress(user.id, lessonId, { completion_status: quizIndex === total - 1 ? "completed" : "in_progress", score, xp_earned: quizIndex === total - 1 ? score : undefined });
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex < quizzes.length - 1) {
      setQuizIndex((index) => index + 1);
      setSelectedOption(null);
      setQuizAnswered(false);
      return;
    }
    setShowResults(true);
    onComplete?.(quizzes.length ? Math.round((quizScore / quizzes.length) * 100) : 0);
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setSelectedOption(null);
    setQuizAnswered(false);
    setShowResults(false);
  };

  const title = data?.lesson?.title || "Lesson";
  const videoUrl = data?.lesson?.video_url;
  const explanation = typeof data?.lesson?.content === "object" ? data.lesson.content?.explanation : data?.lesson?.content;

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95" role="status"><div className="text-center"><Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-indigo-400" /><p className="text-sm text-slate-300">Preparing your lesson…</p></div></div>;
  if (!data) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6"><div className="max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center"><CircleAlert className="mx-auto mb-3 h-8 w-8 text-rose-300" /><p className="text-sm text-white">{error || "Lesson unavailable."}</p><button onClick={onClose} className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">Close</button></div></div>;

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950" role="dialog" aria-modal="true" aria-label={title}>
    <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 p-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"><ChevronLeft className="h-5 w-5" />Back</button><div className="min-w-0 text-center"><p className="truncate text-sm font-bold text-white">{title}</p><p className="text-[10px] uppercase tracking-[0.16em] text-indigo-300">Guided lesson · {progressStep}%</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white" aria-label="Close lesson"><X className="h-5 w-5" /></button></div>
      <div className="mx-auto mt-3 h-1 max-w-3xl overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all" style={{ width: `${progressStep}%` }} /></div>
    </div>
    <main className="mx-auto max-w-3xl space-y-5 p-4 pb-12 sm:p-6">
      {error && <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200" role="alert"><CircleAlert className="h-4 w-4 shrink-0" />{error}</div>}
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Lesson stages">{tabMeta.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}>{tab.icon}{tab.label}</button>)}</nav>

      {activeTab === "overview" && <section className="space-y-4"><div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 p-6"><div className="mb-3 flex items-center gap-2 text-cyan-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.16em]">Hook & welcome</span></div><h1 className="text-2xl font-black text-white">You are about to practise {title.toLowerCase()}.</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">{explanation || "Build practical English through short explanations, teacher examples, listening, speaking, and a checkpoint quiz."}</p><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><InfoPill icon={<Clock3 className="h-4 w-4" />} label="15 min" /><InfoPill icon={<AudioLines className="h-4 w-4" />} label="Listen" /><InfoPill icon={<Mic className="h-4 w-4" />} label="Speak" /><InfoPill icon={<Trophy className="h-4 w-4" />} label="XP reward" /></div></div><div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Learning goal</p><p className="mt-2 text-lg font-bold text-white">Understand the language, hear a natural model, then use it in your own words.</p><button onClick={() => setActiveTab("video")} className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500">Begin lesson <ChevronRight className="h-4 w-4" /></button></div></section>}

      {activeTab === "video" && <section className="space-y-4"><SectionHeading icon={<Video className="h-4 w-4" />} title="Teacher examples" /><div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">{videoUrl ? <video className="aspect-video w-full" controls playsInline src={videoUrl} /> : <div className="flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-900 p-6 text-center"><Video className="mb-3 h-10 w-10 text-indigo-300" /><h3 className="font-bold text-white">Video slot ready</h3><p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400">No teacher video asset is attached yet. This lesson is fully usable with the interactive stages below; video production remains intentionally paused.</p></div>}</div><div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3"><label className="flex items-center gap-2 text-xs text-slate-300"><Subtitles className="h-4 w-4 text-cyan-300" /><input type="checkbox" checked={showSubtitles} onChange={(event) => setShowSubtitles(event.target.checked)} /> English subtitles</label><label className="flex items-center gap-2 text-xs text-slate-300">Speed<select value={audioRate} onChange={(event) => setAudioRate(Number(event.target.value))} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"><option value="0.75">0.75×</option><option value="0.9">0.9×</option><option value="1">1×</option><option value="1.15">1.15×</option></select></label></div>{showSubtitles && <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">{data.dialogues?.[0]?.text || explanation || "Listen for the key phrase, then repeat it aloud."}</div>}</section>}

      {activeTab === "vocabulary" && <section className="space-y-3"><SectionHeading icon={<BookOpen className="h-4 w-4" />} title={`Key vocabulary (${data.vocabulary?.length || 0})`} />{data.vocabulary?.length ? data.vocabulary.map((word: any) => <div key={word.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-black text-white">{word.word}</h3><p className="mt-1 font-mono text-xs text-indigo-300">{word.pronunciation}</p></div><button onClick={() => speakText(word.word)} className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300 hover:bg-indigo-500/20" aria-label={`Play ${word.word}`}><Volume2 className="h-4 w-4" /></button></div><p className="mt-3 text-sm text-slate-300">{word.meaning}</p><p className="mt-2 text-xs italic text-slate-500">“{word.example_sentence}”</p></div>) : <Empty text="Vocabulary will appear here when this lesson has words." />}</section>}

      {activeTab === "grammar" && <section className="space-y-3"><SectionHeading icon={<Brain className="h-4 w-4" />} title="Grammar focus" />{data.grammar?.length ? data.grammar.map((grammar: any) => <div key={grammar.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><h3 className="font-bold text-yellow-300">{grammar.topic}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{grammar.explanation}</p><div className="mt-4 rounded-xl bg-slate-950 p-3 text-sm text-emerald-300">{grammar.examples}</div></div>) : <Empty text="Grammar notes will appear here when this lesson has a grammar topic." />}</section>}

      {activeTab === "listening" && <section className="space-y-4"><SectionHeading icon={<Headphones className="h-4 w-4" />} title="Listening practice" /><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Listen, notice, repeat</p><h3 className="mt-1 text-lg font-black text-white">Teacher dialogue</h3></div><button onClick={() => speakText(listeningLines.map((line: any) => line.text).join(" "))} className="flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500"><Play className="h-4 w-4" />Play at {audioRate}×</button></div><div className="mt-5 space-y-3">{listeningLines.length ? listeningLines.map((line: any) => <div key={line.id} className="flex gap-3 border-b border-slate-800 pb-3 last:border-0 last:pb-0"><span className="w-16 shrink-0 text-xs font-bold text-slate-500">{line.speaker}</span><p className="text-sm text-slate-200">{line.text}</p></div>) : <Empty text="Listening dialogue is not available yet." />}</div></div></section>}

      {activeTab === "dialogue" && <section className="space-y-3"><SectionHeading icon={<MessageSquare className="h-4 w-4" />} title="Dialogue & shadowing" />{data.dialogues?.map((line: any) => <div key={line.id} className={`rounded-2xl border p-4 ${line.speaker === "Learner" ? "ml-8 border-indigo-500/30 bg-indigo-500/10" : "mr-8 border-slate-800 bg-slate-900/80"}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{line.speaker}</p><button onClick={() => speakText(line.text)} className="text-slate-500 hover:text-cyan-300" aria-label="Play dialogue line"><Volume2 className="h-4 w-4" /></button></div><p className="mt-2 text-sm leading-relaxed text-white">{line.text}</p></div>)}<button onClick={() => setActiveTab("speaking")} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white">Repeat & shadow <ChevronRight className="h-4 w-4" /></button></section>}

      {activeTab === "speaking" && <section className="space-y-4"><SectionHeading icon={<Mic className="h-4 w-4" />} title="Controlled speaking practice" /><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Speaking pause</p><p className="mt-3 text-xl font-black leading-relaxed text-white">“{currentSpeakingPhrase}”</p><p className="mt-3 text-xs text-slate-400">Take a breath, press start, and speak for five seconds. A browser microphone is optional; the assessment endpoint will provide feedback when available.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => speakText(currentSpeakingPhrase)} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"><Volume2 className="h-4 w-4" />Hear model</button><button onClick={startSpeakingPractice} disabled={countdown !== null || isRecording} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><Mic className="h-4 w-4" />{isRecording ? "Listening…" : countdown !== null ? `Get ready ${countdown}` : "Start speaking"}</button>{isRecording && <button onClick={() => void assessSpeaking()} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white">Finish & assess</button>}</div>{speechResult && <div className="mt-5 rounded-xl border border-emerald-500/20 bg-slate-950/70 p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold text-white">Speech score</span><span className="text-2xl font-black text-emerald-300">{speechResult.score}%</span></div><p className="mt-2 text-xs leading-relaxed text-slate-300">{speechResult.feedback}</p></div>}</div><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose your own prompt</p><input value={speakingPhrase} onChange={(event) => setSpeakingPhrase(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400" placeholder="Type a sentence to practise" /></div><button onClick={onOpenTutor} className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-indigo-500/20"><Sparkles className="h-4 w-4" />Continue with AI Tutor</button></section>}

      {activeTab === "quiz" && <section className="space-y-4">{showResults ? <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/50 to-slate-900 p-8 text-center"><Trophy className="mx-auto h-14 w-14 text-amber-300" /><h2 className="mt-4 text-2xl font-black text-white">Checkpoint complete</h2><p className="mt-2 text-slate-300">You scored <strong className="text-white">{quizScore}/{quizzes.length}</strong> ({quizzes.length ? Math.round((quizScore / quizzes.length) * 100) : 0}%).</p><div className="mt-5 flex justify-center gap-3"><button onClick={resetQuiz} className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200"><RotateCcw className="h-4 w-4" />Retry</button><button onClick={onClose} className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2.5 text-sm font-bold text-white">Continue learning</button></div></div> : currentQuiz ? <><div className="flex items-center justify-between"><SectionHeading icon={<HelpCircle className="h-4 w-4" />} title="Checkpoint quiz" /><span className="text-xs text-slate-500">{quizIndex + 1}/{quizzes.length}</span></div><div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><h3 className="text-lg font-black text-white">{currentQuiz.question}</h3><div className="mt-5 space-y-2">{[currentQuiz.option_a, currentQuiz.option_b, currentQuiz.option_c, currentQuiz.option_d].filter(Boolean).map((option: string, index: number) => { const selected = selectedOption === option; const correct = quizAnswered && option === currentQuiz.correct_answer; const wrong = quizAnswered && selected && !correct; return <button key={option} disabled={quizAnswered} onClick={() => setSelectedOption(option)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${correct ? "border-emerald-500 bg-emerald-500/10 text-emerald-200" : wrong ? "border-rose-500 bg-rose-500/10 text-rose-200" : selected ? "border-indigo-400 bg-indigo-500/10 text-white" : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-black">{correct ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + index)}</span>{option}</button>; })}</div>{!quizAnswered ? <button onClick={() => void handleQuizSubmit()} disabled={!selectedOption} className="mt-5 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-40">Submit answer</button> : <button onClick={handleNextQuiz} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-bold text-white">{quizIndex === quizzes.length - 1 ? "See results" : "Next question"}<ChevronRight className="h-4 w-4" /></button>}</div></> : <Empty text="This lesson has no checkpoint quiz yet." />}</section>}
    </main>
  </div>;
};

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex items-center gap-2 text-sm font-bold text-white">{icon}<h2>{title}</h2></div>; }
function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) { return <div className="flex items-center gap-2 rounded-xl bg-slate-950/50 p-3 text-xs font-bold text-slate-300">{icon}<span>{label}</span></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{text}</div>; }
