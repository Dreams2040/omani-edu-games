-- Phase 4: student data retention (see /student-privacy).
-- Daily job (23:15 UTC = 03:15 Oman time):
--   1. Games left running for more than a day are closed.
--   2. 30 days after a caravan game ends, nicknames are replaced with "لاعب 1", "لاعب 2"...
--      and the player rows (with their tokens) are deleted. Per-question results stay
--      so the teacher keeps the summary.
-- The function body is replaced by the next migration (safe two-step rename).
create extension if not exists pg_cron;

alter table public.game_sessions add column anonymized_at timestamptz;

create or replace function private.cleanup_games()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_sessions
  set status = 'finished', ended_at = coalesce(ended_at, now())
  where status <> 'finished' and created_at < now() - interval '1 day';
end;
$$;
revoke all on function private.cleanup_games() from public, anon, authenticated;

select cron.schedule('cleanup-games', '15 23 * * *', 'select private.cleanup_games()');
