"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

const input =
  "w-full rounded-xl border-2 border-border bg-surface px-3.5 py-2.5 outline-none transition-colors focus:border-sea";

export function ProfileForm({ fullName, school }: { fullName: string; school: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">الاسم</span>
        <input name="full_name" defaultValue={fullName} className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">المدرسة</span>
        <input name="school" defaultValue={school} placeholder="مثال: مدرسة السيب للتعليم الأساسي" className={input} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-indigo px-6 py-2.5 font-bold text-white transition-colors hover:bg-sea-deep disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : "حفظ التغييرات"}
        </button>
        {state.saved && !pending && <span role="status" className="text-sm font-semibold text-palm-deep">تم حفظ التغييرات</span>}
        {state.error && <span role="alert" className="text-sm font-semibold text-pomegranate-deep">{state.error}</span>}
      </div>
    </form>
  );
}
