-- Explain-it-back note, time per problem, and a lesson quick-check score.
alter table public.user_problems
  add column recall_note text check (char_length(recall_note) <= 500),
  add column solve_minutes smallint check (solve_minutes between 1 and 600);
grant update (recall_note, solve_minutes) on public.user_problems to authenticated;

alter table public.user_lessons add column quiz_score smallint check (quiz_score between 0 and 10);
grant update (quiz_score, completed_at) on public.user_lessons to authenticated;
