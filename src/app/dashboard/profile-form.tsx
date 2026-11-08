"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";

const input =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-sea-600 focus:ring-2 focus:ring-sea-600/20";

export function ProfileForm({ fullName, school }: { fullName: string; school: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">الاسم</span>
        <input name="full_name" defaultValue={fullName} className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">المدرسة</span>
        <input name="school" defaultValue={school} placeholder="مثال: مدرسة السيب للتعليم الأساسي" className={input} />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-sea-600 px-4 py-2 font-medium text-white hover:bg-sea-700 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        {state.saved && !pending && <span role="status" className="text-sm text-green-700">تم الحفظ</span>}
        {state.error && <span role="alert" className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
