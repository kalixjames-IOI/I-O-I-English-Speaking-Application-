import type { CEFRLevel } from "../types";

export const CEFR_LEVELS: Array<{ code: Exclude<CEFRLevel, "C2">; name: string; description: string }> = [
  { code: "A1", name: "Beginner", description: "Build confidence with essential everyday English." },
  { code: "A2", name: "Elementary", description: "Handle routine conversations and practical situations." },
  { code: "B1", name: "Intermediate", description: "Speak independently about familiar and professional topics." },
  { code: "B2", name: "Upper Intermediate", description: "Express ideas clearly with greater range and precision." },
  { code: "C1", name: "Advanced", description: "Communicate fluently in complex academic and professional settings." },
];

export const A1_UNIT_TITLES = [
  "Personal Identity",
  "Daily Life",
  "Family & Friends",
  "Home",
  "Food & Drinks",
  "Time & Dates",
  "Places & Directions",
  "Shopping",
  "School & Work",
  "Health & Basic Needs",
  "Weather",
  "Hobbies & Free Time",
  "Travel & Transportation",
  "Communication",
  "Review & Real-Life Speaking",
] as const;

const UNIT_TITLES: Record<Exclude<CEFRLevel, "C2">, readonly string[]> = {
  A1: A1_UNIT_TITLES,
  A2: ["Routines & Habits", "Past Experiences", "Plans & Invitations", "Services & Requests", "Practical Problems"],
  B1: ["Opinions & Reasons", "Stories & Experiences", "Travel & Culture", "Workplace Communication", "Media & Technology"],
  B2: ["Nuance & Emphasis", "Debate & Persuasion", "Professional Presentations", "Reports & Trends", "Society & Change"],
  C1: ["Advanced Rhetoric", "Academic Discussion", "Leadership & Negotiation", "Global Issues", "Fluent Real-Life Speaking"],
};

export interface CatalogLevel {
  id: string;
  code: Exclude<CEFRLevel, "C2">;
  name: string;
  description: string;
  order_number: number;
}

export interface CatalogUnit {
  id: string;
  level_id: string;
  order_number: number;
  title: string;
  description: string;
}

export interface CatalogLesson {
  id: string;
  unit_id: string;
  order_number: number;
  title: string;
  lesson_type: string;
  video_url: string | null;
  audio_url: string | null;
  content: { explanation: string };
}

export const DEMO_LEVELS: CatalogLevel[] = CEFR_LEVELS.map((level, index) => ({
  id: `demo-level-${level.code.toLowerCase()}`,
  code: level.code,
  name: level.name,
  description: level.description,
  order_number: index + 1,
}));

export const DEMO_UNITS: CatalogUnit[] = DEMO_LEVELS.flatMap((level) =>
  UNIT_TITLES[level.code].map((title, index) => ({
    id: `demo-${level.code.toLowerCase()}-unit-${index + 1}`,
    level_id: level.id,
    order_number: index + 1,
    title,
    description: `Build ${level.code} speaking skills through ${title.toLowerCase()}.`,
  })),
);

export const DEMO_LESSONS: CatalogLesson[] = DEMO_UNITS.flatMap((unit) => [1, 2].map((lessonNumber) => {
  const level = DEMO_LEVELS.find((item) => item.id === unit.level_id)!;
  return {
    id: `${unit.id}-lesson-${lessonNumber}`,
    unit_id: unit.id,
    order_number: lessonNumber,
    title: `${unit.title}: ${lessonNumber === 1 ? "Core Language" : "Speaking Practice"}`,
    lesson_type: lessonNumber === 1 ? "Learn" : "Practice",
    video_url: null,
    audio_url: null,
    content: { explanation: `A guided ${level.code} lesson for ${unit.title.toLowerCase()}. Work through the language, listen, speak, and finish with the checkpoint quiz.` },
  };
}));

export function getDemoLessonBundle(lessonId: string) {
  const lesson = DEMO_LESSONS.find((item) => item.id === lessonId) ?? DEMO_LESSONS[0];
  const unit = DEMO_UNITS.find((item) => item.id === lesson.unit_id) ?? DEMO_UNITS[0];
  const level = DEMO_LEVELS.find((item) => item.id === unit.level_id) ?? DEMO_LEVELS[0];
  const lessonNumber = lesson.order_number;
  const vocabulary = [
    { id: `${lesson.id}-vocab-1`, word: lessonNumber === 1 ? "introduce" : "practice", pronunciation: lessonNumber === 1 ? "/ˌɪntrəˈduːs/" : "/ˈpræktɪs/", meaning: lessonNumber === 1 ? "to tell someone who you are" : "to repeat an activity to improve", example_sentence: `I can ${lessonNumber === 1 ? "introduce myself clearly" : "practice this conversation"}.` },
    { id: `${lesson.id}-vocab-2`, word: "confident", pronunciation: "/ˈkɒnfɪdənt/", meaning: "sure about your ability", example_sentence: "I feel more confident when I speak every day." },
  ];
  const dialogues = [
    { id: `${lesson.id}-dialogue-1`, speaker: "Teacher", text: `Welcome to ${unit.title}. Let’s practice one clear sentence together.` },
    { id: `${lesson.id}-dialogue-2`, speaker: "Learner", text: "I am ready to speak clearly and confidently." },
    { id: `${lesson.id}-dialogue-3`, speaker: "Teacher", text: "Excellent. Now say it again with natural rhythm." },
  ];
  const quizzes = [
    { id: `${lesson.id}-quiz-1`, question: "Which sentence is the clearest speaking response?", option_a: "I ready speak.", option_b: "I am ready to speak clearly.", option_c: "Ready I speaking.", option_d: "I am speak ready.", correct_answer: "I am ready to speak clearly." },
    { id: `${lesson.id}-quiz-2`, question: `What is the main focus of this ${level.code} lesson?`, option_a: unit.title, option_b: "Memorizing silently", option_c: "Avoiding practice", option_d: "Translating every word", correct_answer: unit.title },
  ];
  const grammar = [{ id: `${lesson.id}-grammar-1`, topic: "Clear sentence structure", explanation: "Use a subject, verb, and complement to make your meaning easy to understand.", examples: "I am ready to speak clearly." }];
  const speakingPractice = [{ id: `${lesson.id}-speaking-1`, scenario: `Real-life ${unit.title} conversation`, difficulty_level: level.code === "A1" || level.code === "A2" ? "beginner" : level.code === "B1" ? "intermediate" : "advanced", ai_instruction: "Speak for 20–30 seconds. Focus on complete sentences, steady rhythm, and one new vocabulary word." }];
  return { lesson, vocabulary, dialogues, grammar, quizzes, speakingPractice };
}
