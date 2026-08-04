export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type PlanType = "free" | "premium" | "professional";

export interface AITeacher {
  id: string;
  name: string;
  title: string;
  accent: string;
  flag: string;
  avatarUrl: string;
  voiceName: "Kore" | "Fenrir" | "Zephyr" | "Charon" | "Puck";
  specialty: string;
  personality: string;
  bio: string;
  sampleAudioText: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  currentLevel: CEFRLevel;
  targetGoal: string;
  dailyMinutesGoal: number;
  learningStyle: string;
  streakDays: number;
  totalXp: number;
  fluencyScore: number;
  plan: PlanType;
  completedLessonIds: string[];
  savedVocabulary: SavedWord[];
  roadmap?: PersonalizedRoadmap;
}

export interface SavedWord {
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  nativeTranslation: string;
  dateAdded: string;
}

export interface PersonalizedRoadmap {
  curriculumName: string;
  assignedCEFR: string;
  weeklyFocus: string[];
  recommendedTeacher: string;
  dailyPlan: {
    day: string;
    topic: string;
    minutes: number;
  }[];
  aiTip: string;
}

export interface FullCurriculumLesson {
  id: string;
  level: CEFRLevel;
  unitNumber: number;
  moduleNumber: number;
  title: string;
  subtitle: string;
  category: "Grammar" | "Vocabulary" | "Listening" | "Speaking" | "Roleplay" | "Business" | "Academic";
  estimatedMinutes: number;
  xpReward: number;
  learningObjective: string;
  grammarExplanation: {
    summary: string;
    rules: { ruleTitle: string; explanation: string; example: string }[];
    commonMistakes: { incorrect: string; correct: string; reason: string }[];
  };
  vocabularyList: {
    term: string;
    phonetic: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    nativeTranslation: string;
    audioUrl?: string;
  }[];
  exampleSentences: {
    english: string;
    nativeTranslation: string;
    contextNote: string;
  }[];
  listeningScript: {
    title: string;
    audioText: string;
    speakers: { speaker: string; text: string; translation: string }[];
    comprehensionCheck: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  };
  speakingPractice: {
    targetPhrases: { phrase: string; phonetic: string; translation: string; pronunciationTip: string }[];
    phonemeFocus: string[];
  };
  aiConversationScenario: {
    scenarioTitle: string;
    roleplayRole: string;
    teacherRole: string;
    initialMessage: string;
    suggestedResponses: string[];
    contextGoal: string;
  };
  pronunciationPractice: {
    stressPatterns: { word: string; stressedSyllable: string; phonetic: string }[];
    minimalPairs: { wordA: string; wordB: string; difference: string }[];
    intonationType: string;
  };
  exercises: {
    id: string;
    type: "fill_blank" | "sentence_reorder" | "matching" | "multiple_choice";
    prompt: string;
    options?: string[];
    correctAnswer: string;
    hint: string;
  }[];
  quiz: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  homework: {
    assignmentTitle: string;
    instructions: string;
    writingPrompt?: string;
    speakingTaskPrompt?: string;
  };
  aiEvaluationCriteria: {
    targetGrammarMastery: number;
    targetVocabularyDiversity: number;
    accuracyThresholdPercent: number;
    keyFeedbackFocusPoints: string[];
  };
}

export interface CurriculumModuleItem {
  id: string;
  level: CEFRLevel;
  unitNumber: number;
  moduleNumber: number;
  globalLessonIndex: number; // 1 to 900
  title: string;
  topic: string;
  category: "Grammar" | "Vocabulary" | "Listening" | "Speaking" | "Roleplay" | "Business" | "Academic";
  estimatedMinutes: number;
  xpReward: number;
  isUnlocked: boolean;
}

export interface VocabularyDatabaseItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  cefrLevel: CEFRLevel;
  topicDomain: "General" | "Business" | "Travel" | "Tech & AI" | "Healthcare" | "Academic" | "Everyday Social" | "Media & Culture";
  definition: string;
  example: string;
  nativeTranslations: Record<string, string>; // e.g. { es: "...", fr: "...", de: "...", zh: "..." }
  collocations: string[];
  synonyms: string[];
}

export interface SpeakingScenarioItem {
  id: string;
  title: string;
  category: "Business" | "Travel" | "Academic" | "Everyday Social" | "Tech & Engineering" | "Healthcare" | "Flight & Customs" | "Negotiations" | "Emergency" | "Media & Culture";
  cefrLevel: CEFRLevel;
  userRole: string;
  aiTeacherRole: string;
  situationDescription: string;
  targetVocabulary: string[];
  starterPhrase: string;
  difficultyRating: number;
}

export interface ListeningScriptItem {
  id: string;
  title: string;
  category: "News Broadcast" | "Podcast Dialogue" | "Job Interview" | "Airport Announcement" | "Lecture Excerpt" | "Casual Street Chat";
  cefrLevel: CEFRLevel;
  audioDurationSeconds: number;
  speakers: { name: string; accent: string; avatarUrl: string }[];
  transcript: { speaker: string; text: string; timestamp: string; translation?: string }[];
  comprehensionQuiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
}

export interface LessonUnit {
  id: string;
  level: CEFRLevel;
  unitNumber: number;
  title: string;
  subtitle: string;
  category: "Grammar" | "Vocabulary" | "Listening" | "Speaking" | "Roleplay" | "Test";
  estimatedMinutes: number;
  xpReward: number;
  isLocked?: boolean;
  content: {
    explanation?: string;
    rules?: string[];
    vocabulary?: { term: string; phonetic: string; definition: string; example: string; translation?: string }[];
    audioDialogue?: { speaker: string; text: string; audioText?: string; translation?: string }[];
    quizQuestions?: {
      id: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
    speakingPrompts?: {
      id: string;
      phrase: string;
      phonetic: string;
      translation: string;
      hint: string;
    }[];
  };
}

export interface SpeechAssessmentResult {
  accuracyScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  overallCEFR: string;
  feedbackText: string;
  wordFeedback: {
    word: string;
    accuracy: number;
    status: "excellent" | "good" | "needs_practice";
  }[];
  nativeAlternative: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "teacher";
  text: string;
  timestamp: string;
  grammarCorrection?: string | null;
  betterPhrasing?: string;
  pronunciationFocus?: string[];
  audioBase64?: string;
}

export interface EssayResult {
  cefrGrade: string;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  corrections: {
    original: string;
    suggestion: string;
    explanation: string;
  }[];
  advancedVocabularySuggestions: {
    basic: string;
    advanced: string;
  }[];
  summaryFeedback: string;
}

export interface QuizQuestion {
  id: string;
  category: string;
  level: CEFRLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SubtitleCue {
  id: string;
  startTime: string; // e.g. "00:00:02.500"
  endTime: string;   // e.g. "00:00:07.200"
  startSeconds: number;
  endSeconds: number;
  speaker: string;
  text: string;
  nativeTranslation?: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  sectionCategory: "1. Introduction" | "2. Teaching Explanation" | "3. Examples" | "4. Practice" | "5. Review" | "6. Homework";
  durationSeconds: number;
  cameraFraming: "Medium Close-Up" | "Wide Studio" | "Split Screen" | "Lower Third Focus" | "Presentation Full";
  avatarPose: string;
  facialExpressionCue: string;
  backgroundDescription: string;
  animationInstructions: string;
  onScreenText: string[];
  motionTransition: "Smooth Dissolve" | "Slide Left" | "Pop In Graphic" | "Zoom Focus" | "Fade through Black";
  spokenScript: string;
  slideContent: {
    heading: string;
    subheading?: string;
    bulletPoints?: string[];
    grammarHighlightBox?: { title: string; ruleText: string; example: string };
    vocabularyCard?: { term: string; phonetic: string; definition: string; example: string };
    codeOrSentenceExample?: string;
    commonMistakes?: { mistake: string; correction: string; reason: string }[];
  };
  visualAssetSuggestions: {
    primaryGraphicPrompt: string;
    assetType: "3D Illustration" | "Vector Graphic" | "Studio Photo" | "Motion Infographic" | "Icon Grid";
    recommendedIcons: string[];
    colorPalette: string[];
  };
  interactivePractice?: {
    repeatAfterTeacherSentence: string;
    phoneticFocus: string;
    aiConversationPrompt: string;
  };
  homeworkAssignment?: {
    speakingTask: string;
    writingTask: string;
    practiceActivity: string;
  };
  quizCheckpoint?: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface AIVideoLessonPackage {
  lessonId: string;
  title: string;
  cefrLevel: CEFRLevel;
  totalDurationSeconds: number;
  assignedTeacher: AITeacher;
  summary: {
    keyTakeaways: string[];
    grammarSummary: string;
    vocabularySummary: string[];
    estimatedXp: number;
  };
  avatarTeachingScript: {
    introduction: string;
    mainInstruction: string;
    guidedPractice: string;
    conclusion: string;
    fullNarrativeText: string;
  };
  voiceNarrationConfig: {
    voiceName: string;
    accent: string;
    recommendedRate: number;
    pitch: string;
    sampleAudioText: string;
  };
  storyboard: StoryboardScene[];
  subtitleScript: SubtitleCue[];
  quizPresentation: {
    quizTitle: string;
    passScorePercent: number;
    questions: {
      id: string;
      sceneTriggerIndex: number;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  homeworkSection?: {
    speakingTask: string;
    writingTask: string;
    practiceActivity: string;
  };
  createdAt: string;
}

