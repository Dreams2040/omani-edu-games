"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

async function siteUrl() {
  const h = await headers();
  const origin = h.get("origin");
  return origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
