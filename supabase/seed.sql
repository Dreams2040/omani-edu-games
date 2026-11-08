-- Sample data for Phase 1: Grade 5 Mathematics, 2 units x 3 lessons,
-- and one public platform question set (owner_id = null) per lesson.
-- Unit and lesson names here are placeholders for testing. Replace them with the
-- official textbook index before launch. Questions are original.
-- Safe to re-run: it skips rows that already exist.

insert into public.grades (number, name_ar)
values (5, 'الصف الخامس')
on conflict (number) do nothing;

insert into public.subjects (name_ar, name_en)
values ('الرياضيات', 'Mathematics')
on conflict (name_ar) do nothing;

-- Units
insert into public.units (grade_id, subject_id, semester, position, title_ar)
select g.id, s.id, 1, u.position, u.title_ar
from public.grades g, public.subjects s,
  (values (1, 'الوحدة الأولى: الأعداد الكبيرة'),
          (2, 'الوحدة الثانية: الكسور')) as u(position, title_ar)
where g.number = 5 and s.name_ar = 'الرياضيات'
  and not exists (
    select 1 from public.units x
    where x.grade_id = g.id and x.subject_id = s.id and x.title_ar = u.title_ar
  );

-- Lessons
insert into public.lessons (unit_id, position, title_ar, objectives)
select un.id, l.position, l.title_ar, l.objectives
from public.units un
join (values
  ('الوحدة الأولى: الأعداد الكبيرة', 1, 'القيمة المنزلية حتى الملايين', 'يقرأ الأعداد حتى الملايين ويكتبها، ويحدد القيمة المنزلية لكل رقم.'),
  ('الوحدة الأولى: الأعداد الكبيرة', 2, 'مقارنة الأعداد وترتيبها', 'يقارن بين الأعداد الكبيرة باستخدام الرموز ويرتبها تصاعدياً وتنازلياً.'),
  ('الوحدة الأولى: الأعداد الكبيرة', 3, 'تقريب الأعداد', 'يقرّب الأعداد إلى أقرب عشرة ومئة وألف.'),
  ('الوحدة الثانية: الكسور', 1, 'الكسور المتكافئة', 'يكوّن كسوراً متكافئة بالضرب أو القسمة على العدد نفسه.'),
  ('الوحدة الثانية: الكسور', 2, 'تبسيط الكسور', 'يكتب الكسر في أبسط صورة.'),
  ('الوحدة الثانية: الكسور', 3, 'جمع الكسور وطرحها', 'يجمع ويطرح كسوراً لها المقام نفسه.')
) as l(unit_title, position, title_ar, objectives) on l.unit_title = un.title_ar
where not exists (
  select 1 from public.lessons x where x.unit_id = un.id and x.title_ar = l.title_ar
);

-- One public platform question set per lesson
insert into public.question_sets (owner_id, lesson_id, title, is_public)
select null, le.id, 'مراجعة: ' || le.title_ar, true
from public.lessons le
join public.units un on un.id = le.unit_id
join public.grades g on g.id = un.grade_id and g.number = 5
where not exists (
  select 1 from public.question_sets x where x.lesson_id = le.id and x.owner_id is null
);

-- Questions (only for sets that have none yet)
insert into public.questions (set_id, type, prompt, choices, answer, position)
select qs.id, q.type::public.question_type, q.prompt, q.choices::jsonb, q.answer, q.position
from public.question_sets qs
join public.lessons le on le.id = qs.lesson_id
join (values
  -- القيمة المنزلية حتى الملايين
  ('القيمة المنزلية حتى الملايين', 1, 'mcq', 'ما القيمة المنزلية للرقم 7 في العدد 3,742,105؟', '["الآحاد","الآلاف","مئات الآلاف","الملايين"]', 'مئات الآلاف'),
  ('القيمة المنزلية حتى الملايين', 2, 'true_false', 'العدد "مليونان وخمسة آلاف" يُكتب 2,005,000.', '["صح","خطأ"]', 'صح'),
  ('القيمة المنزلية حتى الملايين', 3, 'short', 'اكتب العدد الذي يتكون من 4 ملايين و 6 مئات بالأرقام.', '[]', '4000600'),
  -- مقارنة الأعداد وترتيبها
  ('مقارنة الأعداد وترتيبها', 1, 'mcq', 'أي الأعداد التالية هو الأكبر؟', '["908,765","1,002,300","999,999","980,000"]', '1,002,300'),
  ('مقارنة الأعداد وترتيبها', 2, 'true_false', '450,320 أصغر من 450,302.', '["صح","خطأ"]', 'خطأ'),
  ('مقارنة الأعداد وترتيبها', 3, 'mcq', 'ما الرمز المناسب: 65,400 ○ 64,500؟', '[">","<","="]', '>'),
  -- تقريب الأعداد
  ('تقريب الأعداد', 1, 'mcq', 'قرّب العدد 7,462 إلى أقرب مئة.', '["7,400","7,500","7,460","8,000"]', '7,500'),
  ('تقريب الأعداد', 2, 'true_false', 'تقريب 3,849 إلى أقرب ألف هو 4,000.', '["صح","خطأ"]', 'صح'),
  ('تقريب الأعداد', 3, 'short', 'قرّب العدد 586 إلى أقرب عشرة.', '[]', '590'),
  -- الكسور المتكافئة
  ('الكسور المتكافئة', 1, 'mcq', 'أي كسر يكافئ ½؟', '["2/3","3/6","1/3","2/5"]', '3/6'),
  ('الكسور المتكافئة', 2, 'true_false', 'الكسران 2/5 و 4/10 متكافئان.', '["صح","خطأ"]', 'صح'),
  ('الكسور المتكافئة', 3, 'short', 'أكمل: 3/4 = ؟/12', '[]', '9'),
  -- تبسيط الكسور
  ('تبسيط الكسور', 1, 'mcq', 'ما أبسط صورة للكسر 6/8؟', '["3/4","2/3","6/8","1/2"]', '3/4'),
  ('تبسيط الكسور', 2, 'true_false', 'الكسر 5/7 في أبسط صورة.', '["صح","خطأ"]', 'صح'),
  ('تبسيط الكسور', 3, 'short', 'اكتب الكسر 10/15 في أبسط صورة.', '[]', '2/3'),
  -- جمع الكسور وطرحها
  ('جمع الكسور وطرحها', 1, 'mcq', 'ما ناتج 2/7 + 3/7؟', '["5/14","5/7","6/7","1/7"]', '5/7'),
  ('جمع الكسور وطرحها', 2, 'true_false', '5/9 − 2/9 = 3/9', '["صح","خطأ"]', 'صح'),
  ('جمع الكسور وطرحها', 3, 'short', 'ما ناتج 7/10 − 4/10؟ (اكتب الكسر)', '[]', '3/10')
) as q(lesson_title, position, type, prompt, choices, answer) on q.lesson_title = le.title_ar
where qs.owner_id is null
  and not exists (select 1 from public.questions x where x.set_id = qs.id);
