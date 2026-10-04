-- Friends leaderboard. Opt-in: nobody appears on anyone's board unless they turn it on.
alter table public.profiles add column leaderboard_visible boolean not null default false;

create table public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index friendships_friend on public.friendships (friend_id);
alter table public.friendships enable row level security;
create policy "own friendships read" on public.friendships for select to authenticated using ((select auth.uid()) = user_id);
create policy "own friendships delete" on public.friendships for delete to authenticated using ((select auth.uid()) = user_id);
-- Inserts go through add_friend() only, so the opt-in rule and the cap cannot be bypassed.

create or replace function public.add_friend(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  n integer;
begin
  if uid is null then raise exception 'not authenticated' using errcode = '28000'; end if;
  -- Same answer for "no such user" and "not on the leaderboard", so usernames cannot be probed.
  select id into target from public.profiles where username = lower(p_username) and leaderboard_visible and id <> uid;
  if target is null then return 'not_found'; end if;
  select count(*) into n from public.friendships where user_id = uid;
  if n >= 50 then return 'limit'; end if;
  insert into public.friendships (user_id, friend_id) values (uid, target) on conflict do nothing;
  return 'ok';
end;
$$;

create or replace function public.remove_friend(p_username text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships
  where user_id = auth.uid() and friend_id = (select id from public.profiles where username = lower(p_username));
$$;

-- You and the friends who are opted in, ranked by XP. Exposes nothing beyond name, XP and solved count.
create or replace function public.friend_board()
returns table (username text, display_name text, xp integer, solved bigint, is_me boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.username, p.display_name, p.xp,
         (select count(*) from public.user_problems up where up.user_id = p.id) as solved,
         p.id = auth.uid() as is_me
  from public.profiles p
  where auth.uid() is not null
    and (p.id = auth.uid()
         or (p.leaderboard_visible and p.id in (select f.friend_id from public.friendships f where f.user_id = auth.uid())))
  order by p.xp desc, p.username
  limit 60;
$$;

revoke all on function public.add_friend(text), public.remove_friend(text), public.friend_board() from public, anon;
grant execute on function public.add_friend(text), public.remove_friend(text), public.friend_board() to authenticated;
