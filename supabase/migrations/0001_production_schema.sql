-- I O I English Speaking production schema
-- Apply this migration to the active production Supabase project before launch.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  native_language text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level text,
  thumbnail_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  name text not null,
  order_number integer not null,
  unique (course_id, order_number)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references public.levels(id) on delete cascade,
  title text not null,
  description text,
  order_number integer not null,
  unique (level_id, order_number)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete cascade,
  title text not null,
  lesson_type text,
  content jsonb,
  video_url text,
  audio_url text,
  ai_prompt text,
  order_number integer,
  created_at timestamptz not null default now(),
  unique (unit_id, order_number)
);

create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  word text not null,
  pronunciation text,
  meaning text,
  example_sentence text,
  audio_url text
);

create table if not exists public.dialogues (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  speaker text not null,
  text text not null,
  audio_url text,
  order_number integer
);

create table if not exists public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  topic text not null,
  explanation text,
  examples text
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  question text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null,
  order_number integer
);

create table if not exists public.speaking_practice (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  scenario text not null,
  ai_instruction text,
  difficulty_level text
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completion_status text not null default 'in_progress' check (completion_status in ('in_progress', 'completed')),
  score integer check (score is null or score between 0 and 100),
  speaking_score integer check (speaking_score is null or speaking_score between 0 and 100),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  last_accessed timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.user_progress add column if not exists xp_earned integer not null default 0;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null check (plan_name in ('free', 'premium', 'professional')),
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')),
  start_date date,
  end_date date,
  payment_provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now()
);

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

create index if not exists levels_course_order_idx on public.levels(course_id, order_number);
create index if not exists units_level_order_idx on public.units(level_id, order_number);
create index if not exists lessons_unit_order_idx on public.lessons(unit_id, order_number);
create index if not exists user_progress_user_idx on public.user_progress(user_id, last_accessed desc);
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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at before update on public.community_posts for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.levels enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary enable row level security;
alter table public.dialogues enable row level security;
alter table public.grammar_topics enable row level security;
alter table public.quizzes enable row level security;
alter table public.speaking_practice enable row level security;
alter table public.user_progress enable row level security;
alter table public.subscriptions enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_post_reactions enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles','courses','levels','units','lessons','vocabulary','dialogues','grammar_topics','quizzes','speaking_practice','user_progress','subscriptions','community_posts','community_comments','community_post_reactions']
  loop
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
  end loop;
end $$;

-- Public curriculum is read-only from the client.
create policy courses_public_read on public.courses for select using (status = 'active');
create policy levels_public_read on public.levels for select using (true);
create policy units_public_read on public.units for select using (true);
create policy lessons_public_read on public.lessons for select using (true);
create policy vocabulary_public_read on public.vocabulary for select using (true);
create policy dialogues_public_read on public.dialogues for select using (true);
create policy grammar_public_read on public.grammar_topics for select using (true);
create policy quizzes_public_read on public.quizzes for select using (true);
create policy speaking_public_read on public.speaking_practice for select using (true);

grant select on public.courses, public.levels, public.units, public.lessons, public.vocabulary, public.dialogues, public.grammar_topics, public.quizzes, public.speaking_practice to anon, authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
grant select, insert, update on public.profiles to authenticated;

create policy progress_select_own on public.user_progress for select to authenticated using (user_id = auth.uid());
create policy progress_insert_own on public.user_progress for insert to authenticated with check (user_id = auth.uid());
create policy progress_update_own on public.user_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_delete_own on public.user_progress for delete to authenticated using (user_id = auth.uid());
grant select, insert, update, delete on public.user_progress to authenticated;

create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = auth.uid());
grant select on public.subscriptions to authenticated;

create policy community_posts_public_read on public.community_posts for select using (true);
create policy community_posts_insert_own on public.community_posts for insert to authenticated with check (user_id = auth.uid());
create policy community_posts_update_own on public.community_posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy community_posts_delete_own on public.community_posts for delete to authenticated using (user_id = auth.uid());
grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

create policy community_comments_public_read on public.community_comments for select using (true);
create policy community_comments_insert_own on public.community_comments for insert to authenticated with check (user_id = auth.uid());
create policy community_comments_delete_own on public.community_comments for delete to authenticated using (user_id = auth.uid());
grant select on public.community_comments to anon, authenticated;
grant insert, delete on public.community_comments to authenticated;

create policy community_reactions_public_read on public.community_post_reactions for select using (true);
create policy community_reactions_insert_own on public.community_post_reactions for insert to authenticated with check (user_id = auth.uid());
create policy community_reactions_delete_own on public.community_post_reactions for delete to authenticated using (user_id = auth.uid());
grant select on public.community_post_reactions to anon, authenticated;
grant insert, delete on public.community_post_reactions to authenticated;

create or replace function public.get_user_subscription_status(user_uuid uuid)
returns text
language sql
security invoker
set search_path = public
as $$
  select coalesce((select plan_name from public.subscriptions where user_id = user_uuid and user_id = auth.uid() and status = 'active' order by created_at desc limit 1), 'free');
$$;

create or replace function public.get_user_progress_summary(user_uuid uuid)
returns json
language sql
security invoker
set search_path = public
as $$
  select json_build_object(
    'completed_lessons', count(*) filter (where completion_status = 'completed'),
    'total_xp', coalesce(sum(xp_earned), 0),
    'average_score', coalesce(round(avg(score))::integer, 0)
  )
  from public.user_progress
  where user_id = user_uuid and user_id = auth.uid();
$$;

revoke execute on function public.get_user_subscription_status(uuid) from public, anon;
revoke execute on function public.get_user_progress_summary(uuid) from public, anon;
grant execute on function public.get_user_subscription_status(uuid) to authenticated;
grant execute on function public.get_user_progress_summary(uuid) to authenticated;
