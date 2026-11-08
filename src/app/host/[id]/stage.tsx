"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { GameQuestion } from "@/lib/games";
import { CHOICE_TONES } from "@/lib/questions";
import { useFullscreen } from "@/lib/use-game";

/** Full-screen frame for the classroom display: slim control bar + content. */
export function Stage({
  children,
  setId,
  progress,
  sound,
  tone = "bg-sea",
}: {
  children: ReactNode;
  setId: string;
  progress?: string;
  sound: { enabled: boolean; toggle: () => void };
  tone?: string;
}) {
  const fs = useFullscreen();
  const btn = "rounded-full bg-white/15 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/25";
  return (
    <div className={`flex min-h-screen flex-col ${tone}`}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Link href={`/sets/${setId}`} className={btn}>
          خروج
        </Link>
        {progress && <span className="rounded-full bg-white px-4 py-2 font-bold text-indigo">{progress}</span>}
        <div className="ms-auto flex gap-2">
          <button type="button" onClick={sound.toggle} aria-pressed={sound.enabled} className={btn}>
            {sound.enabled ? "الصوت: يعمل" : "الصوت: متوقف"}
          </button>
          <button type="button" onClick={fs.toggle} className={btn}>
            {fs.on ? "إنهاء ملء الشاشة" : "ملء الشاشة"}
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-6 sm:px-6">{children}</div>
    </div>
  );
}

/** The question as the class sees it: large type, readable from the back row. */
export function QuestionCard({
  q,
  revealed,
  counts,
  footer,
}: {
  q: GameQuestion;
  revealed: boolean;
  counts?: Record<string, number>;
  footer?: ReactNode;
}) {
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const options = q.type === "short" ? [] : q.choices;
  return (
    <section className="rounded-[2rem] bg-white p-5 text-indigo shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <h1 className="flex-1 text-3xl font-bold leading-snug sm:text-4xl lg:text-5xl">{q.prompt}</h1>
        {q.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image_url} alt="" className="max-h-64 self-center rounded-2xl ring-1 ring-border lg:max-w-[40%]" />
        )}
      </div>

      {options.length > 0 && (
        <ul className={`mt-6 grid gap-3 ${options.length > 2 ? "sm:grid-cols-2" : "grid-cols-2"}`}>
          {options.map((c, i) => {
            const right = c === q.answer;
            const tone = q.type === "true_false" ? (c === "صح" ? "bg-palm" : "bg-pomegranate") : CHOICE_TONES[i];
            const n = counts?.[c] ?? 0;
            return (
              <li
                key={c}
                className={`relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-2xl font-bold text-white transition-opacity sm:text-3xl ${tone} ${
                  revealed && !right ? "opacity-35" : ""
                } ${revealed && right ? "ring-8 ring-white outline outline-4 outline-palm-deep" : ""}`}
              >
                {revealed && counts && (
                  <span aria-hidden className="absolute inset-y-0 right-0 bg-black/15" style={{ width: total ? `${(n / total) * 100}%` : 0 }} />
                )}
                <span dir="auto" className="relative flex-1">{c}</span>
                {revealed && right && (
                  <svg viewBox="0 0 16 16" className="relative h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" aria-label="الإجابة الصحيحة">
                    <path d="M3 8.5l3.2 3L13 4.5" />
                  </svg>
                )}
                {revealed && counts && <span className="relative rounded-full bg-white/25 px-3 text-xl">{n}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {q.type === "short" && revealed && (
        <p className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl bg-palm px-6 py-4 text-3xl font-bold text-white">
          الإجابة: <span dir="auto">{q.answer}</span>
        </p>
      )}

      {footer}
    </section>
  );
}

export function StageButton({ children, onClick, tone = "bg-pomegranate hover:bg-pomegranate-deep", disabled }: { children: ReactNode; onClick: () => void; tone?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-8 py-4 text-xl font-bold text-white shadow-lg transition-colors disabled:opacity-50 ${tone}`}
    >
      {children}
    </button>
  );
}
