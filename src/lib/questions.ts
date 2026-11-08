import type { Database } from "./database.types";

export type QuestionType = Database["public"]["Enums"]["question_type"];

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "اختيار من متعدد" },
  { value: "true_false", label: "صح أو خطأ" },
  { value: "short", label: "إجابة قصيرة" },
];

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح أو خطأ",
  short: "إجابة قصيرة",
};

// Answer colours, shared by the editor and the game screens.
export const CHOICE_TONES = ["bg-sea", "bg-saffron", "bg-pomegranate", "bg-palm", "bg-indigo", "bg-sea-deep"];

export const TRUE_FALSE = ["صح", "خطأ"] as const;
export const MAX_CHOICES = 6;
export const MIN_CHOICES = 2;
export const IMAGE_BUCKET = "question-images";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Only images from our own bucket are accepted, so a question can never load
// an outside URL on students' devices.
export function isOwnImageUrl(url: string) {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;
  return url.startsWith(base) && !url.includes("..");
}

export function choicesOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((c): c is string => typeof c === "string") : [];
}
