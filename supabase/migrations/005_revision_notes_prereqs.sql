-- Revision scheduling, notes, per-user settings and the topic skill tree.
alter table public.user_problems
  add column notes text check (char_length(notes) <= 2000),
  add column confidence smallint check (confidence between 1 and 3),
  add column last_reviewed_at timestamptz,
  add column review_count integer not null default 0 check (review_count >= 0);

alter table public.profiles
  add column daily_goal smallint not null default 3 check (daily_goal between 1 and 10),
  add column timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 60),
  add column onboarded boolean not null default false;

-- New solves are due for their first review the next day. Done in the database so manual ticks and LeetCode sync behave the same.
create function public.set_review_defaults() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.next_review_at is null then
    new.next_review_at := new.solved_at + interval '1 day';
  end if;
  return new;
end $$;
create trigger user_problems_review_defaults before insert on public.user_problems
for each row execute function public.set_review_defaults();

update public.user_problems set next_review_at = solved_at + interval '1 day' where next_review_at is null;

create table public.topic_edges (
  from_topic integer not null references public.topics(id) on delete cascade,
  to_topic integer not null references public.topics(id) on delete cascade,
  primary key (from_topic, to_topic),
  check (from_topic <> to_topic)
);
create index topic_edges_to_idx on public.topic_edges (to_topic);
alter table public.topic_edges enable row level security;
create policy "edges readable" on public.topic_edges for select to anon, authenticated using (true);

-- Prerequisites: what makes each topic easier (mirrors how the roadmap is taught).
insert into public.topic_edges (from_topic, to_topic)
select a.id, b.id from (values
  ('arrays-hashing','two-pointers'),('arrays-hashing','stack'),
  ('two-pointers','binary-search'),('two-pointers','sliding-window'),('two-pointers','linked-list'),
  ('binary-search','trees'),('sliding-window','trees'),('linked-list','trees'),
  ('trees','tries'),('trees','backtracking'),('trees','heap-priority-queue'),
  ('heap-priority-queue','intervals'),('heap-priority-queue','greedy'),('heap-priority-queue','advanced-graphs'),
  ('backtracking','graphs'),('backtracking','dp-1d'),
  ('graphs','advanced-graphs'),('dp-1d','dp-2d'),('dp-1d','bit-manipulation'),
  ('dp-2d','math-geometry'),('bit-manipulation','math-geometry')
) as e(f, t)
join public.topics a on a.slug = e.f join public.topics b on b.slug = e.t;

-- Users may update their own notes, confidence and review fields; column grants keep everything else locked.
revoke update on public.user_problems from authenticated;
grant update (notes, confidence, last_reviewed_at, review_count, review_stage, next_review_at) on public.user_problems to authenticated;
grant update (daily_goal, timezone, onboarded) on public.profiles to authenticated;

-- A finished ladder is stage 4 (mastered).
alter table public.user_problems drop constraint if exists user_problems_review_stage_check;
alter table public.user_problems add constraint user_problems_review_stage_check check (review_stage between 0 and 4);
