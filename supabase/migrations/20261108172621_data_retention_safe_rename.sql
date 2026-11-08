-- Rename in two steps through a control-character prefix, so a new alias can never
-- clash with a nickname that has not been renamed yet. Nicknames themselves may no
-- longer contain control characters.
create or replace function private.cleanup_games()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  marker constant text := chr(1);
begin
  update public.game_sessions
  set status = 'finished', ended_at = coalesce(ended_at, now())
  where status <> 'finished' and created_at < now() - interval '1 day';

  create temp table due on commit drop as
    select id from public.game_sessions
    where game_type = 'frankincense_caravan'
      and status = 'finished'
      and anonymized_at is null
      and coalesce(ended_at, created_at) < now() - interval '30 days';

  with renamed as (
    select a.session_id, a.nickname,
           'لاعب ' || dense_rank() over (partition by a.session_id order by a.nickname) as alias
    from public.session_answers a
    where a.session_id in (select id from due)
    group by a.session_id, a.nickname
  )
  update public.session_answers a
  set nickname = marker || r.alias
  from renamed r
  where a.session_id = r.session_id and a.nickname = r.nickname;

  update public.session_answers
  set nickname = substr(nickname, 2)
  where session_id in (select id from due) and left(nickname, 1) = marker;

  delete from public.session_players where session_id in (select id from due);
  update public.game_sessions set anonymized_at = now() where id in (select id from due);
end;
$$;
revoke all on function private.cleanup_games() from public, anon, authenticated;

create or replace function public.join_session(p_code text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.game_sessions;
  nick text := regexp_replace(regexp_replace(coalesce(p_nickname, ''), '[[:cntrl:]]', '', 'g'), '\s+', ' ', 'g');
  p public.session_players;
begin
  nick := btrim(nick);
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
  returning * into p;

  return jsonb_build_object('session_id', g.id, 'token', p.token, 'nickname', p.nickname);
end;
$$;
revoke all on function public.join_session(text, text) from public;
grant execute on function public.join_session(text, text) to anon, authenticated;
