import React, { useState } from "react";
import { UserProfile, AITeacher, LessonUnit, PlanType } from "./types";
import { INITIAL_USER, AI_TEACHERS } from "./data/initialData";
import { MobileContainer } from "./components/MobileContainer";
import { HeaderNav } from "./components/HeaderNav";
import { OnboardingFlow } from "./components/OnboardingFlow";
import { TeacherAvatarCard } from "./components/TeacherAvatarCard";
import { VoiceChatStudio } from "./components/VoiceChatStudio";
import { CurriculumView } from "./components/CurriculumView";
import { LessonPlayer } from "./components/LessonPlayer";
import { PronunciationStudio } from "./components/PronunciationStudio";
import { EssayEvaluator } from "./components/EssayEvaluator";
import { AiContentStudio } from "./components/AiContentStudio";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { CertificateModal } from "./components/CertificateModal";
import { ProgressAnalytics } from "./components/ProgressAnalytics";
import { VideoLessonStudio } from "./components/VideoLessonStudio";
import { Sparkles, MessageSquare, Mic, Layers, Award, Flame } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [activeTab, setActiveTab] = useState<string>("teachers");
  const [selectedTeacher, setSelectedTeacher] = useState<AITeacher>(AI_TEACHERS[0]);
  const [activeLesson, setActiveLesson] = useState<LessonUnit | null>(null);

  // Modals state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const handleUpdateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  const handleCompleteUnit = (xpGained: number) => {
    setUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + xpGained,
      completedLessonIds: activeLesson ? [...prev.completedLessonIds, activeLesson.id] : prev.completedLessonIds
    }));
  };

  const handleUpgradePlan = (newPlan: PlanType) => {
    setUser((prev) => ({ ...prev, plan: newPlan }));
  };

  const handleStartVoiceChat = (teacher: AITeacher) => {
    setSelectedTeacher(teacher);
    setActiveTab("voice");
  };

  return (
    <MobileContainer
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userStreak={user.streakDays}
      userXp={user.totalXp}
      userPlan={user.plan}
      onOpenSubscription={() => setShowSubscription(true)}
    >
      {/* Top Mobile App Navigation Bar */}
      <HeaderNav
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSubscription={() => setShowSubscription(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
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

      {/* Tab 2: CEFR Curriculum Pathway (A1 - C2) */}
      {activeTab === "curriculum" && (
        <CurriculumView
          user={user}
          onUpdateUser={(updated) => handleUpdateUser(updated)}
          onStartRoleplay={(scenarioTitle, initialMessage) => {
            setActiveTab("voice");
          }}
          userLevel={user.currentLevel}
          completedLessonIds={user.completedLessonIds}
          onSelectLesson={(unit) => setActiveLesson(unit)}
        />
      )}

      {/* Tab AI Video Lessons: Complete AI Video Generation System */}
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

      {/* Modals & Overlays */}
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

      {activeLesson && (
        <LessonPlayer
          unit={activeLesson}
          user={user}
          onCompleteUnit={handleCompleteUnit}
          onClose={() => setActiveLesson(null)}
        />
      )}
    </MobileContainer>
  );
}
