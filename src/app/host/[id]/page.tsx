import { notFound, redirect } from "next/navigation";
import { readSettings } from "@/lib/games";
import { choicesOf } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";
import { CaravanHost } from "./caravan-host";
import { SailRaceHost } from "./sail-race-host";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "شاشة اللعبة" };

export default async function HostPage({ params }: PageProps<"/host/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  // RLS: only the host can read the session.
  const { data: session } = await supabase
    .from("game_sessions")
    .select("id, set_id, game_type, join_code, status, current_index, revealed, question_started_at, settings, question_sets!inner(title)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();
  if (session.status === "finished") redirect(`/host/${id}/summary`);

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase.from("questions").select("id, type, prompt, image_url, choices, answer").eq("set_id", session.set_id).order("position").order("created_at"),
    supabase.from("session_answers").select("question_id, nickname, is_correct, answer").eq("session_id", id),
  ]);

  const items = (questions ?? []).map((q) => ({ ...q, choices: choicesOf(q.choices) }));
  const common = {
    sessionId: session.id,
    setId: session.set_id,
    title: session.question_sets.title,
    questions: items,
    initialIndex: session.current_index,
    initialRevealed: session.revealed,
    initialAnswers: answers ?? [],
  };

  if (session.game_type === "sail_race") {
    return <SailRaceHost {...common} teams={readSettings(session.settings).teams ?? []} />;
  }
  return (
    <CaravanHost
      {...common}
      joinCode={session.join_code}
      initialStatus={session.status}
      initialStartedAt={session.question_started_at}
      timer={readSettings(session.settings).timer ?? 0}
    />
  );
}
