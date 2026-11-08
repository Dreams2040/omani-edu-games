"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

// Where Supabase sends people back after email confirmation or Google sign-in.
// The configured site address wins; the request origin is only a fallback.
// (Supabase also checks it against the project's allowed redirect URLs.)
async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  // On Vercel production, use the project's main address (set automatically by Vercel).
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const h = await headers();
  return h.get("origin") ?? "http://localhost:3000";
}

function arabicError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "البريد أو كلمة المرور غير صحيحة.";
  if (m.includes("email not confirmed")) return "لم يتم تأكيد البريد بعد. افتح الرسالة التي وصلتك واضغط رابط التأكيد.";
  if (m.includes("already registered")) return "هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.";
  if (m.includes("password should be")) return "كلمة المرور قصيرة. استخدم 8 أحرف على الأقل.";
  if (m.includes("rate limit")) return "محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.";
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "اكتب البريد وكلمة المرور." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: arabicError(error.message) };

  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !email || !password) return { error: "اكتب الاسم والبريد وكلمة المرور." };
  if (password.length < 8) return { error: "كلمة المرور قصيرة. استخدم 8 أحرف على الأقل." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: arabicError(error.message) };

  // If email confirmation is off, Supabase returns a session right away.
  if (data.session) redirect("/dashboard");

  return { message: "أرسلنا رابط تأكيد إلى بريدك. افتحه ثم ارجع لتسجيل الدخول." };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=/dashboard` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
