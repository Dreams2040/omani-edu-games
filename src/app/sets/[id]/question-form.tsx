"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IMAGE_BUCKET,
  IMAGE_TYPES,
  MAX_CHOICES,
  MAX_IMAGE_BYTES,
  MIN_CHOICES,
  QUESTION_TYPES,
  TRUE_FALSE,
  type QuestionType,
} from "@/lib/questions";
import { saveQuestion, type FormState } from "../actions";
import { inputClass } from "../set-form";

export type EditableQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  image_url: string | null;
  choices: string[];
  answer: string;
};

// The same four colours the games use for answer buttons.
export const CHOICE_TONES = ["bg-sea", "bg-saffron", "bg-pomegranate", "bg-palm", "bg-indigo", "bg-sea-deep"];

export function QuestionForm({
  setId,
  userId,
  question,
  onDone,
  onCancel,
}: {
  setId: string;
  userId: string;
  question?: EditableQuestion;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveQuestion.bind(null, setId, question?.id ?? null),
    {},
  );

  // Every field is controlled: React resets uncontrolled fields after a form
  // action, which would wipe the teacher's text when validation fails.
  const [type, setType] = useState<QuestionType>(question?.type ?? "mcq");
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [choices, setChoices] = useState<string[]>(
    question?.type === "mcq" ? question.choices : ["", "", "", ""],
  );
  const [correct, setCorrect] = useState<number | null>(
    question?.type === "mcq" ? question.choices.indexOf(question.answer) : null,
  );
  const [tfAnswer, setTfAnswer] = useState(question?.type === "true_false" ? question.answer : "");
  const [shortAnswer, setShortAnswer] = useState(question?.type === "short" ? question.answer : "");
  const [imageUrl, setImageUrl] = useState(question?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Tell the parent when a save succeeds (it closes the editor or clears the form).
  const lastSaved = useRef(state.savedAt);
  useEffect(() => {
    if (state.savedAt && state.savedAt !== lastSaved.current) {
      lastSaved.current = state.savedAt;
      onDone?.();
    }
  }, [state.savedAt, onDone]);

  async function upload(file: File) {
    setUploadError("");
    if (!IMAGE_TYPES.includes(file.type)) return setUploadError("اختر صورة بصيغة PNG أو JPG أو WEBP أو GIF.");
    if (file.size > MAX_IMAGE_BYTES) return setUploadError("حجم الصورة أكبر من 2 ميغابايت. صغّرها ثم أعد المحاولة.");

    setUploading(true);
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError("تعذّر رفع الصورة. تحقق من الاتصال وحاول مرة أخرى.");
    setImageUrl(supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const idPrefix = question?.id ?? "new";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="choices" value={JSON.stringify(choices)} />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">نوع السؤال</legend>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
              className="rounded-full px-4 py-2 font-semibold ring-1 ring-border transition-colors hover:bg-indigo-soft aria-pressed:bg-indigo aria-pressed:text-white aria-pressed:ring-indigo dark:aria-pressed:bg-sea dark:aria-pressed:ring-sea"
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">نص السؤال</span>
        <textarea
          name="prompt"
          required
          rows={2}
          maxLength={1000}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={type === "true_false" ? "مثال: العدد 450,320 أكبر من 450,302." : "مثال: قرّب العدد 7,462 إلى أقرب مئة."}
          className={`${inputClass} text-lg`}
        />
      </label>

      {/* Image */}
      <div>
        {imageUrl ? (
          <div className="flex flex-wrap items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="صورة السؤال" className="max-h-48 rounded-2xl ring-1 ring-border" />
            <button type="button" onClick={() => setImageUrl("")} className="rounded-full px-4 py-2 text-sm font-semibold text-pomegranate-deep hover:bg-pomegranate-soft">
              أزل الصورة
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="flex items-center gap-2 rounded-full border-2 border-dashed border-border px-4 py-2 font-semibold text-muted transition-colors hover:border-sea hover:text-sea-deep disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="M21 16l-5-5-8 8" />
            </svg>
            {uploading ? "جارٍ رفع الصورة…" : "أضف صورة (اختياري)"}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) upload(f);
          }}
        />
        {uploadError && (
          <p role="alert" className="mt-2 text-sm font-semibold text-pomegranate-deep">
            {uploadError}
          </p>
        )}
      </div>

      {/* Answers */}
      {type === "mcq" && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">الخيارات، واضغط الدائرة بجانب الإجابة الصحيحة</legend>
          <ol className="space-y-2">
            {choices.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <label className="relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl text-white" title="الإجابة الصحيحة">
                  <span aria-hidden className={`absolute inset-0 rounded-xl ${CHOICE_TONES[i]}`} />
                  <input
                    type="radio"
                    name="correct"
                    value={i}
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    aria-label={`الخيار ${i + 1} هو الإجابة الصحيحة`}
                    className="peer sr-only"
                  />
                  <span aria-hidden className="relative grid h-6 w-6 place-items-center rounded-full border-2 border-white peer-checked:bg-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-[var(--ring)]">
                    {correct === i && (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-palm-deep" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 8.5l3.2 3L13 4.5" />
                      </svg>
                    )}
                  </span>
                </label>
                <input
                  value={c}
                  onChange={(e) => setChoices(choices.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-label={`الخيار ${i + 1}`}
                  placeholder={`الخيار ${i + 1}`}
                  maxLength={200}
                  className={`${inputClass} ${correct === i ? "border-palm" : ""}`}
                />
                {choices.length > MIN_CHOICES && (
                  <button
                    type="button"
                    onClick={() => {
                      setChoices(choices.filter((_, j) => j !== i));
                      if (correct === i) setCorrect(null);
                      else if (correct !== null && correct > i) setCorrect(correct - 1);
                    }}
                    aria-label={`احذف الخيار ${i + 1}`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-pomegranate-soft hover:text-pomegranate-deep"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ol>
          {choices.length < MAX_CHOICES && (
            <button type="button" onClick={() => setChoices([...choices, ""])} className="mt-2 rounded-full px-4 py-2 text-sm font-semibold text-sea-deep hover:bg-sea-soft">
              أضف خياراً
            </button>
          )}
        </fieldset>
      )}

      {type === "true_false" && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">الإجابة الصحيحة</legend>
          <div className="flex gap-3">
            {TRUE_FALSE.map((v) => (
              <label
                key={v}
                className={`flex min-w-28 cursor-pointer items-center justify-center rounded-2xl px-6 py-3 text-lg font-bold ring-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--ring)] ${
                  tfAnswer === v
                    ? v === "صح"
                      ? "bg-palm text-white ring-palm"
                      : "bg-pomegranate text-white ring-pomegranate"
                    : "ring-border hover:bg-indigo-soft"
                }`}
              >
                <input type="radio" name="answer" value={v} checked={tfAnswer === v} onChange={() => setTfAnswer(v)} className="sr-only" />
                {v}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === "short" && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">الإجابة الصحيحة</span>
          <input
            name="answer"
            value={shortAnswer}
            onChange={(e) => setShortAnswer(e.target.value)}
            maxLength={200}
            placeholder="مثال: 7500"
            className={inputClass}
            id={`${idPrefix}-short`}
          />
          <span className="mt-1 block text-sm text-muted">اجعلها قصيرة: رقماً أو كلمة أو كلمتين، ليسهل تصحيحها في اللعبة.</span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-sea px-6 py-2.5 font-bold text-white transition-colors hover:bg-sea-deep disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : question ? "حفظ السؤال" : "أضف السؤال"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-5 py-2.5 font-semibold text-muted hover:bg-indigo-soft">
            إلغاء
          </button>
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
