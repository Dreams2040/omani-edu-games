import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import { ProfileForm } from "./profile-form";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: units, error: unitsError }] = await Promise.all([
    supabase.from("profiles").select("full_name, school, role").eq("id", userId).single(),
    supabase
      .from("units")
      .select(
        "id, title_ar, semester, position, grades!inner(number, name_ar), subjects!inner(name_ar), lessons(id, title_ar, position, objectives, question_sets(count))",
      )
      .eq("grades.number", 5)
      .order("semester")
      .order("position")
      .order("position", { referencedTable: "lessons" }),
  ]);

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <SiteHeader>
        <form action={signOut}>
          <button type="submit" className="rounded-lg border border-border px-4 py-2 hover:bg-sand-100">
            خروج
          </button>
        </form>
      </SiteHeader>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {firstName ? `أهلاً ${firstName}` : "أهلاً بك"}
        </h1>
        <p className="mt-1 text-muted">هذه دروس الصف الخامس المتاحة الآن. سنضيف صفوفاً ومواد أخرى تباعاً.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          <section aria-labelledby="curriculum" className="space-y-5">
            <h2 id="curriculum" className="sr-only">دروس المنهج</h2>
            {unitsError && (
              <p role="alert" className="rounded-lg bg-danger/10 p-3 text-danger">تعذّر تحميل الدروس.</p>
            )}
            {units?.map((unit) => (
              <article key={unit.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <header className="flex flex-wrap items-baseline justify-between gap-2 bg-sand-100 px-5 py-3">
                  <h3 className="text-lg font-bold">{unit.title_ar}</h3>
                  <span className="text-sm text-muted">
                    {unit.subjects.name_ar} · {unit.grades.name_ar} · الفصل الدراسي {unit.semester === 1 ? "الأول" : "الثاني"}
                  </span>
                </header>
                <ol className="divide-y divide-border">
                  {unit.lessons.map((lesson, i) => {
                    const sets = lesson.question_sets[0]?.count ?? 0;
                    return (
                      <li key={lesson.id} className="flex items-start gap-4 px-5 py-4">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-600/10 font-bold text-green-700">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{lesson.title_ar}</p>
                          {lesson.objectives && <p className="mt-0.5 text-sm text-muted">{lesson.objectives}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-sea-600/10 px-3 py-1 text-sm text-sea-700">
                          {sets === 1 ? "مجموعة أسئلة" : `${sets} مجموعات`}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </article>
            ))}
          </section>

          <aside className="h-fit rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-lg font-bold">ملفي الشخصي</h2>
            <ProfileForm fullName={profile?.full_name ?? ""} school={profile?.school ?? ""} />
          </aside>
        </div>
      </main>
    </>
  );
}
