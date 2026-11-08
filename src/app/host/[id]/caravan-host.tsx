"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameAnswer, GameQuestion } from "@/lib/games";
import { createClient } from "@/lib/supabase/client";
import { useCountdown, useSessionUpdates, useSound } from "@/lib/use-game";
import { QuestionCard, Stage, StageButton } from "./stage";

type Status = "lobby" | "active" | "finished";
type Player = { id: string; nickname: string };

type Props = {
  sessionId: string;
  setId: string;
  title: string;
  questions: GameQuestion[];
  joinCode: string;
  timer: number;
  initialStatus: Status;
  initialIndex: number;
  initialRevealed: boolean;
  initialStartedAt: string | null;
  initialAnswers: GameAnswer[];
};

const CAMEL_COLORS = ["var(--saffron)", "var(--pomegranate)", "var(--palm)", "var(--sea)", "#fff"];

/** Night desert: the leading caravans walk from the right toward Dhofar's frankincense trees. */
function CaravanTrail({ leaders, total }: { leaders: { nickname: string; score: number }[]; total: number }) {
  const laneH = 64;
  const height = Math.max(leaders.length, 1) * laneH + 70;
  const start = 880;
  const finish = 150;
  return (
    <svg viewBox={`0 0 1000 ${height}`} role="img" aria-label="ترتيب القوافل" className="h-auto w-full">
      <rect width="1000" height={height} rx="28" fill="#18214a" />
      {[[120, 30], [300, 18], [520, 40], [700, 22], [860, 36], [420, 14]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="2.5" fill="#fff" fillOpacity="0.7" />
      ))}
      <circle cx="930" cy="40" r="22" fill="#fff3d6" />
      <path d={`M0 ${height - 40} Q250 ${height - 80} 500 ${height - 50} T1000 ${height - 60} V${height} H0 Z`} fill="var(--saffron-deep)" fillOpacity="0.5" />

      {/* Dhofar: frankincense trees at the finish */}
      {[60, 105].map((x) => (
        <g key={x} transform={`translate(${x} ${height - 70})`}>
          <rect x="-3" y="-10" width="6" height="40" rx="3" fill="#7a5230" />
          <ellipse cx="0" cy="-18" rx="26" ry="16" fill="var(--palm)" />
        </g>
      ))}
      <text x="82" y={height - 14} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">
        ظفار
      </text>

      {leaders.map((p, i) => {
        const y = 30 + i * laneH + 30;
        const x = start - (Math.min(p.score, total) / Math.max(total, 1)) * (start - finish);
        return (
          <g key={p.nickname} style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <g fill={CAMEL_COLORS[i % CAMEL_COLORS.length]} transform="scale(1.1)">
              <path d="M0 0 Q4 -18 18 -16 Q24 -30 34 -16 Q42 -14 44 -4 L44 0 Z" />
              <path d="M0 0 Q-6 -10 -12 -22 L-8 -24 Q-2 -14 4 -4 Z" />
              <rect x="4" y="0" width="3" height="14" rx="1.5" />
              <rect x="16" y="0" width="3" height="14" rx="1.5" />
              <rect x="30" y="0" width="3" height="14" rx="1.5" />
              <rect x="40" y="0" width="3" height="14" rx="1.5" />
            </g>
            {/* In RTL, anchor "end" puts the text's left edge here: the name trails behind the camel. */}
            <text x="62" y="-2" fontSize="20" fontWeight="700" fill="#fff" direction="rtl" textAnchor="end">
              {p.nickname} ({p.score})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CaravanHost(props: Props) {
  const { sessionId, setId, title, questions, joinCode, timer } = props;
  const router = useRouter();
  const sound = useSound();
  const supabase = useMemo(() => createClient(), []);

  const [status, setStatus] = useState<Status>(props.initialStatus);
  const [index, setIndex] = useState(props.initialIndex);
  const [revealed, setRevealed] = useState(props.initialRevealed);
  const [startedAt, setStartedAt] = useState(props.initialStartedAt);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answers, setAnswers] = useState<GameAnswer[]>(props.initialAnswers);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the join address depends on where the site is opened
    setOrigin(window.location.origin);
  }, []);

  const refresh = useCallback(async () => {
    const [p, a] = await Promise.all([
      supabase.from("session_players").select("id, nickname").eq("session_id", sessionId).order("joined_at"),
      supabase.from("session_answers").select("question_id, nickname, is_correct, answer").eq("session_id", sessionId),
    ]);
    if (p.data) setPlayers(p.data);
    if (a.data) setAnswers(a.data);
  }, [supabase, sessionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load of players and answers
    void refresh();
  }, [refresh]);
  useSessionUpdates(sessionId, refresh, 3000);

  const q = questions[index];
  const last = index === questions.length - 1;
  const deadline = status === "active" && !revealed && timer > 0 && startedAt ? new Date(new Date(startedAt).getTime() + timer * 1000).toISOString() : null;
  const secondsLeft = useCountdown(deadline);

  const current = useMemo(() => answers.filter((a) => a.question_id === q?.id), [answers, q]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of current) if (a.answer) c[a.answer] = (c[a.answer] ?? 0) + 1;
    return c;
  }, [current]);

  const standings = useMemo(() => {
    const score = new Map(players.map((p) => [p.nickname, 0]));
    for (const a of answers) if (a.is_correct && score.has(a.nickname)) score.set(a.nickname, score.get(a.nickname)! + 1);
    return [...score].map(([nickname, s]) => ({ nickname, score: s })).sort((x, y) => y.score - x.score || x.nickname.localeCompare(y.nickname, "ar"));
  }, [players, answers]);

  const update = useCallback(
    async (values: { status?: Status; current_index?: number; revealed?: boolean; question_started_at?: string; ended_at?: string }) => {
      const { error } = await supabase.from("game_sessions").update(values).eq("id", sessionId);
      setError(error ? "تعذّر حفظ التقدم. تحقق من الاتصال وحاول مرة أخرى." : "");
      return !error;
    },
    [supabase, sessionId],
  );

  const reveal = useCallback(async () => {
    if (revealed) return;
    setRevealed(true);
    sound.play("correct");
    await update({ revealed: true });
  }, [revealed, sound, update]);

  // Reveal automatically when time runs out or everyone has answered.
  const autoRevealed = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "active" || revealed || !q || autoRevealed.current === q.id) return;
    const everyone = players.length > 0 && current.length >= players.length;
    if (secondsLeft === 0 || everyone) {
      autoRevealed.current = q.id;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- driven by the clock and incoming answers, once per question
      void reveal();
    }
  }, [status, revealed, q, players.length, current.length, secondsLeft, reveal]);

  const lastTick = useRef<number | null>(null);
  useEffect(() => {
    if (secondsLeft !== null && secondsLeft > 0 && secondsLeft <= 5 && lastTick.current !== secondsLeft) {
      lastTick.current = secondsLeft;
      sound.play("tick");
    }
  }, [secondsLeft, sound]);

  async function start() {
    const now = new Date().toISOString();
    setStatus("active");
    setIndex(0);
    setRevealed(false);
    setStartedAt(now);
    sound.play("next");
    await update({ status: "active", current_index: 0, revealed: false, question_started_at: now });
  }

  async function next() {
    if (last) {
      sound.play("finish");
      if (await update({ status: "finished", ended_at: new Date().toISOString() })) router.push(`/host/${sessionId}/summary`);
      return;
    }
    const now = new Date().toISOString();
    setIndex(index + 1);
    setRevealed(false);
    setStartedAt(now);
    sound.play("next");
    await update({ current_index: index + 1, revealed: false, question_started_at: now });
  }

  async function removePlayer(id: string) {
    setPlayers((ps) => ps.filter((p) => p.id !== id));
    await supabase.from("session_players").delete().eq("id", id);
  }

  // ─── Lobby ────────────────────────────────────────────────
  if (status === "lobby") {
    return (
      <Stage setId={setId} sound={sound} tone="bg-indigo">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-8 py-6 text-center text-white">
          <div>
            <p className="text-xl text-white/80">{title}</p>
            <h1 className="mt-2 text-4xl font-bold sm:text-5xl">انضموا إلى قافلة اللبان</h1>
          </div>
          <div className="grid w-full gap-6 md:grid-cols-2">
            <div className="rounded-[2rem] bg-white p-6 text-indigo">
              <p className="text-lg font-semibold">١. افتح الموقع</p>
              <p dir="ltr" className="mt-2 break-all font-display text-3xl font-bold text-sea-deep sm:text-4xl">
                {origin ? `${origin.replace(/^https?:\/\//, "")}/join` : "…/join"}
              </p>
            </div>
            <div className="rounded-[2rem] bg-saffron p-6 text-indigo">
              <p className="text-lg font-semibold">٢. اكتب رمز اللعبة</p>
              <p dir="ltr" className="mt-1 font-display text-6xl font-extrabold tracking-[0.2em] sm:text-7xl">
                {joinCode.slice(0, 3)} {joinCode.slice(3)}
              </p>
            </div>
          </div>

          <section aria-live="polite" className="w-full">
            <h2 className="text-2xl font-bold">
              {players.length === 0 ? "بانتظار أول طالب…" : `انضم ${players.length} ${players.length <= 10 && players.length > 2 ? "طلاب" : "طالباً"}`}
            </h2>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {players.map((p) => (
                <li key={p.id} className="flex items-center gap-1 rounded-full bg-white/15 py-1.5 pe-1.5 ps-4 text-lg font-semibold">
                  {p.nickname}
                  <button
                    type="button"
                    onClick={() => removePlayer(p.id)}
                    aria-label={`أخرج ${p.nickname} من اللعبة`}
                    title="إخراج من اللعبة"
                    className="grid h-7 w-7 place-items-center rounded-full text-white/70 hover:bg-white/20 hover:text-white"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <StageButton onClick={start} tone="bg-pomegranate hover:bg-pomegranate-deep" disabled={players.length === 0}>
            ابدأ الرحلة
          </StageButton>
          {error && <p role="alert" className="rounded-2xl bg-white p-3 font-semibold text-pomegranate-deep">{error}</p>}
        </div>
      </Stage>
    );
  }

  // ─── Question ─────────────────────────────────────────────
  if (!q) return null;
  return (
    <Stage setId={setId} sound={sound} tone="bg-indigo" progress={`السؤال ${index + 1} من ${questions.length}`}>
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <QuestionCard
            q={q}
            revealed={revealed}
            counts={counts}
            footer={
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xl font-bold">
                <span className="rounded-full bg-indigo-soft px-4 py-2">
                  أجاب {current.length} من {players.length}
                </span>
                {secondsLeft !== null && (
                  <span
                    aria-live="off"
                    className={`rounded-full px-4 py-2 font-display text-2xl ${secondsLeft <= 5 ? "bg-pomegranate text-white" : "bg-saffron-soft text-saffron-deep"}`}
                  >
                    {secondsLeft} ث
                  </span>
                )}
              </div>
            }
          />
          <div className="flex flex-wrap gap-3">
            {!revealed ? (
              <StageButton onClick={reveal} tone="bg-sea hover:bg-sea-deep">
                أظهر الإجابة
              </StageButton>
            ) : (
              <StageButton onClick={next}>{last ? "أنهِ الرحلة واعرض النتائج" : "السؤال التالي"}</StageButton>
            )}
          </div>
          {error && <p role="alert" className="rounded-2xl bg-white p-3 font-semibold text-pomegranate-deep">{error}</p>}
        </div>

        <div className="space-y-4">
          <CaravanTrail leaders={standings.slice(0, 5)} total={questions.length} />
          {standings.length > 5 && (
            <ol start={6} className="grid grid-cols-2 gap-2 text-white sm:grid-cols-3">
              {standings.slice(5, 17).map((p, i) => (
                <li key={p.nickname} className="truncate rounded-xl bg-white/10 px-3 py-1.5">
                  {i + 6}. {p.nickname} ({p.score})
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Stage>
  );
}
