import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FavoriteButton } from "@/components/favorite-button";
import { TeacherHeader } from "@/components/teacher-header";
import { questionCount } from "@/lib/arabic";
import { getCurriculum } from "@/lib/curriculum";
import { choicesOf } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";
import { copySet, deleteSet, updateSet } from "../actions";
import { SetForm } from "../set-form";
import { DeleteSetButton } from "./delete-set-button";
import { QuestionList } from "./question-list";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SetPage({ params, searchParams }: PageProps<"/sets/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: set }, { data: questions }, { data: fav }] = await Promise.all([
    supabase
      .from("question_sets")
      .select(
        "id, title, description, is_public, owner_id, lesson_id, copied_from, lesson:lessons!inner(title_ar, unit:units!inner(title_ar, grade:grades!inner(name_ar), subject:subjects!inner(name_ar)))",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("questions").select("id, type, prompt, image_url, choices, answer").eq("set_id", id).order("position").order("created_at"),
    supabase.from("favorites").select("set_id").eq("user_id", userId).eq("set_id", id).maybeSingle(),
  ]);

  if (!set) notFound();

  const mine = set.owner_id === userId;
  const items = (questions ?? []).map((q) => ({ ...q, choices: choicesOf(q.choices) }));
  const { lesson } = set;
  const tree = mine ? await getCurriculum() : [];

  return (
    <>
      <TeacherHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-4xl px-4 pb-8 pt-8 sm:px-6">
            <Link href={`/library?lesson=${set.lesson_id}`} className="text-sm font-semibold text-sea-deep hover:underline">
              مجموعات درس {lesson.title_ar}
            </Link>

            {sp.copied && (
              <p role="status" className="mt-4 rounded-2xl bg-palm-soft p-4 font-semibold text-palm-deep">
                نُسخت المجموعة إلى «أسئلتي». عدّلها كما تحب، فالأصل لن يتغير.
              </p>
            )}
            {sp.error === "copy" && (
              <p role="alert" className="mt-4 rounded-2xl bg-pomegranate-soft p-4 font-semibold text-pomegranate-deep">
                تعذّر نسخ المجموعة. حاول مرة أخرى.
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold sm:text-4xl">{set.title}</h1>
                <p className="mt-2 text-muted">
                  {lesson.unit.grade.name_ar}، {lesson.unit.subject.name_ar}، {lesson.unit.title_ar}
                </p>
                {set.description && <p className="mt-3 max-w-2xl">{set.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                  <span className="rounded-full bg-indigo-soft px-3 py-1">{questionCount(items.length)}</span>
                  {mine ? (
                    <span className={`rounded-full px-3 py-1 ${set.is_public ? "bg-palm-soft text-palm-deep" : "bg-saffron-soft text-saffron-deep"}`}>
                      {set.is_public ? "عامة، يراها المعلمون" : "خاصة، لا يراها غيرك"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-saffron-soft px-3 py-1 text-saffron-deep">{set.owner_id ? "من معلم آخر" : "من المنصة"}</span>
                  )}
                  {set.copied_from && <span className="rounded-full bg-sea-soft px-3 py-1 text-sea-deep">منسوخة من مجموعة أخرى</span>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FavoriteButton setId={set.id} isFavorite={Boolean(fav)} withLabel />
                {!mine && (
                  <form action={copySet.bind(null, set.id)}>
                    <button type="submit" className="rounded-full bg-pomegranate px-5 py-2.5 font-bold text-white transition-colors hover:bg-pomegranate-deep">
                      انسخ إلى أسئلتي وعدّلها
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
          {mine && (
            <details className="group rounded-3xl bg-surface ring-1 ring-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-bold sm:px-6 [&::-webkit-details-marker]:hidden">
                تفاصيل المجموعة: العنوان والدرس والمشاركة
                <svg viewBox="0 0 12 8" aria-hidden className="h-3 w-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l5 5 5-5" />
                </svg>
              </summary>
              <div className="border-t border-border p-5 sm:p-6">
                <SetForm
                  tree={tree}
                  action={updateSet.bind(null, set.id)}
                  submitLabel="حفظ التفاصيل"
                  initial={{ title: set.title, description: set.description ?? "", lesson_id: set.lesson_id, is_public: set.is_public }}
                />
              </div>
            </details>
          )}

          <section aria-label="الأسئلة">
            <QuestionList setId={set.id} userId={userId} questions={items} editable={mine} />
          </section>

          {mine && (
            <div className="flex justify-end border-t border-border pt-6">
              <DeleteSetButton action={deleteSet.bind(null, set.id)} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
