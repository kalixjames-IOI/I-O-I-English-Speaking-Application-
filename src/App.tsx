import React, { useState } from "react";
import type { AITeacher, CEFRLevel, PlanType, UserProfile } from "./types";
import { AI_TEACHERS, INITIAL_USER } from "./data/initialData";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { db, isSupabaseConfigured } from "./lib/supabase";
import { AuthModal } from "./components/AuthModal";
import { MobileContainer } from "./components/MobileContainer";
import { HeaderNav } from "./components/HeaderNav";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TeacherAvatarCard } from "./components/TeacherAvatarCard";
import { VoiceChatStudio } from "./components/VoiceChatStudio";
import { PronunciationStudio } from "./components/PronunciationStudio";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { CertificateModal } from "./components/CertificateModal";
import { ProgressAnalytics } from "./components/ProgressAnalytics";
import { CurriculumDatabaseView } from "./components/CurriculumDatabaseView";
import { LessonDatabasePlayer } from "./components/LessonDatabasePlayer";
import { HomeDashboard } from "./components/HomeDashboard";
import { CommunityView } from "./components/CommunityView";
import { AiContentStudio } from "./components/AiContentStudio";
import { Sparkles } from "lucide-react";

type PersistedProfile = {
  full_name?: string | null;
  email?: string | null;
  native_language?: string | null;
  current_level?: string | null;
  target_goal?: string | null;
  daily_minutes_goal?: number | null;
  learning_style?: string | null;
  streak_days?: number | null;
  total_xp?: number | null;
  fluency_score?: number | null;
  plan?: string | null;
  roadmap?: unknown;
};

function isCEFRLevel(value: unknown): value is CEFRLevel { return ["A1", "A2", "B1", "B2", "C1", "C2"].includes(String(value)); }

function AppContent() {
  const { user: authUser, loading: authLoading, signOut, profile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedTeacher, setSelectedTeacher] = useState<AITeacher>(AI_TEACHERS[0]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showContentStudio, setShowContentStudio] = useState(false);

  React.useEffect(() => {
    if (!authUser) return;
    const saved = (profile ?? {}) as PersistedProfile;
    setUser((previous) => ({
      ...previous,
      id: authUser.id,
      email: saved.email || authUser.email || previous.email,
      name: saved.full_name || authUser.user_metadata?.full_name || previous.name,
      nativeLanguage: saved.native_language || previous.nativeLanguage,
      currentLevel: isCEFRLevel(saved.current_level) ? saved.current_level : previous.currentLevel,
      targetGoal: saved.target_goal || previous.targetGoal,
      dailyMinutesGoal: saved.daily_minutes_goal ?? previous.dailyMinutesGoal,
      learningStyle: saved.learning_style || previous.learningStyle,
      streakDays: saved.streak_days ?? previous.streakDays,
      totalXp: saved.total_xp ?? previous.totalXp,
      fluencyScore: saved.fluency_score ?? previous.fluencyScore,
      plan: saved.plan === "premium" || saved.plan === "professional" ? saved.plan : previous.plan,
      roadmap: saved.roadmap && typeof saved.roadmap === "object" ? saved.roadmap as UserProfile["roadmap"] : previous.roadmap,
    }));
  }, [authUser, profile]);

  React.useEffect(() => {
    if (!authUser || !isSupabaseConfigured) return;
    let active = true;
    void db.getProgress(authUser.id).then(({ data, error }) => {
      if (!active || error || !data) return;
      const completedIds = data.filter((item) => item.completion_status === "completed" && item.lesson_id).map((item) => item.lesson_id as string);
      const scored = data.filter((item) => typeof item.speaking_score === "number" && item.speaking_score > 0);
      const averageSpeaking = scored.length ? Math.round(scored.reduce((sum, item) => sum + (item.speaking_score ?? 0), 0) / scored.length) : undefined;
      const earnedXp = data.reduce((sum, item) => sum + (item.xp_earned ?? 0), 0);
      setUser((previous) => ({ ...previous, completedLessonIds: Array.from(new Set([...previous.completedLessonIds, ...completedIds])), totalXp: Math.max(previous.totalXp, earnedXp), fluencyScore: averageSpeaking ?? previous.fluencyScore }));
    });
    return () => { active = false; };
  }, [authUser?.id]);

  const updateUser = (fields: Partial<UserProfile>) => setUser((previous) => ({ ...previous, ...fields }));
  const handleUpdateUser = (fields: Partial<UserProfile>) => {
    updateUser(fields);
    if (authUser && isSupabaseConfigured) {
      const next = { ...user, ...fields };
      void db.updateProfile(authUser.id, { full_name: next.name, native_language: next.nativeLanguage, current_level: next.currentLevel, target_goal: next.targetGoal, daily_minutes_goal: next.dailyMinutesGoal, learning_style: next.learningStyle, streak_days: next.streakDays, total_xp: next.totalXp, fluency_score: next.fluencyScore, plan: next.plan, roadmap: next.roadmap ? JSON.parse(JSON.stringify(next.roadmap)) : null });
    }
    setShowOnboarding(false);
  };
  const handleCompleteLesson = (xpGained: number) => {
    const lessonId = activeLessonId;
    setUser((previous) => {
      const nextXp = previous.totalXp + xpGained;
      if (authUser && isSupabaseConfigured && lessonId) {
        void Promise.all([
          db.upsertProgress(authUser.id, lessonId, { completion_status: "completed", score: 100, xp_earned: xpGained }),
          db.updateProfile(authUser.id, { total_xp: nextXp }),
        ]);
      }
      return { ...previous, totalXp: nextXp, completedLessonIds: lessonId ? Array.from(new Set([...previous.completedLessonIds, lessonId])) : previous.completedLessonIds };
    });
    setActiveLessonId(null);
  };
  const openTutor = () => setActiveTab("tutor");
  const openTeachers = () => setActiveTab("teachers");
  const openCourse = () => setActiveTab("course");
  const openProfile = () => setActiveTab("profile");

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-center"><div><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /><p className="text-sm text-slate-400">Loading your IOI learning space…</p></div></div>;

  return <><MobileContainer activeTab={activeTab} setActiveTab={setActiveTab} userStreak={user.streakDays} userXp={user.totalXp} userPlan={user.plan} onOpenSubscription={() => setShowSubscription(true)} isAuthenticated={!!authUser} userEmail={authUser?.email} userName={user.name} onSignIn={() => setShowAuth(true)} onSignOut={signOut}><HeaderNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} onOpenSubscription={() => setShowSubscription(true)} onOpenOnboarding={() => setShowOnboarding(true)} isAuthenticated={!!authUser} userEmail={authUser?.email} userName={user.name} onSignIn={() => setShowAuth(true)} onSignOut={signOut} />
      {activeTab === "home" && <HomeDashboard user={user} onOpenCourse={openCourse} onOpenTutor={openTutor} onOpenTeachers={openTeachers} onOpenProfile={openProfile} onOpenContentStudio={() => setShowContentStudio(true)} />}
      {activeTab === "course" && <CurriculumDatabaseView completedLessonIds={user.completedLessonIds} onSelectLesson={setActiveLessonId} />}
      {activeTab === "teachers" && <TeachersView selectedTeacher={selectedTeacher} onSelect={setSelectedTeacher} onStartChat={(teacher) => { setSelectedTeacher(teacher); openTutor(); }} />}
      {activeTab === "tutor" && <VoiceChatStudio teacher={selectedTeacher} user={user} onBack={openTeachers} />}
      {activeTab === "community" && <CommunityView isAuthenticated={!!authUser} onSignIn={() => setShowAuth(true)} />}
      {activeTab === "profile" && <ProgressAnalytics user={user} onOpenSubscription={() => setShowSubscription(true)} onOpenCertificate={() => setShowCertificate(true)} />}
      {activeTab === "speech" && <PronunciationStudio user={user} />}
    </MobileContainer>

    {showAuth && <AuthModal onClose={() => setShowAuth(false)} onComplete={() => setShowAuth(false)} />}
    {showOnboarding && <OnboardingFlow user={user} onComplete={handleUpdateUser} onClose={() => setShowOnboarding(false)} />}
    {showSubscription && <SubscriptionModal currentPlan={user.plan} isAuthenticated={!!authUser} onSignIn={() => setShowAuth(true)} onClose={() => setShowSubscription(false)} />}
    {showCertificate && <CertificateModal user={user} onClose={() => setShowCertificate(false)} />}
    {showContentStudio && <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/95"><div className="mx-auto max-w-3xl"><div className="flex justify-end px-4 pt-4"><button onClick={() => setShowContentStudio(false)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">Close</button></div><AiContentStudio user={user} /></div></div>}
    {activeLessonId && <LessonDatabasePlayer lessonId={activeLessonId} onClose={() => setActiveLessonId(null)} onComplete={handleCompleteLesson} onOpenTutor={openTutor} />}
  </>;
}

function TeachersView({ selectedTeacher, onSelect, onStartChat }: { selectedTeacher: AITeacher; onSelect: (teacher: AITeacher) => void; onStartChat: (teacher: AITeacher) => void }) {
  return <div className="space-y-5 p-4 sm:p-6"><section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 p-5"><div className="flex items-center gap-2 text-indigo-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">AI Teachers</span></div><h1 className="mt-3 text-2xl font-black text-white">Find your speaking coach.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Practise with a teacher matched to your goals, accent preference, and confidence level.</p></section><div className="grid gap-3">{AI_TEACHERS.map((teacher) => <TeacherAvatarCard key={teacher.id} teacher={teacher} isSelected={selectedTeacher.id === teacher.id} onSelect={onSelect} onStartChat={onStartChat} />)}</div></div>;
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
