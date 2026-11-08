import type { Database } from "./database.types";
import type { QuestionType } from "./questions";

export type GameType = Database["public"]["Enums"]["game_type"];

export const GAME_LABEL: Record<GameType, string> = {
  sail_race: "سباق السفن الشراعية",
  frankincense_caravan: "قافلة اللبان",
};

// Team colours stay readable on the sea-blue board.
export const TEAM_PRESETS = [
  { name: "فريق النخيل", color: "var(--palm)" },
  { name: "فريق اللبان", color: "var(--saffron)" },
  { name: "فريق الرمان", color: "var(--pomegranate)" },
  { name: "فريق الليل", color: "var(--indigo)" },
] as const;

export const TIMER_OPTIONS = [
  { value: 0, label: "بلا مؤقت" },
  { value: 20, label: "20 ثانية" },
  { value: 30, label: "30 ثانية" },
  { value: 60, label: "دقيقة" },
] as const;

export type GameSettings = { timer?: number; teams?: string[] };

export function readSettings(value: unknown): GameSettings {
  const v = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    timer: typeof v.timer === "number" ? v.timer : 0,
    teams: Array.isArray(v.teams) ? v.teams.filter((t): t is string => typeof t === "string") : [],
  };
}

export function teamColor(name: string) {
  return TEAM_PRESETS.find((t) => t.name === name)?.color ?? "var(--sea)";
}

export type GameQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  image_url: string | null;
  choices: string[];
  answer: string;
};

export type GameAnswer = { question_id: string; nickname: string; is_correct: boolean; answer: string | null };

/** What a student's device receives from get_player_state(). */
export type PlayerState = {
  status: "lobby" | "active" | "finished";
  index: number;
  total: number;
  revealed: boolean;
  nickname: string;
  score: number;
  rank: number;
  players: number;
  question: null | {
    id: string;
    type: QuestionType;
    prompt: string;
    image_url: string | null;
    choices: string[];
    my_answer: string | null;
    is_correct: boolean | null;
    correct_answer: string | null;
    deadline: string | null;
  };
};

export const PLAYER_STORAGE_KEY = "caravan-player";
export type StoredPlayer = { session_id: string; token: string; nickname: string };
