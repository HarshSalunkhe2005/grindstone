-- Shared, cross-instance rate limiting. Serverless instances do not share memory, so counters live in Postgres.
create table public.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket, window_start)
);
alter table public.rate_limits enable row level security;
-- No policies on purpose: nobody can read or write the table directly. Only the function below, which runs as its owner.

create or replace function public.rate_limit_hit(p_bucket text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  win timestamptz;
  key text;
  n integer;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 1 or p_window_seconds > 86400 or char_length(p_bucket) > 60 then
    raise exception 'invalid arguments' using errcode = '22023';
  end if;
  win := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  key := uid::text || ':' || p_bucket;
  insert into public.rate_limits as r (bucket, window_start, hits) values (key, win, 1)
    on conflict (bucket, window_start) do update set hits = r.hits + 1
    returning r.hits into n;
  -- Opportunistic cleanup keeps the table small without a cron job.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  allowed := n <= p_limit;
  retry_after := case when n <= p_limit then 0 else greatest(1, ceil(extract(epoch from (win + make_interval(secs => p_window_seconds) - now())))::integer) end;
  return next;
end;
$$;
revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon;
grant execute on function public.rate_limit_hit(text, integer, integer) to authenticated;
