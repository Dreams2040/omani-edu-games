import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <>
      <SiteHeader>
        {signedIn ? (
          <Link href="/dashboard" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            لوحتي
          </Link>
        ) : (
          <Link href="/login" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            دخول المعلم
          </Link>
        )}
      </SiteHeader>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="mb-3 font-medium text-sea-600">للمعلمين في سلطنة عُمان</p>
          <h1 className="text-3xl font-bold leading-snug sm:text-5xl sm:leading-tight">
            أسئلة جاهزة لدرس اليوم،
            <br />
            ولعبة جماعية بضغطة واحدة
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">
            اختر الصف والمادة والدرس، فتجد مجموعات أسئلة مرتبة حسب المنهج العُماني. اعرضها على شاشة الصف
            كسباق للسفن الشراعية، أو كقافلة لبان يشارك فيها الطلاب من أجهزتهم.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700"
            >
              {signedIn ? "افتح دروسك" : "ابدأ مجاناً"}
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-20 sm:grid-cols-3">
          {[
            { t: "حسب المنهج", d: "الصف ثم المادة ثم الوحدة ثم الدرس، كما تبحث عنه في دفتر التحضير." },
            { t: "سباق السفن الشراعية", d: "لكل فريق سفينة تنطلق من صحار، وكل جواب صحيح يدفعها نحو الميناء." },
            { t: "قافلة اللبان", d: "يدخل الطلاب برمز ويجيبون من أجهزتهم، دون حساب أو بريد." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-2 text-lg font-bold">{c.t}</h2>
              <p className="text-muted">{c.d}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
