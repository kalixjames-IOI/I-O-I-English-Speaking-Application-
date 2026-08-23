import React, { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, MessageCircle, PenLine, Send, Users } from "lucide-react";
import { db, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

type Post = { id: string; user_id?: string; author_name: string; title: string; body: string; created_at: string; likes: number; replies: number };
type Comment = { id: string; post_id: string; user_id: string; author_name: string; body: string; created_at: string };

const starterPosts: Post[] = [
  { id: "welcome", author_name: "IOI Teacher Team", created_at: "Today", title: "What are you practising this week?", body: "Share one English speaking goal with the community. A clear, small target makes progress easier to notice.", likes: 24, replies: 8 },
  { id: "shadowing", author_name: "Mina K.", created_at: "Yesterday", title: "Shadowing helped my rhythm", body: "I listened to one short dialogue three times, then repeated it without looking. My pauses felt much more natural.", likes: 17, replies: 5 },
  { id: "interview", author_name: "Daniel R.", created_at: "2 days ago", title: "Interview practice partners", body: "Looking for a partner to practise concise answers to common interview questions at B1–B2 level.", likes: 11, replies: 3 },
];

export const CommunityView: React.FC<{ isAuthenticated: boolean; onSignIn: () => void }> = ({ isAuthenticated, onSignIn }) => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorName = useMemo(() => profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner", [profile, user]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setPosts(starterPosts);
      setLoading(false);
      return () => { active = false; };
    }
    void db.getCommunityPosts(20, 0).then(({ data, error: queryError }: any) => {
      if (!active) return;
      if (queryError) {
        setError("Community storage is not available yet. Apply the production Supabase migration before launch.");
        setPosts([]);
      } else {
        setPosts((data ?? []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          author_name: row.author_name,
          title: row.title,
          body: row.body,
          created_at: new Date(row.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          likes: Number(row.community_post_reactions?.[0]?.count ?? 0),
          replies: Number(row.community_comments?.[0]?.count ?? 0),
        })));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLiked([]);
      return;
    }
    void db.getCommunityReactions(user.id).then(({ data, error: reactionError }: any) => {
      if (!reactionError) setLiked((data ?? []).map((row: { post_id: string }) => row.post_id));
    });
  }, [user]);

  const submitPost = async () => {
    const body = draft.trim();
    if (!body) return;
    if (!isAuthenticated || !user) { onSignIn(); return; }
    setSubmitting(true);
    setError(null);
    if (!isSupabaseConfigured) {
      setPosts((current) => [{ id: `local-${Date.now()}`, author_name: authorName, created_at: "Just now", title: "A new practice note", body, likes: 0, replies: 0 }, ...current]);
      setDraft("");
      setSubmitting(false);
      return;
    }
    const { data, error: createError }: any = await db.createCommunityPost(user.id, authorName, body);
    if (createError || !data) setError("Your post could not be saved. Please try again.");
    else {
      setPosts((current) => [{ ...data, created_at: "Just now", likes: 0, replies: 0 }, ...current]);
      setDraft("");
    }
    setSubmitting(false);
  };

  const toggleLike = async (post: Post) => {
    if (!isAuthenticated || !user) { onSignIn(); return; }
    const isLiked = liked.includes(post.id);
    setLiked((current) => isLiked ? current.filter((id) => id !== post.id) : [...current, post.id]);
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likes: Math.max(0, item.likes + (isLiked ? -1 : 1)) } : item));
    if (isSupabaseConfigured && !post.id.startsWith("local-")) {
      const { error: reactionError } = isLiked ? await db.removeCommunityReaction(post.id, user.id) : await db.addCommunityReaction(post.id, user.id);
      if (reactionError) {
        setLiked((current) => isLiked ? [...current, post.id] : current.filter((id) => id !== post.id));
        setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likes: Math.max(0, item.likes + (isLiked ? 1 : -1)) } : item));
        setError("Your reaction could not be saved.");
      }
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPost === postId) { setExpandedPost(null); return; }
    setExpandedPost(postId);
    if (!isSupabaseConfigured || postId.startsWith("local-") || comments[postId]) return;
    const { data, error: commentsError }: any = await db.getCommunityComments(postId);
    if (commentsError) setError("Replies could not be loaded.");
    else setComments((current) => ({ ...current, [postId]: data ?? [] }));
  };

  const submitComment = async (postId: string) => {
    const body = commentDraft.trim();
    if (!body) return;
    if (!isAuthenticated || !user) { onSignIn(); return; }
    if (!isSupabaseConfigured || postId.startsWith("local-")) {
      const localComment: Comment = { id: `local-comment-${Date.now()}`, post_id: postId, user_id: user.id, author_name: authorName, body, created_at: new Date().toISOString() };
      setComments((current) => ({ ...current, [postId]: [...(current[postId] ?? []), localComment] }));
    } else {
      const { data, error: commentError }: any = await db.createCommunityComment(postId, user.id, authorName, body);
      if (commentError || !data) { setError("Your reply could not be saved."); return; }
      setComments((current) => ({ ...current, [postId]: [...(current[postId] ?? []), data] }));
    }
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, replies: post.replies + 1 } : post));
    setCommentDraft("");
  };

  return <div className="space-y-5 p-4 sm:p-6">
    <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 p-6"><div className="flex items-center gap-2 text-cyan-300"><Users className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Community</span></div><h1 className="mt-3 text-2xl font-black text-white">Practise together.</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">A calm space to share wins, ask language questions, and find encouragement from other English learners.</p></section>
    {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200" role="alert">{error}</div>}
    {!isSupabaseConfigured && <p className="text-[11px] text-slate-500">Offline demo mode: posts, replies, and reactions are stored only in this session. Connect Supabase and apply the migration for production persistence.</p>}
    {isAuthenticated ? <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white"><PenLine className="h-4 w-4 text-indigo-300" />Share a practice note</div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} placeholder="What did you practise today?" className="mt-3 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400" /><div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-slate-500">{draft.length}/2000</span><button onClick={() => void submitPost()} disabled={!draft.trim() || submitting} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">{submitting ? "Saving…" : "Post to community"}</button></div></section> : <section className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4"><div><p className="font-bold text-white">Join the conversation</p><p className="mt-1 text-xs text-slate-300">Sign in to share a post or reply. You can still read the community without an account.</p></div><button onClick={onSignIn} className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Sign in</button></section>}
    {loading ? <div className="flex justify-center py-12" role="status"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div> : <section className="space-y-3">{posts.map((post) => { const isLiked = liked.includes(post.id); const postComments = comments[post.id] ?? []; return <article key={post.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-black text-white">{post.author_name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-white">{post.author_name}</p><span className="text-[11px] text-slate-500">{post.created_at}</span></div><h2 className="mt-3 font-bold text-white">{post.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">{post.body}</p><div className="mt-4 flex items-center gap-4 text-xs text-slate-500"><button onClick={() => void toggleLike(post)} className={`flex items-center gap-1.5 ${isLiked ? "text-rose-300" : "hover:text-rose-300"}`}><Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />{post.likes}</button><button onClick={() => void toggleComments(post.id)} className="flex items-center gap-1.5 hover:text-cyan-300"><MessageCircle className="h-4 w-4" />{post.replies} replies</button></div>{expandedPost === post.id && <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">{postComments.map((comment) => <div key={comment.id} className="rounded-xl bg-slate-950/70 p-3"><p className="text-xs font-bold text-white">{comment.author_name}</p><p className="mt-1 text-xs leading-relaxed text-slate-300">{comment.body}</p></div>)}{isAuthenticated && <div className="flex gap-2"><input value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} maxLength={1000} placeholder="Write a reply…" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400" /><button onClick={() => void submitComment(post.id)} disabled={!commentDraft.trim()} className="rounded-xl bg-cyan-600 p-2 text-white disabled:opacity-40" aria-label="Send reply"><Send className="h-4 w-4" /></button></div>}</div>}</div></div></article>; })}</section>}
  </div>;
};
