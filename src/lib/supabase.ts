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

// Community tables were added to the live schema after the initial generated type snapshot.
// Keep the query shape explicit and refresh database.types.ts whenever the schema changes.
const communityDb = supabase as any;

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

  upsertProgress: (userId: string, lessonId: string, data: Partial<{ completion_status: string; score: number; speaking_score: number; xp_earned: number }>) => {
    return supabase.from('user_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      ...data,
      last_accessed: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' });
  },

  // Profile
  getProfile: (userId: string) => {
    return supabase.from('profiles').select('*').eq('id', userId).single();
  },

  updateProfile: (userId: string, data: Partial<Database["public"]["Tables"]["profiles"]["Update"]>) => {
    return supabase.from('profiles').update({ ...data, updated_at: new Date().toISOString() }).eq('id', userId);
  },

  // Subscriptions
  getSubscription: (userId: string) => {
    return supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle();
  },

  getCommunityPosts: (limit = 20, offset = 0) => communityDb.from('community_posts').select('id,user_id,author_name,title,body,created_at,community_comments(count),community_post_reactions(count)').order('created_at', { ascending: false }).range(offset, offset + limit - 1),
  createCommunityPost: (userId: string, authorName: string, body: string, title = 'A new practice note') => communityDb.from('community_posts').insert({ user_id: userId, author_name: authorName, title, body }).select('id,user_id,author_name,title,body,created_at').single(),
  getCommunityComments: (postId: string, limit = 50) => communityDb.from('community_comments').select('id,post_id,user_id,author_name,body,created_at').eq('post_id', postId).order('created_at', { ascending: true }).limit(limit),
  createCommunityComment: (postId: string, userId: string, authorName: string, body: string) => communityDb.from('community_comments').insert({ post_id: postId, user_id: userId, author_name: authorName, body }).select('id,post_id,user_id,author_name,body,created_at').single(),
  addCommunityReaction: (postId: string, userId: string) => communityDb.from('community_post_reactions').insert({ post_id: postId, user_id: userId }),
  removeCommunityReaction: (postId: string, userId: string) => communityDb.from('community_post_reactions').delete().eq('post_id', postId).eq('user_id', userId),
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
