import React, { useState } from "react";
import type { AITeacher, PlanType, UserProfile } from "./types";
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
import { Sparkles } from "lucide-react";

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

  React.useEffect(() => {
    if (!authUser) return;
    setUser((previous) => ({ ...previous, id: authUser.id, email: authUser.email || previous.email, name: profile?.full_name || authUser.user_metadata?.full_name || previous.name }));
  }, [authUser, profile]);

  React.useEffect(() => {
    if (!authUser || !isSupabaseConfigured) return;
    let active = true;
    void Promise.all([db.getProgress(authUser.id), db.getSubscription(authUser.id)]).then(([progressResult, subscriptionResult]) => {
      if (!active) return;
      if (!progressResult.error) {
        const rows = progressResult.data ?? [];
        setUser((previous) => ({
          ...previous,
          completedLessonIds: rows.filter((row) => row.completion_status === "completed" && row.lesson_id).map((row) => row.lesson_id as string),
          totalXp: rows.reduce((sum, row) => sum + Number(row.xp_earned ?? 0), 0),
        }));
      }
      if (!subscriptionResult.error && subscriptionResult.data?.plan_name) {
        const plan = subscriptionResult.data.plan_name as PlanType;
        if (["free", "premium", "professional"].includes(plan)) setUser((previous) => ({ ...previous, plan }));
      }
    });
    return () => { active = false; };
  }, [authUser]);

  const updateUser = (fields: Partial<UserProfile>) => setUser((previous) => ({ ...previous, ...fields }));
  const handleUpdateUser = (fields: Partial<UserProfile>) => {
    updateUser(fields);
    if (authUser && isSupabaseConfigured) {
      void db.updateProfile(authUser.id, { full_name: fields.name, native_language: fields.nativeLanguage });
    }
  };
  const handleCompleteLesson = (xpGained: number) => {
    const alreadyCompleted = activeLessonId ? user.completedLessonIds.includes(activeLessonId) : false;
    if (!alreadyCompleted) {
      updateUser({ totalXp: user.totalXp + xpGained, completedLessonIds: activeLessonId ? Array.from(new Set([...user.completedLessonIds, activeLessonId])) : user.completedLessonIds });
    }
    setActiveLessonId(null);
  };
  const openTutor = () => setActiveTab("tutor");
  const openTeachers = () => setActiveTab("teachers");
  const openCourse = () => setActiveTab("course");
  const openProfile = () => setActiveTab("profile");

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-center"><div><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /><p className="text-sm text-slate-400">Loading your IOI learning space…</p></div></div>;

  return <><MobileContainer activeTab={activeTab} setActiveTab={setActiveTab} userStreak={user.streakDays} userXp={user.totalXp} userPlan={user.plan} onOpenSubscription={() => setShowSubscription(true)} isAuthenticated={!!authUser} userEmail={authUser?.email} userName={user.name} onSignIn={() => setShowAuth(true)} onSignOut={signOut}><HeaderNav user={user} activeTab={activeTab} setActiveTab={setActiveTab} onOpenSubscription={() => setShowSubscription(true)} onOpenOnboarding={() => setShowOnboarding(true)} isAuthenticated={!!authUser} userEmail={authUser?.email} userName={user.name} onSignIn={() => setShowAuth(true)} onSignOut={signOut} />
      {activeTab === "home" && <HomeDashboard user={user} onOpenCourse={openCourse} onOpenTutor={openTutor} onOpenTeachers={openTeachers} onOpenProfile={openProfile} />}
      {activeTab === "course" && <CurriculumDatabaseView completedLessonIds={user.completedLessonIds} onSelectLesson={setActiveLessonId} />}
      {activeTab === "teachers" && <TeachersView selectedTeacher={selectedTeacher} onSelect={setSelectedTeacher} onStartChat={(teacher) => { setSelectedTeacher(teacher); openTutor(); }} />}
      {activeTab === "tutor" && <VoiceChatStudio teacher={selectedTeacher} user={user} onBack={openTeachers} />}
      {activeTab === "community" && <CommunityView isAuthenticated={!!authUser} onSignIn={() => setShowAuth(true)} />}
      {activeTab === "profile" && <ProgressAnalytics user={user} onOpenSubscription={() => setShowSubscription(true)} onOpenCertificate={() => setShowCertificate(true)} />}
      {activeTab === "speech" && <PronunciationStudio user={user} />}
    </MobileContainer>

    {showAuth && <AuthModal onClose={() => setShowAuth(false)} onComplete={() => setShowAuth(false)} />}
    {showOnboarding && <OnboardingFlow user={user} onComplete={handleUpdateUser} onClose={() => setShowOnboarding(false)} />}
    {showSubscription && <SubscriptionModal currentPlan={user.plan} onClose={() => setShowSubscription(false)} />}
    {showCertificate && <CertificateModal user={user} onClose={() => setShowCertificate(false)} />}
    {activeLessonId && <LessonDatabasePlayer lessonId={activeLessonId} onClose={() => setActiveLessonId(null)} onComplete={handleCompleteLesson} onOpenTutor={openTutor} />}
  </>;
}

function TeachersView({ selectedTeacher, onSelect, onStartChat }: { selectedTeacher: AITeacher; onSelect: (teacher: AITeacher) => void; onStartChat: (teacher: AITeacher) => void }) {
  return <div className="space-y-5 p-4 sm:p-6"><section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 p-5"><div className="flex items-center gap-2 text-indigo-300"><Sparkles className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">AI Teachers</span></div><h1 className="mt-3 text-2xl font-black text-white">Find your speaking coach.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Practise with a teacher matched to your goals, accent preference, and confidence level.</p></section><div className="grid gap-3">{AI_TEACHERS.map((teacher) => <TeacherAvatarCard key={teacher.id} teacher={teacher} isSelected={selectedTeacher.id === teacher.id} onSelect={onSelect} onStartChat={onStartChat} />)}</div></div>;
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }
