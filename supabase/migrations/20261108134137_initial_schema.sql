-- Phase 1: initial schema for the Omani classroom games platform.
-- 10 tables: profiles, curriculum tree (grades, subjects, units, lessons),
-- question bank (question_sets, questions, favorites), live play (game_sessions, session_answers).
-- Every table in `public` has RLS enabled.

-- ─────────────────────────────────────────────────────────────
-- Types
-- ─────────────────────────────────────────────────────────────
create type public.user_role as enum ('teacher', 'admin');
create type public.question_type as enum ('mcq', 'true_false', 'short');
create type public.game_type as enum ('sail_race', 'frankincense_caravan');
create type public.session_status as enum ('lobby', 'active', 'finished');

-- Private schema for helper functions (not exposed through the Data API).
create schema if not exists private;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  school text,
  role public.user_role not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grades (
  id bigint generated always as identity primary key,
  number smallint not null unique check (number between 1 and 12),
  name_ar text not null
);

create table public.subjects (
  id bigint generated always as identity primary key,
  name_ar text not null unique,
  name_en text
);

create table public.units (
  id bigint generated always as identity primary key,
  grade_id bigint not null references public.grades (id) on delete restrict,
  subject_id bigint not null references public.subjects (id) on delete restrict,
  semester smallint not null check (semester in (1, 2)),
  position integer not null default 0,
  title_ar text not null,
  title_en text
);
create index units_grade_subject_idx on public.units (grade_id, subject_id, semester, position);
create index units_subject_id_idx on public.units (subject_id);

create table public.lessons (
  id bigint generated always as identity primary key,
  unit_id bigint not null references public.units (id) on delete cascade,
  position integer not null default 0,
  title_ar text not null,
  title_en text,
  objectives text
);
create index lessons_unit_id_idx on public.lessons (unit_id, position);

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  -- null owner = platform-provided content managed by admins
  owner_id uuid references public.profiles (id) on delete cascade,
  lesson_id bigint not null references public.lessons (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  is_public boolean not null default false,
  copied_from uuid references public.question_sets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index question_sets_owner_id_idx on public.question_sets (owner_id);
create index question_sets_lesson_id_idx on public.question_sets (lesson_id);
create index question_sets_copied_from_idx on public.question_sets (copied_from);
create index question_sets_public_idx on public.question_sets (lesson_id) where is_public;

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.question_sets (id) on delete cascade,
  type public.question_type not null,
  prompt text not null check (char_length(prompt) between 1 and 1000),
  image_url text,
  choices jsonb not null default '[]'::jsonb check (jsonb_typeof(choices) = 'array'),
  answer text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index questions_set_id_idx on public.questions (set_id, position);

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  set_id uuid not null references public.question_sets (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, set_id)
);
create index favorites_set_id_idx on public.favorites (set_id);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.question_sets (id) on delete cascade,
  host_id uuid not null references public.profiles (id) on delete cascade,
  game_type public.game_type not null,
  join_code text not null check (join_code ~ '^[0-9]{6}$'),
  status public.session_status not null default 'lobby',
  current_index integer not null default 0,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
-- A join code only needs to be unique among sessions that are still running.
create unique index game_sessions_active_code_idx on public.game_sessions (join_code) where status <> 'finished';
create index game_sessions_host_id_idx on public.game_sessions (host_id);
create index game_sessions_set_id_idx on public.game_sessions (set_id);

create table public.session_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  team text,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id, nickname)
);
create index session_answers_question_id_idx on public.session_answers (question_id);

-- ─────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────

-- Is the current user an admin? SECURITY DEFINER so policies on `profiles`
-- can call it without recursing into profiles' own RLS. Lives in `private`.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

-- Keep updated_at fresh.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger question_sets_set_updated_at before update on public.question_sets
  for each row execute function private.set_updated_at();

-- Create a profile row for every new auth user. The name comes from sign-up
-- metadata (display only, never used for authorization). Role is always 'teacher'.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Grants (explicit, in case new tables are not auto-exposed)
-- ─────────────────────────────────────────────────────────────
-- Curriculum: readable by everyone; writes are limited to admins by RLS.
grant select on public.grades, public.subjects, public.units, public.lessons to anon, authenticated;
grant insert, update, delete on public.grades, public.subjects, public.units, public.lessons to authenticated;

-- Everything else: signed-in users only (RLS narrows the rows).
revoke all on public.profiles, public.question_sets, public.questions, public.favorites,
  public.game_sessions, public.session_answers from anon;

grant select on public.profiles to authenticated;
-- Teachers may edit their name and school, never their role.
revoke update on public.profiles from authenticated;
grant update (full_name, school) on public.profiles to authenticated;

grant select, insert, update, delete on public.question_sets, public.questions, public.favorites,
  public.game_sessions to authenticated;
-- Answers are written later by a server-side function that checks the join code.
grant select on public.session_answers to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.question_sets enable row level security;
alter table public.questions enable row level security;
alter table public.favorites enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_answers enable row level security;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- curriculum tree: read for all, write for admins
create policy "grades: read all" on public.grades for select to anon, authenticated using (true);
create policy "grades: admin insert" on public.grades for insert to authenticated with check ((select private.is_admin()));
create policy "grades: admin update" on public.grades for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "grades: admin delete" on public.grades for delete to authenticated using ((select private.is_admin()));

create policy "subjects: read all" on public.subjects for select to anon, authenticated using (true);
create policy "subjects: admin insert" on public.subjects for insert to authenticated with check ((select private.is_admin()));
create policy "subjects: admin update" on public.subjects for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "subjects: admin delete" on public.subjects for delete to authenticated using ((select private.is_admin()));

create policy "units: read all" on public.units for select to anon, authenticated using (true);
create policy "units: admin insert" on public.units for insert to authenticated with check ((select private.is_admin()));
create policy "units: admin update" on public.units for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "units: admin delete" on public.units for delete to authenticated using ((select private.is_admin()));

create policy "lessons: read all" on public.lessons for select to anon, authenticated using (true);
create policy "lessons: admin insert" on public.lessons for insert to authenticated with check ((select private.is_admin()));
create policy "lessons: admin update" on public.lessons for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "lessons: admin delete" on public.lessons for delete to authenticated using ((select private.is_admin()));

-- question_sets: owner manages; everyone signed in reads public sets;
-- admins manage platform sets (owner_id is null).
create policy "question_sets: read own or public" on public.question_sets
  for select to authenticated
  using (is_public or owner_id = (select auth.uid()) or (select private.is_admin()));

create policy "question_sets: insert own" on public.question_sets
  for insert to authenticated
  with check (owner_id = (select auth.uid()) or (owner_id is null and (select private.is_admin())));

create policy "question_sets: update own" on public.question_sets
  for update to authenticated
  using (owner_id = (select auth.uid()) or (owner_id is null and (select private.is_admin())))
  with check (owner_id = (select auth.uid()) or (owner_id is null and (select private.is_admin())));

create policy "question_sets: delete own" on public.question_sets
  for delete to authenticated
  using (owner_id = (select auth.uid()) or (owner_id is null and (select private.is_admin())));

-- questions follow their set
create policy "questions: read if set visible" on public.questions
  for select to authenticated
  using (exists (
    select 1 from public.question_sets s
    where s.id = set_id
      and (s.is_public or s.owner_id = (select auth.uid()) or (select private.is_admin()))
  ));

create policy "questions: insert into own set" on public.questions
  for insert to authenticated
  with check (exists (
    select 1 from public.question_sets s
    where s.id = set_id
      and (s.owner_id = (select auth.uid()) or (s.owner_id is null and (select private.is_admin())))
  ));

create policy "questions: update in own set" on public.questions
  for update to authenticated
  using (exists (
    select 1 from public.question_sets s
    where s.id = set_id
      and (s.owner_id = (select auth.uid()) or (s.owner_id is null and (select private.is_admin())))
  ))
  with check (exists (
    select 1 from public.question_sets s
    where s.id = set_id
      and (s.owner_id = (select auth.uid()) or (s.owner_id is null and (select private.is_admin())))
  ));

create policy "questions: delete in own set" on public.questions
  for delete to authenticated
  using (exists (
    select 1 from public.question_sets s
    where s.id = set_id
      and (s.owner_id = (select auth.uid()) or (s.owner_id is null and (select private.is_admin())))
  ));

-- favorites: own rows only
create policy "favorites: read own" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites: insert own" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites: delete own" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- game_sessions: only the host
create policy "game_sessions: host read" on public.game_sessions
  for select to authenticated using (host_id = (select auth.uid()));
create policy "game_sessions: host insert" on public.game_sessions
  for insert to authenticated with check (host_id = (select auth.uid()));
create policy "game_sessions: host update" on public.game_sessions
  for update to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));
create policy "game_sessions: host delete" on public.game_sessions
  for delete to authenticated using (host_id = (select auth.uid()));

-- session_answers: only the session host reads results
create policy "session_answers: host read" on public.session_answers
  for select to authenticated
  using (exists (
    select 1 from public.game_sessions g
    where g.id = session_id and g.host_id = (select auth.uid())
  ));
