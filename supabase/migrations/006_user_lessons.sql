-- Completion state for the web-dev track. The lesson text itself lives in src/content/lessons.ts.
create table public.user_lessons (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_slug text not null check (char_length(lesson_slug) between 1 and 60),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);
alter table public.user_lessons enable row level security;
create policy "own lessons read" on public.user_lessons for select to authenticated using ((select auth.uid()) = user_id);
create policy "own lessons insert" on public.user_lessons for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own lessons delete" on public.user_lessons for delete to authenticated using ((select auth.uid()) = user_id);
