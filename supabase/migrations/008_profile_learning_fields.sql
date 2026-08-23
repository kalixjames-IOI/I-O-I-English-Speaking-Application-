-- Persist the learner state that the app already collects during onboarding and lessons.
alter table public.profiles add column if not exists current_level text not null default 'A1';
alter table public.profiles add column if not exists target_goal text not null default 'Daily Conversation';
alter table public.profiles add column if not exists daily_minutes_goal integer not null default 15;
alter table public.profiles add column if not exists learning_style text not null default 'Interactive Voice';
alter table public.profiles add column if not exists streak_days integer not null default 0;
alter table public.profiles add column if not exists total_xp integer not null default 0;
alter table public.profiles add column if not exists fluency_score integer not null default 0;
alter table public.profiles add column if not exists plan text not null default 'free';

alter table public.profiles drop constraint if exists profiles_current_level_check;
alter table public.profiles add constraint profiles_current_level_check check (current_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
alter table public.profiles drop constraint if exists profiles_daily_minutes_goal_check;
alter table public.profiles add constraint profiles_daily_minutes_goal_check check (daily_minutes_goal between 5 and 180);
alter table public.profiles drop constraint if exists profiles_streak_days_check;
alter table public.profiles add constraint profiles_streak_days_check check (streak_days >= 0);
alter table public.profiles drop constraint if exists profiles_total_xp_check;
alter table public.profiles add constraint profiles_total_xp_check check (total_xp >= 0);
alter table public.profiles drop constraint if exists profiles_fluency_score_check;
alter table public.profiles add constraint profiles_fluency_score_check check (fluency_score between 0 and 100);
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'premium', 'professional'));
