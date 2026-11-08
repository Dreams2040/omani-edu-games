import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveValue } from "@/lib/curriculum-value";
import { FavoriteButton } from "@/components/favorite-button";
import { TeacherHeader } from "@/components/teacher-header";
import { questionCount } from "@/lib/arabic";
import { getCurriculum } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { LibraryFilters } from "./filters";

const TABS = [
  { key: "all", label: "كل الأسئلة" },
  { key: "mine", label: "أسئلتي" },
  { key: "favorites", label: "المفضلة" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const EMPTY: Record<Tab, string> = {
  all: "لا توجد مجموعات لهذا الاختيار بعد. كن أول من ينشئ مجموعة لهذا الدرس.",
  mine: "لم تنشئ أي مجموعة بعد. أنشئ مجموعة جديدة، أو انسخ مجموعة عامة وعدّلها لصفك.",
  favorites: "لا توجد مجموعات في المفضلة. اضغط النجمة بجانب أي مجموعة لتجدها هنا بسرعة.",
};

const asId = (v: string | string[] | undefined) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "all";

  const [tree, { data: favRows }] = await Promise.all([
    getCurriculum(),
    supabase.from("favorites").select("set_id").eq("user_id", userId),
  ]);
  const favorites = new Set((favRows ?? []).map((f) => f.set_id));
  const filter = resolveValue(tree, { grade: asId(sp.grade), subject: asId(sp.subject), unit: asId(sp.unit), lesson: asId(sp.lesson) });

  let query = supabase
    .from("question_sets")
    .select(
      "id, title, description, is_public, owner_id, copied_from, updated_at, lesson:lessons!inner(id, title_ar, unit_id, unit:units!inner(id, title_ar, grade_id, subject_id)), questions(count)",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (filter.lesson) query = query.eq("lesson_id", filter.lesson);
  else if (filter.unit) query = query.eq("lessons.unit_id", filter.unit);
  if (filter.grade) query = query.eq("lessons.units.grade_id", filter.grade);
  if (filter.subject) query = query.eq("lessons.units.subject_id", filter.subject);
  if (tab === "mine") query = query.eq("owner_id", userId);
  if (tab === "favorites") query = query.in("id", favorites.size ? [...favorites] : ["00000000-0000-0000-0000-000000000000"]);

  const { data: sets, error } = await query;

  const keepFilters = (t: Tab) => {
    const p = new URLSearchParams();
    if (t !== "all") p.set("tab", t);
    for (const [k, v] of Object.entries(filter)) if (v) p.set(k, String(v));
    const qs = p.toString();
    return qs ? `/library?${qs}` : "/library";
  };
  const newSetHref = filter.lesson ? `/sets/new?lesson=${filter.lesson}` : "/sets/new";
  const hasFilter = Object.values(filter).some(Boolean);

  return (
    <>
      <TeacherHeader current="/library" />
      <main className="flex-1">
        <section className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold sm:text-4xl">مكتبة الأسئلة</h1>
                <p className="mt-1 text-muted">اختر الدرس لتجد مجموعاته، أو أنشئ مجموعتك الخاصة.</p>
              </div>
              <Link
                href={newSetHref}
                className="rounded-full bg-pomegranate px-6 py-3 font-bold text-white shadow-[0_10px_24px_-10px_var(--pomegranate)] transition-colors hover:bg-pomegranate-deep"
              >
                مجموعة جديدة
              </Link>
            </div>

            <div className="mt-8">
              <LibraryFilters tree={tree} value={filter} tab={tab} />
              {hasFilter && (
                <Link href={tab === "all" ? "/library" : `/library?tab=${tab}`} className="mt-3 inline-block text-sm font-semibold text-sea-deep hover:underline">
                  إلغاء الفلاتر
                </Link>
              )}
            </div>

            <div role="tablist" aria-label="عرض المجموعات" className="mt-8 flex gap-2 overflow-x-auto">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  role="tab"
                  aria-selected={tab === t.key}
                  href={keepFilters(t.key)}
                  scroll={false}
                  className="whitespace-nowrap rounded-full px-5 py-2 font-semibold text-muted ring-1 ring-border transition-colors hover:text-foreground aria-selected:bg-indigo aria-selected:text-white aria-selected:ring-indigo dark:aria-selected:bg-sea dark:aria-selected:ring-sea"
                >
                  {t.label}
                  {t.key === "favorites" && favorites.size > 0 && <span className="ms-1.5 opacity-75">({favorites.size})</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="المجموعات" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {error && (
            <p role="alert" className="rounded-xl bg-pomegranate-soft p-4 font-medium text-pomegranate-deep">
              تعذّر تحميل المجموعات. حدّث الصفحة، وإن تكرر الخطأ تحقق من اتصال الإنترنت.
            </p>
          )}

          {sets?.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center">
              <p className="mx-auto max-w-md text-lg text-muted">{EMPTY[tab]}</p>
              {tab !== "favorites" && (
                <Link href={newSetHref} className="mt-5 inline-block rounded-full bg-sea px-6 py-2.5 font-bold text-white hover:bg-sea-deep">
                  أنشئ مجموعة
                </Link>
              )}
            </div>
          )}

          <ul className="grid gap-4 md:grid-cols-2">
            {sets?.map((s) => {
              const mine = s.owner_id === userId;
              const platform = s.owner_id === null;
              const count = s.questions[0]?.count ?? 0;
              const source = mine
                ? { label: s.is_public ? "مجموعتي، عامة" : "مجموعتي، خاصة", tone: "bg-sea-soft text-sea-deep", bar: "bg-sea" }
                : platform
                  ? { label: "من المنصة", tone: "bg-saffron-soft text-saffron-deep", bar: "bg-saffron" }
                  : { label: "من معلم آخر", tone: "bg-palm-soft text-palm-deep", bar: "bg-palm" };
              return (
                <li key={s.id} className="relative flex overflow-hidden rounded-3xl bg-surface ring-1 ring-border transition-shadow hover:shadow-[0_12px_30px_-18px_var(--indigo)]">
                  <span aria-hidden className={`w-1.5 shrink-0 ${source.bar}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${source.tone}`}>{source.label}</span>
                        <h2 className="mt-2 text-xl font-bold leading-snug">
                          <Link href={`/sets/${s.id}`} className="after:absolute after:inset-0 hover:text-sea-deep">
                            {s.title}
                          </Link>
                        </h2>
                      </div>
                      <div className="relative z-10">
                        <FavoriteButton setId={s.id} isFavorite={favorites.has(s.id)} />
                      </div>
                    </div>
                    <p className="text-sm text-muted">
                      {s.lesson.unit.title_ar}، درس {s.lesson.title_ar}
                    </p>
                    <p className="mt-auto font-semibold text-indigo dark:text-foreground">{questionCount(count)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
