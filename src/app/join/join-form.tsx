"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAYER_STORAGE_KEY, type StoredPlayer } from "@/lib/games";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  P0002: "الرمز غير صحيح، أو انتهت اللعبة. تأكد من الرمز على شاشة الصف.",
  "23505": "هذا اللقب مستخدم في اللعبة. اختر لقباً آخر.",
  "22023": "اكتب لقباً من حرف واحد إلى 20 حرفاً.",
  "53400": "اكتمل عدد اللاعبين في هذه اللعبة.",
};

const field =
  "w-full rounded-2xl border-4 border-transparent bg-white px-5 py-4 text-center text-2xl font-bold text-indigo outline-none placeholder:text-indigo/40 focus:border-saffron";

export function JoinForm({ initialCode }: { initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const digits = code.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/\D/g, "");
    if (digits.length !== 6) return setError("الرمز من 6 أرقام.");
    if (!nickname.trim()) return setError("اكتب لقبك.");

    setPending(true);
    setError("");
    const { data, error } = await createClient().rpc("join_session", { p_code: digits, p_nickname: nickname });
    setPending(false);
    if (error || !data) return setError(ERRORS[error?.code ?? ""] ?? "تعذّر الدخول. تحقق من الاتصال وحاول مرة أخرى.");

    const player = data as StoredPlayer;
    try {
      localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player));
    } catch {
      return setError("المتصفح يمنع حفظ بيانات اللعبة. افتح الصفحة في نافذة عادية، لا في وضع التصفح الخاص.");
    }
    router.push(`/join/play?s=${player.session_id}`);
  }

  return (
    <form onSubmit={join} className="w-full space-y-4">
      <label className="block">
        <span className="mb-2 block text-lg font-semibold">رمز اللعبة</span>
        <input
          dir="ltr"
          inputMode="numeric"
          autoComplete="off"
          maxLength={7}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123 456"
          className={`${field} font-display tracking-[0.3em]`}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-lg font-semibold">لقبك في اللعبة</span>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} autoComplete="off" placeholder="مثال: صقر الباطنة" className={field} />
        <span className="mt-2 block text-sm text-white/80">اختر لقباً فقط، لا تكتب اسمك الكامل.</span>
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-white px-4 py-3 font-semibold text-pomegranate-deep">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-pomegranate py-4 text-2xl font-bold text-white shadow-lg transition-colors hover:bg-pomegranate-deep disabled:opacity-60"
      >
        {pending ? "جارٍ الدخول…" : "ادخل اللعبة"}
      </button>
    </form>
  );
}
