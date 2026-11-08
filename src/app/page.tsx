import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SailRaceBoard } from "@/components/sail-race-board";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    title: "اختر درس اليوم",
    body: "تصفّح حسب الصف والمادة والوحدة، فتجد مجموعات أسئلة مربوطة بالدرس نفسه.",
    tone: "bg-sea-soft text-sea-deep",
  },
  {
    title: "اعرض اللعبة على الشاشة",
    body: "اضغط «ابدأ لعبة»، فتتحول الأسئلة إلى سباق أو قافلة يتابعها الصف كله.",
    tone: "bg-saffron-soft text-saffron-deep",
  },
  {
    title: "اعرف ما يحتاج إعادة شرح",
    body: "بعد اللعبة ترى نسبة الإجابات الصحيحة لكل سؤال.",
    tone: "bg-pomegranate-soft text-pomegranate-deep",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const primaryHref = signedIn ? "/dashboard" : "/login";

  return (
    <>
      <SiteHeader>
        <Link
          href={primaryHref}
          className="whitespace-nowrap rounded-full bg-sea px-5 py-2 font-semibold text-white transition-colors hover:bg-sea-deep"
        >
          {signedIn ? "لوحتي" : "دخول المعلم"}
        </Link>
      </SiteHeader>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-saffron/25 blur-3xl" />
          <div aria-hidden className="absolute -bottom-48 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-sea/20 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pb-24 lg:pt-20">
            <div>
              <h1 className="text-balance text-4xl font-extrabold text-indigo sm:text-6xl dark:text-foreground">
                حوّل أسئلة درسك إلى سباق يشجّع فيه الصف كله
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">
                مجموعات أسئلة جاهزة مرتبة حسب المنهج العُماني، تعرضها على شاشة الصف كلعبة جماعية بضغطة واحدة.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryHref}
                  className="rounded-full bg-pomegranate px-7 py-3.5 text-lg font-bold text-white shadow-[0_10px_24px_-8px_var(--pomegranate)] transition-colors hover:bg-pomegranate-deep"
                >
                  {signedIn ? "افتح دروسي" : "أنشئ حسابك المجاني"}
                </Link>
                {!signedIn && (
                  <Link href="/login" className="rounded-full px-5 py-3.5 font-semibold text-indigo hover:bg-indigo-soft dark:text-foreground">
                    لديّ حساب
                  </Link>
                )}
              </div>
              <p className="mt-6 text-sm text-muted">متاح الآن: رياضيات الصف الخامس. مواد وصفوف أخرى قريباً.</p>
            </div>

            <SailRaceBoard />
          </div>
        </section>

        {/* How it works: a real sequence, so it is numbered */}
        <section aria-labelledby="how" className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="how" className="text-3xl font-bold">ثلاث خطوات في الحصة</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold ${s.tone}`}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The two games */}
        <section aria-labelledby="games" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="games" className="text-3xl font-bold">لعبتان من بيئتنا</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-5">
            <article className="relative overflow-hidden rounded-[2rem] bg-sea p-8 text-white md:col-span-3">
              <svg aria-hidden viewBox="0 0 200 120" className="absolute -bottom-4 -left-6 w-56 opacity-25">
                <path d="M100 10 L100 80 L150 80 Z M94 24 L94 80 L60 80 Z" fill="#fff" />
                <path d="M40 86 H170 L150 104 H58 Z" fill="#fff" />
              </svg>
              <p className="font-semibold text-white/80">تكفيها شاشة العرض</p>
              <h3 className="mt-1 text-3xl font-bold">سباق السفن الشراعية</h3>
              <p className="mt-4 max-w-md text-white/90">
                لكل فريق سفينة تنطلق من صحار. يجيب الفريق شفهياً، وتضغط أنت «صح» أو «خطأ»، فتتقدم السفينة نحو موانئ التجارة القديمة.
              </p>
            </article>

            <article className="relative overflow-hidden rounded-[2rem] bg-saffron p-8 text-indigo md:col-span-2">
              <svg aria-hidden viewBox="0 0 120 80" className="absolute -bottom-2 -left-4 w-40 opacity-30">
                <path d="M10 70 Q30 40 60 60 T110 60 V80 H10 Z" fill="var(--indigo)" />
                <circle cx="88" cy="22" r="12" fill="#fff" />
              </svg>
              <p className="font-semibold text-indigo/70">الطلاب من أجهزتهم</p>
              <h3 className="mt-1 text-3xl font-bold">قافلة اللبان</h3>
              <p className="mt-4 text-indigo/85">
                يدخل الطلاب برمز ولقب دون حساب. كل جواب صحيح يجمع لباناً من أشجار ظفار، وتسير القوافل على الشاشة حسب الترتيب.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-6">
          <span>ألعاب تعليمية بهوية عُمانية</span>
          <span>لا نجمع أي بيانات شخصية عن الطلاب.</span>
        </div>
      </footer>
    </>
  );
}
