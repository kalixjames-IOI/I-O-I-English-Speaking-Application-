-- Prevent duplicate reactions when users tap like repeatedly or requests race.
create unique index if not exists community_post_reactions_user_post_key
  on public.community_post_reactions (user_id, post_id);
