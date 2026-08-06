import React, { useState } from "react";
import { UserProfile, AITeacher, PlanType } from "./types";
import { INITIAL_USER, AI_TEACHERS } from "./data/initialData";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { AuthModal } from "./components/AuthModal";
import { MobileContainer } from "./components/MobileContainer";
import { HeaderNav } from "./components/HeaderNav";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TeacherAvatarCard } from "./components/TeacherAvatarCard";
import { VoiceChatStudio } from "./components/VoiceChatStudio";
import { LessonPlayer } from "./components/LessonPlayer";
import { PronunciationStudio } from "./components/PronunciationStudio";
import { EssayEvaluator } from "./components/EssayEvaluator";
import { AiContentStudio } from "./components/AiContentStudio";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { CertificateModal } from "./components/CertificateModal";
import { ProgressAnalytics } from "./components/ProgressAnalytics";
import { VideoLessonStudio } from "./components/VideoLessonStudio";
import { CurriculumDatabaseView } from "./components/CurriculumDatabaseView";
import { LessonDatabasePlayer } from "./components/LessonDatabasePlayer";
import { Sparkles, MessageSquare, Mic, Layers, Award, Flame } from "lucide-react";

function AppContent() {
  const { user: authUser, session, loading: authLoading, signOut, profile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("teachers");
  const [selectedTeacher, setSelectedTeacher] = useState<AITeacher>(AI_TEACHERS[0]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Local user state (synced with Supabase)
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Sync auth user to local state
  React.useEffect(() => {
    if (authUser && profile) {
      setUser((prev) => ({
        ...prev,
        id: authUser.id,
        email: authUser.email || prev.email,
        name: profile.full_name || prev.name,
      }));
    }
  }, [authUser, profile]);

  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleCompleteUnit = (xpGained: number) => {
    setUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + xpGained,
    }));
    setActiveLessonId(null);
  };

  const handleUpgradePlan = (newPlan: PlanType) => {
    setUser((prev) => ({ ...prev, plan: newPlan }));
  };

  const handleStartVoiceChat = (teacher: AITeacher) => {
    setSelectedTeacher(teacher);
    setActiveTab("voice");
  };

  const handleAuthComplete = () => {
    setShowAuth(false);
    setShowOnboarding(true);
  };

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  // If auth is still loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading I O I Education Network...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileContainer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userStreak={user.streakDays}
        userXp={user.totalXp}
        userPlan={user.plan}
        onOpenSubscription={() => setShowSubscription(true)}
        isAuthenticated={!!authUser}
        userEmail={authUser?.email}
        userName={user.name}
        onSignIn={() => setShowAuth(true)}
        onSignOut={signOut}
      >
        {/* Top Mobile App Navigation Bar */}
        <HeaderNav
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSubscription={() => setShowSubscription(true)}
          onOpenOnboarding={() => setShowOnboarding(true)}
          isAuthenticated={!!authUser}
          onSignIn={() => setShowAuth(true)}
          onSignOut={signOut}
        />

        {/* Tab 1: AI Avatar Teachers Overview */}
        {activeTab === "teachers" && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 border border-slate-800 p-5 rounded-3xl space-y-2 relative overflow-hidden shadow-xl">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h1 className="text-base font-extrabold text-white tracking-tight">AI Avatar Teachers</h1>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                Practice 1-on-1 speaking 24/7 with native AI teachers specialized in conversation, business English, grammar, and exam preparation.
              </p>
            </div>

            {/* Teacher Cards Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available AI Personal Teachers (5)</h3>
              <div className="grid grid-cols-1 gap-3">
                {AI_TEACHERS.map((teacher) => (
                  <TeacherAvatarCard
                    key={teacher.id}
                    teacher={teacher}
                    isSelected={selectedTeacher.id === teacher.id}
                    onSelect={(t) => setSelectedTeacher(t)}
                    onStartChat={handleStartVoiceChat}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CEFR Curriculum Pathway - Database-driven */}
        {activeTab === "curriculum" && (
          <CurriculumDatabaseView
            onSelectLesson={handleSelectLesson}
          />
        )}

        {/* Tab AI Video Lessons */}
        {activeTab === "video" && (
          <VideoLessonStudio
            user={user}
            onUpdateUser={(updated) => handleUpdateUser(updated)}
            onStartRoleplay={(sc, msg) => {
              setActiveTab("voice");
            }}
          />
        )}

        {/* Tab 3: Real-Time AI Teacher Voice Conversation */}
        {activeTab === "voice" && (
          <VoiceChatStudio
            teacher={selectedTeacher}
            user={user}
            onBack={() => setActiveTab("teachers")}
          />
        )}

        {/* Tab 4: Speech & Pronunciation Lab */}
        {activeTab === "pronounce" && <PronunciationStudio user={user} />}

        {/* Tab 5: AI Essay & Writing Examiner */}
        {activeTab === "essay" && <EssayEvaluator user={user} />}

        {/* Tab 6: On-Demand AI Scenario Generator */}
        {activeTab === "studio" && <AiContentStudio user={user} />}

        {/* Tab 7: Learner Analytics & Saved Vocabulary */}
        {activeTab === "analytics" && (
          <ProgressAnalytics
            user={user}
            onOpenSubscription={() => setShowSubscription(true)}
            onOpenCertificate={() => setShowCertificate(true)}
          />
        )}
      </MobileContainer>

      {/* Modals & Overlays */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onComplete={handleAuthComplete}
        />
      )}

      {showOnboarding && (
        <OnboardingFlow
          user={user}
          onComplete={handleUpdateUser}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {showSubscription && (
        <SubscriptionModal
          currentPlan={user.plan}
          onUpgradePlan={handleUpgradePlan}
          onClose={() => setShowSubscription(false)}
        />
      )}

      {showCertificate && (
        <CertificateModal
          user={user}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {activeLessonId && (
        <LessonDatabasePlayer
          lessonId={activeLessonId}
          onClose={() => setActiveLessonId(null)}
          onComplete={handleCompleteUnit}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
