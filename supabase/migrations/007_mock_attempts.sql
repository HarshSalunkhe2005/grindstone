-- Timed mock interviews. The problems are drawn from the roadmap; a finished round records its solves as progress.
create table public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_min smallint not null check (duration_min between 15 and 180),
  problem_ids integer[] not null check (cardinality(problem_ids) between 1 and 5),
  solved_ids integer[] not null default '{}',
  finished_at timestamptz
);
create index mock_attempts_user_started on public.mock_attempts (user_id, started_at desc);
alter table public.mock_attempts enable row level security;
create policy "own mocks read" on public.mock_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "own mocks insert" on public.mock_attempts for insert to authenticated with check ((select auth.uid()) = user_id and finished_at is null);
create policy "own mocks update" on public.mock_attempts for update to authenticated using ((select auth.uid()) = user_id and finished_at is null) with check ((select auth.uid()) = user_id);
