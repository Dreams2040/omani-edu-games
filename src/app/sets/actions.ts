"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MAX_CHOICES, MIN_CHOICES, TRUE_FALSE, isOwnImageUrl, type QuestionType } from "@/lib/questions";

export type FormState = { error?: string; savedAt?: number };

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// ─── Sets ───────────────────────────────────────────────────

function readSetFields(fd: FormData) {
  const title = text(fd, "title");
  const description = text(fd, "description");
  const lessonId = Number(fd.get("lesson_id"));
  const isPublic = fd.get("is_public") === "on";

  if (!title) return { error: "اكتب عنواناً للمجموعة." } as const;
  if (title.length > 200) return { error: "العنوان طويل. اختصره إلى 200 حرف أو أقل." } as const;
  if (description.length > 1000) return { error: "الوصف طويل. اختصره إلى 1000 حرف أو أقل." } as const;
  if (!Number.isInteger(lessonId) || lessonId <= 0) return { error: "اختر الدرس الذي ترتبط به المجموعة." } as const;

  return { fields: { title, description: description || null, lesson_id: lessonId, is_public: isPublic } } as const;
}

export async function createSet(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  const parsed = readSetFields(fd);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await supabase
    .from("question_sets")
    .insert({ ...parsed.fields, owner_id: userId })
    .select("id")
    .single();

  if (error || !data) return { error: "تعذّر إنشاء المجموعة. حاول مرة أخرى." };
  revalidatePath("/library");
  redirect(`/sets/${data.id}`);
}

export async function updateSet(setId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = readSetFields(fd);
  if ("error" in parsed) return { error: parsed.error };

  // RLS only lets the owner update; an empty result means "not yours".
  const { data, error } = await supabase.from("question_sets").update(parsed.fields).eq("id", setId).select("id");
  if (error || !data?.length) return { error: "تعذّر حفظ المجموعة." };

  revalidatePath(`/sets/${setId}`);
  return { savedAt: Date.now() };
}

export async function deleteSet(setId: string) {
  const { supabase } = await requireUser();
  await supabase.from("question_sets").delete().eq("id", setId);
  revalidatePath("/library");
  redirect("/library?tab=mine");
}

export async function copySet(setId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("copy_question_set", { source_id: setId });
  if (error || !data) redirect(`/sets/${setId}?error=copy`);
  revalidatePath("/library");
  redirect(`/sets/${data}?copied=1`);
}

export async function toggleFavorite(setId: string, isFavorite: boolean) {
  const { supabase, userId } = await requireUser();
  if (isFavorite) {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("set_id", setId);
  } else {
    await supabase.from("favorites").insert({ user_id: userId, set_id: setId });
  }
  revalidatePath("/library");
  revalidatePath(`/sets/${setId}`);
}

// ─── Questions ──────────────────────────────────────────────

function readQuestion(fd: FormData) {
  const type = text(fd, "type") as QuestionType;
  const prompt = text(fd, "prompt");
  const imageUrl = text(fd, "image_url");

  if (!prompt) return { error: "اكتب نص السؤال." } as const;
  if (prompt.length > 1000) return { error: "نص السؤال طويل. اختصره إلى 1000 حرف أو أقل." } as const;
  if (imageUrl && !isOwnImageUrl(imageUrl)) return { error: "ارفع الصورة من جهازك بزر «أضف صورة»." } as const;

  const base = { type, prompt, image_url: imageUrl || null };

  if (type === "mcq") {
    let raw: unknown;
    try {
      raw = JSON.parse(String(fd.get("choices") ?? "[]"));
    } catch {
      raw = [];
    }
    const typed = (Array.isArray(raw) ? raw : []).map((c) => String(c).trim());
    const choices = typed.filter(Boolean);
    if (choices.length < MIN_CHOICES) return { error: "اكتب خيارين على الأقل." } as const;
    if (choices.length > MAX_CHOICES) return { error: `الحد الأقصى ${MAX_CHOICES} خيارات.` } as const;
    if (new Set(choices).size !== choices.length) return { error: "يوجد خياران متطابقان. غيّر أحدهما." } as const;
    // `correct` is the index in the list as typed (blanks included).
    const rawCorrect = fd.get("correct");
    const answer = rawCorrect === null || rawCorrect === "" ? "" : typed[Number(rawCorrect)] ?? "";
    if (!answer) return { error: "حدد الإجابة الصحيحة بالضغط على دائرتها." } as const;
    return { fields: { ...base, choices, answer } } as const;
  }

  if (type === "true_false") {
    const answer = text(fd, "answer");
    if (!TRUE_FALSE.includes(answer as (typeof TRUE_FALSE)[number])) return { error: "اختر «صح» أو «خطأ» كإجابة." } as const;
    return { fields: { ...base, choices: [...TRUE_FALSE] as string[], answer } } as const;
  }

  if (type === "short") {
    const answer = text(fd, "answer");
    if (!answer) return { error: "اكتب الإجابة الصحيحة." } as const;
    if (answer.length > 200) return { error: "الإجابة طويلة. اختصرها إلى 200 حرف أو أقل." } as const;
    return { fields: { ...base, choices: [] as string[], answer } } as const;
  }

  return { error: "اختر نوع السؤال." } as const;
}

export async function saveQuestion(setId: string, questionId: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const parsed = readQuestion(fd);
  if ("error" in parsed) return { error: parsed.error };

  if (questionId) {
    const { data, error } = await supabase
      .from("questions")
      .update(parsed.fields)
      .eq("id", questionId)
      .eq("set_id", setId)
      .select("id");
    if (error || !data?.length) return { error: "تعذّر حفظ السؤال." };
  } else {
    const { data: last } = await supabase
      .from("questions")
      .select("position")
      .eq("set_id", setId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("questions")
      .insert({ ...parsed.fields, set_id: setId, position: (last?.position ?? 0) + 1 });
    if (error) return { error: "تعذّر إضافة السؤال." };
  }

  await supabase.from("question_sets").update({ updated_at: new Date().toISOString() }).eq("id", setId);
  revalidatePath(`/sets/${setId}`);
  return { savedAt: Date.now() };
}

export async function deleteQuestion(setId: string, questionId: string) {
  const { supabase } = await requireUser();
  await supabase.from("questions").delete().eq("id", questionId).eq("set_id", setId);
  revalidatePath(`/sets/${setId}`);
}

export async function moveQuestion(setId: string, questionId: string, direction: -1 | 1) {
  const { supabase } = await requireUser();
  const { data: rows } = await supabase
    .from("questions")
    .select("id, position")
    .eq("set_id", setId)
    .order("position")
    .order("created_at");
  if (!rows) return;

  const ids = rows.map((r) => r.id);
  const from = ids.indexOf(questionId);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];

  // Renumber 1..n, touching only rows whose position changed.
  await Promise.all(
    ids.flatMap((id, i) => {
      const current = rows.find((r) => r.id === id)!.position;
      return current === i + 1 ? [] : [supabase.from("questions").update({ position: i + 1 }).eq("id", id)];
    }),
  );
  revalidatePath(`/sets/${setId}`);
}
