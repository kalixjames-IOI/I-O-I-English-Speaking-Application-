-- Additive production hardening for the existing Supabase schema.
-- This migration does not delete or rewrite existing production rows.

alter table public.user_progress add column if not exists xp_earned integer not null default 0;
create unique index if not exists user_progress_user_lesson_uidx on public.user_progress(user_id, lesson_id);
create index if not exists user_progress_user_last_accessed_idx on public.user_progress(user_id, last_accessed desc);

alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists provider_subscription_id text;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  title text not null default 'A new practice note',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.community_post_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_posts_created_idx on public.community_posts(created_at desc);
create index if not exists community_comments_post_idx on public.community_comments(post_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts for each row execute function public.set_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_reactions enable row level security;

revoke all on table public.community_posts, public.community_comments, public.community_post_reactions from anon, authenticated;

drop policy if exists community_posts_public_read on public.community_posts;
drop policy if exists community_posts_insert_own on public.community_posts;
drop policy if exists community_posts_update_own on public.community_posts;
drop policy if exists community_posts_delete_own on public.community_posts;
create policy community_posts_public_read on public.community_posts for select using (true);
create policy community_posts_insert_own on public.community_posts for insert to authenticated with check (user_id = auth.uid());
create policy community_posts_update_own on public.community_posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy community_posts_delete_own on public.community_posts for delete to authenticated using (user_id = auth.uid());
grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

drop policy if exists community_comments_public_read on public.community_comments;
drop policy if exists community_comments_insert_own on public.community_comments;
drop policy if exists community_comments_delete_own on public.community_comments;
create policy community_comments_public_read on public.community_comments for select using (true);
create policy community_comments_insert_own on public.community_comments for insert to authenticated with check (user_id = auth.uid());
create policy community_comments_delete_own on public.community_comments for delete to authenticated using (user_id = auth.uid());
grant select on public.community_comments to anon, authenticated;
grant insert, delete on public.community_comments to authenticated;

drop policy if exists community_reactions_public_read on public.community_post_reactions;
drop policy if exists community_reactions_insert_own on public.community_post_reactions;
drop policy if exists community_reactions_delete_own on public.community_post_reactions;
create policy community_reactions_public_read on public.community_post_reactions for select using (true);
create policy community_reactions_insert_own on public.community_post_reactions for insert to authenticated with check (user_id = auth.uid());
create policy community_reactions_delete_own on public.community_post_reactions for delete to authenticated using (user_id = auth.uid());
grant select on public.community_post_reactions to anon, authenticated;
grant insert, delete on public.community_post_reactions to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
