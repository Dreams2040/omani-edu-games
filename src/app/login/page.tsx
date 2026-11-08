import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  google: "تعذّر الدخول بحساب Google. حاول مرة أخرى أو استخدم البريد.",
  callback: "انتهت صلاحية الرابط أو أنه غير صحيح. سجّل الدخول من جديد.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  const { error } = await searchParams;
  const initialError = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">أهلاً بك</h1>
        <p className="mb-8 text-muted">ادخل لتصل إلى دروسك ومجموعات أسئلتك.</p>
        <LoginForm initialError={initialError} />
      </main>
    </>
  );
}
