"use client";

import { useActionState, useState } from "react";
import { LessonPicker } from "@/components/curriculum-selects";
import type { CurriculumUnit } from "@/lib/curriculum";
import type { FormState } from "./actions";

export const inputClass =
  "w-full rounded-xl border-2 border-border bg-surface px-3.5 py-2.5 outline-none transition-colors focus:border-sea";

type SetValues = { title: string; description: string; lesson_id: number | null; is_public: boolean };

export function SetForm({
  tree,
  action,
  initial,
  submitLabel,
}: {
  tree: CurriculumUnit[];
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial: SetValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // Controlled so a failed save keeps what the teacher typed.
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [isPublic, setIsPublic] = useState(initial.is_public);

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">عنوان المجموعة</span>
        <input name="title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مراجعة سريعة قبل الاختبار" className={inputClass} />
      </label>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold">الدرس المرتبط</legend>
        <LessonPicker tree={tree} defaultLessonId={initial.lesson_id} />
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">
          وصف قصير <span className="font-normal text-muted">(اختياري)</span>
        </span>
        <textarea name="description" rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-sea-soft/60 p-4">
        <input type="checkbox" name="is_public" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--sea)]" />
        <span>
          <span className="block font-semibold">مشاركة المجموعة مع المعلمين</span>
          <span className="block text-sm text-muted">
            تظهر في المكتبة لكل المعلمين ويمكنهم نسخها. لا ترفع صوراً أو نصوصاً منسوخة من الكتاب المدرسي في المجموعات العامة.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-indigo px-7 py-3 font-bold text-white transition-colors hover:bg-sea-deep disabled:opacity-60 dark:bg-sea"
        >
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </button>
        {state.savedAt && !pending && !state.error && (
          <span role="status" className="text-sm font-semibold text-palm-deep">
            تم حفظ المجموعة
          </span>
        )}
        {state.error && (
          <span role="alert" className="text-sm font-semibold text-pomegranate-deep">
            {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
