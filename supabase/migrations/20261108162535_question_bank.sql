-- Phase 2: question bank.
-- 1. Data rules for each question type.
-- 2. Storage bucket for question images (each teacher writes only in their own folder).
-- 3. copy_question_set(): copy a visible set (with its questions) into the caller's account.

-- ─────────────────────────────────────────────────────────────
-- 1. Question shape per type
--   mcq:        2–6 choices, the answer is one of them
--   true_false: choices are exactly ["صح","خطأ"], answer is one of them
--   short:      no choices, answer is 1–200 characters
-- ─────────────────────────────────────────────────────────────
alter table public.questions
  add constraint questions_shape_check check (
    case type
      when 'mcq' then jsonb_array_length(choices) between 2 and 6 and choices ? answer
      when 'true_false' then choices = '["صح","خطأ"]'::jsonb and answer in ('صح', 'خطأ')
      else choices = '[]'::jsonb and char_length(answer) between 1 and 200
    end
  );

alter table public.question_sets
  add constraint question_sets_description_length check (char_length(description) <= 1000);

-- ─────────────────────────────────────────────────────────────
-- 2. Question images
-- Public bucket: images must load on the classroom screen and on student
-- devices without sign-in. Files are stored under <user id>/<file>.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('question-images', 'question-images', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "question-images: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "question-images: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "question-images: update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "question-images: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'question-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ─────────────────────────────────────────────────────────────
-- 3. Copy a set
-- SECURITY INVOKER: RLS still decides what the caller can read (own or public
-- sets) and that the new set belongs to the caller.
-- ─────────────────────────────────────────────────────────────
create or replace function public.copy_question_set(source_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  src public.question_sets%rowtype;
  new_id uuid;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into src from public.question_sets where id = source_id;
  if not found then
    raise exception 'set not found' using errcode = 'P0002';
  end if;

  insert into public.question_sets (owner_id, lesson_id, title, description, is_public, copied_from)
  values (uid, src.lesson_id, left('نسخة من ' || src.title, 200), src.description, false, src.id)
  returning id into new_id;

  insert into public.questions (set_id, type, prompt, image_url, choices, answer, position)
  select new_id, q.type, q.prompt, q.image_url, q.choices, q.answer, q.position
  from public.questions q
  where q.set_id = src.id;

  return new_id;
end;
$$;

revoke all on function public.copy_question_set(uuid) from public, anon;
grant execute on function public.copy_question_set(uuid) to authenticated;
