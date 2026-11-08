import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";
import { ProfileForm } from "./profile-form";

// Each unit gets its own colour so teachers can tell units apart at a glance.
const UNIT_TONES = [
  { bar: "bg-sea", badge: "bg-sea-soft text-sea-deep", chip: "text-sea-deep" },
  { bar: "bg-pomegranate", badge: "bg-pomegranate-soft text-pomegranate-deep", chip: "text-pomegranate-deep" },
  { bar: "bg-palm", badge: "bg-palm-soft text-palm-deep", chip: "text-palm-deep" },
  { bar: "bg-saffron", badge: "bg-saffron-soft text-saffron-deep", chip: "text-saffron-deep" },
];

function arabicCount(n: number, one: string, two: string, few: string, many: string) {
  if (n === 0) return `لا ${many}`;
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: units, error: unitsError }] = await Promise.all([
    supabase.from("profiles").select("full_name, school").eq("id", userId).single(),
    supabase
      .from("units")
      .select(
        "id, title_ar, semester, position, grades!inner(number, name_ar), subjects!inner(name_ar), lessons(id, title_ar, position, objectives, question_sets(id, questions(count)))",
      )
      .eq("grades.number", 5)
      .order("semester")
      .order("position")
      .order("position", { referencedTable: "lessons" }),
  ]);

  const firstName = profile?.full_name?.split(" ")[0];
  const lessonCount = units?.reduce((n, u) => n + u.lessons.length, 0) ?? 0;
  const subject = units?.[0]?.subjects.name_ar;
  const grade = units?.[0]?.grades.name_ar;

  return (
    <>
      <SiteHeader>
        <form action={signOut}>
          <button type="submit" className="whitespace-nowrap rounded-full px-3 py-2 font-semibold sm:px-4 text-muted transition-colors hover:bg-indigo-soft hover:text-foreground">
            تسجيل الخروج
          </button>
        </form>
      </SiteHeader>

      <main className="flex-1">
        {/* Greeting band */}
        <section className="relative overflow-hidden bg-sea text-white">
          <svg aria-hidden className="absolute inset-0 h-full w-full opacity-20">
            <defs>
              <pattern id="dash-waves" width="64" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 12 Q16 2 32 12 T64 12" fill="none" stroke="#fff" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dash-waves)" />
          </svg>
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h1 className="text-3xl font-bold sm:text-4xl">{firstName ? `أهلاً ${firstName}` : "أهلاً بك"}</h1>
            <p className="mt-2 text-lg text-white/90">اختر درساً لتراجع أسئلته قبل الحصة.</p>
            {grade && subject && (
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-4 py-1.5 font-semibold">{grade}</span>
                <span className="rounded-full bg-white/20 px-4 py-1.5 font-semibold">{subject}</span>
                <span className="rounded-full bg-saffron px-4 py-1.5 font-semibold text-indigo">
                  {arabicCount(lessonCount, "درس واحد", "درسان", "دروس", "درساً")}
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
          <section aria-label="دروس المنهج" className="space-y-8">
            {unitsError && (
              <p role="alert" className="rounded-xl bg-pomegranate-soft p-4 font-medium text-pomegranate-deep">
                تعذّر تحميل الدروس. حدّث الصفحة، وإن تكرر الخطأ تحقق من اتصال الإنترنت.
              </p>
            )}

            {units?.length === 0 && (
              <p className="rounded-xl bg-surface p-6 text-muted ring-1 ring-border">لا توجد دروس منشورة لهذا الصف بعد.</p>
            )}

            {units?.map((unit, u) => {
              const tone = UNIT_TONES[u % UNIT_TONES.length];
              return (
                <article key={unit.id} className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
                  <header className="flex items-stretch gap-4 px-6 pt-6">
                    <span aria-hidden className={`w-1.5 shrink-0 rounded-full ${tone.bar}`} />
                    <div>
                      <h2 className="text-2xl font-bold">{unit.title_ar}</h2>
                      <p className="text-sm text-muted">
                        الفصل الدراسي {unit.semester === 1 ? "الأول" : "الثاني"}، {arabicCount(unit.lessons.length, "درس واحد", "درسان", "دروس", "درساً")}
                      </p>
                    </div>
                  </header>

                  <ol className="mt-4 divide-y divide-border">
                    {unit.lessons.map((lesson, i) => {
                      const sets = lesson.question_sets.length;
                      const questions = lesson.question_sets.reduce((n, s) => n + (s.questions[0]?.count ?? 0), 0);
                      return (
                        <li key={lesson.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4">
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg font-bold ${tone.badge}`}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1 basis-56">
                            <h3 className="text-lg font-semibold leading-snug">{lesson.title_ar}</h3>
                            {lesson.objectives && <p className="mt-0.5 text-sm text-muted">{lesson.objectives}</p>}
                          </div>
                          <p className={`shrink-0 text-sm font-semibold ${tone.chip}`}>
                            {arabicCount(sets, "مجموعة واحدة", "مجموعتان", "مجموعات", "مجموعة")}،{" "}
                            {arabicCount(questions, "سؤال واحد", "سؤالان", "أسئلة", "سؤالاً")}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-3xl bg-surface p-6 ring-1 ring-border lg:sticky lg:top-24">
            <div className="mb-5 flex items-center gap-3">
              <span aria-hidden className="grid h-12 w-12 place-items-center rounded-2xl bg-saffron font-display text-xl font-bold text-indigo">
                {firstName?.[0] ?? "م"}
              </span>
              <div>
                <h2 className="text-lg font-bold">ملفي الشخصي</h2>
                <p className="text-sm text-muted">{profile?.school || "أضف اسم مدرستك"}</p>
              </div>
            </div>
            <ProfileForm fullName={profile?.full_name ?? ""} school={profile?.school ?? ""} />
          </aside>
        </div>
      </main>
    </>
  );
}
