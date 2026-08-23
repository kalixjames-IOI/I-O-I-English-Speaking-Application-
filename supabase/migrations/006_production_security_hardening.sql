-- I O I English Speaking: production security and performance hardening.
-- This migration intentionally does not create or seed video assets.

-- Prevent future objects in the exposed public schema from receiving broad default access.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;

-- Foreign-key indexes used by RLS filters and curriculum joins.
create index if not exists idx_units_level_id on public.units (level_id);
create index if not exists idx_lessons_unit_id on public.lessons (unit_id);
create index if not exists idx_vocabulary_lesson_id on public.vocabulary (lesson_id);
create index if not exists idx_dialogues_lesson_id on public.dialogues (lesson_id);
create index if not exists idx_grammar_topics_lesson_id on public.grammar_topics (lesson_id);
create index if not exists idx_quizzes_lesson_id on public.quizzes (lesson_id);
create index if not exists idx_speaking_practice_lesson_id on public.speaking_practice (lesson_id);
create index if not exists idx_user_progress_user_id on public.user_progress (user_id);
create index if not exists idx_user_progress_lesson_id on public.user_progress (lesson_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);
create index if not exists idx_community_posts_user_id on public.community_posts (user_id);
create index if not exists idx_community_comments_post_id on public.community_comments (post_id);
create index if not exists idx_community_comments_user_id on public.community_comments (user_id);
create index if not exists idx_community_reactions_user_id on public.community_post_reactions (user_id);

-- The client uses upsert for progress; make the logical key explicit.
alter table public.user_progress
  drop constraint if exists user_progress_user_lesson_key;
alter table public.user_progress
  add constraint user_progress_user_lesson_key unique (user_id, lesson_id);

-- Curriculum is public-read and server/admin-managed; authenticated clients must not write it.
drop policy if exists "Courses are insertable by authenticated users (admin)" on public.courses;
drop policy if exists "Courses are updatable by authenticated users (admin)" on public.courses;
drop policy if exists "Courses are viewable by everyone" on public.courses;
create policy "courses_public_read" on public.courses for select to anon, authenticated using (true);
revoke insert, update, delete on public.courses from anon, authenticated;
grant select on public.courses to anon, authenticated;

drop policy if exists "Levels are insertable by authenticated users" on public.levels;
drop policy if exists "Levels are viewable by everyone" on public.levels;
create policy "levels_public_read" on public.levels for select to anon, authenticated using (true);
revoke insert, update, delete on public.levels from anon, authenticated;
grant select on public.levels to anon, authenticated;

drop policy if exists "Units are insertable by authenticated users" on public.units;
drop policy if exists "Units are viewable by everyone" on public.units;
create policy "units_public_read" on public.units for select to anon, authenticated using (true);
revoke insert, update, delete on public.units from anon, authenticated;
grant select on public.units to anon, authenticated;

drop policy if exists "Lessons are insertable by authenticated users" on public.lessons;
drop policy if exists "Lessons are viewable by everyone" on public.lessons;
create policy "lessons_public_read" on public.lessons for select to anon, authenticated using (true);
revoke insert, update, delete on public.lessons from anon, authenticated;
grant select on public.lessons to anon, authenticated;

drop policy if exists "Vocabulary is insertable by authenticated users" on public.vocabulary;
drop policy if exists "Vocabulary is viewable by everyone" on public.vocabulary;
create policy "vocabulary_public_read" on public.vocabulary for select to anon, authenticated using (true);
revoke insert, update, delete on public.vocabulary from anon, authenticated;
grant select on public.vocabulary to anon, authenticated;

drop policy if exists "Dialogues are insertable by authenticated users" on public.dialogues;
drop policy if exists "Dialogues are viewable by everyone" on public.dialogues;
create policy "dialogues_public_read" on public.dialogues for select to anon, authenticated using (true);
revoke insert, update, delete on public.dialogues from anon, authenticated;
grant select on public.dialogues to anon, authenticated;

drop policy if exists "Grammar topics are insertable by authenticated users" on public.grammar_topics;
drop policy if exists "Grammar topics are viewable by everyone" on public.grammar_topics;
create policy "grammar_topics_public_read" on public.grammar_topics for select to anon, authenticated using (true);
revoke insert, update, delete on public.grammar_topics from anon, authenticated;
grant select on public.grammar_topics to anon, authenticated;

drop policy if exists "Quizzes are insertable by authenticated users" on public.quizzes;
drop policy if exists "Quizzes are viewable by everyone" on public.quizzes;
create policy "quizzes_public_read" on public.quizzes for select to anon, authenticated using (true);
revoke insert, update, delete on public.quizzes from anon, authenticated;
grant select on public.quizzes to anon, authenticated;

drop policy if exists "Speaking practice is insertable by authenticated users" on public.speaking_practice;
drop policy if exists "Speaking practice is viewable by everyone" on public.speaking_practice;
create policy "speaking_practice_public_read" on public.speaking_practice for select to anon, authenticated using (true);
revoke insert, update, delete on public.speaking_practice from anon, authenticated;
grant select on public.speaking_practice to anon, authenticated;

-- Profiles are private to the owner; auth.uid() is evaluated once per statement.
drop policy if exists "Authenticated users can view all profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Progress is private to the signed-in owner and safely upsertable by user + lesson.
drop policy if exists "Users can view their own progress" on public.user_progress;
drop policy if exists "Users can insert their own progress" on public.user_progress;
drop policy if exists "Users can update their own progress" on public.user_progress;
drop policy if exists "Users can delete their own progress" on public.user_progress;
create policy "progress_select_own" on public.user_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.user_progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.user_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "progress_delete_own" on public.user_progress for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.user_progress from anon;
grant select, insert, update, delete on public.user_progress to authenticated;

-- Subscription rows are read-only to clients; a trusted billing webhook/service owns writes.
drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
drop policy if exists "Users can insert their own subscriptions" on public.subscriptions;
drop policy if exists "Users can update their own subscriptions" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;
grant select on public.subscriptions to authenticated;

-- Community is public-read; mutations are limited to the authenticated owner.
drop policy if exists "community_posts_public_read" on public.community_posts;
drop policy if exists "community_posts_insert_own" on public.community_posts;
drop policy if exists "community_posts_update_own" on public.community_posts;
drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_public_read" on public.community_posts for select to anon, authenticated using (true);
create policy "community_posts_insert_own" on public.community_posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "community_posts_update_own" on public.community_posts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "community_posts_delete_own" on public.community_posts for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

drop policy if exists "community_comments_public_read" on public.community_comments;
drop policy if exists "community_comments_insert_own" on public.community_comments;
drop policy if exists "community_comments_delete_own" on public.community_comments;
create policy "community_comments_public_read" on public.community_comments for select to anon, authenticated using (true);
create policy "community_comments_insert_own" on public.community_comments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "community_comments_delete_own" on public.community_comments for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.community_comments to anon, authenticated;
grant insert, delete on public.community_comments to authenticated;

drop policy if exists "community_reactions_public_read" on public.community_post_reactions;
drop policy if exists "community_reactions_insert_own" on public.community_post_reactions;
drop policy if exists "community_reactions_delete_own" on public.community_post_reactions;
create policy "community_reactions_public_read" on public.community_post_reactions for select to anon, authenticated using (true);
create policy "community_reactions_insert_own" on public.community_post_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "community_reactions_delete_own" on public.community_post_reactions for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.community_post_reactions to anon, authenticated;
grant insert, delete on public.community_post_reactions to authenticated;
