import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Keep the demo usable without shipping a project URL or token in source control.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    },
  },
);

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  },

  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signInWithGoogle: async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  },

  signOut: async () => {
    return supabase.auth.signOut();
  },

  getSession: async () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

// Database helper functions
export const db = {
  // Courses
  getCourses: () => {
    return supabase.from('courses').select('*').eq('status', 'active');
  },

  // Levels
  getLevels: (courseId?: string) => {
    let query = supabase.from('levels').select('*').order('order_number');
    if (courseId) query = query.eq('course_id', courseId);
    return query;
  },

  // Units
  getUnits: (levelId: string) => {
    return supabase.from('units').select('*').eq('level_id', levelId).order('order_number');
  },

  // Lessons
  getLessons: (unitId: string) => {
    return supabase.from('lessons').select('*').eq('unit_id', unitId).order('order_number');
  },

  getLesson: (lessonId: string) => {
    return supabase.from('lessons').select('*').eq('id', lessonId).single();
  },

  // Vocabulary
  getVocabulary: (lessonId: string) => {
    return supabase.from('vocabulary').select('*').eq('lesson_id', lessonId);
  },

  // Dialogues
  getDialogues: (lessonId: string) => {
    return supabase.from('dialogues').select('*').eq('lesson_id', lessonId).order('order_number');
  },

  // Grammar Topics
  getGrammarTopics: (lessonId: string) => {
    return supabase.from('grammar_topics').select('*').eq('lesson_id', lessonId);
  },

  // Quizzes
  getQuizzes: (lessonId: string) => {
    return supabase.from('quizzes').select('*').eq('lesson_id', lessonId).order('order_number');
  },

  // Speaking Practice
  getSpeakingPractice: (lessonId: string) => {
    return supabase.from('speaking_practice').select('*').eq('lesson_id', lessonId);
  },

  // User Progress
  getProgress: (userId: string) => {
    return supabase.from('user_progress').select('*').eq('user_id', userId);
  },

  getProgressByLesson: (userId: string, lessonId: string) => {
    return supabase.from('user_progress').select('*').eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
  },

  upsertProgress: (userId: string, lessonId: string, data: Partial<{ completion_status: string; score: number; speaking_score: number }>) => {
    return supabase.from('user_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      ...data,
      last_accessed: new Date().toISOString(),
    });
  },

  // Profile
  getProfile: (userId: string) => {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  updateProfile: (userId: string, data: Partial<{ full_name: string; native_language: string; country: string; avatar_url: string }>) => {
    return supabase.from('profiles').update({ ...data, updated_at: new Date().toISOString() }).eq('id', userId);
  },

  // Subscriptions
  getSubscription: (userId: string) => {
    return supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
  },
};

// Full lesson data loader
export const loadFullLesson = async (lessonId: string) => {
  const [lesson, vocabulary, dialogues, grammar, quizzes, speakingPractice] = await Promise.all([
    db.getLesson(lessonId).then(res => res.data),
    db.getVocabulary(lessonId).then(res => res.data || []),
    db.getDialogues(lessonId).then(res => res.data || []),
    db.getGrammarTopics(lessonId).then(res => res.data || []),
    db.getQuizzes(lessonId).then(res => res.data || []),
    db.getSpeakingPractice(lessonId).then(res => res.data || []),
  ]);

  return {
    lesson,
    vocabulary,
    dialogues,
    grammar,
    quizzes,
    speakingPractice,
  };
};
