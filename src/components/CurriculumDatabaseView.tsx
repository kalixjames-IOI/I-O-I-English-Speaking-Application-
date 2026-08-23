import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Loader2, Sparkles } from "lucide-react";
import { db, isSupabaseConfigured } from "../lib/supabase";
import { DEMO_LEVELS, DEMO_UNITS, DEMO_LESSONS, type CatalogLesson, type CatalogLevel, type CatalogUnit } from "../data/curriculumCatalog";
import { useAuth } from "../lib/AuthContext";

interface CurriculumDatabaseViewProps {
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds?: string[];
}

type ViewLevel = CatalogLevel;
type ViewUnit = CatalogUnit;
type ViewLesson = CatalogLesson;

const normalizeLevel = (name: string, order: number): ViewLevel["code"] => {
  const match = name.toUpperCase().match(/A1|A2|B1|B2|C1/);
  if (match) return match[0] as ViewLevel["code"];
  return (["A1", "A2", "B1", "B2", "C1"] as const)[Math.max(0, Math.min(order - 1, 4))];
};

export const CurriculumDatabaseView: React.FC<CurriculumDatabaseViewProps> = ({ onSelectLesson, completedLessonIds = [] }) => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<ViewLevel[]>([]);
  const [units, setUnits] = useState<ViewUnit[]>([]);
  const [lessons, setLessons] = useState<ViewLesson[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<ViewLevel | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ViewUnit | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [lessonLoading, setLessonLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completed = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);

  useEffect(() => {
    let active = true;
    const fetchLevels = async () => {
      setLoading(true);
      setError(null);
      if (!isSupabaseConfigured) {
        setLevels(DEMO_LEVELS);
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await db.getLevels();
      if (!active) return;
      if (queryError) {
        setError("We could not reach the course database. Showing the offline curriculum catalog.");
        setLevels(DEMO_LEVELS);
      } else if (data?.length) {
        setLevels(data.map((level) => ({
          id: level.id,
          code: normalizeLevel(level.name, level.order_number),
          name: level.name,
          description: `Explore the ${level.name} learning path.`,
          order_number: level.order_number,
        })));
      } else {
        setLevels(DEMO_LEVELS);
      }
      setLoading(false);
    };
    void fetchLevels();
    return () => { active = false; };
  }, []);

  const selectLevel = async (level: ViewLevel) => {
    setSelectedLevel(level);
    setSelectedUnit(null);
    setLessons([]);
    setContentLoading(true);
    setError(null);
    if (!isSupabaseConfigured || level.id.startsWith("demo-")) {
      setUnits(DEMO_UNITS.filter((unit) => unit.level_id === level.id));
      setContentLoading(false);
      return;
    }
    const { data, error: queryError } = await db.getUnits(level.id);
    if (queryError) {
      setError("Units could not be loaded. Please check your connection and try again.");
      setUnits([]);
    } else {
      setUnits((data ?? []).map((unit) => ({ id: unit.id, level_id: unit.level_id ?? level.id, order_number: unit.order_number, title: unit.title, description: unit.description ?? "Structured speaking practice" })));
    }
    setContentLoading(false);
  };

  const selectUnit = async (unit: ViewUnit) => {
    setSelectedUnit(unit);
    setLessons([]);
    setContentLoading(true);
    setError(null);
    if (!isSupabaseConfigured || unit.id.startsWith("demo-")) {
      setLessons(DEMO_LESSONS.filter((lesson) => lesson.unit_id === unit.id));
      setContentLoading(false);
      return;
    }
    const { data, error: queryError } = await db.getLessons(unit.id);
    if (queryError) {
      setError("Lessons could not be loaded. Please check your connection and try again.");
      setLessons([]);
    } else {
      setLessons((data ?? []).map((lesson) => ({
        id: lesson.id,
        unit_id: lesson.unit_id ?? unit.id,
        order_number: lesson.order_number ?? 1,
        title: lesson.title,
        lesson_type: lesson.lesson_type ?? "Lesson",
        video_url: lesson.video_url,
        audio_url: lesson.audio_url,
        content: typeof lesson.content === "object" && lesson.content && "explanation" in lesson.content
          ? { explanation: String(lesson.content.explanation) }
          : { explanation: "A structured lesson with vocabulary, grammar, dialogue, listening, speaking, and a checkpoint quiz." },
      })));
    }
    setContentLoading(false);
  };

  const handleLessonClick = async (lesson: ViewLesson) => {
    setLessonLoading(lesson.id);
    setError(null);
    if (user && isSupabaseConfigured && !lesson.id.startsWith("demo-")) {
      const { error: progressError } = await db.upsertProgress(user.id, lesson.id, { completion_status: "in_progress" });
      if (progressError) setError("Lesson opened, but progress could not be saved.");
    }
    onSelectLesson(lesson.id);
    setLessonLoading(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20" role="status"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /><span className="sr-only">Loading curriculum</span></div>;
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-indigo-300"><BookOpen className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Course pathway</span></div>
            <h1 className="text-xl font-black text-white">English Speaking Mastery</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Move from <strong className="text-white">level</strong> to <strong className="text-white">unit</strong> to <strong className="text-white">lesson</strong>, then practise every skill in one guided flow.</p>
          </div>
          <div className="hidden rounded-2xl bg-white/10 p-3 sm:block"><Sparkles className="h-6 w-6 text-cyan-300" /></div>
        </div>
      </section>

      {error && <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200" role="alert"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {!isSupabaseConfigured && <p className="text-[11px] text-slate-500">Demo catalog active. Connect Supabase environment variables to use your production course database.</p>}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs" aria-label="Course breadcrumb">
        <button onClick={() => { setSelectedLevel(null); setSelectedUnit(null); setUnits([]); setLessons([]); }} className={!selectedLevel ? "font-bold text-white" : "text-indigo-300 hover:text-white"}>Levels</button>
        {selectedLevel && <><ChevronRight className="h-3 w-3 text-slate-600" /><button onClick={() => { setSelectedUnit(null); setLessons([]); }} className={!selectedUnit ? "font-bold text-white" : "text-indigo-300 hover:text-white"}>{selectedLevel.code} Units</button></>}
        {selectedUnit && <><ChevronRight className="h-3 w-3 text-slate-600" /><span className="font-bold text-white">Lessons</span></>}
      </div>

      {!selectedLevel && <div className="grid gap-3 sm:grid-cols-2">{levels.map((level) => <button key={level.id} onClick={() => void selectLevel(level)} className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-500/60 hover:bg-slate-800/90"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-lg font-black text-indigo-300">{level.code}</div><div><div className="font-bold text-white">{level.name}</div><div className="mt-1 text-xs text-slate-400">{level.description}</div></div></div><ChevronRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-indigo-300" /></button>)}</div>}

      {selectedLevel && !selectedUnit && <div className="space-y-2">{contentLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-400" /></div> : units.length ? units.map((unit) => <button key={unit.id} onClick={() => void selectUnit(unit)} className="group flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-800/90"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 font-black text-cyan-300">{String(unit.order_number).padStart(2, "0")}</span><div><div className="font-bold text-white">{unit.title}</div><div className="mt-1 text-xs text-slate-400">{unit.description}</div></div></div><ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-cyan-300" /></button>) : <EmptyState text="No units are available for this level yet." />}</div>}

      {selectedUnit && <div className="space-y-3">{contentLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div> : lessons.length ? lessons.map((lesson) => { const isComplete = completed.has(lesson.id); return <button key={lesson.id} onClick={() => void handleLessonClick(lesson)} disabled={lessonLoading === lesson.id} className="group flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-emerald-500/50 hover:bg-slate-800/90 disabled:opacity-70"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isComplete ? "bg-emerald-500/15 text-emerald-300" : "bg-indigo-500/15 text-indigo-300"}`}>{lessonLoading === lesson.id ? <Loader2 className="h-5 w-5 animate-spin" /> : isComplete ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}</span><div><div className="font-bold text-white">Lesson {lesson.order_number}: {lesson.title}</div><div className="mt-1 text-xs text-slate-400">{lesson.lesson_type} · Video, vocabulary, grammar, listening, speaking & quiz</div></div></div><ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-300" /></button>; }) : <EmptyState text="No lessons are available for this unit yet." />}</div>}
    </div>
  );
};

function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">{text}</div>; }
