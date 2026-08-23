-- Keep the migration-owned unique key and remove redundant equivalent indexes.
alter table public.user_progress drop constraint if exists user_progress_user_id_lesson_id_key;
drop index if exists public.user_progress_user_lesson_uidx;
