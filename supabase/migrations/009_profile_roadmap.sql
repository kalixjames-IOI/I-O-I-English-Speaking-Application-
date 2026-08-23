-- Store the generated roadmap with the learner profile; no media assets are created.
alter table public.profiles add column if not exists roadmap jsonb;
