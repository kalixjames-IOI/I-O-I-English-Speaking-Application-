-- Remove client-callable execution privileges from trigger/helper functions.
-- These functions are used by triggers or server-side operations only.

revoke execute on function public.get_user_progress_summary(uuid) from public, anon, authenticated;
revoke execute on function public.get_user_subscription_status(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_updated_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
