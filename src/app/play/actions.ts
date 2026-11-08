"use server";

import { randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { TEAM_PRESETS, TIMER_OPTIONS, type GameType } from "@/lib/games";
import { createClient } from "@/lib/supabase/server";

export type StartState = { error?: string };

export async function startGame(setId: string, _prev: StartState, fd: FormData): Promise<StartState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const gameType = String(fd.get("game_type")) as GameType;
  if (gameType !== "sail_race" && gameType !== "frankincense_caravan") return { error: "اختر لعبة." };

  const { count } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("set_id", setId);
  if (!count) return { error: "المجموعة فارغة. أضف سؤالاً واحداً على الأقل قبل بدء اللعبة." };

  const timer = Number(fd.get("timer"));
  const teamCount = Math.min(Math.max(Number(fd.get("teams")) || 2, 2), TEAM_PRESETS.length);
  const settings =
    gameType === "sail_race"
      ? { teams: TEAM_PRESETS.slice(0, teamCount).map((t) => t.name) }
      : { timer: TIMER_OPTIONS.some((o) => o.value === timer) ? timer : 0 };

  // Codes only need to be unique among running sessions; retry on the rare clash.
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        set_id: setId,
        host_id: userId,
        game_type: gameType,
        join_code: String(randomInt(0, 1_000_000)).padStart(6, "0"),
        // The sail race needs no lobby: it starts on the first question.
        status: gameType === "sail_race" ? "active" : "lobby",
        question_started_at: gameType === "sail_race" ? new Date().toISOString() : null,
        settings,
      })
      .select("id")
      .single();

    if (data) redirect(`/host/${data.id}`);
    if (error?.code !== "23505") return { error: "تعذّر بدء اللعبة. حاول مرة أخرى." };
  }
  return { error: "تعذّر بدء اللعبة. حاول مرة أخرى." };
}
