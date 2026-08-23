-- Prevent duplicate lesson titles in the same unit, including punctuation/case variants.
create unique index if not exists lessons_unit_normalized_title_unique
  on public.lessons (unit_id, lower(regexp_replace(title, '[^a-z0-9]+', ' ', 'g')));
