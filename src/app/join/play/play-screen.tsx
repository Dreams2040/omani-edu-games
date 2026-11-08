"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PLAYER_STORAGE_KEY, type PlayerState, type StoredPlayer } from "@/lib/games";
import { CHOICE_TONES } from "@/lib/questions";
import { createClient } from "@/lib/supabase/client";
import { useCountdown, useSessionUpdates } from "@/lib/use-game";

function readPlayer(sessionId: string): StoredPlayer | null {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) ?? "null") as StoredPlayer | null;
    return p && p.session_id === sessionId ? p : null;
  } catch {
    return null;
  }
}

function Shell({ children, top }: { children: React.ReactNode; top?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-indigo text-white">
      {top}
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-6">{children}</div>
    </main>
  );
}

function Message({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">{title}</h1>
      {body && <p className="mt-3 text-lg text-white/80">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const rejoin = (
  <Link href="/join" className="inline-block rounded-2xl bg-saffron px-6 py-3 text-xl font-bold text-indigo">
    ادخل برمز جديد
  </Link>
);

export function PlayScreen({ sessionId }: { sessionId: string }) {
  const [player, setPlayer] = useState<StoredPlayer | null | undefined>(undefined);
  const [state, setState] = useState<PlayerState | null>(null);
  const [gone, setGone] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sending, setSending] = useState(false);
  const [shortAnswer, setShortAnswer] = useState("");
  const [submitError, setSubmitError] = useState("");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the player token lives in this device's storage
    setPlayer(readPlayer(sessionId));
  }, [sessionId]);

  const refresh = useCallback(async () => {
    if (!player) return;
    const { data, error } = await supabase.rpc("get_player_state", { p_session: player.session_id, p_token: player.token });
    if (error) {
      if (error.code === "P0002") setGone(true);
      else setOffline(true);
      return;
    }
    setOffline(false);
    setState(data as PlayerState);
  }, [player, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load once the token is known
    void refresh();
  }, [refresh]);
  useSessionUpdates(player ? sessionId : null, refresh, 4000);

  const q = state?.question ?? null;
  const secondsLeft = useCountdown(q && !q.my_answer && !state?.revealed ? q.deadline : null);

  // Clear the typed answer when a new question arrives.
  const questionId = q?.id;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset per question
    setShortAnswer("");
    setSubmitError("");
  }, [questionId]);

  async function answer(value: string) {
    if (!player || !q || sending || !value.trim()) return;
    setSending(true);
    setSubmitError("");
    const { error } = await supabase.rpc("submit_answer", {
      p_session: player.session_id,
      p_token: player.token,
      p_question: q.id,
      p_answer: value,
    });
    setSending(false);
    if (error && error.code !== "23505") {
      setSubmitError(error.code === "55000" ? "انتهى وقت هذا السؤال." : "لم تصل إجابتك. تحقق من الاتصال واضغط مرة أخرى.");
    }
    void refresh();
  }

  if (player === undefined) return <Shell>{null}</Shell>;
  if (!player || gone) {
    return (
      <Shell>
        <Message title="لست في هذه اللعبة" body="ربما انتهت اللعبة أو أخرجك المعلم منها." action={rejoin} />
      </Shell>
    );
  }

  const top = state && (
    <div className="flex items-center justify-between gap-3 bg-black/20 px-4 py-3">
      <span className="truncate text-lg font-bold">{state.nickname}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-saffron px-3 py-1 font-bold text-indigo">{state.score} لبان</span>
        {state.status !== "lobby" && <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">المركز {state.rank}</span>}
      </span>
    </div>
  );

  if (!state) {
    return (
      <Shell>
        <Message title={offline ? "نحاول الاتصال…" : "جارٍ التحميل…"} />
      </Shell>
    );
  }

  if (state.status === "lobby") {
    return (
      <Shell top={top}>
        <Message title={`أهلاً ${state.nickname}`} body="أنت في القافلة. انتظر حتى يبدأ المعلم الرحلة." />
        <p className="text-center text-white/70">في القافلة الآن: {state.players}</p>
      </Shell>
    );
  }

  if (state.status === "finished") {
    return (
      <Shell top={top}>
        <Message
          title={state.rank === 1 ? "قافلتك وصلت أولاً!" : `وصلت قافلتك في المركز ${state.rank}`}
          body={`جمعت ${state.score} من ${state.total} لبان. أحسنت!`}
          action={rejoin}
        />
      </Shell>
    );
  }

  if (!q) return <Shell top={top}><Message title="انتظر السؤال التالي…" /></Shell>;

  const answered = q.my_answer !== null;
  const closed = state.revealed || secondsLeft === 0;

  return (
    <Shell top={top}>
      <div className="flex items-center justify-between text-white/80">
        <span className="font-semibold">
          السؤال {state.index + 1} من {state.total}
        </span>
        {secondsLeft !== null && <span className={`rounded-full px-3 py-1 font-display text-xl font-bold ${secondsLeft <= 5 ? "bg-pomegranate text-white" : "bg-white/15"}`}>{secondsLeft} ث</span>}
      </div>

      <div className="rounded-3xl bg-white p-5 text-indigo">
        <p className="text-2xl font-bold leading-snug">{q.prompt}</p>
        {q.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image_url} alt="" className="mt-3 max-h-48 rounded-2xl" />
        )}
      </div>

      {answered ? (
        <div role="status" className={`rounded-3xl p-6 text-center ${q.is_correct ? "bg-palm" : "bg-pomegranate"}`}>
          <p className="text-3xl font-bold">{q.is_correct ? "إجابة صحيحة! +1 لبان" : "إجابة غير صحيحة"}</p>
          {!q.is_correct && q.correct_answer && (
            <p className="mt-2 text-xl">
              الصحيح: <span dir="auto">{q.correct_answer}</span>
            </p>
          )}
          <p className="mt-3 text-white/85">انظر إلى الشاشة وانتظر السؤال التالي.</p>
        </div>
      ) : closed ? (
        <div role="status" className="rounded-3xl bg-white/10 p-6 text-center">
          <p className="text-2xl font-bold">انتهى وقت السؤال</p>
          {q.correct_answer && (
            <p className="mt-2 text-xl">
              الصحيح: <span dir="auto">{q.correct_answer}</span>
            </p>
          )}
        </div>
      ) : q.type === "short" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void answer(shortAnswer);
          }}
          className="space-y-3"
        >
          <input
            value={shortAnswer}
            onChange={(e) => setShortAnswer(e.target.value)}
            maxLength={200}
            autoComplete="off"
            aria-label="إجابتك"
            placeholder="اكتب إجابتك"
            className="w-full rounded-2xl border-4 border-transparent bg-white px-5 py-4 text-center text-2xl font-bold text-indigo outline-none focus:border-saffron"
          />
          <button type="submit" disabled={sending || !shortAnswer.trim()} className="w-full rounded-2xl bg-saffron py-4 text-2xl font-bold text-indigo disabled:opacity-60">
            {sending ? "جارٍ الإرسال…" : "أرسل"}
          </button>
        </form>
      ) : (
        <div className={`grid gap-3 ${q.choices.length > 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
          {q.choices.map((c, i) => (
            <button
              key={c}
              type="button"
              disabled={sending}
              onClick={() => answer(c)}
              className={`min-h-20 rounded-2xl px-4 py-4 text-2xl font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60 ${
                q.type === "true_false" ? (c === "صح" ? "bg-palm" : "bg-pomegranate") : CHOICE_TONES[i]
              }`}
            >
              <span dir="auto">{c}</span>
            </button>
          ))}
        </div>
      )}

      {submitError && (
        <p role="alert" className="rounded-2xl bg-white px-4 py-3 text-center font-semibold text-pomegranate-deep">
          {submitError}
        </p>
      )}
      {offline && <p className="text-center text-white/70">الاتصال ضعيف، نحاول من جديد…</p>}
    </Shell>
  );
}
