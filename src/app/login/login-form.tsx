"use client";

import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

const input =
  "w-full rounded-xl border-2 border-border bg-surface px-4 py-3 text-base outline-none transition-colors focus:border-sea";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});

  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp;
  const error = state.error ?? (mode === "signin" ? initialError : undefined);

  return (
    <div>
      <div role="tablist" aria-label="نوع الدخول" className="mb-6 grid grid-cols-2 rounded-full bg-indigo-soft p-1.5">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full py-2.5 font-semibold transition-colors ${
              mode === m ? "bg-surface text-indigo shadow-sm dark:text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {m === "signin" ? "تسجيل الدخول" : "حساب جديد"}
          </button>
        ))}
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-border bg-surface py-3 font-semibold transition-colors hover:border-sea"
        >
          <svg aria-hidden width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          المتابعة بحساب Google
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-border" />
        أو بالبريد الإلكتروني
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={mode === "signin" ? signInAction : signUpAction} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">الاسم الكامل</span>
            <input name="full_name" required autoComplete="name" className={input} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">البريد الإلكتروني</span>
          <input name="email" type="email" required dir="ltr" autoComplete="email" placeholder="name@example.com" className={`${input} text-left`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">كلمة المرور</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            dir="ltr"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={`${input} text-left`}
          />
          {mode === "signup" && <span className="mt-1.5 block text-sm text-muted">8 أحرف على الأقل.</span>}
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-pomegranate-soft px-4 py-3 text-sm font-medium text-pomegranate-deep">
            {error}
          </p>
        )}
        {state.message && (
          <p role="status" className="rounded-xl bg-palm-soft px-4 py-3 text-sm font-medium text-palm-deep">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-sea py-3.5 text-lg font-bold text-white transition-colors hover:bg-sea-deep disabled:opacity-60"
        >
          {pending ? "لحظة…" : mode === "signin" ? "دخول" : "إنشاء الحساب"}
        </button>
        {mode === "signup" && (
          <p className="text-center text-sm text-muted">
            بإنشاء الحساب توافق على{" "}
            <a href="/terms" target="_blank" className="font-semibold text-sea-deep underline">
              شروط الاستخدام
            </a>{" "}
            و
            <a href="/privacy" target="_blank" className="font-semibold text-sea-deep underline">
              سياسة الخصوصية
            </a>
            .
          </p>
        )}
      </form>
    </div>
  );
}
