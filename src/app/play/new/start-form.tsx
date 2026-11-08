"use client";

import { useActionState, useState } from "react";
import { TEAM_PRESETS, TIMER_OPTIONS, type GameType } from "@/lib/games";
import { startGame, type StartState } from "../actions";

const GAMES: { value: GameType; title: string; needs: string; body: string; tone: string }[] = [
  {
    value: "sail_race",
    title: "سباق السفن الشراعية",
    needs: "تكفيها شاشة العرض",
    body: "قسّم الصف إلى فرق. يجيب كل فريق شفهياً، وتضغط «صح» أو «خطأ» فتتقدم سفينته نحو الميناء.",
    tone: "bg-sea text-white",
  },
  {
    value: "frankincense_caravan",
    title: "قافلة اللبان",
    needs: "الطلاب من أجهزتهم",
    body: "يدخل الطلاب برمز ولقب دون حساب، ويجيبون من الجوال أو الحاسوب. كل جواب صحيح يجمع لباناً لقافلتهم.",
    tone: "bg-saffron text-indigo",
  },
];

export function StartForm({ setId }: { setId: string }) {
  const [state, action, pending] = useActionState<StartState, FormData>(startGame.bind(null, setId), {});
  const [game, setGame] = useState<GameType>("sail_race");
  const [teams, setTeams] = useState(3);
  const [timer, setTimer] = useState(30);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="game_type" value={game} />
      <input type="hidden" name="teams" value={teams} />
      <input type="hidden" name="timer" value={timer} />

      <fieldset>
        <legend className="mb-3 text-lg font-bold">اختر اللعبة</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {GAMES.map((g) => (
            <label
              key={g.value}
              className={`relative cursor-pointer rounded-[1.75rem] p-6 ring-4 transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--ring)] ${g.tone} ${
                game === g.value ? "ring-indigo dark:ring-white" : "opacity-75 ring-transparent hover:opacity-100"
              }`}
            >
              <input type="radio" name="game_choice" checked={game === g.value} onChange={() => setGame(g.value)} className="sr-only" />
              <span className="text-sm font-semibold opacity-80">{g.needs}</span>
              <span className="mt-1 block font-display text-2xl font-bold">{g.title}</span>
              <span className="mt-2 block opacity-90">{g.body}</span>
              {game === g.value && (
                <span aria-hidden className="absolute left-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-white text-palm-deep">
                  <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 8.5l3.2 3L13 4.5" />
                  </svg>
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {game === "sail_race" ? (
        <fieldset>
          <legend className="mb-3 text-lg font-bold">عدد الفرق</legend>
          <div className="flex flex-wrap gap-3">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={teams === n}
                onClick={() => setTeams(n)}
                className="rounded-2xl px-5 py-3 font-bold ring-2 ring-border transition-colors aria-pressed:bg-indigo aria-pressed:text-white aria-pressed:ring-indigo dark:aria-pressed:bg-sea dark:aria-pressed:ring-sea"
              >
                {n} فرق
              </button>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {TEAM_PRESETS.slice(0, teams).map((t) => (
              <li key={t.name} className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 font-semibold ring-1 ring-border">
                <span className="h-3 w-3 rounded-full" style={{ background: t.color }} />
                {t.name}
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="mb-3 text-lg font-bold">الوقت لكل سؤال</legend>
          <div className="flex flex-wrap gap-3">
            {TIMER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={timer === o.value}
                onClick={() => setTimer(o.value)}
                className="rounded-2xl px-5 py-3 font-bold ring-2 ring-border transition-colors aria-pressed:bg-indigo aria-pressed:text-white aria-pressed:ring-indigo dark:aria-pressed:bg-sea dark:aria-pressed:ring-sea"
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-pomegranate px-9 py-4 text-xl font-bold text-white shadow-[0_12px_28px_-10px_var(--pomegranate)] transition-colors hover:bg-pomegranate-deep disabled:opacity-60"
        >
          {pending ? "جارٍ التجهيز…" : "ابدأ اللعبة"}
        </button>
        {state.error && (
          <p role="alert" className="font-semibold text-pomegranate-deep">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
