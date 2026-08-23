import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// A valid placeholder keeps the module importable for the offline demo. All callers that
// touch Supabase are guarded by isSupabaseConfigured, so no request is sent in demo mode.
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

const communityDb = supabase as any;

export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured) return { data: { user: null, session: null }, error: new Error("Supabase is not configured") };
    return supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  },

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { data: { user: null, session: null }, error: new Error("Supabase is not configured") };
    return supabase.auth.signInWithPassword({ email, password });
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) return { data: { provider: "google", url: null }, error: new Error("Supabase is not configured") };
    return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return { error: null };
    return supabase.auth.signOut();
  },

  getSession: async () => {
    if (!isSupabaseConfigured) return { data: { session: null }, error: null };
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (session: any) => void) => {
    if (!isSupabaseConfigured) return { data: { subscription: { unsubscribe: () => undefined } } } as any;
    return supabase.auth.onAuthStateChange((_event, session) => callback(session));
  },
};

export const db = {
  getCourses: () => supabase.from("courses").select("*").eq("status", "active"),
  getLevels: (courseId?: string) => {
    let query = supabase.from("levels").select("*").order("order_number");
    if (courseId) query = query.eq("course_id", courseId);
    return query;
  },
  getUnits: (levelId: string) => supabase.from("units").select("*").eq("level_id", levelId).order("order_number"),
  getLessons: (unitId: string) => supabase.from("lessons").select("*").eq("unit_id", unitId).order("order_number"),
  getLesson: (lessonId: string) => supabase.from("lessons").select("*").eq("id", lessonId).single(),
  getVocabulary: (lessonId: string) => supabase.from("vocabulary").select("*").eq("lesson_id", lessonId),
  getDialogues: (lessonId: string) => supabase.from("dialogues").select("*").eq("lesson_id", lessonId).order("order_number"),
  getGrammarTopics: (lessonId: string) => supabase.from("grammar_topics").select("*").eq("lesson_id", lessonId),
  getQuizzes: (lessonId: string) => supabase.from("quizzes").select("*").eq("lesson_id", lessonId).order("order_number"),
  getSpeakingPractice: (lessonId: string) => supabase.from("speaking_practice").select("*").eq("lesson_id", lessonId),

  getProgress: (userId: string) => supabase.from("user_progress").select("lesson_id,completion_status,score,speaking_score,xp_earned,last_accessed").eq("user_id", userId),
  getProgressByLesson: (userId: string, lessonId: string) => supabase.from("user_progress").select("*").eq("user_id", userId).eq("lesson_id", lessonId).maybeSingle(),
  upsertProgress: (userId: string, lessonId: string, data: Partial<{ completion_status: string; score: number; speaking_score: number; xp_earned: number }>) => supabase.from("user_progress").upsert({ user_id: userId, lesson_id: lessonId, ...data, last_accessed: new Date().toISOString() }, { onConflict: "user_id,lesson_id" }),

  getProfile: (userId: string) => supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  ensureProfile: (userId: string, email?: string, fullName?: string) => supabase.from("profiles").upsert({ id: userId, email: email ?? null, full_name: fullName ?? "" }, { onConflict: "id" }).select("*").single(),
  updateProfile: (userId: string, data: Partial<{ full_name: string; native_language: string; country: string; avatar_url: string }>) => supabase.from("profiles").update({ ...data, updated_at: new Date().toISOString() }).eq("id", userId),

  getSubscription: (userId: string) => supabase.from("subscriptions").select("plan_name,status,start_date,end_date,payment_provider").eq("user_id", userId).eq("status", "active").maybeSingle(),

  getCommunityPosts: (limit = 20, offset = 0) => communityDb.from("community_posts").select("id,user_id,author_name,title,body,created_at,community_comments(count),community_post_reactions(count)").order("created_at", { ascending: false }).range(offset, offset + limit - 1),
  createCommunityPost: (userId: string, authorName: string, body: string, title = "A new practice note") => communityDb.from("community_posts").insert({ user_id: userId, author_name: authorName, title, body }).select("id,user_id,author_name,title,body,created_at").single(),
  getCommunityComments: (postId: string, limit = 50) => communityDb.from("community_comments").select("id,post_id,user_id,author_name,body,created_at").eq("post_id", postId).order("created_at", { ascending: true }).limit(limit),
  createCommunityComment: (postId: string, userId: string, authorName: string, body: string) => communityDb.from("community_comments").insert({ post_id: postId, user_id: userId, author_name: authorName, body }).select("id,post_id,user_id,author_name,body,created_at").single(),
  addCommunityReaction: (postId: string, userId: string) => communityDb.from("community_post_reactions").insert({ post_id: postId, user_id: userId }),
  removeCommunityReaction: (postId: string, userId: string) => communityDb.from("community_post_reactions").delete().eq("post_id", postId).eq("user_id", userId),
};

export const loadFullLesson = async (lessonId: string) => {
  const [lesson, vocabulary, dialogues, grammar, quizzes, speakingPractice] = await Promise.all([
    db.getLesson(lessonId).then((res) => res.data),
    db.getVocabulary(lessonId).then((res) => res.data || []),
    db.getDialogues(lessonId).then((res) => res.data || []),
    db.getGrammarTopics(lessonId).then((res) => res.data || []),
    db.getQuizzes(lessonId).then((res) => res.data || []),
    db.getSpeakingPractice(lessonId).then((res) => res.data || []),
  ]);

  return { lesson, vocabulary, dialogues, grammar, quizzes, speakingPractice };
};
