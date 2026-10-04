-- Defence in depth: row-level security already gates every row, but Supabase's default grants hand the
-- API roles every privilege on every table. Take back everything the app does not use.
revoke all on all tables in schema public from anon;
grant select on public.topics, public.problems, public.topic_edges to anon;

revoke truncate, trigger, references on all tables in schema public from authenticated;
revoke insert, update, delete on public.topics, public.problems, public.topic_edges from authenticated;
revoke all on public.rate_limits from authenticated;           -- only rate_limit_hit() (security definer) touches it
revoke insert, update on public.friendships from authenticated; -- friends are added through add_friend() only
revoke update on public.user_lessons from authenticated;
revoke insert, delete on public.profiles from authenticated;    -- created by the signup trigger, removed with the auth user

-- A mock's problems and length are fixed once it starts; only ticks and the finish time can change.
revoke update on public.mock_attempts from authenticated;
grant update (solved_ids, finished_at) on public.mock_attempts to authenticated;

-- The opt-in flag for the friends leaderboard.
grant update (leaderboard_visible) on public.profiles to authenticated;

-- Tables created from now on start with nothing granted to the API roles.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;

-- Trigger functions are never meant to be called as RPC.
revoke all on function public.handle_new_user(), public.sync_xp(), public.set_review_defaults() from public, anon, authenticated;
