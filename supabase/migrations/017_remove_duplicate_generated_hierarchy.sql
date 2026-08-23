-- Remove only the deterministic duplicate hierarchy created by the oversized seed attempt.
-- The original course (11111111-1111-1111-1111-111111111111) and its records remain untouched.
begin;
create temporary table ioi_duplicate_seed_lessons on commit drop as
  select l.id
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.levels lev on lev.id = u.level_id
  where lev.course_id = 'a5fa87b3-127c-5628-4f16-ff24db59ffaa';

delete from public.user_progress where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.vocabulary where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.dialogues where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.grammar_topics where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.quizzes where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.speaking_practice where lesson_id in (select id from ioi_duplicate_seed_lessons);
delete from public.lessons where id in (select id from ioi_duplicate_seed_lessons);
delete from public.units where level_id in (select id from public.levels where course_id = 'a5fa87b3-127c-5628-4f16-ff24db59ffaa');
delete from public.levels where course_id = 'a5fa87b3-127c-5628-4f16-ff24db59ffaa';
delete from public.courses where id = 'a5fa87b3-127c-5628-4f16-ff24db59ffaa';
commit;
