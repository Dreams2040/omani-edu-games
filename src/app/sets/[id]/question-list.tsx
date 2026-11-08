"use client";

import { useCallback, useState } from "react";
import { TYPE_LABEL } from "@/lib/questions";
import { deleteQuestion, moveQuestion } from "../actions";
import { CHOICE_TONES, QuestionForm, type EditableQuestion } from "./question-form";

function QuestionBody({ q }: { q: EditableQuestion }) {
  return (
    <>
      <p className="text-lg font-semibold leading-relaxed">{q.prompt}</p>
      {q.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={q.image_url} alt="" className="mt-3 max-h-56 rounded-2xl ring-1 ring-border" />
      )}
      {q.type === "short" ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-palm-soft px-3 py-1.5 font-semibold text-palm-deep">
          الإجابة: <span dir="auto">{q.answer}</span>
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {q.choices.map((c, i) => {
            const right = c === q.answer;
            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ring-1 ${right ? "bg-palm-soft font-semibold text-palm-deep ring-palm" : "ring-border"}`}
              >
                <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${q.type === "mcq" ? CHOICE_TONES[i] : c === "صح" ? "bg-palm" : "bg-pomegranate"}`} />
                <span dir="auto" className="min-w-0 flex-1">{c}</span>
                {right && <span className="text-sm">الإجابة الصحيحة</span>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function IconButton({ label, children, ...props }: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-indigo-soft hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
      {...props}
    >
      {children}
    </button>
  );
}

export function QuestionList({
  setId,
  userId,
  questions,
  editable,
}: {
  setId: string;
  userId: string;
  questions: EditableQuestion[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [newKey, setNewKey] = useState(0);
  const closeEditor = useCallback(() => setEditing(null), []);
  const resetNew = useCallback(() => setNewKey((k) => k + 1), []);

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="rounded-3xl border-2 border-dashed border-border p-8 text-center text-muted">
          {editable ? "المجموعة فارغة. أضف أول سؤال من النموذج في الأسفل." : "لا توجد أسئلة في هذه المجموعة بعد."}
        </p>
      )}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-3xl bg-surface p-5 ring-1 ring-border sm:p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo font-display text-lg font-bold text-white dark:bg-sea">
                {i + 1}
              </span>
              <span className="text-sm font-semibold text-muted">{TYPE_LABEL[q.type]}</span>

              {editable && editing !== q.id && (
                <div className="ms-auto flex items-center">
                  <form action={moveQuestion.bind(null, setId, q.id, -1)}>
                    <IconButton label="انقل السؤال للأعلى" disabled={i === 0}>
                      <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 10l5-5 5 5" />
                      </svg>
                    </IconButton>
                  </form>
                  <form action={moveQuestion.bind(null, setId, q.id, 1)}>
                    <IconButton label="انقل السؤال للأسفل" disabled={i === questions.length - 1}>
                      <svg viewBox="0 0 16 16" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6l5 5 5-5" />
                      </svg>
                    </IconButton>
                  </form>
                  <button
                    type="button"
                    onClick={() => setEditing(q.id)}
                    className="rounded-full px-3 py-1.5 text-sm font-semibold text-sea-deep hover:bg-sea-soft"
                  >
                    تعديل
                  </button>
                  <form
                    action={deleteQuestion.bind(null, setId, q.id)}
                    onSubmit={(e) => {
                      if (!confirm(`حذف السؤال ${i + 1}؟ لا يمكن التراجع عن الحذف.`)) e.preventDefault();
                    }}
                  >
                    <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-pomegranate-deep hover:bg-pomegranate-soft">
                      حذف
                    </button>
                  </form>
                </div>
              )}
            </div>

            {editing === q.id ? (
              <QuestionForm setId={setId} userId={userId} question={q} onDone={closeEditor} onCancel={closeEditor} />
            ) : (
              <QuestionBody q={q} />
            )}
          </li>
        ))}
      </ol>

      {editable && (
        <section aria-labelledby="add-q" className="rounded-3xl bg-surface p-5 ring-2 ring-sea sm:p-6">
          <h2 id="add-q" className="mb-4 text-xl font-bold">
            سؤال جديد
          </h2>
          <QuestionForm key={newKey} setId={setId} userId={userId} onDone={resetNew} />
        </section>
      )}
    </div>
  );
}
