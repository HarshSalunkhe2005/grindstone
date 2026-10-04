-- A private log of questions the user met in real interviews and mocks. Never shared.
create table public.interview_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company text not null check (char_length(company) between 1 and 80),
  round text not null default 'other' check (round in ('online-test','dsa','system-design','hr','other')),
  question text not null check (char_length(question) between 1 and 2000),
  notes text check (char_length(notes) <= 4000),
  asked_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index interview_log_user on public.interview_log (user_id, asked_on desc);
alter table public.interview_log enable row level security;
create policy "own log read" on public.interview_log for select to authenticated using ((select auth.uid()) = user_id);
create policy "own log insert" on public.interview_log for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own log update" on public.interview_log for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own log delete" on public.interview_log for delete to authenticated using ((select auth.uid()) = user_id);
-- Per-user cap so a client cannot fill the database.
create or replace function public.cap_interview_log() returns trigger language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.interview_log where user_id = new.user_id) >= 500 then
    raise exception 'interview log is full' using errcode = '54000';
  end if;
  return new;
end; $$;
create trigger interview_log_cap before insert on public.interview_log for each row execute function public.cap_interview_log();
revoke all on function public.cap_interview_log() from public, anon, authenticated;
grant select, insert, delete on public.interview_log to authenticated;
grant update (company, round, question, notes, asked_on) on public.interview_log to authenticated;
