import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  google: "تعذّر الدخول بحساب Google. حاول مرة أخرى أو استخدم البريد.",
  callback: "انتهت صلاحية الرابط أو أنه غير صحيح. سجّل الدخول من جديد.",
};

function CaravanScene() {
  return (
    <svg viewBox="0 0 400 260" aria-hidden className="h-auto w-full">
      <circle cx="300" cy="70" r="38" fill="#fff" fillOpacity="0.9" />
      <path d="M0 190 Q90 140 190 175 T400 160 V260 H0 Z" fill="var(--saffron-deep)" fillOpacity="0.35" />
      <path d="M0 215 Q120 175 230 205 T400 200 V260 H0 Z" fill="var(--indigo)" fillOpacity="0.9" />
      {/* camels: simple silhouettes walking left */}
      {[70, 150, 230].map((x, i) => (
        <g key={x} transform={`translate(${x} ${180 - i * 4})`} fill="var(--indigo)">
          <path d="M0 0 Q4 -18 18 -16 Q24 -30 34 -16 Q42 -14 44 -4 L44 0 Z" />
          <path d="M0 0 Q-6 -10 -12 -22 L-8 -24 Q-2 -14 4 -4 Z" />
          <rect x="4" y="0" width="3" height="16" rx="1.5" />
          <rect x="16" y="0" width="3" height="16" rx="1.5" />
          <rect x="30" y="0" width="3" height="16" rx="1.5" />
          <rect x="40" y="0" width="3" height="16" rx="1.5" />
          <circle cx="24" cy="-24" r="5" fill="var(--pomegranate)" />
        </g>
      ))}
    </svg>
  );
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  const { error } = await searchParams;
  const initialError = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-2">
      <section className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 self-start">
          <LogoMark />
          <span className="font-display text-xl font-bold leading-none">ألعاب تعليمية بهوية عُمانية</span>
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold sm:text-4xl">أهلاً بك</h1>
          <p className="mb-8 mt-2 text-muted">ادخل لتصل إلى دروسك ومجموعات أسئلتك.</p>
          <LoginForm initialError={initialError} />
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-saffron lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-pomegranate/30 blur-2xl" />
        <div className="relative px-14 pt-16">
          <p className="font-display text-4xl font-bold leading-snug text-indigo">
            كل جواب صحيح
            <br />
            يقرّب قافلة الصف من ظفار
          </p>
          <p className="mt-4 max-w-sm text-lg text-indigo/80">
            في قافلة اللبان يجيب الطلاب من أجهزتهم برمز ولقب فقط، دون حساب أو بريد.
          </p>
        </div>
        <div className="relative">
          <CaravanScene />
        </div>
      </aside>
    </main>
  );
}
