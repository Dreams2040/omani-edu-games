import Link from "next/link";
import { notFound } from "next/navigation";
import { TeacherHeader } from "@/components/teacher-header";
import { GAME_LABEL, readSettings, teamColor } from "@/lib/games";
import { TYPE_LABEL } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETEACH = 50;

export const metadata = { title: "ملخص الجلسة" };

export default async function SummaryPage({ params }: PageProps<"/host/[id]/summary">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, set_id, game_type, status, settings, created_at, question_sets!inner(title)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const [{ data: questions }, { data: answers }, { count: playerCount }] = await Promise.all([
    supabase.from("questions").select("id, type, prompt, answer").eq("set_id", session.set_id).order("position").order("created_at"),
    supabase.from("session_answers").select("question_id, nickname, is_correct, answer").eq("session_id", id),
    supabase.from("session_players").select("id", { count: "exact", head: true }).eq("session_id", id),
  ]);

  const all = answers ?? [];
  const rows = (questions ?? []).map((q, i) => {
    const mine = all.filter((a) => a.question_id === q.id);
    const correct = mine.filter((a) => a.is_correct).length;
    const wrong = new Map<string, number>();
    for (const a of mine) if (!a.is_correct && a.answer) wrong.set(a.answer, (wrong.get(a.answer) ?? 0) + 1);
    const commonWrong = [...wrong].sort((x, y) => y[1] - x[1])[0];
    return {
      ...q,
      n: i + 1,
      answered: mine.length,
      correct,
      pct: mine.length ? Math.round((correct / mine.length) * 100) : null,
      commonWrong,
    };
  });

  const answered = all.length;
  const overall = answered ? Math.round((all.filter((a) => a.is_correct).length / answered) * 100) : null;
  const reteach = rows.filter((r) => r.pct !== null && r.pct < RETEACH);

  // Final standings: teams in the sail race, nicknames in the caravan.
  const names = session.game_type === "sail_race" ? (readSettings(session.settings).teams ?? []) : [...new Set(all.map((a) => a.nickname))];
  const standings = names
    .map((name) => ({ name, score: all.filter((a) => a.nickname === name && a.is_correct).length }))
    .sort((a, b) => b.score - a.score);

  const date = new Date(session.created_at).toLocaleDateString("ar-OM", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <TeacherHeader />
      <main className="flex-1">
        <section className="bg-sea text-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <p className="text-white/85">
              {GAME_LABEL[session.game_type]}، {date}
            </p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">ملخص الجلسة: {session.question_sets.title}</h1>
            {session.status !== "finished" && (
              <p className="mt-3 inline-block rounded-full bg-saffron px-4 py-1.5 font-semibold text-indigo">اللعبة لم تنتهِ بعد، والأرقام حتى الآن.</p>
            )}
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/15 p-4">
                <dt className="text-white/85">نسبة الصواب</dt>
                <dd className="font-display text-4xl font-bold">{overall === null ? "—" : `${overall}%`}</dd>
              </div>
              <div className="rounded-2xl bg-white/15 p-4">
                <dt className="text-white/85">{session.game_type === "sail_race" ? "الفرق" : "الطلاب"}</dt>
                <dd className="font-display text-4xl font-bold">{session.game_type === "sail_race" ? names.length : (playerCount ?? names.length)}</dd>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/15 p-4 sm:col-span-1">
                <dt className="text-white/85">أسئلة تحتاج إعادة شرح</dt>
                <dd className="font-display text-4xl font-bold">{reteach.length}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_280px]">
          <section aria-labelledby="per-q">
            <h2 id="per-q" className="text-2xl font-bold">
              نتيجة كل سؤال
            </h2>
            <p className="mb-5 mt-1 text-muted">الأسئلة التي أجاب عنها أقل من {RETEACH}% بشكل صحيح مميزة باللون الأحمر.</p>
            <ol className="space-y-3">
              {rows.map((r) => {
                const low = r.pct !== null && r.pct < RETEACH;
                return (
                  <li key={r.id} className={`rounded-2xl bg-surface p-5 ring-1 ${low ? "ring-2 ring-pomegranate" : "ring-border"}`}>
                    <div className="flex flex-wrap items-start gap-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo font-display font-bold text-white dark:bg-sea">{r.n}</span>
                      <div className="min-w-0 flex-1 basis-60">
                        <p className="text-lg font-semibold">{r.prompt}</p>
                        <p className="mt-1 text-sm text-muted">
                          {TYPE_LABEL[r.type]}، الإجابة: <span dir="auto">{r.answer}</span>
                        </p>
                        {r.commonWrong && (
                          <p className="mt-1 text-sm font-semibold text-pomegranate-deep">
                            أكثر إجابة خاطئة: <span dir="auto">«{r.commonWrong[0]}»</span> ({r.commonWrong[1]})
                          </p>
                        )}
                      </div>
                      <div className="w-full sm:w-40">
                        <p className={`text-left font-display text-2xl font-bold ${low ? "text-pomegranate-deep" : "text-palm-deep"}`}>{r.pct === null ? "لم يُجب" : `${r.pct}%`}</p>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-indigo-soft" aria-hidden>
                          <div className={`h-full rounded-full ${low ? "bg-pomegranate" : "bg-palm"}`} style={{ width: `${r.pct ?? 0}%` }} />
                        </div>
                        <p className="mt-1 text-left text-sm text-muted">
                          {r.correct} من {r.answered}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl bg-surface p-5 ring-1 ring-border">
              <h2 className="text-xl font-bold">{session.game_type === "sail_race" ? "ترتيب الفرق" : "ترتيب القوافل"}</h2>
              {standings.length === 0 ? (
                <p className="mt-2 text-muted">لا توجد إجابات مسجلة.</p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {standings.slice(0, 10).map((s, i) => (
                    <li key={s.name} className="flex items-center gap-3">
                      <span className="w-6 font-display font-bold text-muted">{i + 1}</span>
                      {session.game_type === "sail_race" && <span className="h-3 w-3 rounded-full" style={{ background: teamColor(s.name) }} />}
                      <span className="flex-1 truncate font-semibold">{s.name}</span>
                      <span className="font-display font-bold">{s.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <Link href={`/play/new?set=${session.set_id}`} className="block rounded-full bg-pomegranate px-6 py-3 text-center font-bold text-white hover:bg-pomegranate-deep">
              العب مرة أخرى
            </Link>
            <Link href={`/sets/${session.set_id}`} className="block rounded-full px-6 py-3 text-center font-semibold text-sea-deep ring-1 ring-border hover:bg-sea-soft">
              العودة إلى المجموعة
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
