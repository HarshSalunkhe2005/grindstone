-- Owners may write their own cached platform stats (no service-role key is used).
-- Because users can therefore edit their own displayed stats, never rank users by platform_stats;
-- rankings must come from user_problems/xp, which only server-side triggers can change.
create policy "own stats insert" on public.platform_stats for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own stats update" on public.platform_stats for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
