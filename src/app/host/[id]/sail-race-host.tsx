"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { teamColor, type GameAnswer, type GameQuestion } from "@/lib/games";
import { createClient } from "@/lib/supabase/client";
import { useSound } from "@/lib/use-game";
import { QuestionCard, Stage, StageButton } from "./stage";

type Props = {
  sessionId: string;
  setId: string;
  title: string;
  questions: GameQuestion[];
  teams: string[];
  initialIndex: number;
  initialRevealed: boolean;
  initialAnswers: GameAnswer[];
};

function Boat({ color }: { color: string }) {
  return (
    <g className="boat-bob">
      <g transform="scale(-1.5 1.5)">
        <path d="M2 -46 L2 -6 L28 -6 Z" fill="#fff" />
        <path d="M-2 -38 L-2 -6 L-20 -6 Z" fill={color} />
        <rect x="-1" y="-48" width="3" height="44" rx="1.5" fill="var(--indigo)" />
        <path d="M-30 -4 H34 Q30 10 18 12 H-20 Q-28 8 -30 -4 Z" fill={color} />
        <path d="M-24 2 H28" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Boats sail from Sohar (right) toward the trade port (left); one step per correct answer. */
function RaceBoard({ teams, scores, total }: { teams: string[]; scores: Record<string, number>; total: number }) {
  const laneH = 92;
  const height = teams.length * laneH + 50;
  const start = 900;
  const finish = 120;
  return (
    <svg viewBox={`0 0 1000 ${height}`} role="img" aria-label="لوحة السباق" className="h-auto w-full">
      <defs>
        <pattern id="race-waves" width="56" height="18" patternUnits="userSpaceOnUse">
          <path d="M0 11 Q14 2 28 11 T56 11" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="1000" height={height} rx="28" fill="var(--sea-deep)" />
      <rect width="1000" height={height} rx="28" fill="url(#race-waves)" />

      {/* finish: the port */}
      <rect x="24" y="16" width="64" height={height - 52} rx="14" fill="var(--saffron)" />
      <path d="M56 26 V60 M56 26 L78 34 L56 42" stroke="var(--indigo)" strokeWidth="4" fill="var(--pomegranate)" strokeLinejoin="round" />
      <text x="56" y={height - 14} textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">
        الميناء
      </text>
      {/* start: Sohar */}
      <rect x={start + 34} y="16" width="8" height={height - 52} rx="4" fill="#fff" fillOpacity="0.8" />
      <text x={start + 38} y={height - 14} textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">
        صحار
      </text>

      {teams.map((team, i) => {
        const y = 16 + i * laneH + laneH / 2 + 18;
        const score = scores[team] ?? 0;
        const x = start - (Math.min(score, total) / Math.max(total, 1)) * (start - finish);
        return (
          <g key={team}>
            <line x1={finish} x2={start + 20} y1={y + 22} y2={y + 22} stroke="#fff" strokeOpacity="0.3" strokeDasharray="3 14" strokeWidth="4" strokeLinecap="round" />
            <g style={{ transform: `translate(${x}px, ${y}px)`, transition: "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
              <Boat color={teamColor(team)} />
              <g transform="translate(-70 -40)">
                <rect x="-26" y="-20" width="52" height="38" rx="19" fill="#fff" />
                <text x="0" y="8" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--indigo)">
                  {score}
                </text>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function SailRaceHost({ sessionId, setId, title, questions, teams, initialIndex, initialRevealed, initialAnswers }: Props) {
  const router = useRouter();
  const sound = useSound();
  const [index, setIndex] = useState(Math.min(initialIndex, questions.length - 1));
  const [revealed, setRevealed] = useState(initialRevealed);
  const [marks, setMarks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initialAnswers.map((a) => [`${a.question_id}|${a.nickname}`, a.is_correct])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  const q = questions[index];
  const last = index === questions.length - 1;
  const scores = useMemo(() => {
    const s: Record<string, number> = {};
    for (const [key, ok] of Object.entries(marks)) {
      const team = key.split("|")[1];
      if (ok) s[team] = (s[team] ?? 0) + 1;
    }
    return s;
  }, [marks]);

  async function mark(team: string, correct: boolean) {
    const key = `${q.id}|${team}`;
    const previous = marks[key];
    setMarks((m) => ({ ...m, [key]: correct }));
    sound.play(correct ? "correct" : "wrong");
    const { error } = await supabase
      .from("session_answers")
      .upsert({ session_id: sessionId, question_id: q.id, nickname: team, team, is_correct: correct }, { onConflict: "session_id,question_id,nickname" });
    if (error) {
      setMarks((m) => {
        const next = { ...m };
        if (previous === undefined) delete next[key];
        else next[key] = previous;
        return next;
      });
      setError("تعذّر حفظ النتيجة. تحقق من الاتصال واضغط مرة أخرى.");
    } else setError("");
  }

  async function update(values: { current_index?: number; revealed?: boolean; status?: "finished"; ended_at?: string; question_started_at?: string }) {
    setBusy(true);
    const { error } = await supabase.from("game_sessions").update(values).eq("id", sessionId);
    setBusy(false);
    if (error) setError("تعذّر حفظ التقدم. تحقق من الاتصال وحاول مرة أخرى.");
    else setError("");
    return !error;
  }

  async function toggleReveal() {
    const next = !revealed;
    setRevealed(next);
    await update({ revealed: next });
  }

  async function goNext() {
    if (last) {
      sound.play("finish");
      if (await update({ status: "finished", ended_at: new Date().toISOString() })) router.push(`/host/${sessionId}/summary`);
      return;
    }
    sound.play("next");
    setIndex(index + 1);
    setRevealed(false);
    await update({ current_index: index + 1, revealed: false, question_started_at: new Date().toISOString() });
  }

  if (!q) {
    return (
      <Stage setId={setId} sound={sound}>
        <p className="m-auto text-2xl font-bold text-white">المجموعة فارغة. أضف أسئلة ثم ابدأ من جديد.</p>
      </Stage>
    );
  }

  return (
    <Stage setId={setId} sound={sound} progress={`السؤال ${index + 1} من ${questions.length}`}>
      <p className="sr-only">{title}</p>
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <QuestionCard q={q} revealed={revealed} />
          <div className="flex flex-wrap gap-3">
            <StageButton onClick={toggleReveal} tone="bg-indigo hover:bg-indigo/85" disabled={busy}>
              {revealed ? "أخفِ الإجابة" : "أظهر الإجابة"}
            </StageButton>
            <StageButton onClick={goNext} disabled={busy}>
              {last ? "أنهِ السباق واعرض النتائج" : "السؤال التالي"}
            </StageButton>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl bg-white p-3 font-semibold text-pomegranate-deep">
              {error}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <RaceBoard teams={teams} scores={scores} total={questions.length} />
          <ul className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => {
              const state = marks[`${q.id}|${team}`];
              return (
                <li key={team} className="rounded-2xl bg-white p-4 text-indigo">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ background: teamColor(team) }} />
                    <span className="flex-1 text-lg font-bold">{team}</span>
                    <span className="font-display text-2xl font-bold">{scores[team] ?? 0}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label={`نتيجة ${team} في هذا السؤال`}>
                    <button
                      type="button"
                      aria-pressed={state === true}
                      onClick={() => mark(team, true)}
                      className="rounded-xl py-3 text-lg font-bold ring-2 ring-palm text-palm-deep transition-colors aria-pressed:bg-palm aria-pressed:text-white"
                    >
                      صح
                    </button>
                    <button
                      type="button"
                      aria-pressed={state === false}
                      onClick={() => mark(team, false)}
                      className="rounded-xl py-3 text-lg font-bold ring-2 ring-pomegranate text-pomegranate-deep transition-colors aria-pressed:bg-pomegranate aria-pressed:text-white"
                    >
                      خطأ
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Stage>
  );
}
