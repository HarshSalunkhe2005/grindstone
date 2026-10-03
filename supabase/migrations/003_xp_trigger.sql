create function public.sync_xp() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pts int; pid int; uid uuid; sgn int;
begin
  if tg_op = 'INSERT' then pid := new.problem_id; uid := new.user_id; sgn := 1;
  else pid := old.problem_id; uid := old.user_id; sgn := -1; end if;
  select case difficulty when 'easy' then 10 when 'medium' then 20 else 40 end into pts
    from public.problems where id = pid;
  update public.profiles set xp = greatest(0, xp + sgn * coalesce(pts, 0)) where id = uid;
  return null;
end $$;
revoke execute on function public.sync_xp() from public, anon, authenticated;
create trigger user_problems_xp after insert or delete on public.user_problems
for each row execute function public.sync_xp();
