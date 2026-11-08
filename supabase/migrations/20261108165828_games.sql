-- Phase 3: classroom games.
-- Students never sign in: they join with a 6-digit code and a nickname and get a
-- random player token. All student access goes through three functions that
-- check that token, so the correct answer only reaches a device after it answers.

-- ─────────────────────────────────────────────────────────────
-- Columns and tables
-- ─────────────────────────────────────────────────────────────
alter table public.game_sessions
  add column revealed boolean not null default false,
  add column question_started_at timestamptz,
  -- { "timer": 0 | seconds, "teams": ["فريق النخيل", ...] }
  add column settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object');

alter table public.session_answers
  add column answer text check (char_length(answer) <= 200);

create table public.session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  token uuid not null default gen_random_uuid(),
  joined_at timestamptz not null default now(),
  unique (session_id, nickname)
);
alter table public.session_players enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Grants and policies
-- ─────────────────────────────────────────────────────────────
revoke all on public.session_players from anon, authenticated;
-- The host sees nicknames but not tokens, and can remove a player.
grant select (id, session_id, nickname, joined_at), delete on public.session_players to authenticated;

create policy "session_players: host read" on public.session_players
  for select to authenticated
  using (exists (select 1 from public.game_sessions g where g.id = session_id and g.host_id = (select auth.uid())));
create policy "session_players: host delete" on public.session_players
  for delete to authenticated
  using (exists (select 1 from public.game_sessions g where g.id = session_id and g.host_id = (select auth.uid())));

-- Sail race: the host records each team's result.
grant insert, update on public.session_answers to authenticated;
create policy "session_answers: host insert" on public.session_answers
  for insert to authenticated
  with check (exists (select 1 from public.game_sessions g where g.id = session_id and g.host_id = (select auth.uid())));
create policy "session_answers: host update" on public.session_answers
  for update to authenticated
  using (exists (select 1 from public.game_sessions g where g.id = session_id and g.host_id = (select auth.uid())))
  with check (exists (select 1 from public.game_sessions g where g.id = session_id and g.host_id = (select auth.uid())));

-- A teacher may only host a set they can see (their own or a public one);
-- otherwise the student functions could leak a private set.
drop policy "game_sessions: host insert" on public.game_sessions;
drop policy "game_sessions: host update" on public.game_sessions;

create policy "game_sessions: host insert" on public.game_sessions
  for insert to authenticated
  with check (
    host_id = (select auth.uid())
    and exists (select 1 from public.question_sets s
                where s.id = set_id and (s.is_public or s.owner_id = (select auth.uid()) or (select private.is_admin())))
  );
create policy "game_sessions: host update" on public.game_sessions
  for update to authenticated
  using (host_id = (select auth.uid()))
  with check (
    host_id = (select auth.uid())
    and exists (select 1 from public.question_sets s
                where s.id = set_id and (s.is_public or s.owner_id = (select auth.uid()) or (select private.is_admin())))
  );

-- ─────────────────────────────────────────────────────────────
-- Helpers (private schema, not exposed)
-- ─────────────────────────────────────────────────────────────

-- Loose comparison for short answers: Arabic-Indic digits, thousands separators,
-- alef/ya/ta-marbuta forms, tatweel, case and extra spaces are ignored.
create or replace function private.normalize_answer(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
           translate(lower(btrim(coalesce(t, ''))),
                     -- mapped: digits, alef forms → ا, ى → ي, ة → ه, ٫ → .
                     -- dropped (no counterpart): tatweel and thousands separators
                     '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹أإآىة٫ـ,،٬',
                     '01234567890123456789ااايه.'),
           '\s+', ' ', 'g');
$$;

-- The question shown at a given index (same order as the editor).
create or replace function private.session_question(p_set uuid, p_index integer)
returns public.questions
language sql
stable
security definer
set search_path = ''
as $$
  select q.* from public.questions q
  where q.set_id = p_set
  order by q.position, q.created_at
  offset greatest(p_index, 0) limit 1;
$$;
revoke all on function private.session_question(uuid, integer) from public;

create or replace function private.player_for(p_session uuid, p_token uuid)
returns public.session_players
language plpgsql
stable
security definer
set search_path = ''
as $$
declare p public.session_players;
begin
  select * into p from public.session_players where session_id = p_session and token = p_token;
  if not found then
    raise exception 'player not found' using errcode = 'P0002';
  end if;
  return p;
end;
$$;
revoke all on function private.player_for(uuid, uuid) from public;

-- Tell every screen in a session that something changed (Realtime Broadcast).
-- The message carries no data; devices fetch their own view through the functions below.
create or replace function private.notify_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare sid uuid;
begin
  if tg_table_name = 'game_sessions' then
    sid := new.id;
  elsif tg_op = 'DELETE' then
    sid := old.session_id;
  else
    sid := new.session_id;
  end if;
  perform realtime.send('{}'::jsonb, tg_table_name, 'game:' || sid::text, false);
  return null;
end;
$$;
revoke all on function private.notify_session() from public;

create trigger game_sessions_notify after update on public.game_sessions
  for each row execute function private.notify_session();
create trigger session_players_notify after insert or delete on public.session_players
  for each row execute function private.notify_session();
create trigger session_answers_notify after insert or update on public.session_answers
  for each row execute function private.notify_session();

-- ─────────────────────────────────────────────────────────────
-- Student functions (callable without sign-in; each checks code or token)
-- ─────────────────────────────────────────────────────────────

create or replace function public.join_session(p_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.game_sessions;
  nick text := regexp_replace(btrim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  p public.session_players;
begin
  if char_length(nick) not between 1 and 20 then
    raise exception 'invalid nickname' using errcode = '22023';
  end if;

  select * into g from public.game_sessions
  where join_code = btrim(p_code) and status <> 'finished' and game_type = 'frankincense_caravan';
  if not found then
    raise exception 'invalid code' using errcode = 'P0002';
  end if;

  if (select count(*) from public.session_players where session_id = g.id) >= 80 then
    raise exception 'session full' using errcode = '53400';
  end if;

  insert into public.session_players (session_id, nickname) values (g.id, nick)
  returning * into p;   -- a taken nickname raises unique_violation (23505)

  return jsonb_build_object('session_id', g.id, 'token', p.token, 'nickname', p.nickname);
end;
$$;

create or replace function public.get_player_state(p_session uuid, p_token uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.session_players;
  g public.game_sessions;
  q public.questions;
  mine public.session_answers;
  total integer;
  my_score integer;
  my_rank integer;
  timer integer;
  question jsonb := null;
begin
  p := private.player_for(p_session, p_token);
  select * into g from public.game_sessions where id = p_session;
  select count(*) into total from public.questions where set_id = g.set_id;
  timer := coalesce((g.settings ->> 'timer')::integer, 0);

  select count(*) filter (where is_correct) into my_score
  from public.session_answers where session_id = g.id and nickname = p.nickname;

  select 1 + count(*) into my_rank from (
    select pl.nickname, count(a.id) filter (where a.is_correct) as score
    from public.session_players pl
    left join public.session_answers a on a.session_id = pl.session_id and a.nickname = pl.nickname
    where pl.session_id = g.id
    group by pl.nickname
  ) s where s.score > my_score;

  if g.status = 'active' then
    q := private.session_question(g.set_id, g.current_index);
    if q.id is not null then
      select * into mine from public.session_answers
      where session_id = g.id and question_id = q.id and nickname = p.nickname;

      question := jsonb_build_object(
        'id', q.id,
        'type', q.type,
        'prompt', q.prompt,
        'image_url', q.image_url,
        'choices', q.choices,
        'my_answer', mine.answer,
        'is_correct', mine.is_correct,
        -- the correct answer only after this player answered or the host revealed it
        'correct_answer', case when g.revealed or mine.id is not null then q.answer end,
        'deadline', case when timer > 0 and g.question_started_at is not null
                         then g.question_started_at + make_interval(secs => timer) end
      );
    end if;
  end if;

  return jsonb_build_object(
    'status', g.status,
    'index', g.current_index,
    'total', total,
    'revealed', g.revealed,
    'nickname', p.nickname,
    'score', my_score,
    'rank', my_rank,
    'players', (select count(*) from public.session_players where session_id = g.id),
    'question', question
  );
end;
$$;

create or replace function public.submit_answer(p_session uuid, p_token uuid, p_question uuid, p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.session_players;
  g public.game_sessions;
  q public.questions;
  timer integer;
  given text := left(btrim(coalesce(p_answer, '')), 200);
  correct boolean;
  inserted integer;
begin
  p := private.player_for(p_session, p_token);
  select * into g from public.game_sessions where id = p_session;

  if g.status <> 'active' or g.revealed then
    raise exception 'answers closed' using errcode = '55000';
  end if;

  q := private.session_question(g.set_id, g.current_index);
  if q.id is distinct from p_question then
    raise exception 'not the current question' using errcode = '55000';
  end if;

  timer := coalesce((g.settings ->> 'timer')::integer, 0);
  if timer > 0 and g.question_started_at is not null
     and now() > g.question_started_at + make_interval(secs => timer + 2) then
    raise exception 'time is up' using errcode = '55000';
  end if;

  if given = '' then
    raise exception 'empty answer' using errcode = '22023';
  end if;

  correct := case q.type
    when 'short' then private.normalize_answer(given) = private.normalize_answer(q.answer)
    else given = q.answer
  end;

  insert into public.session_answers (session_id, question_id, nickname, is_correct, answer)
  values (g.id, q.id, p.nickname, correct, given)
  on conflict (session_id, question_id, nickname) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 0 then
    raise exception 'already answered' using errcode = '23505';
  end if;

  return jsonb_build_object('is_correct', correct, 'correct_answer', q.answer);
end;
$$;

revoke all on function public.join_session(text, text) from public;
revoke all on function public.get_player_state(uuid, uuid) from public;
revoke all on function public.submit_answer(uuid, uuid, uuid, text) from public;
grant execute on function public.join_session(text, text) to anon, authenticated;
grant execute on function public.get_player_state(uuid, uuid) to anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, uuid, text) to anon, authenticated;
